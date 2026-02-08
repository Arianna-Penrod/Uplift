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

export default function Level4() {
    const [progress, setProgress] = useState<Progress | null>(null);
    const [levelState, setLevelState] = useState<Level4State | null>(null);

    const [topic, setTopic] = useState<Topic>("Big-O");
    const [q, setQ] = useState<MCQ | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    // pool for the currently selected topic (empty if that topic is skipped)
    const pool = useMemo(() => {
        if (!levelState) return topicPool(topic);
        if (levelState.skippedTopics?.[topic]) return [];
        return topicPool(topic);
    }, [topic, levelState]);

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

                // If the current topic is skipped, auto-jump to first non-skipped topic (if any)
                const startTopic =
                    s.skippedTopics?.[topic] ? (L4_TOPICS.find((t) => !s.skippedTopics?.[t]) ?? topic) : topic;

                // If topic changed due to skip, update it
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

    // loading
    if (!progress || !levelState) return <ActivityIndicator style={{ marginTop: 40 }} />;

    // ✅ Completion and progress should ignore skipped topics
    const activeQuestions = L4_QUESTIONS.filter((qq) => !levelState.skippedTopics?.[qq.topic]);
    const mcqTotal = activeQuestions.length;
    const mcqSolvedCount = activeQuestions.reduce(
        (acc, qq) => acc + (levelState.solved[qq.id] ? 1 : 0),
        0
    );
    const mcqComplete = mcqTotal === 0 ? true : mcqSolvedCount === mcqTotal;

    // solved status for current question
    const solved = q ? !!levelState.solved[q.id] : false;

    // require correct before next
    const canGoNext = q ? solved : true;

    const isCurrentTopicSkipped = !!levelState.skippedTopics?.[topic];

    // topic progress bar (only meaningful if not skipped)
    const topicSolved = pool.filter((qq) => levelState.solved[qq.id]).length;
    const topicTotal = pool.length;
    const topicPct = topicTotal === 0 ? 0 : Math.round((topicSolved / topicTotal) * 100);

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

        const nextTopic = L4_TOPICS.find(
            (t) => !levelState.skippedTopics?.[t] && anyUnansweredInTopic(t, levelState.solved)
        );

        if (nextTopic) {
            onSelectTopic(nextTopic);
            return;
        }

        // nothing left (all active topics complete)
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

        // if current topic was skipped, bring it back and refresh
        const newPool = topicPool(topic);
        setQ(firstUnanswered(newPool, next.solved));
        setSelected(null);
        setRevealed(false);
    };

    return (
        <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Level 4: Technical Practice</Text>

            {/* ✅ Continue button is locked until ALL ACTIVE MCQs are SOLVED */}
            <Pressable
                disabled={!mcqComplete}
                onPress={() => router.replace("/levels/4/fill")}
                style={{
                    padding: 12,
                    borderWidth: 1,
                    borderRadius: 10,
                    opacity: mcqComplete ? 1 : 0.45,
                }}
            >
                <Text style={{ textAlign: "center", fontWeight: "800" }}>
                    {mcqComplete
                        ? "Continue → Fill in the Blank"
                        : mcqTotal === 0
                            ? "All MCQ topics are skipped (reset skipped topics to continue)"
                            : `Finish MCQs first (${mcqSolvedCount}/${mcqTotal})`}
                </Text>
            </Pressable>

            {/* Topic progress bar */}
            <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
                <Text style={{ fontWeight: "800" }}>
                    {isCurrentTopicSkipped
                        ? `Topic Progress: (skipped)`
                        : `Topic Progress: ${topicSolved}/${topicTotal} (${topicPct}%)`}
                </Text>
                {!isCurrentTopicSkipped && (
                    <View style={{ height: 12, borderRadius: 999, borderWidth: 1, overflow: "hidden" }}>
                        <View style={{ height: "100%", width: `${topicPct}%`, backgroundColor: "black" }} />
                    </View>
                )}
            </View>

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
                    <Pressable
                        onPress={() => onToggleSkip(topic)}
                        style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}
                    >
                        <Text style={{ textAlign: "center", fontWeight: "800" }}>Unskip topic</Text>
                    </Pressable>
                </View>
            ) : !q ? (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}>
                    <Text style={{ fontWeight: "800" }}>✅ Topic complete!</Text>
                    <Text style={{ color: "#444" }}>Choose another topic or continue.</Text>
                </View>
            ) : (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800" }}>{q.prompt}</Text>

                    {q.choices.map((choice, idx) => {
                        const isPicked = selected === idx;
                        const bg =
                            revealed && isPicked
                                ? idx === q.answerIndex
                                    ? "#d7ffd7"
                                    : "#ffd7d7"
                                : "transparent";

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
                    onPress={onNext}
                    style={{
                        flex: 1,
                        padding: 14,
                        borderRadius: 10,
                        backgroundColor: "#000",
                        opacity: canGoNext ? 1 : 0.45,
                    }}
                >
                    <Text style={{ color: "#fff", textAlign: "center", fontWeight: "800" }}>
                        Next Question
                    </Text>
                </Pressable>

                <Pressable onPress={onReset} style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}>
                    <Text style={{ fontWeight: "800" }}>Reset</Text>
                </Pressable>
            </View>
        </View>
    );
}
