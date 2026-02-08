// app/levels/4/index.tsx

/**
 * This screen is the Level 4 Multiple Choice Questions (MCQ) practice UI.
 *
 * Key features:
 * - Loads "progress" (what levels are unlocked) and the user's saved Level 4 MCQ state from AsyncStorage.
 * - Lets the user pick a topic and answer questions in that topic.
 * - Requires the user to answer each question correctly before moving on (for non-complete mode).
 * - Allows skipping/unskipping entire topics via long-press.
 * - Computes progress bars:
 *    1) Overall progress across ALL *active* (non-skipped) topics
 *    2) Progress within the currently-selected topic
 * - When all active MCQs are solved, the bottom button changes to go to Fill-in-the-Blank.
 */

import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

// Question bank + list of topic names for Level 4
import { L4_QUESTIONS, L4_TOPICS, type MCQ, type Topic } from "../../../data/level4Qs";

// Persistence helpers for Level 4 MCQ state (AsyncStorage-backed).
// - loadLevel4(): loads saved state
// - recordAnswer(): stores attempted answer + marks solved/missed
// - resetLevel4(): clears state
// - toggleSkipTopic(): marks a topic as skipped/unskipped
// - resetSkippedTopics(): unskips all topics
import {
    loadLevel4,
    recordAnswer,
    resetLevel4,
    toggleSkipTopic,
    resetSkippedTopics,
    type Level4State,
} from "../../../lib/level4Store";

// Overall app progress, used to gate access (unlockedLevel must be >= 4)
import { loadProgress, type Progress } from "../../../lib/progress";

/**
 * Returns all MCQs that belong to a given topic.
 * Example: topicPool("Big-O") returns all Big-O questions.
 */
function topicPool(topic: Topic) {
    return L4_QUESTIONS.filter((x) => x.topic === topic);
}

/**
 * Given a pool of questions and a solved map (qid -> true),
 * return the first question that is NOT solved yet.
 * If everything in the pool is solved, return null.
 */
function firstUnanswered(pool: MCQ[], solved: Record<string, true>) {
    return pool.find((qq) => !solved[qq.id]) ?? null;
}

/**
 * Finds the "next" unanswered question AFTER the given question id.
 * We:
 *  1) find the index of afterId in the pool,
 *  2) start scanning from afterId+1,
 *  3) return the first unsolved question found
 * If none exists, return null.
 */
function nextUnansweredAfter(pool: MCQ[], solved: Record<string, true>, afterId: string) {
    const start = Math.max(0, pool.findIndex((qq) => qq.id === afterId) + 1);
    for (let i = start; i < pool.length; i++) {
        if (!solved[pool[i].id]) return pool[i];
    }
    return null;
}

/**
 * Returns true if there is at least one unanswered question in the given topic.
 * Useful for deciding which topic to jump to next.
 */
function anyUnansweredInTopic(topic: Topic, solved: Record<string, true>) {
    return topicPool(topic).some((qq) => !solved[qq.id]);
}

/**
 * A reusable “card” UI component that matches your fill-in-the-blank progress bars.
 * It prints "title: solved/total (pct%)" and draws a black progress bar.
 */
function ProgressCard({
    title,
    solved,
    total,
}: {
    title: string;
    solved: number;
    total: number;
}) {
    // Percent is integer 0..100. If total is 0, avoid division and show 0.
    const pct = total === 0 ? 0 : Math.round((solved / total) * 100);

    return (
        <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
            <Text style={{ fontWeight: "800" }}>
                {title}: {solved}/{total} ({pct}%)
            </Text>

            {/* Outer bar */}
            <View style={{ height: 12, borderRadius: 999, borderWidth: 1, overflow: "hidden" }}>
                {/* Filled bar: width changes with pct */}
                <View style={{ height: "100%", width: `${pct}%`, backgroundColor: "black" }} />
            </View>
        </View>
    );
}

export default function Level4() {
    // ---------------------------
    // Loaded / persisted app state
    // ---------------------------

    // Overall app progress (unlocked levels, etc.)
    const [progress, setProgress] = useState<Progress | null>(null);

    // Saved MCQ state for Level 4:
    //  attempted: what user last picked
    //  solved: questions answered correctly
    //  missed: questions user has ever gotten wrong
    //  skippedTopics: topics the user chose to skip
    const [levelState, setLevelState] = useState<Level4State | null>(null);

    // ---------------------------
    // Local UI state
    // ---------------------------

    // Current selected topic (controls which pool of questions we display)
    const [topic, setTopic] = useState<Topic>("Big-O");

    // Current question shown on screen (within the topic pool)
    const [q, setQ] = useState<MCQ | null>(null);

    // Index of the choice the user most recently tapped
    const [selected, setSelected] = useState<number | null>(null);

    // Whether to show feedback UI (green/red and explanation)
    const [revealed, setRevealed] = useState(false);

    /**
     * Build the pool of questions for the current topic.
     * useMemo avoids recomputing it unless topic changes.
     */
    const pool = useMemo(() => topicPool(topic), [topic]);

    /**
     * useFocusEffect runs when the screen comes into focus (user navigates here).
     * We load progress and the saved Level 4 state, and then choose a starting question.
     */
    useFocusEffect(
        useCallback(() => {
            // "alive" prevents setting state after the component is unmounted / unfocused.
            // This is a common pattern to avoid warnings when async work finishes late.
            let alive = true;

            (async () => {
                // Load overall progress (e.g., unlockedLevel)
                const p = await loadProgress();
                if (!alive) return;
                setProgress(p);

                // Gate: If Level 4 isn't unlocked, send user home
                if (p.unlockedLevel < 4) {
                    router.replace("/");
                    return;
                }

                // Load saved Level 4 MCQ state from storage
                const s = await loadLevel4();
                if (!alive) return;
                setLevelState(s);

                /**
                 * If the currently-selected topic is skipped,
                 * we auto-jump to the first non-skipped topic (if any).
                 */
                const startTopic = s.skippedTopics?.[topic]
                    ? (L4_TOPICS.find((t) => !s.skippedTopics?.[t]) ?? topic)
                    : topic;

                // Update topic if we had to jump
                if (startTopic !== topic) setTopic(startTopic);

                /**
                 * If startTopic is skipped, the pool is empty (and q becomes null).
                 * Otherwise, get its real pool and pick the first unanswered question.
                 */
                const startPool = s.skippedTopics?.[startTopic] ? [] : topicPool(startTopic);
                setQ(firstUnanswered(startPool, s.solved));

                // Reset per-question UI state whenever we (re)load the screen/topic
                setSelected(null);
                setRevealed(false);
            })();

            // Cleanup when screen loses focus / component unmounts
            return () => {
                alive = false;
            };
        }, [topic])
    );

    /**
     * While we haven't loaded progress/state yet, show a spinner.
     * This prevents rendering UI that depends on null values.
     */
    if (!progress || !levelState) return <ActivityIndicator style={{ marginTop: 40 }} />;

    // ---------------------------
    // Completion / gating logic
    // ---------------------------

    /**
     * We consider "active questions" to be those in topics that are NOT skipped.
     * This makes completion ignore skipped topics.
     */
    const activeQuestions = L4_QUESTIONS.filter((qq) => !levelState.skippedTopics?.[qq.topic]);

    // Total active MCQs
    const mcqTotal = activeQuestions.length;

    // Number of active MCQs that are solved
    const mcqSolvedCount = activeQuestions.reduce(
        (acc, qq) => acc + (levelState.solved[qq.id] ? 1 : 0),
        0
    );

    // All active MCQs solved?
    const mcqComplete = mcqTotal === 0 ? true : mcqSolvedCount === mcqTotal;

    // Is the currently selected topic skipped?
    const isCurrentTopicSkipped = !!levelState.skippedTopics?.[topic];

    // Is the current question solved correctly?
    const solved = q ? !!levelState.solved[q.id] : false;

    /**
     * Bottom button enable/disable:
     * - If all MCQs complete, allow navigation to fill regardless.
     * - Otherwise, require that the current question is solved before allowing "Next".
     */
    const canGoNext = mcqComplete ? true : q ? solved : true;

    // ---------------------------
    // Topic progress counts
    // ---------------------------

    // How many questions in THIS topic are solved?
    const topicSolved = pool.filter((qq) => levelState.solved[qq.id]).length;
    const topicTotal = pool.length;

    // ---------------------------
    // Event handlers
    // ---------------------------

    /**
     * Selecting a topic:
     * - update topic
     * - if topic is skipped, show "skipped" UI (q = null)
     * - else load the first unanswered question in that topic
     * - reset selection/revealed UI
     */
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

    /**
     * Long-press skip/unskip a topic:
     * - Update persistent skip map in storage
     * - If we skipped the current topic, auto-jump to a non-skipped topic
     * - If we unskipped the current topic, refresh the first unanswered question
     */
    const onToggleSkip = async (t: Topic) => {
        const nextState = await toggleSkipTopic(levelState, t);
        setLevelState(nextState);

        // If we just skipped the currently-selected topic, jump away.
        if (t === topic && nextState.skippedTopics?.[t]) {
            // Prefer a non-skipped topic that still has unanswered questions,
            // otherwise any non-skipped topic, otherwise fallback to current.
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

        // If we unskipped the current topic, refresh its first unanswered question.
        if (t === topic && !nextState.skippedTopics?.[t]) {
            const newPool = topicPool(t);
            setQ(firstUnanswered(newPool, nextState.solved));
            setSelected(null);
            setRevealed(false);
        }
    };

    /**
     * When user taps a choice:
     * - update selection UI
     * - reveal feedback UI
     * - persist attempted answer
     * - if correct, question becomes solved in storage
     */
    const onPickChoice = async (idx: number) => {
        if (!q) return;
        if (isCurrentTopicSkipped) return;

        setSelected(idx);
        setRevealed(true);

        const nextState = await recordAnswer(levelState, q.id, idx, idx === q.answerIndex);
        setLevelState(nextState);
    };

    /**
     * Advance to the next question:
     * 1) Try next unanswered within the same topic after current question
     * 2) If none, find the next topic that has unanswered questions (and isn't skipped)
     */
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
    };

    /**
     * Reset everything for Level 4 MCQs:
     * - clears storage
     * - goes back to the first topic
     * - loads first unanswered question
     */
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

    /**
     * Unskip all skipped topics.
     * We keep question solved/attempted history, only reset skip flags.
     */
    const onResetSkipped = async () => {
        const next = await resetSkippedTopics(levelState);
        setLevelState(next);

        const newPool = topicPool(topic);
        setQ(firstUnanswered(newPool, next.solved));
        setSelected(null);
        setRevealed(false);
    };

    /**
     * Bottom button behavior:
     * - If all active MCQs are complete -> navigate to fill screen
     * - Else -> go to next question (but button is disabled until current is solved)
     */
    const bottomLabel = mcqComplete ? "Fill in the blank questions" : "Next Question";
    const onBottomPress = () => {
        if (mcqComplete) router.replace("/levels/4/fill");
        else onNext();
    };

    // ---------------------------
    // Render UI
    // ---------------------------
    return (
        <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: "800" }}>Level 4: Technical Practice</Text>

            {/* Overall progress bar (counts only active, non-skipped topics) */}
            <ProgressCard title="Overall Progress (active topics)" solved={mcqSolvedCount} total={mcqTotal} />

            {/* Topic progress bar: if the topic is skipped, show a simple card instead */}
            {isCurrentTopicSkipped ? (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 8 }}>
                    <Text style={{ fontWeight: "800" }}>Topic Progress: (skipped)</Text>
                </View>
            ) : (
                <ProgressCard title={`Topic Progress (${topic})`} solved={topicSolved} total={topicTotal} />
            )}

            <Text style={{ fontWeight: "800" }}>Topics (tap = select, long-press = skip/unskip)</Text>

            {/* Topic pills */}
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

            {/* Reset skip flags */}
            <Pressable
                onPress={onResetSkipped}
                style={{ alignSelf: "flex-start", padding: 10, borderWidth: 1, borderRadius: 10 }}
            >
                <Text style={{ fontWeight: "800" }}>Reset skipped topics</Text>
            </Pressable>

            {/* Main content area: skipped topic message OR question UI */}
            {isCurrentTopicSkipped ? (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 10 }}>
                    <Text style={{ fontWeight: "800" }}>This topic is currently skipped.</Text>
                    <Pressable onPress={() => onToggleSkip(topic)} style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}>
                        <Text style={{ textAlign: "center", fontWeight: "800" }}>Unskip topic</Text>
                    </Pressable>
                </View>
            ) : !q ? (
                // If q is null, that means this topic has no unanswered questions
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}>
                    <Text style={{ fontWeight: "800" }}>✅ Topic complete!</Text>
                    <Text style={{ color: "#444" }}>
                        {mcqComplete ? "All MCQs complete — continue below." : "Choose another topic or continue."}
                    </Text>
                </View>
            ) : (
                // Normal question UI
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800" }}>{q.prompt}</Text>

                    {q.choices.map((choice, idx) => {
                        const isPicked = selected === idx;

                        // Highlight the selected choice after the user taps (green if correct, red if wrong)
                        const bg = revealed && isPicked ? (idx === q.answerIndex ? "#d7ffd7" : "#ffd7d7") : "transparent";

                        return (
                            <Pressable
                                key={idx}
                                disabled={solved} // Once solved, lock choice buttons to prevent changes
                                onPress={() => onPickChoice(idx)}
                                style={{ padding: 10, borderWidth: 1, borderRadius: 10, backgroundColor: bg }}
                            >
                                <Text style={{ fontWeight: "700" }}>{choice}</Text>
                            </Pressable>
                        );
                    })}

                    {/* Feedback area shown after user picks a choice */}
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

            {/* Bottom controls */}
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
