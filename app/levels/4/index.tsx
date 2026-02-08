import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import { L4_QUESTIONS, L4_TOPICS, type MCQ, type Topic } from "../../../data/level4Qs";
import { loadLevel4, recordAnswer, resetLevel4, type Level4State } from "../../../lib/level4Store";
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

                setQ(firstUnanswered(topicPool(topic), s.solved));
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

    // ✅ MCQ completion is based on SOLVED, not attempted
    const mcqTotal = L4_QUESTIONS.length;

    // Count only solved questions that exist in *this* current question set
    const mcqSolvedCount = L4_QUESTIONS.reduce(
        (acc, qq) => acc + (levelState.solved[qq.id] ? 1 : 0),
        0
    );

    const mcqComplete = mcqSolvedCount === mcqTotal;


    // solved status for current question
    const solved = q ? !!levelState.solved[q.id] : false;

    // require correct before next
    const canGoNext = q ? solved : true;

    // topic progress bar
    const topicSolved = pool.filter((qq) => levelState.solved[qq.id]).length;
    const topicTotal = pool.length;
    const topicPct = topicTotal === 0 ? 0 : Math.round((topicSolved / topicTotal) * 100);

    const onSelectTopic = (t: Topic) => {
        setTopic(t);
        const newPool = topicPool(t);
        setQ(firstUnanswered(newPool, levelState.solved));
        setSelected(null);
        setRevealed(false);
    };

    const onPickChoice = async (idx: number) => {
        if (!q) return;

        setSelected(idx);
        setRevealed(true);

        const nextState = await recordAnswer(levelState, q.id, idx, idx === q.answerIndex);
        setLevelState(nextState);
    };

    const onNext = () => {
        if (q) {
            const next = nextUnansweredAfter(pool, levelState.solved, q.id);
            if (next) {
                setQ(next);
                setSelected(null);
                setRevealed(false);
                return;
            }
        }

        const nextTopic = L4_TOPICS.find((t) => anyUnansweredInTopic(t, levelState.solved));
        if (nextTopic) {
            onSelectTopic(nextTopic);
            return;
        }

        // If MCQ complete, nudge them forward
        // (or leave them here and rely on the button)
    };

    const onReset = async () => {
        const cleared = await resetLevel4();
        setLevelState(cleared);
        setQ(firstUnanswered(pool, cleared.solved));
        setSelected(null);
        setRevealed(false);
    };

    return (
        <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Level 4: Technical Practice</Text>

            {/* ✅ Continue button is locked until ALL MCQs are SOLVED */}
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
                        : `Finish MCQs first (${mcqSolvedCount}/${mcqTotal})`}
                </Text>
            </Pressable>

            {/* Topic progress bar */}
            <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
                <Text style={{ fontWeight: "800" }}>
                    Topic Progress: {topicSolved}/{topicTotal} ({topicPct}%)
                </Text>
                <View style={{ height: 12, borderRadius: 999, borderWidth: 1, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${topicPct}%`, backgroundColor: "black" }} />
                </View>
            </View>

            <Text style={{ fontWeight: "800" }}>Topics</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {L4_TOPICS.map((t) => (
                    <Pressable
                        key={t}
                        onPress={() => onSelectTopic(t)}
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

            {!q ? (
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
                    <Text style={{ color: "#fff", textAlign: "center", fontWeight: "800" }}>Next Question</Text>
                </Pressable>

                <Pressable onPress={onReset} style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}>
                    <Text style={{ fontWeight: "800" }}>Reset</Text>
                </Pressable>
            </View>
        </View>
    );
}
