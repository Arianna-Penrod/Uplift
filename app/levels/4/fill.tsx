// app/levels/4/fill.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Modal } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import { L4_QUESTIONS } from "../../../data/level4Qs";
import { loadLevel4 } from "../../../lib/level4Store";
import { L4_FILL_EXERCISES } from "../../../data/level4FillBlankQs";
import { FillBlankCode } from "../../../components/FillBlankUI";
import {
    loadLevel4Fill,
    markFillSolved,
    resetLevel4Fill,
    toggleFillTopicSkip,
    resetFillTopicSkips,
    type Level4FillState,
} from "../../../lib/level4FillBlankStore";
import { loadProgress } from "../../../lib/progress";

export default function Level4Fill() {
    const [st, setSt] = useState<Level4FillState | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [cursorId, setCursorId] = useState<string | null>(null);
    const [showCongrats, setShowCongrats] = useState(false);

    const topicLabel = (t?: string) => (t && t.trim().length ? t : "General");

    const topics = useMemo(() => {
        const set = new Set<string>();
        for (const ex of L4_FILL_EXERCISES) set.add(topicLabel((ex as any).topic));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, []);

    // reset cursor when topic changes
    useEffect(() => {
        setCursorId(null);
    }, [selectedTopic]);

    useFocusEffect(
        useCallback(() => {
            let alive = true;

            (async () => {
                const p = await loadProgress();
                if (!alive) return;

                if (p.unlockedLevel < 4) {
                    router.replace("/");
                    return;
                }

                // Gate: require MCQs complete (ignoring skipped MCQ topics)
                const mcq = await loadLevel4();
                const activeMcqs = L4_QUESTIONS.filter((qq) => !mcq.skippedTopics?.[qq.topic]);
                const mcqSolvedCount = activeMcqs.reduce((acc, qq) => acc + (mcq.solved[qq.id] ? 1 : 0), 0);
                const mcqComplete = activeMcqs.length === 0 ? true : mcqSolvedCount === activeMcqs.length;

                if (!mcqComplete) {
                    router.replace("/levels/4");
                    return;
                }

                const s = await loadLevel4Fill();
                if (!alive) return;

                setSt(s);
                setShowCongrats(false);

                const firstNonSkippedWithUnsolved =
                    topics.find(
                        (t) =>
                            !s.skippedTopics[t] &&
                            L4_FILL_EXERCISES.some((ex) => topicLabel((ex as any).topic) === t && !s.solved[ex.id])
                    ) ??
                    topics.find((t) => !s.skippedTopics[t]) ??
                    (topics[0] ?? null);

                setSelectedTopic(firstNonSkippedWithUnsolved);
                setCursorId(null);
            })();

            return () => {
                alive = false;
            };
        }, [topics])
    );

    // ---- Derived values (NO HOOKS) ----
    const activeExercises =
        st ? L4_FILL_EXERCISES.filter((ex) => !st.skippedTopics[topicLabel((ex as any).topic)]) : [];

    const solvedCount = st ? activeExercises.filter((ex) => st.solved[ex.id]).length : 0;
    const total = activeExercises.length;
    const pct = total === 0 ? 0 : Math.round((solvedCount / total) * 100);

    const anyActiveUnsolved = st ? activeExercises.some((ex) => !st.solved[ex.id]) : true;
    const fillComplete = !!st && (total === 0 ? true : !anyActiveUnsolved);

    // show congrats once when completed
    useEffect(() => {
        if (fillComplete && !showCongrats) setShowCongrats(true);
    }, [fillComplete, showCongrats]);

    // If still loading, render spinner (no early return => no hook order problems)
    if (!st) {
        return <ActivityIndicator style={{ marginTop: 40 }} />;
    }

    const selectedPool = selectedTopic
        ? activeExercises.filter((ex) => topicLabel((ex as any).topic) === selectedTopic)
        : [];

    const topicSolved = selectedPool.filter((ex) => st.solved[ex.id]).length;
    const topicTotal = selectedPool.length;
    const topicPct = topicTotal === 0 ? 0 : Math.round((topicSolved / topicTotal) * 100);

    const effectiveCurrent = (() => {
        if (!selectedTopic) return null;

        const firstUnsolved = selectedPool.find((ex) => !st.solved[ex.id]) ?? null;
        if (!cursorId) return firstUnsolved;

        const found = selectedPool.find((ex) => ex.id === cursorId) ?? null;
        if (found && !st.solved[found.id]) return found;

        return firstUnsolved;
    })();

    const jumpToNextTopicWithUnsolved = () => {
        const next =
            topics.find(
                (t) =>
                    !st.skippedTopics[t] &&
                    activeExercises.some((ex) => topicLabel((ex as any).topic) === t && !st.solved[ex.id])
            ) ??
            topics.find((t) => !st.skippedTopics[t]) ??
            null;

        setSelectedTopic(next);
        setCursorId(null);
    };

    const onToggleSkip = async (t: string) => {
        const nextState = await toggleFillTopicSkip(st, t);
        setSt(nextState);

        if (selectedTopic === t && nextState.skippedTopics[t]) {
            const next =
                topics.find(
                    (x) =>
                        !nextState.skippedTopics[x] &&
                        L4_FILL_EXERCISES.some((ex) => topicLabel((ex as any).topic) === x && !nextState.solved[ex.id])
                ) ??
                topics.find((x) => !nextState.skippedTopics[x]) ??
                null;

            setSelectedTopic(next);
            setCursorId(null);
        }
    };

    const onNextExercise = () => {
        if (!effectiveCurrent) {
            jumpToNextTopicWithUnsolved();
            return;
        }

        const idx = selectedPool.findIndex((ex) => ex.id === effectiveCurrent.id);
        if (idx < 0) return;

        for (let i = idx + 1; i < selectedPool.length; i++) {
            if (!st.solved[selectedPool[i].id]) {
                setCursorId(selectedPool[i].id);
                return;
            }
        }

        setCursorId(null);
        jumpToNextTopicWithUnsolved();
    };

    return (
        <View style={{ padding: 16, gap: 12 }}>
            {/* ✅ Congrats popup */}
            <Modal
                transparent
                visible={showCongrats}
                animationType="fade"
                onRequestClose={() => setShowCongrats(false)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 20 }}>
                    <View style={{ backgroundColor: "white", borderRadius: 14, padding: 16, gap: 12 }}>
                        <Text style={{ fontSize: 20, fontWeight: "900" }}>🎉 Congrats!</Text>
                        <Text style={{ color: "#333" }}>
                            You finished all active Level 4 fill-in-the-blank exercises.
                        </Text>

                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <Pressable
                                onPress={() => {
                                    setShowCongrats(false);
                                    router.replace("/");
                                }}
                                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "black" }}
                            >
                                <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>Return Home</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    setShowCongrats(false);
                                    router.replace("/levels/4");
                                }}
                                style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1 }}
                            >
                                <Text style={{ textAlign: "center", fontWeight: "800" }}>Back to Level 4</Text>
                            </Pressable>
                        </View>

                        <Pressable onPress={() => setShowCongrats(false)} style={{ padding: 10 }}>
                            <Text style={{ textAlign: "center", fontWeight: "800" }}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <Text style={{ fontSize: 24, fontWeight: "800" }}>Level 4: Fill in the Blank</Text>

            {/* Topics */}
            <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
                <Text style={{ fontWeight: "800" }}>Topics (tap = select, long-press = skip/unskip)</Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {topics.map((t) => {
                        const skipped = !!st.skippedTopics[t];
                        const isSelected = t === selectedTopic;

                        return (
                            <Pressable
                                key={t}
                                onPress={() => {
                                    setSelectedTopic(t);
                                    setCursorId(null);
                                }}
                                onLongPress={() => onToggleSkip(t)}
                                style={{
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    borderWidth: 1,
                                    borderRadius: 999,
                                    backgroundColor: isSelected ? "#000" : skipped ? "#eee" : "transparent",
                                    opacity: skipped ? 0.6 : 1,
                                }}
                            >
                                <Text
                                    style={{
                                        color: isSelected ? "#fff" : "#000",
                                        fontWeight: "700",
                                        textDecorationLine: skipped ? "line-through" : "none",
                                    }}
                                >
                                    {t}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable
                    onPress={async () => {
                        const nextState = await resetFillTopicSkips(st);
                        setSt(nextState);
                        setCursorId(null);
                    }}
                    style={{
                        alignSelf: "flex-start",
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderWidth: 1,
                        borderRadius: 10,
                    }}
                >
                    <Text style={{ fontWeight: "800" }}>Reset skipped topics</Text>
                </Pressable>
            </View>

            {/* Overall progress */}
            <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
                <Text style={{ fontWeight: "800" }}>
                    Overall Progress (active): {solvedCount}/{total} ({pct}%)
                </Text>
                <View style={{ height: 12, borderRadius: 999, borderWidth: 1, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${pct}%`, backgroundColor: "black" }} />
                </View>
            </View>

            {/* Topic progress */}
            <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
                <Text style={{ fontWeight: "800" }}>
                    Topic: {selectedTopic ?? "None"} — {topicSolved}/{topicTotal} ({topicPct}%)
                </Text>
                <View style={{ height: 12, borderRadius: 999, borderWidth: 1, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${topicPct}%`, backgroundColor: "black" }} />
                </View>
            </View>

            {/* Exercise */}
            {!effectiveCurrent ? (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 10 }}>
                    <Text style={{ fontWeight: "800" }}>
                        {anyActiveUnsolved ? "✅ Selected topic complete!" : "🎉 All active fill-blank exercises solved!"}
                    </Text>

                    {anyActiveUnsolved && (
                        <Pressable
                            onPress={jumpToNextTopicWithUnsolved}
                            style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}
                        >
                            <Text style={{ textAlign: "center", fontWeight: "800" }}>Go to next topic</Text>
                        </Pressable>
                    )}
                </View>
            ) : (
                <View style={{ gap: 12 }}>
                    <FillBlankCode
                        key={effectiveCurrent.id}
                        exercise={effectiveCurrent}
                        onSolved={async () => {
                            const next = await markFillSolved(st, effectiveCurrent.id);
                            setSt(next);
                            setCursorId(null);
                        }}
                    />

                    <Pressable onPress={onNextExercise} style={{ padding: 12, borderRadius: 10, borderWidth: 1 }}>
                        <Text style={{ textAlign: "center", fontWeight: "800" }}>Next Exercise</Text>
                    </Pressable>
                </View>
            )}

            {/* Bottom buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                    onPress={() => router.replace("/levels/4")}
                    style={{ flex: 1, padding: 14, borderRadius: 10, borderWidth: 1 }}
                >
                    <Text style={{ textAlign: "center", fontWeight: "800" }}>Back</Text>
                </Pressable>

                <Pressable
                    onPress={() => router.replace("/")}
                    style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: "black" }}
                >
                    <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>Home</Text>
                </Pressable>

                <Pressable
                    onPress={async () => {
                        const cleared = await resetLevel4Fill();
                        setSt(cleared);
                        const firstNonSkipped = topics.find((t) => !cleared.skippedTopics[t]) ?? (topics[0] ?? null);
                        setSelectedTopic(firstNonSkipped);
                        setCursorId(null);
                        setShowCongrats(false);
                    }}
                    style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}
                >
                    <Text style={{ fontWeight: "800" }}>Reset</Text>
                </Pressable>
            </View>
        </View>
    );
}
