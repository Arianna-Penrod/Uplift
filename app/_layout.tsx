// app/_layout.tsx
// Root layout for Expo Router.
//
// This is the TOP-MOST navigator that wraps your entire app.
// We use a Stack here so your tabs (/(tabs)) are one screen,
// and other routes like /levels/... can be pushed on top.

import React from "react";
import { Stack } from "expo-router";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

// Force React Navigation's theme to be light.
// (This affects navigator backgrounds, headers, etc.)
const LIGHT_NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#FFFFFF",
    card: "#FFFFFF",
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={LIGHT_NAV_THEME}>
      {/* Dark status bar icons for light background */}
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,

          // Consistent background for every screen in the root stack
          // (including /levels/...)
          contentStyle: { backgroundColor: "#FFFFFF" },
        }}
      >
        {/* Your main tabs group */}
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
