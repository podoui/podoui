import { z } from "zod";

export type ToolbarItem =
  | "undo-redo" // 실행 취소/다시 실행
  | "paragraph" // 문단 형식
  | "text-style" // 굵게, 기울임, 밑줄, 취소선
  | "color" // 글꼴 색상, 배경 색상
  | "align" // 정렬
  | "list" // 목록, 번호 목록
  | "table" // 표
  | "link" // 링크
  | "image" // 이미지
  | "youtube" // 유튜브
  | "hr" // 구분선
  | "format" // 서식 지우기
  | "code"; // 코드 보기

export interface EditorImageUploadResult {
  /** 업로드가 끝난 뒤 본문에 삽입할 공개 이미지 URL */
  src: string;
  /** 업로더가 결정한 대체 텍스트. Editor의 입력값이 있으면 입력값이 우선합니다. */
  alt?: string;
}

export type EditorImageUploadHandler = (file: File) => Promise<string | EditorImageUploadResult>;

export interface EditorProps {
  value: string;
  width?: string;
  height?: string | "contents";
  minHeight?: string;
  maxHeight?: string;
  resizable?: boolean;
  onChange: (content: string) => void;
  validator?: z.ZodType<unknown>;
  placeholder?: string;
  toolbar?: ToolbarItem[]; // 사용할 툴바 아이템 (없으면 전부)
  /**
   * 파일 선택·붙여넣기·드롭으로 들어온 이미지를 외부 저장소에서 처리합니다.
   * 생략하면 이전과 같이 data URL을 본문에 삽입합니다.
   */
  onImageUpload?: EditorImageUploadHandler;
  /** 외부 이미지 처리 실패 알림. 실패한 이미지는 본문에 삽입하지 않습니다. */
  onImageUploadError?: (error: unknown, file: File) => void;
  /** 편집 영역의 접근성 이름 (기본값: "리치 텍스트 편집기") */
  ariaLabel?: string;
}

export interface ParagraphOption {
  value: string;
  label: string;
  className?: string;
}

export interface AlignOption {
  value: string;
  label: string;
  icon: string;
}
