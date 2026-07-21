import { useState, useRef, useEffect, RefObject } from "react";

export interface UseCodeViewProps {
  editorRef: RefObject<HTMLDivElement | null>;
  codeEditorRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (content: string) => void;
  formatHtml: (html: string) => string;
  getCleanHTML: (html: string) => string;
  height?: string | "contents";
  onInput?: () => void; // handleInput 콜백
  onValidate?: (content: string) => void; // 검증 콜백 (리치 텍스트 편집과 동일한 흐름)
  onBeforeToggle?: (toCodeView: boolean) => void; // 토글 전 콜백 (예: clearCellSelection)
}

export interface UseCodeViewReturn {
  isCodeView: boolean;
  codeContent: string;
  savedEditorHeight: number | null;
  toggleCodeView: () => void;
  handleCodeChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

/**
 * 에디터 코드 보기 모드 관리 Hook
 *
 * 일반 WYSIWYG 모드와 HTML 코드 보기 모드 간 전환을 관리합니다.
 * 코드 보기 모드에서는 HTML을 포맷팅하여 표시하고, 사용자가 직접 수정할 수 있습니다.
 *
 * @param {UseCodeViewProps} props - Hook 설정
 * @returns {UseCodeViewReturn} 코드 보기 상태 및 관리 함수
 *
 * @example
 * ```tsx
 * const codeView = useCodeView({
 *   editorRef,
 *   codeEditorRef,
 *   value: content,
 *   onChange: setContent,
 *   formatHtml,
 *   getCleanHTML,
 *   height: '400px',
 *   onInput: handleInput,
 *   onBeforeToggle: (toCodeView) => {
 *     if (toCodeView) clearCellSelection();
 *   }
 * });
 *
 * // 코드 보기 전환
 * codeView.toggleCodeView();
 * ```
 */
export const useCodeView = ({
  editorRef,
  codeEditorRef,
  value,
  onChange,
  formatHtml,
  getCleanHTML,
  height,
  onInput,
  onValidate,
  onBeforeToggle,
}: UseCodeViewProps): UseCodeViewReturn => {
  const [isCodeView, setIsCodeView] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [originalHtml, setOriginalHtml] = useState("");
  const [savedEditorHeight, setSavedEditorHeight] = useState<number | null>(null);

  // 마지막으로 onChange로 방출한 값 — 외부 값 동기화에서 자기 에코를 구분한다
  const lastEmittedRef = useRef<string | null>(null);
  const prevValueRef = useRef(value);

  // 코드 보기가 열린 동안 value prop이 외부(controlled)에서 바뀌면 코드 내용도
  // 갱신한다. 이때 에디터 div는 언마운트 상태라 index.tsx의 innerHTML 동기화가
  // 닿지 않는다. 코드 보기 진입 자체(값 변화 없음)나 방금 방출한 값의 에코에는
  // 반응하지 않아 사용자가 편집 중인 텍스트를 덮어쓰지 않는다.
  useEffect(() => {
    const prevValue = prevValueRef.current;
    prevValueRef.current = value;
    if (!isCodeView) return;
    if (value === prevValue) return;
    if (value === lastEmittedRef.current) return;
    setOriginalHtml(value);
    setCodeContent(formatHtml(value));
    // 외부 값을 실제로 반영했으면 에코 기억은 무효화한다 — 이 ref는 방금 방출한
    // 값의 즉각적인 에코 하나만 삼키면 되고, 과거 방출값과 우연히 같은 이후의
    // 외부 업데이트(A 방출 → B 반영 → A 반영)까지 무시하면 안 된다.
    lastEmittedRef.current = null;
  }, [value, isCodeView, formatHtml]);

  /**
   * 코드 보기 모드 전환
   */
  const toggleCodeView = () => {
    // 토글 전 콜백 실행 (예: clearCellSelection)
    if (onBeforeToggle) {
      onBeforeToggle(!isCodeView);
    }

    if (isCodeView) {
      // 코드보기에서 일반 모드로 전환
      setIsCodeView(false);
      setSavedEditorHeight(null); // 저장된 높이 초기화

      // 다음 렌더링 사이클에서 에디터 내용 업데이트
      setTimeout(() => {
        if (editorRef.current && originalHtml !== undefined) {
          // 원본 HTML을 사용 (포맷팅되지 않은 버전)
          editorRef.current.innerHTML = originalHtml;

          // handleInput 콜백 호출
          if (onInput) {
            onInput();
          }
        }
      }, 0);
    } else {
      // 일반 모드에서 코드보기로 전환
      if (editorRef.current) {
        // height가 contents일 때 현재 에디터 높이 저장
        if (height === "contents") {
          const currentHeight = editorRef.current.scrollHeight;
          setSavedEditorHeight(currentHeight);
        }

        // 원본 HTML 저장 (포맷팅 없음)
        const html = editorRef.current.innerHTML;
        setOriginalHtml(html);

        // 표시용으로 포맷팅된 HTML 생성
        const formattedHtml = formatHtml(html);
        setCodeContent(formattedHtml);
        setIsCodeView(true);
      }
    }
  };

  /**
   * 코드 에디터 내용 변경 처리
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - 변경 이벤트
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setCodeContent(newContent);
    // 사용자가 코드를 수정하면 원본 HTML도 업데이트
    setOriginalHtml(newContent);
    // 리치 텍스트 편집(handleInput)과 동일하게 정리된 HTML을 즉시 onChange로 전파한다.
    // 코드 보기 종료 전까지 controlled 소비자가 stale 상태로 남지 않도록 한다.
    const cleanContent = getCleanHTML(newContent);
    lastEmittedRef.current = cleanContent;
    onChange(cleanContent);
    // 코드 편집도 리치 텍스트 편집과 동일한 검증 흐름을 거친다
    onValidate?.(cleanContent);
  };

  return {
    isCodeView,
    codeContent,
    savedEditorHeight,
    toggleCodeView,
    handleCodeChange,
  };
};
