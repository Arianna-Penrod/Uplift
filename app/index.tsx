import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { loadProgress, type Progress } from "../lib/progress";

export default function Home() {
    const [p, setP] = useState<Progress | null>(null);

    useEffect(() => {
        loadProgress().then(setP);
    }, []);

    if (!p) return <ActivityIndicator style={{ marginTop: 40 }} />;

    const levels = [
        { id: 1, title: "Resume" },
        { id: 2, title: "Elevator Pitch" },
        { id: 3, title: "LinkedIn" },
        { id: 4, title: "Technical" },
    ] as const;

    return (
        <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 26, fontWeight: "700" }}>Interview Prep</Text>
            <Text>Complete Level 1 to unlock Levels 2–4.</Text>

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
