/**
 * Import side — variable collections.
 *
 * 덮어쓰기는 in-place 갱신이다: 같은 이름의 기존 컬렉션·변수를 지우지 않고
 * 재사용하며 모드/값/메타만 원본과 일치하도록 조정한다. 컬렉션·변수 id가
 * 재설치 후에도 유지되므로 (1) 변수 모달의 수동 정렬(Reorder collections)이
 * 초기화되지 않고 (2) 사용자 디자인의 변수 바인딩이 끊어지지 않는다.
 *
 * Two passes (SPEC "Hard ordering rules" #1):
 *   1. Reconcile every collection (modes by name, variables by name) and set
 *      raw (non-alias) values.
 *   2. Write alias values through the old→new variable id map — aliases may
 *      cross collections, so this only runs after all variables exist.
 *
 * Returns the old-variable-id → new-variable-id map used by every later
 * import stage (styles, nodes), plus the count of collections processed
 * (for the ImportReport).
 */

import { CollectionData, RGBAData, VariableValueData } from '../schema';

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function deserializeRawValue(value: boolean | number | string | RGBAData): VariableValue {
  if (typeof value === 'object' && value !== null) {
    const rgba: RGBA = { r: value.r, g: value.g, b: value.b, a: value.a };
    return rgba;
  }
  return value;
}

interface PendingAlias {
  variable: Variable;
  newModeId: string;
  oldTargetId: string;
  /** For warning messages only. */
  variableName: string;
  modeName: string;
}

const CODE_SYNTAX_PLATFORMS: readonly CodeSyntaxPlatform[] = ['WEB', 'ANDROID', 'iOS'];

/**
 * 컬렉션 표시 순서는 플러그인 API 밖이다: Figma는 기본 알파벳순으로 나열하고
 * (실측 — 생성 순서를 바꿔도 표시 불변), 원본의 theme-first 순서는 UI의
 * "Reorder collections" 수동 정렬 결과라서 API로 재현할 수 없다.
 * 그래도 생성 순서는 원본 UI 순서를 따라 둔다 — 비용이 없고, Figma가
 * 표시 규칙을 바꾸면 그대로 이득이 된다. 최종 순서는 설치 후 변수 모달의
 * ⋯ → Reorder collections에서 한 번 수동 정렬해야 한다 (README 참고).
 * in-place 갱신이라 그 수동 정렬은 재설치 후에도 유지된다.
 */
const COLLECTION_UI_ORDER: readonly string[] = ['theme', 'semantic', 'responsive', 'primitive'];

function collectionRank(name: string): number {
  const index = COLLECTION_UI_ORDER.indexOf(name);
  return index === -1 ? COLLECTION_UI_ORDER.length : index;
}

function applyVariableMeta(
  variable: Variable,
  data: CollectionData['variables'][number],
  warn: (m: string) => void
): void {
  variable.description = data.description;
  variable.hiddenFromPublishing = data.hiddenFromPublishing;
  try {
    variable.scopes = data.scopes as VariableScope[];
  } catch (e) {
    warn(
      `importVariables: variable "${data.name}": could not apply scopes [${data.scopes.join(', ')}]: ${errorMessage(e)}`
    );
  }
  for (const platform of CODE_SYNTAX_PLATFORMS) {
    const syntax = data.codeSyntax[platform];
    if (syntax === undefined) {
      continue;
    }
    try {
      variable.setVariableCodeSyntax(platform, syntax);
    } catch (e) {
      warn(
        `importVariables: variable "${data.name}": could not set ${platform} code syntax: ${errorMessage(e)}`
      );
    }
  }
}

export interface ImportVariablesResult {
  /** old variable id -> new variable id. */
  varMap: Map<string, string>;
  /** Number of variable collections actually created or updated. */
  collections: number;
}

export async function importVariables(
  collections: CollectionData[],
  warn: (m: string) => void
): Promise<ImportVariablesResult> {
  const varMap = new Map<string, string>();
  /** new variable id -> Variable object (createVariableAlias needs the object). */
  const newVariables = new Map<string, Variable>();
  const pendingAliases: PendingAlias[] = [];
  let processedCollections = 0;

  const existingByName = new Map<string, VariableCollection>();
  for (const existing of await figma.variables.getLocalVariableCollectionsAsync()) {
    if (!existingByName.has(existing.name)) {
      existingByName.set(existing.name, existing);
    }
  }

  // ---------------------------------------------------------------- pass 1
  // 생성 순서는 원본 UI 순서를 따른다 (stable sort — 위 주석 참고).
  const ordered = [...collections].sort((a, b) => collectionRank(a.name) - collectionRank(b.name));
  for (const collectionData of ordered) {
    let collection = existingByName.get(collectionData.name) ?? null;
    const isNew = collection === null;
    if (collection === null) {
      try {
        collection = figma.variables.createVariableCollection(collectionData.name);
      } catch (e) {
        warn(
          `importVariables: could not create collection "${collectionData.name}": ${errorMessage(e)}. All ${collectionData.variables.length} variables in it were skipped.`
        );
        continue;
      }
    }
    processedCollections++;
    collection.hiddenFromPublishing = collectionData.hiddenFromPublishing;

    // Mode reconciliation. 새 컬렉션도 같은 알고리즘으로 처리된다: 초기
    // "Mode 1"은 이름 매칭에 실패하고, 기본 모드가 페어링 rename으로 그
    // 자리를 차지한다 (fresh collection의 초기 모드 = 기본 모드).
    //   1) 이름이 같은 모드끼리 매칭 (값 보존)
    //   2) 남는 원본 모드 ↔ 남는 기존 모드를 순서대로 rename 페어링 (값 보존)
    //   3) 그래도 남는 원본 모드는 addMode (플랜 제한 시 ⚠ 경고)
    //   4) 그래도 남는 기존 모드는 removeMode (원본에 없는 모드)
    const modeMap = new Map<string, string>();
    const modeNameByOldId = new Map<string, string>();
    if (collectionData.modes.length > 0) {
      const defaultMode =
        collectionData.modes.find((m) => m.modeId === collectionData.defaultModeId) ??
        collectionData.modes[0];
      // 기본 모드를 맨 앞에 둬서 새 컬렉션의 초기 모드(=기본 모드)와 페어링되게 한다.
      const incoming = [
        defaultMode,
        ...collectionData.modes.filter((m) => m.modeId !== defaultMode.modeId),
      ];

      const remainingExisting = [...collection.modes];
      const unmatched: typeof incoming = [];
      for (const mode of incoming) {
        const index = remainingExisting.findIndex((m) => m.name === mode.name);
        if (index >= 0) {
          modeMap.set(mode.modeId, remainingExisting[index].modeId);
          modeNameByOldId.set(mode.modeId, mode.name);
          remainingExisting.splice(index, 1);
        } else {
          unmatched.push(mode);
        }
      }

      const toAdd: typeof incoming = [];
      for (const mode of unmatched) {
        const target = remainingExisting.shift();
        if (!target) {
          toAdd.push(mode);
          continue;
        }
        try {
          collection.renameMode(target.modeId, mode.name);
          modeMap.set(mode.modeId, target.modeId);
          modeNameByOldId.set(mode.modeId, mode.name);
        } catch (e) {
          warn(
            `importVariables: collection "${collectionData.name}": could not rename mode "${target.name}" to "${mode.name}": ${errorMessage(e)}`
          );
          toAdd.push(mode);
        }
      }

      for (const mode of toAdd) {
        try {
          const newModeId = collection.addMode(mode.name);
          modeMap.set(mode.modeId, newModeId);
          modeNameByOldId.set(mode.modeId, mode.name);
        } catch (e) {
          // e.g. "in addMode: Limited to N modes only" on lower pricing tiers.
          const msg = errorMessage(e);
          const limit = /Limited to (\d+) modes?/i.exec(msg);
          warn(
            limit
              ? `⚠ 플랜 제한: 컬렉션 "${collectionData.name}"에 "${mode.name}" 모드를 추가하지 못했습니다 — 이 파일 위치는 컬렉션당 모드 ${limit[1]}개까지만 허용합니다(Drafts 포함). 파일을 유료 팀 프로젝트로 이동한 뒤 다시 설치하세요. 이 모드의 값은 모두 빠졌습니다.`
              : `importVariables: collection "${collectionData.name}": could not add mode "${mode.name}": ${msg}. Values for this mode were dropped.`
          );
        }
      }

      for (const leftover of remainingExisting) {
        try {
          collection.removeMode(leftover.modeId);
          warn(
            `importVariables: 컬렉션 "${collectionData.name}": 원본에 없는 모드 "${leftover.name}"를 제거했습니다.`
          );
        } catch (e) {
          warn(
            `importVariables: collection "${collectionData.name}": could not remove extra mode "${leftover.name}": ${errorMessage(e)}`
          );
        }
      }

      // defaultModeId는 읽기 전용 — 기존 컬렉션의 기본 모드가 원본과 다르면 알림만 남긴다.
      const mappedDefault = modeMap.get(defaultMode.modeId);
      if (mappedDefault !== undefined && collection.defaultModeId !== mappedDefault) {
        warn(
          `importVariables: 컬렉션 "${collectionData.name}": 기본 모드를 "${defaultMode.name}"(으)로 바꿀 수 없습니다 (플러그인 API 제한). 기존 기본 모드가 유지됩니다.`
        );
      }
    }

    // Variable reconciliation: 이름으로 매칭해 재사용(id 보존), 타입이 바뀌면
    // 재생성, 원본에 없는 변수는 제거.
    const existingVarByName = new Map<string, Variable>();
    if (!isNew) {
      for (const id of collection.variableIds) {
        const existing = await figma.variables.getVariableByIdAsync(id);
        if (existing && !existingVarByName.has(existing.name)) {
          existingVarByName.set(existing.name, existing);
        }
      }
    }

    for (const variableData of collectionData.variables) {
      let variable = existingVarByName.get(variableData.name) ?? null;
      if (variable) {
        existingVarByName.delete(variableData.name);
        if (variable.resolvedType !== variableData.resolvedType) {
          try {
            variable.remove();
          } catch (e) {
            warn(
              `importVariables: variable "${variableData.name}": could not remove type-changed variable: ${errorMessage(e)}`
            );
          }
          variable = null;
          warn(
            `importVariables: 변수 "${variableData.name}": 타입이 바뀌어 다시 만들었습니다 (이 변수를 쓰던 기존 바인딩은 끊어질 수 있습니다).`
          );
        }
      }
      if (variable === null) {
        try {
          variable = figma.variables.createVariable(
            variableData.name,
            collection,
            variableData.resolvedType
          );
        } catch (e) {
          warn(
            `importVariables: could not create variable "${variableData.name}" in collection "${collectionData.name}": ${errorMessage(e)}`
          );
          continue;
        }
      }
      varMap.set(variableData.id, variable.id);
      newVariables.set(variable.id, variable);
      applyVariableMeta(variable, variableData, warn);

      for (const oldModeId of Object.keys(variableData.valuesByMode)) {
        const newModeId = modeMap.get(oldModeId);
        if (newModeId === undefined) {
          // Mode was dropped (addMode failed) — already warned per collection.
          continue;
        }
        const valueData: VariableValueData = variableData.valuesByMode[oldModeId];
        if (valueData.kind === 'alias') {
          pendingAliases.push({
            variable,
            newModeId,
            oldTargetId: valueData.id,
            variableName: variableData.name,
            modeName: modeNameByOldId.get(oldModeId) || oldModeId
          });
        } else {
          try {
            variable.setValueForMode(newModeId, deserializeRawValue(valueData.value));
          } catch (e) {
            warn(
              `importVariables: variable "${variableData.name}": could not set value for mode "${modeNameByOldId.get(oldModeId) || oldModeId}": ${errorMessage(e)}`
            );
          }
        }
      }
    }

    let removedVariables = 0;
    for (const leftover of existingVarByName.values()) {
      try {
        leftover.remove();
        removedVariables++;
      } catch (e) {
        warn(
          `importVariables: collection "${collectionData.name}": could not remove extra variable "${leftover.name}": ${errorMessage(e)}`
        );
      }
    }
    if (removedVariables > 0) {
      warn(
        `importVariables: 컬렉션 "${collectionData.name}": 원본에 없는 변수 ${removedVariables}개를 제거했습니다.`
      );
    }
  }

  // ---------------------------------------------------------------- pass 2
  for (const pending of pendingAliases) {
    const newTargetId = varMap.get(pending.oldTargetId);
    if (newTargetId === undefined) {
      warn(
        `importVariables: variable "${pending.variableName}" (mode "${pending.modeName}"): alias target ${pending.oldTargetId} was not imported; the value was left at its default.`
      );
      continue;
    }
    const target = newVariables.get(newTargetId);
    if (!target) {
      warn(
        `importVariables: variable "${pending.variableName}" (mode "${pending.modeName}"): alias target ${pending.oldTargetId} has no created Variable object; the value was left at its default.`
      );
      continue;
    }
    try {
      pending.variable.setValueForMode(
        pending.newModeId,
        figma.variables.createVariableAlias(target)
      );
    } catch (e) {
      warn(
        `importVariables: variable "${pending.variableName}" (mode "${pending.modeName}"): could not write alias to "${target.name}": ${errorMessage(e)}`
      );
    }
  }

  return { varMap, collections: processedCollections };
}
