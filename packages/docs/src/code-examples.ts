/**
 * React Native's public runtime needs real host primitives.  Keeping this
 * setup in one formatter prevents component pages from accidentally
 * documenting the test-renderer-only top-level convenience exports.
 */
export function nativeComponentUsage(components: string[], example: string): string {
  const names = components.join(", ");
  return (
    `import { Pressable, ScrollView, Text, TextInput, View } from "react-native";\n` +
    `import { createNativeComponents } from "podo-ui/native";\n\n` +
    `const { ${names} } = createNativeComponents({\n` +
    `  Pressable, ScrollView, Text, TextInput, View,\n` +
    `});\n\n` +
    example
  );
}
