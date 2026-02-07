import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import { L4_QUESTIONS, L4_TOPICS, type MCQ, type Topic } from "../../../data/level4Qs";
import { loadLevel4, recordAnswer, resetLevel4, type Level4State } from "../../../lib/level4Store";
import { loadProgress, type Progress } from "../../../lib/progress";

function pickRandom(questions: MCQ[], excludeIds: Set<string>) {
    const remaining = questions.filter((q) => !excludeIds.has(q.id));
    const pool = remaining.length ? remaining : questions; // if all answered, allow repeats
    return pool[Math.floor(Math.random() * pool.length)];
}

export default function Level4() {
    const [appProgress, setAppProgress] = useState<Progress | null>(null);
    const [state, setState] = useState<Level4State | null>(null);

    const [topic, setTopic] = useState<Topic>("Big-O");
    const [q, setQ] = useState<MCQ | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    const pool = useMemo(() => L4_QUESTIONS.filter((x) => x.topic === topic), [topic]);

    useFocusEffect(
        useCallback(() => {
            let alive = true;

            (async () => {
                const p = await loadProgress();
                if (!alive) return;
                setAppProgress(p);

                // Optional: enforce lock
                if (p.unlockedLevel < 4) {
                    router.replace("/"); // or /levels/1
                    return;
                }

                const s = await loadLevel4();
                if (!alive) return;
                setState(s);

                const exclude = new Set(Object.keys(s.answered));
                setQ(pickRandom(pool, exclude));
                setSelected(null);
                setRevealed(false);
            })();

            return () => {
                alive = false;
            };
        }, [pool])
    );

    if (!appProgress || !state || !q) return <ActivityIndicator style={{ marginTop: 40 }} />;

    const pct = state.total === 0 ? 0 : Math.round((state.correct / state.total) * 100);
    const topicAnswered = pool.filter((qq) => state.answered[qq.id] !== undefined).length;
    const topicMissed = pool.filter((qq) => state.missed[qq.id]).length;

    return (
        <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Level 4: Technical Practice</Text>

            <View style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}>
                <Text style={{ fontWeight: "800" }}>
                    Score: {state.correct}/{state.total} ({pct}%)
                </Text>
                <Text style={{ color: "#444" }}>
                    Topic: {topicAnswered}/{pool.length} answered • {topicMissed} missed
                </Text>
            </View>

            <Text style={{ fontWeight: "800" }}>Topics</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {L4_TOPICS.map((t) => (
                    <Pressable
                        key={t}
                        onPress={() => setTopic(t)}
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderRadius: 999,
                            backgroundColor: t === topic ? "#000" : "transparent",
                        }}
                    >
                        <Text style={{ color: t === topic ? "#fff" : "#000", fontWeight: "700" }}>{t}</Text>
                    </Pressable>
                ))}
            </View>

            <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "800" }}>{q.prompt}</Text>

                {q.choices.map((choice, idx) => {
                    const isCorrect = idx === q.answerIndex;
                    const isPicked = selected === idx;

                    const bg =
                        revealed && isCorrect ? "#d7ffd7" : revealed && isPicked && !isCorrect ? "#ffd7d7" : "transparent";

                    return (
                        <Pressable
                            key={idx}
                            disabled={revealed}
                            onPress={async () => {
                                setSelected(idx);
                                setRevealed(true);

                                const next = await recordAnswer(state, q.id, idx, idx === q.answerIndex);
                                setState(next);
                            }}
                            style={{ padding: 10, borderWidth: 1, borderRadius: 10, backgroundColor: bg }}
                        >
                            <Text style={{ fontWeight: "700" }}>{choice}</Text>
                        </Pressable>
                    );
                })}

                {revealed && (
                    <View style={{ gap: 6 }}>
                        <Text style={{ fontWeight: "800" }}>
                            {selected === q.answerIndex ? "Correct ✅" : "Not quite ❌"}
                        </Text>
                        <Text style={{ color: "#333" }}>{q.explanation}</Text>
                    </View>
                )}
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                    onPress={() => {
                        const exclude = new Set(Object.keys(state.answered));
                        setQ(pickRandom(pool, exclude));
                        setSelected(null);
                        setRevealed(false);
                    }}
                    style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: "#000" }}
                >
                    <Text style={{ color: "#fff", textAlign: "center", fontWeight: "800" }}>
                        Next Question
                    </Text>
                </Pressable>

                <Pressable
                    onPress={async () => {
                        const cleared = await resetLevel4();
                        setState(cleared);
                        const exclude = new Set(Object.keys(cleared.answered));
                        setQ(pickRandom(pool, exclude));
                        setSelected(null);
                        setRevealed(false);
                    }}
                    style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}
                >
                    <Text style={{ fontWeight: "800" }}>Reset</Text>
                </Pressable>
            </View>
        </View>
    );
}
