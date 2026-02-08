// app/levels/4/fill.tsx
import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import { L4_QUESTIONS } from "../../../data/level4Qs";
import { loadLevel4 } from "../../../lib/level4Store";
import { L4_FILL_EXERCISES } from "../../../data/level4FillBlankQs";
import { FillBlankCode } from "../../../components/FillBlankUI";
import { loadLevel4Fill, markFillSolved, resetLevel4Fill, type Level4FillState } from "../../../lib/level4FillBlankStore";
import { loadProgress } from "../../../lib/progress";

export default function Level4Fill() {
    const [st, setSt] = useState<Level4FillState | null>(null);

    useFocusEffect(
        useCallback(() => {
            let alive = true;

            (async () => {
                const p = await loadProgress();
                if (!alive) return;

                // enforce lock like your MCQ screen
                if (p.unlockedLevel < 4) {
                    router.replace("/");
                    return;
                }

                // ✅ Gate: require MCQs complete before fill-blank
                const mcq = await loadLevel4();
                const mcqSolvedCount = L4_QUESTIONS.reduce(
                    (acc, qq) => acc + (mcq.solved[qq.id] ? 1 : 0),
                    0
                );
                const mcqComplete = mcqSolvedCount === L4_QUESTIONS.length;

                if (!mcqComplete) {
                    router.replace("/levels/4"); // send them back to MCQ screen
                    return;
                }


                const s = await loadLevel4Fill();
                if (!alive) return;
                setSt(s);
            })();

            return () => { alive = false; };
        }, [])
    );

    if (!st) return <ActivityIndicator style={{ marginTop: 40 }} />;

    const solvedCount = Object.keys(st.solved).length;
    const total = L4_FILL_EXERCISES.length;
    const pct = total === 0 ? 0 : Math.round((solvedCount / total) * 100);

    const current = useMemo(
        () => L4_FILL_EXERCISES.find((ex) => !st.solved[ex.id]) ?? null,
        [st]
    );

    return (
        <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Level 4: Fill in the Blank</Text>

            {/* progress bar */}
            <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
                <Text style={{ fontWeight: "800" }}>
                    Progress: {solvedCount}/{total} ({pct}%)
                </Text>
                <View style={{ height: 12, borderRadius: 999, borderWidth: 1, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${pct}%`, backgroundColor: "black" }} />
                </View>
            </View>

            {!current ? (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 10 }}>
                    <Text style={{ fontWeight: "800" }}>🎉 All fill-blank exercises solved!</Text>
                    <Pressable onPress={() => router.replace("/levels/4")} style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}>
                        <Text style={{ textAlign: "center", fontWeight: "800" }}>Back to MCQ</Text>
                    </Pressable>
                </View>
            ) : (
                <FillBlankCode
                    exercise={current}
                    onSolved={async () => {
                        const next = await markFillSolved(st, current.id);
                        setSt(next);
                    }}
                />
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                    onPress={() => router.replace("/levels/4")}
                    style={{ flex: 1, padding: 14, borderRadius: 10, borderWidth: 1 }}
                >
                    <Text style={{ textAlign: "center", fontWeight: "800" }}>Back</Text>
                </Pressable>

                <Pressable
                    onPress={async () => setSt(await resetLevel4Fill())}
                    style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}
                >
                    <Text style={{ fontWeight: "800" }}>Reset</Text>
                </Pressable>
            </View>
        </View>
    );
}
