// Minimal ambient declaration — svgpath ships without types (mirrors
// packages/icon-build/src/vendor-types.d.ts; only the used surface).
declare module "svgpath" {
  interface SvgPath {
    round(precision: number): SvgPath;
    translate(x: number, y?: number): SvgPath;
    matrix(matrix: number[]): SvgPath;
    toString(): string;
  }
  function svgpath(path: string): SvgPath;
  export default svgpath;
}
