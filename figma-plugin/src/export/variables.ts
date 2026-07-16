/**
 * Export side — local variable collections.
 *
 * Serializes every local collection (modes, defaultModeId, per-variable
 * metadata and per-mode values) into the schema's CollectionData shape.
 * Aliases are stored as { kind: 'alias', id: <source variable id> } and
 * resolved on import through the old→new id map.
 */

import { CollectionData, VariableData, VariableValueData, RGBAData } from '../schema';

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function isVariableAlias(value: VariableValue): value is VariableAlias {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as VariableAlias).type === 'VARIABLE_ALIAS'
  );
}

function serializeColor(value: RGB | RGBA): RGBAData {
  return {
    r: value.r,
    g: value.g,
    b: value.b,
    a: 'a' in value ? value.a : 1
  };
}

function serializeVariableValue(value: VariableValue): VariableValueData {
  if (isVariableAlias(value)) {
    return { kind: 'alias', id: value.id };
  }
  if (typeof value === 'object' && value !== null) {
    // RGB / RGBA color object.
    return { kind: 'value', value: serializeColor(value) };
  }
  return { kind: 'value', value };
}

async function serializeVariable(
  variableId: string,
  collection: VariableCollection,
  warn: (m: string) => void
): Promise<VariableData | null> {
  const variable = await figma.variables.getVariableByIdAsync(variableId);
  if (!variable) {
    warn(
      `exportVariables: variable ${variableId} in collection "${collection.name}" could not be resolved; skipped.`
    );
    return null;
  }

  const valuesByMode: Record<string, VariableValueData> = {};
  for (const mode of collection.modes) {
    const value = variable.valuesByMode[mode.modeId];
    if (value === undefined) {
      warn(
        `exportVariables: variable "${variable.name}" has no value for mode "${mode.name}"; that mode was skipped.`
      );
      continue;
    }
    valuesByMode[mode.modeId] = serializeVariableValue(value);
  }

  return {
    id: variable.id,
    name: variable.name,
    description: variable.description,
    resolvedType: variable.resolvedType,
    scopes: variable.scopes.slice(),
    codeSyntax: {
      WEB: variable.codeSyntax.WEB,
      ANDROID: variable.codeSyntax.ANDROID,
      iOS: variable.codeSyntax.iOS
    },
    hiddenFromPublishing: variable.hiddenFromPublishing,
    valuesByMode
  };
}

export async function exportVariables(warn: (m: string) => void): Promise<CollectionData[]> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const out: CollectionData[] = [];

  for (const collection of collections) {
    const variables: VariableData[] = [];
    for (const variableId of collection.variableIds) {
      try {
        const data = await serializeVariable(variableId, collection, warn);
        if (data) {
          variables.push(data);
        }
      } catch (e) {
        warn(
          `exportVariables: failed to serialize variable ${variableId} in collection "${collection.name}": ${errorMessage(e)}`
        );
      }
    }

    out.push({
      id: collection.id,
      name: collection.name,
      defaultModeId: collection.defaultModeId,
      modes: collection.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
      hiddenFromPublishing: collection.hiddenFromPublishing,
      variables
    });
  }

  return out;
}
