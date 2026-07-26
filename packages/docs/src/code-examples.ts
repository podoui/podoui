/** React Native's published entry already binds components to RN primitives. */
export function nativeComponentUsage(components: string[], example: string): string {
  const names = components.join(", ");
  return `import { ${names} } from "podo-ui/native";\n\n${example}`;
}
