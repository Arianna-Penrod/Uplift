// app/index.tsx
import { useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { loadProgress, saveProgress, type Progress } from "../lib/progress";

export default function Home() {
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

    if (!p) return <ActivityIndicator style={{ marginTop: 40 }} />;

    const levels = [
        { id: 1, title: "Resume" },
        { id: 2, title: "Elevator Pitch" },
        { id: 3, title: "Professional Profile" },
        { id: 4, title: "Technical" },
    ] as const;

    return (
        <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 26, fontWeight: "700" }}>Interview Prep</Text>

            {/* DEV TOGGLE BUTTON */}
            <Pressable
                onPress={async () => {
                    // If everything is unlocked, lock back down to Level 1.
                    // Otherwise unlock everything.
                    const nextUnlocked = p.unlockedLevel >= 4 ? 1 : 4;

                    const updated: Progress = { ...p, unlockedLevel: nextUnlocked };
                    await saveProgress(updated);
                    setP(updated);
                }}
                style={{
                    padding: 14,
                    borderWidth: 1,
                    borderRadius: 10,
                    backgroundColor: "#eee",
                }}
            >
                <Text style={{ textAlign: "center", fontWeight: "700" }}>
                    {p.unlockedLevel >= 4 ? "DEV: Lock levels (only Level 1)" : "DEV: Unlock all levels"}
                </Text>
            </Pressable>


            {levels.map((lvl) => {
                const locked = lvl.id > p.unlockedLevel;
                return (
                    <Pressable
                        key={lvl.id}
                        onPress={() => !locked && router.push(`/levels/${lvl.id}`)}
                        style={{
                            padding: 14,
                            borderWidth: 1,
                            borderRadius: 10,
                            opacity: locked ? 0.45 : 1,
                        }}
                    >
                        <Text style={{ fontSize: 18, fontWeight: "600" }}>
                            Level {lvl.id}: {lvl.title}
                        </Text>
                        <Text>{locked ? "Locked" : "Tap to open"}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
