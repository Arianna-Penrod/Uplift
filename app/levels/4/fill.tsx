// app/levels/4/fill.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
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

    // ✅ must be declared before any conditional return
    const [cursorId, setCursorId] = useState<string | null>(null);

    const topicLabel = (t?: string) => (t && t.trim().length ? t : "General");

    const topics = useMemo(() => {
        const set = new Set<string>();
        for (const ex of L4_FILL_EXERCISES) set.add(topicLabel((ex as any).topic));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, []);

    // ✅ reset cursor when topic changes (side effect = useEffect)
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

                // Gate: require MCQs complete
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

    // ✅ safe early return now that all hooks are declared above
    if (!st) return <ActivityIndicator style={{ marginTop: 40 }} />;

    const activeExercises = useMemo(
        () => L4_FILL_EXERCISES.filter((ex) => !st.skippedTopics[topicLabel((ex as any).topic)]),
        [st]
    );

    const solvedCount = activeExercises.filter((ex) => st.solved[ex.id]).length;
    const total = activeExercises.length;
    const pct = total === 0 ? 0 : Math.round((solvedCount / total) * 100);

    const selectedPool = useMemo(() => {
        if (!selectedTopic) return [];
        return activeExercises.filter((ex) => topicLabel((ex as any).topic) === selectedTopic);
    }, [activeExercises, selectedTopic]);

    const anyActiveUnsolved = activeExercises.some((ex) => !st.solved[ex.id]);

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

        // If we just skipped the selected topic, move to a valid next topic
        if (selectedTopic === t && nextState.skippedTopics[t]) {
            const next =
                topics.find(
                    (x) =>
                        !nextState.skippedTopics[x] &&
                        L4_FILL_EXERCISES.some(
                            (ex) => topicLabel((ex as any).topic) === x && !nextState.solved[ex.id]
                        )
                ) ??
                topics.find((x) => !nextState.skippedTopics[x]) ??
                null;

            setSelectedTopic(next);
            setCursorId(null);
        }
    };

    // effective current = cursor (if unsolved) else first unsolved in selected topic
    const effectiveCurrent = useMemo(() => {
        if (!selectedTopic) return null;

        const firstUnsolved = selectedPool.find((ex) => !st.solved[ex.id]) ?? null;
        if (!cursorId) return firstUnsolved;

        const found = selectedPool.find((ex) => ex.id === cursorId) ?? null;
        if (found && !st.solved[found.id]) return found;

        return firstUnsolved;
    }, [cursorId, selectedPool, selectedTopic, st]);

    const topicSolved = selectedPool.filter((ex) => st.solved[ex.id]).length;
    const topicTotal = selectedPool.length;
    const topicPct = topicTotal === 0 ? 0 : Math.round((topicSolved / topicTotal) * 100);

    // ✅ Next Exercise button (advances within topic; if none, jumps to next topic)
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

        // no more unsolved in this topic → next topic
        setCursorId(null);
        jumpToNextTopicWithUnsolved();
    };

    return (
        <View style={{ padding: 16, gap: 12 }}>
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

                    <Pressable
                        onPress={() => router.replace("/levels/4")}
                        style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}
                    >
                        <Text style={{ textAlign: "center", fontWeight: "800" }}>Back to MCQ</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={{ gap: 12 }}>
                    {/* key forces FillBlankCode to reset inputs when switching */}
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

            <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                    onPress={() => router.replace("/levels/4")}
                    style={{ flex: 1, padding: 14, borderRadius: 10, borderWidth: 1 }}
                >
                    <Text style={{ textAlign: "center", fontWeight: "800" }}>Back</Text>
                </Pressable>

                <Pressable
                    onPress={async () => {
                        const cleared = await resetLevel4Fill();
                        setSt(cleared);
                        const firstNonSkipped = topics.find((t) => !cleared.skippedTopics[t]) ?? (topics[0] ?? null);
                        setSelectedTopic(firstNonSkipped);
                        setCursorId(null);
                    }}
                    style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}
                >
                    <Text style={{ fontWeight: "800" }}>Reset</Text>
                </Pressable>
            </View>
        </View>
    );
}
