import { useState, useCallback, RefObject } from "react";
import { UseSelectionManagerReturn } from "./useSelectionManager.js";
import { paragraphOptions, alignOptions } from "../constants.js";

/**
 * 블록 레벨 요소 셀렉터 — 이런 요소를 인라인 span으로 감싸면
 * `<span><h1>…</h1></span>` 같은 유효하지 않은 HTML이 된다.
 */
const blockElementSelector =
  "p,h1,h2,h3,h4,h5,h6,div,ul,ol,li,table,thead,tbody,tfoot,tr,td,th," +
  "blockquote,pre,hr,figure,figcaption,section,article,header,footer,nav,aside,main";

/**
 * 텍스트 런을 직접 렌더링할 수 없는 구조 컨테이너 태그 —
 * 이들 바로 아래의 공백 텍스트를 span으로 감싸면 또 다른 잘못된 마크업(tr > span 등)이 된다.
 */
const structuralContainerTags = new Set([
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TR",
  "UL",
  "OL",
  "COLGROUP",
]);

export interface UseTextStyleProps {
  editorRef: RefObject<HTMLDivElement | null>;
  selectionManager: UseSelectionManagerReturn;
  styles: Record<string, string>; // CSS modules styles
  onInput?: () => void; // handleInput 콜백
}

export interface UseTextStyleReturn {
  // 상태
  currentParagraphStyle: string;
  isParagraphDropdownOpen: boolean;
  isTextColorOpen: boolean;
  isBgColorOpen: boolean;
  isAlignDropdownOpen: boolean;
  currentAlign: string;

  // Setter
  setIsParagraphDropdownOpen: (open: boolean) => void;
  setIsTextColorOpen: (open: boolean) => void;
  setIsBgColorOpen: (open: boolean) => void;
  setIsAlignDropdownOpen: (open: boolean) => void;

  // 문단 형식
  applyParagraphStyle: (style: string) => void;
  detectCurrentParagraphStyle: () => void;
  getCurrentStyleLabel: () => string;

  // 정렬
  applyAlign: (align: string) => void;
  detectCurrentAlign: () => void;
  getCurrentAlignLabel: () => string;
  getCurrentAlignIcon: () => string;

  // 텍스트 스타일
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrikethrough: () => void;

  // 색상
  applyTextColor: (color: string, savedRange?: Range | null) => void;
  applyBgColor: (color: string, savedRange?: Range | null) => void;
}

/**
 * 에디터 텍스트 스타일 관리 Hook
 *
 * 문단 형식, 정렬, 굵게/기울임/밑줄/취소선, 텍스트 색상/배경색을 관리합니다.
 *
 * @param {UseTextStyleProps} props - Hook 설정
 * @returns {UseTextStyleReturn} 텍스트 스타일 상태 및 관리 함수
 *
 * @example
 * ```tsx
 * const textStyle = useTextStyle({
 *   editorRef,
 *   selectionManager,
 *   styles: cssModules,
 *   onInput: handleInput
 * });
 *
 * // 문단 형식 적용
 * textStyle.applyParagraphStyle('h1');
 *
 * // 정렬 변경
 * textStyle.applyAlign('center');
 *
 * // 텍스트 색상 변경
 * textStyle.applyTextColor('#ff0000');
 * ```
 */
export const useTextStyle = ({
  editorRef,
  selectionManager,
  styles,
  onInput,
}: UseTextStyleProps): UseTextStyleReturn => {
  const [currentParagraphStyle, setCurrentParagraphStyle] = useState("p");
  const [isParagraphDropdownOpen, setIsParagraphDropdownOpen] = useState(false);
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);
  const [isBgColorOpen, setIsBgColorOpen] = useState(false);
  const [isAlignDropdownOpen, setIsAlignDropdownOpen] = useState(false);
  const [currentAlign, setCurrentAlign] = useState("left");

  /**
   * 현재 정렬 상태 감지
   */
  const detectCurrentAlign = useCallback(() => {
    if (document.queryCommandState("justifyLeft")) {
      setCurrentAlign("left");
    } else if (document.queryCommandState("justifyCenter")) {
      setCurrentAlign("center");
    } else if (document.queryCommandState("justifyRight")) {
      setCurrentAlign("right");
    } else {
      setCurrentAlign("left");
    }
  }, []);

  /**
   * 현재 문단 형식 감지
   */
  const detectCurrentParagraphStyle = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setCurrentParagraphStyle("p");
      return;
    }

    let container = selection.getRangeAt(0).commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentNode as Element;
    }

    // 상위 블록 요소 찾기
    while (container && container !== editorRef.current) {
      const element = container as Element;
      if (element.tagName) {
        const tagName = element.tagName.toLowerCase();

        // H1, H2, H3 체크
        if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
          setCurrentParagraphStyle(tagName);
          return;
        }

        // P 태그 체크
        if (tagName === "p") {
          // 클래스 확인
          if (element.className) {
            // p1, p2, p3, p4, p5, p3_semibold, p4_semibold, p5_semibold 등의 클래스 찾기
            const classNames = Object.keys(styles);
            for (const className of classNames) {
              if (
                className.match(/^p[1-5](_semibold)?$/) &&
                element.classList.contains(styles[className])
              ) {
                setCurrentParagraphStyle(className);
                return;
              }
            }
          }
          // 클래스가 없으면 일반 p
          setCurrentParagraphStyle("p");
          return;
        }

        // DIV나 기타 블록 요소는 본문으로 처리
        if (tagName === "div" || tagName === "blockquote" || tagName === "pre") {
          setCurrentParagraphStyle("p");
          return;
        }
      }
      container = (container as Element).parentNode as Element;
    }

    // 아무것도 못 찾으면 본문
    setCurrentParagraphStyle("p");
  }, [editorRef, styles]);

  /**
   * document.execCommand 래퍼
   */
  const execCommand = useCallback(
    (command: string, value?: string) => {
      // bold, italic, underline, strikeThrough일 때 선택 영역이 없으면 아무것도 하지 않음
      if (["bold", "italic", "underline", "strikeThrough"].includes(command)) {
        const selection = window.getSelection();
        if (selection && selection.isCollapsed) {
          return;
        }
      }

      document.execCommand(command, false, value);
      editorRef.current?.focus();

      if (onInput) {
        onInput();
      }
    },
    [editorRef, onInput]
  );

  /**
   * 문단 형식 적용
   */
  const applyParagraphStyle = useCallback(
    (value: string) => {
      if (!value) {
        value = "p";
      }

      // h1, h2, h3는 formatBlock 사용
      if (value === "h1" || value === "h2" || value === "h3") {
        execCommand("formatBlock", value);
        setCurrentParagraphStyle(value);
      }
      // 본문은 p 태그로
      else if (value === "p") {
        execCommand("formatBlock", "p");
        setCurrentParagraphStyle("p");
      }
      // p1~p5 및 p3_semibold~p5_semibold 스타일은 클래스 적용
      else if (value.match(/^p[1-5](_semibold)?$/)) {
        // 먼저 p 태그로 만들고
        execCommand("formatBlock", "p");

        // 잠시 후 클래스 적용
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;

          let container = selection.getRangeAt(0).commonAncestorContainer;
          if (container.nodeType === Node.TEXT_NODE) {
            container = container.parentNode as Element;
          }

          // 상위 블록 요소 찾기
          while (container && container !== editorRef.current) {
            const element = container as Element;
            if (
              element.tagName &&
              ["P", "H1", "H2", "H3", "H4", "H5", "H6", "DIV"].includes(element.tagName)
            ) {
              // 클래스 적용
              element.className = styles[value];
              setCurrentParagraphStyle(value);
              break;
            }
            container = element.parentNode as Element;
          }

          if (onInput) {
            onInput();
          }
        }, 10);
      }

      // 드롭다운 닫기
      setIsParagraphDropdownOpen(false);
    },
    [editorRef, styles, execCommand, onInput]
  );

  /**
   * 정렬 적용
   */
  const applyAlign = useCallback(
    (align: string) => {
      if (align === "left") {
        execCommand("justifyLeft");
      } else if (align === "center") {
        execCommand("justifyCenter");
      } else if (align === "right") {
        execCommand("justifyRight");
      }
      setCurrentAlign(align);
      setIsAlignDropdownOpen(false);
    },
    [execCommand]
  );

  /**
   * 현재 문단 형식 라벨 반환
   */
  const getCurrentStyleLabel = useCallback(() => {
    const option = paragraphOptions.find((opt) => opt.value === currentParagraphStyle);
    return option ? option.label : "문단 형식";
  }, [currentParagraphStyle]);

  /**
   * 현재 정렬 라벨 반환
   */
  const getCurrentAlignLabel = useCallback(() => {
    const option = alignOptions.find((opt) => opt.value === currentAlign);
    return option ? option.label : "정렬";
  }, [currentAlign]);

  /**
   * 현재 정렬 아이콘 반환
   */
  const getCurrentAlignIcon = useCallback(() => {
    const option = alignOptions.find((opt) => opt.value === currentAlign);
    return option ? option.icon : "alignLeft";
  }, [currentAlign]);

  /**
   * 색상 스타일 적용 (내부 함수)
   */
  const applyColorStyle = useCallback(
    (styleProperty: string, color: string, savedRange?: Range | null) => {
      // 저장된 선택 영역이 있으면 복원
      if (savedRange) {
        selectionManager.restoreSelection(savedRange);
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }

      const range = selection.getRangeAt(0);

      // 선택 영역에 포함된 모든 표 셀 찾기
      const getSelectedTableCells = (): HTMLTableCellElement[] => {
        const cells: HTMLTableCellElement[] = [];
        const container = range.commonAncestorContainer;

        // 컨테이너가 표인지 확인
        let tableElement: HTMLElement | null = null;
        let current =
          container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : (container as HTMLElement);

        while (current && current !== editorRef.current) {
          if (
            current.tagName === "TABLE" ||
            current.tagName === "TBODY" ||
            current.tagName === "TR"
          ) {
            // 상위 table 요소 찾기
            let table = current;
            while (table && table.tagName !== "TABLE") {
              table = table.parentElement as HTMLElement;
            }
            tableElement = table;
            break;
          }
          current = current.parentElement;
        }

        if (!tableElement) return cells;

        // 표 내의 모든 셀 확인
        const allCells = tableElement.querySelectorAll("td, th");
        allCells.forEach((cell) => {
          if (range.intersectsNode(cell)) {
            cells.push(cell as HTMLTableCellElement);
          }
        });

        return cells;
      };

      const selectedCells = getSelectedTableCells();

      // 여러 표 셀이 선택된 경우
      if (selectedCells.length > 1) {
        selectedCells.forEach((cell) => {
          // 각 셀의 모든 내용을 span으로 감싸기
          const cellContents = Array.from(cell.childNodes);

          cellContents.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
              // 텍스트 노드를 span으로 감싸기
              const span = document.createElement("span");
              if (styleProperty === "color") {
                span.style.color = color;
              } else if (styleProperty === "background-color") {
                span.style.backgroundColor = color;
              }
              span.textContent = node.textContent;
              cell.replaceChild(span, node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              // 기존 요소에 스타일 적용
              const element = node as HTMLElement;
              if (styleProperty === "color") {
                element.style.color = color;
              } else if (styleProperty === "background-color") {
                element.style.backgroundColor = color;
              }
            }
          });
        });

        // 선택 해제
        selection.removeAllRanges();
        editorRef.current?.focus();

        if (onInput) {
          onInput();
        }
        return;
      }

      // 단일 셀 내부 또는 일반 텍스트
      const commonAncestor = range.commonAncestorContainer;

      // 선택 영역이 표 셀 내부인지 확인
      const isInTableCell = (node: Node): boolean => {
        let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
        while (current && current !== editorRef.current) {
          if (current.tagName === "TD" || current.tagName === "TH") {
            return true;
          }
          current = current.parentElement;
        }
        return false;
      };

      // 색상 지정 헬퍼 — 일반 경로의 기존 직렬화(!important)를 유지한다
      const setColorOn = (element: HTMLElement) => {
        if (styleProperty === "color") {
          element.style.setProperty("color", color, "important");
        } else if (styleProperty === "background-color") {
          element.style.setProperty("background-color", color, "important");
        }
      };

      // 스타일 적용 후 캐럿을 해당 요소 내용 끝으로 이동 (기존 동작과 동일)
      const placeCaretAtEnd = (element: HTMLElement) => {
        const caret = document.createRange();
        caret.selectNodeContents(element);
        caret.collapse(false);
        selection.removeAllRanges();
        selection.addRange(caret);
      };

      // 선택 영역에 블록 요소가 포함되어 있으면 통째로 span에 감싸는 대신
      // 각 블록 내부의 선택된 텍스트 런 단위로 스타일을 적용한다.
      if (range.cloneContents().querySelector(blockElementSelector) !== null) {
        // 경계 텍스트 노드를 분할해 선택된 부분만 남긴다.
        // 끝 경계를 먼저 분할한다 — 분할 지점(offset)과 같은 위치의 Range 경계는
        // 이동하지 않으므로 기존 range 끝은 잘린 노드의 끝에 그대로 남는다.
        const endContainer = range.endContainer;
        if (
          endContainer.nodeType === Node.TEXT_NODE &&
          range.endOffset > 0 &&
          range.endOffset < (endContainer as Text).length
        ) {
          (endContainer as Text).splitText(range.endOffset);
        }
        const startContainer = range.startContainer;
        if (startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
          const rest = (startContainer as Text).splitText(range.startOffset);
          range.setStart(rest, 0);
        }

        // 선택 영역에 완전히 포함된 텍스트 노드 수집
        const walkRoot =
          commonAncestor.nodeType === Node.TEXT_NODE
            ? (commonAncestor.parentNode ?? commonAncestor)
            : commonAncestor;
        const walker = document.createTreeWalker(walkRoot, NodeFilter.SHOW_TEXT);
        const targets: Text[] = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node as Text;
          if (!text.data) continue;
          if (range.comparePoint(text, 0) !== 0 || range.comparePoint(text, text.length) !== 0) {
            continue;
          }
          // 표/목록 구조 노드 바로 아래의 공백 텍스트는 감싸지 않는다
          const parentTag = text.parentElement?.tagName ?? "";
          if (!text.data.trim() && structuralContainerTags.has(parentTag)) continue;
          targets.push(text);
        }

        const styled: HTMLElement[] = [];
        targets.forEach((text) => {
          const parent = text.parentElement;
          // 같은 텍스트 런에 재적용하는 경우 기존 span을 갱신해 중첩을 피한다
          if (parent && parent.tagName === "SPAN" && parent.childNodes.length === 1) {
            setColorOn(parent);
            styled.push(parent);
            return;
          }
          const span = document.createElement("span");
          setColorOn(span);
          text.parentNode?.insertBefore(span, text);
          span.appendChild(text);
          styled.push(span);
        });

        if (styled.length > 0) {
          placeCaretAtEnd(styled[styled.length - 1]);
        }

        editorRef.current?.focus();

        if (onInput) {
          onInput();
        }
        return;
      }

      // 인라인 전용 선택이 기존 span의 전체 텍스트와 정확히 일치하면
      // 새 span으로 다시 감싸는 대신(스팬 중첩 방지) 그 span의 색상만 갱신한다.
      const selectedText = range.toString();
      const ancestorElement =
        commonAncestor.nodeType === Node.TEXT_NODE
          ? commonAncestor.parentElement
          : (commonAncestor as Element);
      const wrappingSpan =
        ancestorElement instanceof HTMLElement
          ? (ancestorElement.closest("span") as HTMLElement | null)
          : null;
      if (
        wrappingSpan &&
        editorRef.current?.contains(wrappingSpan) &&
        selectedText !== "" &&
        wrappingSpan.textContent === selectedText
      ) {
        setColorOn(wrappingSpan);
        placeCaretAtEnd(wrappingSpan);
        editorRef.current?.focus();

        if (onInput) {
          onInput();
        }
        return;
      }

      // 표 셀 내부에서의 색상 변경 (단일 셀)
      if (isInTableCell(commonAncestor)) {
        try {
          const contents = range.extractContents();
          const span = document.createElement("span");

          if (styleProperty === "color") {
            span.style.color = color;
          } else if (styleProperty === "background-color") {
            span.style.backgroundColor = color;
          }

          span.appendChild(contents);
          range.insertNode(span);

          // 커서 위치 조정
          range.setStartAfter(span);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);

          editorRef.current?.focus();

          if (onInput) {
            onInput();
          }
          return;
        } catch {
          // 오류 무시
        }
      }

      // 일반 텍스트에 대한 색상 변경
      const span = document.createElement("span");

      try {
        const contents = range.extractContents();

        if (styleProperty === "color") {
          span.setAttribute("style", `color: ${color} !important;`);
        } else if (styleProperty === "background-color") {
          span.setAttribute("style", `background-color: ${color} !important;`);
        }

        span.appendChild(contents);
        range.insertNode(span);

        range.selectNodeContents(span);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch {
        if (styleProperty === "color") {
          document.execCommand("foreColor", false, color);
        } else {
          document.execCommand("hiliteColor", false, color);
        }
      }

      editorRef.current?.focus();

      if (onInput) {
        onInput();
      }
    },
    [editorRef, selectionManager, onInput]
  );

  /**
   * 텍스트 색상 적용
   */
  const applyTextColor = useCallback(
    (color: string, savedRange?: Range | null) => {
      applyColorStyle("color", color, savedRange);
    },
    [applyColorStyle]
  );

  /**
   * 배경색 적용
   */
  const applyBgColor = useCallback(
    (color: string, savedRange?: Range | null) => {
      applyColorStyle("background-color", color, savedRange);
    },
    [applyColorStyle]
  );

  /**
   * 굵게 토글
   */
  const toggleBold = useCallback(() => {
    execCommand("bold");
  }, [execCommand]);

  /**
   * 기울임 토글
   */
  const toggleItalic = useCallback(() => {
    execCommand("italic");
  }, [execCommand]);

  /**
   * 밑줄 토글
   */
  const toggleUnderline = useCallback(() => {
    execCommand("underline");
  }, [execCommand]);

  /**
   * 취소선 토글
   */
  const toggleStrikethrough = useCallback(() => {
    execCommand("strikeThrough");
  }, [execCommand]);

  return {
    // 상태
    currentParagraphStyle,
    isParagraphDropdownOpen,
    isTextColorOpen,
    isBgColorOpen,
    isAlignDropdownOpen,
    currentAlign,

    // Setter
    setIsParagraphDropdownOpen,
    setIsTextColorOpen,
    setIsBgColorOpen,
    setIsAlignDropdownOpen,

    // 문단 형식
    applyParagraphStyle,
    detectCurrentParagraphStyle,
    getCurrentStyleLabel,

    // 정렬
    applyAlign,
    detectCurrentAlign,
    getCurrentAlignLabel,
    getCurrentAlignIcon,

    // 텍스트 스타일
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrikethrough,

    // 색상
    applyTextColor,
    applyBgColor,
  };
};
