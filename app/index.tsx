import { useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { loadProgress, saveProgress, type Progress } from "../lib/progress";

export default function HomeScreen() {
  const [p, setP] = useState<Progress | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadProgress().then((prog) => {
        if (alive) setP(prog);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  if (!p) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const levels = [
    { id: 1, title: "Resume" },
    { id: 2, title: "Elevator Pitch" },
    { id: 3, title: "Professional Profile" },
    { id: 4, title: "Technical" },
  ] as const;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interview Prep</Text>

      {/* DEV TOGGLE BUTTON */}
      <Pressable
        onPress={async () => {
          const nextUnlocked = p.unlockedLevel >= 4 ? 1 : 4;
          const updated: Progress = { ...p, unlockedLevel: nextUnlocked };
          await saveProgress(updated);
          setP(updated);
        }}
        style={styles.devBtn}
      >
        <Text style={styles.devBtnText}>
          {p.unlockedLevel >= 4 ? "DEV: Lock levels (only Level 1)" : "DEV: Unlock all levels"}
        </Text>
      </Pressable>

      {levels.map((lvl) => {
        const locked = lvl.id > p.unlockedLevel;
        return (
          <Pressable
            key={lvl.id}
            disabled={locked}
            onPress={() => router.push(`/levels/${lvl.id}`)}
            style={[styles.levelBtn, locked && styles.locked]}
          >
            <Text style={styles.levelText}>
              {locked ? "🔒 " : "⛰️ "}Level {lvl.id}: {lvl.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700" },
  devBtn: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  devBtnText: { textAlign: "center", fontWeight: "700" },
  levelBtn: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  locked: { opacity: 0.5 },
  levelText: { fontWeight: "600" },
});