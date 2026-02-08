import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import { L4_QUESTIONS, L4_TOPICS, type MCQ, type Topic } from "../../../data/level4Qs";
import { loadLevel4, recordAnswer, resetLevel4, type Level4State } from "../../../lib/level4Store";
import { loadProgress, type Progress } from "../../../lib/progress";

/**
 * Find the first question in `pool` that has NOT been solved yet.
 * (A question is considered solved if it exists in state.answered.)
 */
function firstUnanswered(pool: MCQ[], answered: Record<string, number>) {
    return pool.find((qq) => answered[qq.id] === undefined) ?? null;
}

/**
 * Find the next unanswered question AFTER `afterId` within the same topic pool.
 * This gives you "sequential" behavior.
 */
function nextUnansweredAfter(pool: MCQ[], answered: Record<string, number>, afterId: string) {
    const start = Math.max(0, pool.findIndex((qq) => qq.id === afterId) + 1);
    for (let i = start; i < pool.length; i++) {
        if (answered[pool[i].id] === undefined) return pool[i];
    }
    return null;
}

/**
 * Checks if a given topic still has any unanswered questions.
 * Useful for jumping to the "next topic that still has work left".
 */
function anyUnansweredInTopic(topic: Topic, answered: Record<string, number>) {
    return L4_QUESTIONS.filter((qq) => qq.topic === topic).some((qq) => answered[qq.id] === undefined);
}

/**
 * Convenience: get all questions for a given topic.
 */
function topicPool(topic: Topic) {
    return L4_QUESTIONS.filter((x) => x.topic === topic);
}

export default function Level4() {
    // -----------------------------
    // Persisted app state (AsyncStorage)
    // -----------------------------
    const [progress, setProgress] = useState<Progress | null>(null);
    const [levelState, setLevelState] = useState<Level4State | null>(null);

    // -----------------------------
    // UI state (what the user is doing right now)
    // -----------------------------
    const [topic, setTopic] = useState<Topic>("Big-O");
    const [q, setQ] = useState<MCQ | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    /**
     * Derived list of questions in the current topic.
     * (Memoized so it doesn't recalc on unrelated renders.)
     */
    const pool = useMemo(() => topicPool(topic), [topic]);

    // -----------------------------
    // Load progress + level-4 state whenever the screen comes into focus
    // -----------------------------
    useFocusEffect(
        useCallback(() => {
            let alive = true;

            (async () => {
                // Load general app progress (unlocked level gating, etc.)
                const p = await loadProgress();
                if (!alive) return;
                setProgress(p);

                // Enforce that Level 4 cannot be opened unless unlocked
                if (p.unlockedLevel < 4) {
                    router.replace("/");
                    return;
                }

                // Load Level 4 quiz state (answered map, missed map, score)
                const s = await loadLevel4();
                if (!alive) return;
                setLevelState(s);

                // Pick the first unanswered question in this topic (sequential start)
                const first = firstUnanswered(topicPool(topic), s.answered);
                setQ(first);

                // Reset UI selection for the new question
                setSelected(null);
                setRevealed(false);
            })();

            return () => {
                alive = false;
            };
        }, [topic])
    );

    // While loading async state, show a spinner
    if (!progress || !levelState) {
        return <ActivityIndicator style={{ marginTop: 40 }} />;
    }

    // -----------------------------
    // Derived flags/stats for rendering
    // -----------------------------

    /**
     * A question is "solved" if it exists in answered[].
     * IMPORTANT: This only works properly if recordAnswer ONLY writes answered[qid] when correct.
     */
    const solved = q ? levelState.answered[q.id] !== undefined : false;

    /**
     * Gate the "Next" button: user must solve current question before moving on.
     * If there is no current question (topic complete), we allow Next to jump topics.
     */
    const canGoNext = q ? solved : true;

    // Score stats
    const pct = levelState.total === 0 ? 0 : Math.round((levelState.correct / levelState.total) * 100);

    // Topic stats
    const topicAnswered = pool.filter((qq) => levelState.answered[qq.id] !== undefined).length;
    const topicMissed = pool.filter((qq) => levelState.missed[qq.id]).length;
    const topicTotal = pool.length;
    const topicSolved = topicAnswered; // same thing: answered in this topic
    const progressRatio = topicTotal === 0 ? 0 : topicSolved / topicTotal;
    const progressPct = Math.round(progressRatio * 100);

    // -----------------------------
    // Event handlers (small + readable)
    // -----------------------------

    /**
     * Switch topics without reloading AsyncStorage again unnecessarily.
     * We immediately show the first unanswered question in the new topic.
     */
    const onSelectTopic = (t: Topic) => {
        setTopic(t);
        const newPool = topicPool(t);
        setQ(firstUnanswered(newPool, levelState.answered));
        setSelected(null);
        setRevealed(false);
    };

    /**
     * User picks an answer choice.
     * - We reveal feedback immediately
     * - We call recordAnswer to persist attempt
     * - If wrong, they can try again (choices stay enabled until solved)
     * - If correct, choices lock and Next becomes enabled
     */
    const onPickChoice = async (idx: number) => {
        if (!q) return;

        setSelected(idx);
        setRevealed(true);

        const nextState = await recordAnswer(levelState, q.id, idx, idx === q.answerIndex);
        setLevelState(nextState);
    };

    /**
     * Move to the next unanswered question in this topic.
     * If none remain, jump to the next topic that still has unanswered questions.
     */
    const onNext = () => {
        // If we're on a question, try to move forward within this topic
        if (q) {
            const next = nextUnansweredAfter(pool, levelState.answered, q.id);
            if (next) {
                setQ(next);
                setSelected(null);
                setRevealed(false);
                return;
            }
        }

        // If no more in this topic (or q is null), go to the next topic with remaining questions
        const nextTopic = L4_TOPICS.find((t) => anyUnansweredInTopic(t, levelState.answered));
        if (nextTopic) {
            onSelectTopic(nextTopic);
            return;
        }

        // Everything is done (optional)
        // router.replace("/congrats");
    };

    /**
     * Clear stored Level 4 progress and restart current topic from the beginning.
     */
    const onReset = async () => {
        const cleared = await resetLevel4();
        setLevelState(cleared);

        setQ(firstUnanswered(pool, cleared.answered));
        setSelected(null);
        setRevealed(false);
    };

    // -----------------------------
    // Render
    // -----------------------------
    return (
        <View style={{ padding: 16, gap: 12 }}>
            {/* Screen Title */}
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Level 4: Technical Practice</Text>

            {/* Score / Progress summary card */}
            <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
                <Text style={{ fontWeight: "800" }}>
                    Progress: {topicSolved}/{topicTotal} solved ({progressPct}%)
                </Text>

                {/* Progress bar container */}
                <View
                    style={{
                        height: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        overflow: "hidden",
                    }}
                >
                    {/* Filled portion */}
                    <View
                        style={{
                            height: "100%",
                            width: `${progressPct}%`,
                            backgroundColor: "black",
                        }}
                    />
                </View>

                <Text style={{ color: "#444" }}>
                    Solve the current question to unlock Next.
                </Text>
            </View>


            {/* Topic pills */}
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

            {/* Question area (handles q == null gracefully when topic complete) */}
            {!q ? (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}>
                    <Text style={{ fontWeight: "800" }}>✅ Topic complete!</Text>
                    <Text style={{ color: "#444" }}>
                        Choose another topic or press Next Question to continue.
                    </Text>
                </View>
            ) : (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800" }}>{q.prompt}</Text>

                    {/* Answer choices */}
                    {q.choices.map((choice, idx) => {
                        const isPicked = selected === idx;

                        // Only color the selected choice after reveal
                        const bg =
                            revealed && isPicked
                                ? idx === q.answerIndex
                                    ? "#d7ffd7" // green if correct
                                    : "#ffd7d7" // red if wrong
                                : "transparent";

                        return (
                            <Pressable
                                key={idx}
                                disabled={solved} // lock choices once solved (correct)
                                onPress={() => onPickChoice(idx)}
                                style={{ padding: 10, borderWidth: 1, borderRadius: 10, backgroundColor: bg }}
                            >
                                <Text style={{ fontWeight: "700" }}>{choice}</Text>
                            </Pressable>
                        );
                    })}

                    {/* Feedback area */}
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

            {/* Navigation buttons */}
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

                <Pressable
                    onPress={onReset}
                    style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}
                >
                    <Text style={{ fontWeight: "800" }}>Reset</Text>
                </Pressable>
            </View>
        </View>
    );
}
