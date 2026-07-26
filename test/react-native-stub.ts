// Vitest runs in jsdom and cannot parse React Native's Flow-annotated runtime
// entry. Keep the existing host-adapter DOM tests deterministic while the
// iOS simulator verification exercises the real react-native components.
export const Pressable = "Pressable";
export const Modal = "Modal";
export const KeyboardAvoidingView = "KeyboardAvoidingView";
export const ScrollView = "ScrollView";
export const Text = "Text";
export const TextInput = "TextInput";
export const View = "View";
export const Keyboard = { dismiss: () => undefined };
export const Linking = { openURL: async () => undefined };
