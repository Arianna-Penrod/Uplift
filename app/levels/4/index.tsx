// app/levels/4/index.tsx
import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import { L4_QUESTIONS, L4_TOPICS, type MCQ, type Topic } from "../../../data/level4Qs";
import {
    loadLevel4,
    recordAnswer,
    resetLevel4,
    toggleSkipTopic,
    resetSkippedTopics,
    type Level4State,
} from "../../../lib/level4Store";
import { loadProgress, type Progress } from "../../../lib/progress";

function topicPool(topic: Topic) {
    return L4_QUESTIONS.filter((x) => x.topic === topic);
}

function firstUnanswered(pool: MCQ[], solved: Record<string, true>) {
    return pool.find((qq) => !solved[qq.id]) ?? null;
}

function nextUnansweredAfter(pool: MCQ[], solved: Record<string, true>, afterId: string) {
    const start = Math.max(0, pool.findIndex((qq) => qq.id === afterId) + 1);
    for (let i = start; i < pool.length; i++) {
        if (!solved[pool[i].id]) return pool[i];
    }
    return null;
}

function anyUnansweredInTopic(topic: Topic, solved: Record<string, true>) {
    return topicPool(topic).some((qq) => !solved[qq.id]);
}

function ProgressCard({
    title,
    solved,
    total,
}: {
    title: string;
    solved: number;
    total: number;
}) {
    const pct = total === 0 ? 0 : Math.round((solved / total) * 100);

    return (
        <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
            <Text style={{ fontWeight: "800" }}>
                {title}: {solved}/{total} ({pct}%)
            </Text>
            <View style={{ height: 12, borderRadius: 999, borderWidth: 1, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${pct}%`, backgroundColor: "black" }} />
            </View>
        </View>
    );
}

export default function Level4() {
    const [progress, setProgress] = useState<Progress | null>(null);
    const [levelState, setLevelState] = useState<Level4State | null>(null);

    const [topic, setTopic] = useState<Topic>("Big-O");
    const [q, setQ] = useState<MCQ | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    const pool = useMemo(() => topicPool(topic), [topic]);

    useFocusEffect(
        useCallback(() => {
            let alive = true;

            (async () => {
                const p = await loadProgress();
                if (!alive) return;
                setProgress(p);

                if (p.unlockedLevel < 4) {
                    router.replace("/");
                    return;
                }

                const s = await loadLevel4();
                if (!alive) return;
                setLevelState(s);

                // if current topic is skipped, jump to a non-skipped one
                const startTopic = s.skippedTopics?.[topic]
                    ? (L4_TOPICS.find((t) => !s.skippedTopics?.[t]) ?? topic)
                    : topic;

                if (startTopic !== topic) setTopic(startTopic);

                const startPool = s.skippedTopics?.[startTopic] ? [] : topicPool(startTopic);
                setQ(firstUnanswered(startPool, s.solved));
                setSelected(null);
                setRevealed(false);
            })();

            return () => {
                alive = false;
            };
        }, [topic])
    );

    if (!progress || !levelState) return <ActivityIndicator style={{ marginTop: 40 }} />;

    // ✅ Completion ignores skipped topics
    const activeQuestions = L4_QUESTIONS.filter((qq) => !levelState.skippedTopics?.[qq.topic]);
    const mcqTotal = activeQuestions.length;
    const mcqSolvedCount = activeQuestions.reduce((acc, qq) => acc + (levelState.solved[qq.id] ? 1 : 0), 0);
    const mcqComplete = mcqTotal === 0 ? true : mcqSolvedCount === mcqTotal;

    const isCurrentTopicSkipped = !!levelState.skippedTopics?.[topic];

    // solved status for current question
    const solved = q ? !!levelState.solved[q.id] : false;

    // require correct before next (unless we're done and going to fill)
    const canGoNext = mcqComplete ? true : q ? solved : true;

    // topic progress
    const topicSolved = pool.filter((qq) => levelState.solved[qq.id]).length;
    const topicTotal = pool.length;

    const onSelectTopic = (t: Topic) => {
        setTopic(t);

        if (levelState.skippedTopics?.[t]) {
            setQ(null);
            setSelected(null);
            setRevealed(false);
            return;
        }

        const newPool = topicPool(t);
        setQ(firstUnanswered(newPool, levelState.solved));
        setSelected(null);
        setRevealed(false);
    };

    const onToggleSkip = async (t: Topic) => {
        const nextState = await toggleSkipTopic(levelState, t);
        setLevelState(nextState);

        // If we just skipped the currently-selected topic, move to a non-skipped topic
        if (t === topic && nextState.skippedTopics?.[t]) {
            const nextTopic =
                L4_TOPICS.find((tt) => !nextState.skippedTopics?.[tt] && anyUnansweredInTopic(tt, nextState.solved)) ??
                L4_TOPICS.find((tt) => !nextState.skippedTopics?.[tt]) ??
                t;

            setTopic(nextTopic);

            const nextPool = nextState.skippedTopics?.[nextTopic] ? [] : topicPool(nextTopic);
            setQ(firstUnanswered(nextPool, nextState.solved));
            setSelected(null);
            setRevealed(false);
            return;
        }

        // If we unskipped the current topic, refresh its question
        if (t === topic && !nextState.skippedTopics?.[t]) {
            const newPool = topicPool(t);
            setQ(firstUnanswered(newPool, nextState.solved));
            setSelected(null);
            setRevealed(false);
        }
    };

    const onPickChoice = async (idx: number) => {
        if (!q) return;
        if (isCurrentTopicSkipped) return;

        setSelected(idx);
        setRevealed(true);

        const nextState = await recordAnswer(levelState, q.id, idx, idx === q.answerIndex);
        setLevelState(nextState);
    };

    const onNext = () => {
        if (isCurrentTopicSkipped) return;

        if (q) {
            const next = nextUnansweredAfter(pool, levelState.solved, q.id);
            if (next) {
                setQ(next);
                setSelected(null);
                setRevealed(false);
                return;
            }
        }

        const nextTopic = L4_TOPICS.find((t) => !levelState.skippedTopics?.[t] && anyUnansweredInTopic(t, levelState.solved));

        if (nextTopic) {
            onSelectTopic(nextTopic);
            return;
        }
    };

    const onReset = async () => {
        const cleared = await resetLevel4();
        setLevelState(cleared);

        const startTopic = L4_TOPICS[0] ?? topic;
        setTopic(startTopic);

        const startPool = topicPool(startTopic);
        setQ(firstUnanswered(startPool, cleared.solved));
        setSelected(null);
        setRevealed(false);
    };

    const onResetSkipped = async () => {
        const next = await resetSkippedTopics(levelState);
        setLevelState(next);

        const newPool = topicPool(topic);
        setQ(firstUnanswered(newPool, next.solved));
        setSelected(null);
        setRevealed(false);
    };

    // ✅ Bottom button behavior:
    // - If complete -> go to fill
    // - Else -> next question (locked until solved)
    const bottomLabel = mcqComplete ? "Fill in the blank questions" : "Next Question";
    const onBottomPress = () => {
        if (mcqComplete) router.replace("/levels/4/fill");
        else onNext();
    };

    return (
        <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Level 4: Technical Practice</Text>

            {/* ✅ Overall progress bar (same style as fill) */}
            <ProgressCard title="Overall Progress (active topics)" solved={mcqSolvedCount} total={mcqTotal} />

            {/* ✅ Topic progress bar (same style as fill) */}
            {isCurrentTopicSkipped ? (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
                    <Text style={{ fontWeight: "800" }}>Topic Progress: (skipped)</Text>
                </View>
            ) : (
                <ProgressCard title={`Topic Progress (${topic})`} solved={topicSolved} total={topicTotal} />
            )}

            <Text style={{ fontWeight: "800" }}>Topics (tap = select, long-press = skip/unskip)</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {L4_TOPICS.map((t) => {
                    const skipped = !!levelState.skippedTopics?.[t];
                    const selectedTopic = t === topic;

                    return (
                        <Pressable
                            key={t}
                            onPress={() => onSelectTopic(t)}
                            onLongPress={() => onToggleSkip(t)}
                            style={{
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderWidth: 1,
                                borderRadius: 999,
                                backgroundColor: selectedTopic ? "#000" : skipped ? "#eee" : "transparent",
                                opacity: skipped ? 0.6 : 1,
                            }}
                        >
                            <Text
                                style={{
                                    color: selectedTopic ? "#fff" : "#000",
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
                onPress={onResetSkipped}
                style={{ alignSelf: "flex-start", padding: 10, borderWidth: 1, borderRadius: 10 }}
            >
                <Text style={{ fontWeight: "800" }}>Reset skipped topics</Text>
            </Pressable>

            {isCurrentTopicSkipped ? (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 10 }}>
                    <Text style={{ fontWeight: "800" }}>This topic is currently skipped.</Text>
                    <Pressable onPress={() => onToggleSkip(topic)} style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}>
                        <Text style={{ textAlign: "center", fontWeight: "800" }}>Unskip topic</Text>
                    </Pressable>
                </View>
            ) : !q ? (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}>
                    <Text style={{ fontWeight: "800" }}>✅ Topic complete!</Text>
                    <Text style={{ color: "#444" }}>
                        {mcqComplete ? "All MCQs complete — continue below." : "Choose another topic or continue."}
                    </Text>
                </View>
            ) : (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800" }}>{q.prompt}</Text>

                    {q.choices.map((choice, idx) => {
                        const isPicked = selected === idx;
                        const bg =
                            revealed && isPicked ? (idx === q.answerIndex ? "#d7ffd7" : "#ffd7d7") : "transparent";

                        return (
                            <Pressable
                                key={idx}
                                disabled={solved} // lock once solved correctly
                                onPress={() => onPickChoice(idx)}
                                style={{ padding: 10, borderWidth: 1, borderRadius: 10, backgroundColor: bg }}
                            >
                                <Text style={{ fontWeight: "700" }}>{choice}</Text>
                            </Pressable>
                        );
                    })}

                    {revealed && (
                        <View style={{ gap: 6 }}>
                            {solved ? (
                                <>
                                    <Text style={{ fontWeight: "800" }}>Correct ✅</Text>
                                    <Text style={{ color: "#333" }}>{q.explanation}</Text>
                                </>
                            ) : (
                                <Text style={{ fontWeight: "800" }}>Not quite ❌ Try again.</Text>
                            )}
                        </View>
                    )}
                </View>
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                    disabled={!canGoNext}
                    onPress={onBottomPress}
                    style={{
                        flex: 1,
                        padding: 14,
                        borderRadius: 10,
                        backgroundColor: "#000",
                        opacity: canGoNext ? 1 : 0.45,
                    }}
                >
                    <Text style={{ color: "#fff", textAlign: "center", fontWeight: "800" }}>{bottomLabel}</Text>
                </Pressable>

                <Pressable onPress={onReset} style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}>
                    <Text style={{ fontWeight: "800" }}>Reset</Text>
                </Pressable>
            </View>
        </View>
    );
}
