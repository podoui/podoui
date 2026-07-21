import React, { useMemo, useState } from "react";
import {
  PodoNativeThemeProvider,
  createNativeComponents,
  usePodoNativeTheme,
  type NativeHost,
} from "@podoui/native";

// Real React Native apps must inject the actual RN host components — the
// package's top-level exports bind to string host tags that only test
// renderers understand. See docs/installation-guide.md ("React Native"):
//
//   import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
//   const { Button, Field, Icon, Input } = createNativeComponents({
//     Pressable,
//     ScrollView,
//     Text,
//     TextInput,
//     View,
//   });
//
// This example package carries no react-native dependency, so minimal typed
// local stand-ins satisfy the NativeHost contract for typechecking only.
function StubView(props: Record<string, unknown>): React.ReactElement {
  return <>{props.children as React.ReactNode}</>;
}

function StubText(props: Record<string, unknown>): React.ReactElement {
  return <>{props.children as React.ReactNode}</>;
}

function StubTextInput(props: Record<string, unknown>): React.ReactElement {
  return <>{(props.value ?? props.placeholder ?? "") as React.ReactNode}</>;
}

function StubPressable(props: Record<string, unknown>): React.ReactElement {
  return <>{props.children as React.ReactNode}</>;
}

const host: NativeHost = {
  Pressable: StubPressable,
  ScrollView: StubView,
  Text: StubText,
  TextInput: StubTextInput,
  View: StubView,
};

const { Button, Field, Icon, Input } = createNativeComponents(host);

// `podo build` emits the RN glyph map (PodoIcons.native.ts: podoIconGlyphMap,
// icon name → codepoint). Convert it once and hand it to the provider so
// <Icon name="…"> renders the font glyph instead of the raw name:
//
//   import { podoIconGlyphMap } from "./podo/PodoIcons.native";
//   const iconGlyphs = Object.fromEntries(
//     Object.entries(podoIconGlyphMap).map(([name, code]) => [
//       name,
//       String.fromCodePoint(code),
//     ])
//   );
//
// This stub wires an inline sample map instead.
const iconGlyphs: Record<string, string> = {
  menu: "\uE900",
  search: "\uE901",
};

export function App(): React.ReactElement {
  const [darkMode, setDarkMode] = useState(false);
  const colorScheme = darkMode ? "dark" : "light";
  const tokens = useMemo(
    () => ({
      color: {
        text: colorScheme === "dark" ? "#f8fafc" : "#111827",
        background: colorScheme === "dark" ? "#101828" : "#ffffff",
      },
      spacing: { controlGap: 12 },
    }),
    [colorScheme]
  );

  return (
    <PodoNativeThemeProvider
      theme="dashboard"
      colorScheme={colorScheme}
      tokens={tokens}
      iconGlyphs={iconGlyphs}
    >
      <ExampleContent onToggleScheme={() => setDarkMode((current) => !current)} />
    </PodoNativeThemeProvider>
  );
}

function ExampleContent({ onToggleScheme }: { onToggleScheme: () => void }): React.ReactElement {
  const theme = usePodoNativeTheme();

  return (
    <>
      <Field
        label={`Email (${theme.theme}/${theme.colorScheme})`}
        helperText="Theme provider, Field and Input share one native context."
        required
      >
        <Input accessibilityLabel="Email" placeholder="team@podo.dev" required />
      </Field>
      <Button prefix={<Icon name="menu" />} onPress={onToggleScheme}>
        Toggle dark mode
      </Button>
    </>
  );
}
