// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Interview Prep" }} />
      <Stack.Screen name="levels/1/index" options={{ title: "Level 1: Resume" }} />
      <Stack.Screen name="levels/1/module/[moduleId]" options={{ title: "Level 1 Module" }} />
    </Stack>
  );
}
