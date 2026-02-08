// app/levels/4/fill.tsx

/**
 * This screen is the Level 4 "Fill in the Blank" practice UI.
 *
 * Big picture:
 * - This screen is *gated* behind the Level 4 MCQs:
 *   The user must finish all ACTIVE (non-skipped) MCQs before entering this screen.
 *
 * What it supports:
 * - Topic selection (tap) and topic skip/unskip (long-press)
 * - Progress tracking (overall + per-topic) with the same bar style as MCQs
 * - A "Next Exercise" button that advances to the next unsolved exercise
 * - A congrats modal that shows once when all ACTIVE exercises are solved
 * - Back/Home/Reset buttons at the bottom
 *
 * Important implementation details:
 * - We use `useFocusEffect` to re-load data each time the screen is focused.
 * - We use a local `cursorId` to support a "Next Exercise" button even if
 *   your default "current exercise" is usually the first unsolved.
 * - The congrats modal uses a `congratsShown` boolean so it does NOT re-open
 *   endlessly when `fillComplete` stays true.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Modal } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

// Reusable card UI for consistent elevated sections
import { Card } from "../../../components/Card";

// We use MCQ question definitions ONLY to enforce the gate (must finish MCQs first)
import { L4_QUESTIONS } from "../../../data/level4Qs";
import { loadLevel4 } from "../../../lib/level4Store";

// Fill-in-the-blank exercises data
import { L4_FILL_EXERCISES } from "../../../data/level4FillBlankQs";

// UI component that renders one fill-in-the-blank exercise and provides checking logic
import { FillBlankCode } from "../../../components/FillBlankUI";

// Persistence helpers for fill-in-the-blank state (AsyncStorage-backed):
// - loadLevel4Fill(): load fill state
// - markFillSolved(): mark an exercise as solved
// - resetLevel4Fill(): clear all fill progress
// - toggleFillTopicSkip(): skip/unskip a fill topic
// - resetFillTopicSkips(): unskip all fill topics
import {
    loadLevel4Fill,
    markFillSolved,
    resetLevel4Fill,
    toggleFillTopicSkip,
    resetFillTopicSkips,
    type Level4FillState,
} from "../../../lib/level4FillBlankStore";

// Overall app progress (unlockedLevel gate)
import { loadProgress } from "../../../lib/progress";

export default function Level4Fill() {
    // ---------------------------
    // Persisted fill-in-the-blank state
    // ---------------------------

    /**
     * st holds the entire stored fill state (or null while loading).
     * Typical fields include:
     * - solved: Record<exerciseId, true>
     * - skippedTopics: Record<topicName, true>
     *
     * We keep it in state so UI re-renders as user solves/skip topics.
     */
    const [st, setSt] = useState<Level4FillState | null>(null);

    // ---------------------------
    // Local UI state
    // ---------------------------

    /**
     * Which topic is currently selected in the fill screen.
     * If null, no topic is selected (we try to always set one on load).
     */
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    /**
     * cursorId allows the "Next Exercise" button to work even if you haven't solved
     * the current exercise. If cursorId is set, we try to display that exercise.
     *
     * Without cursorId, we default to "first unsolved exercise in the selected topic".
     */
    const [cursorId, setCursorId] = useState<string | null>(null);

    // ---------------------------
    // Congrats popup state
    // ---------------------------

    /**
     * showCongrats controls whether the congrats Modal is visible.
     */
    const [showCongrats, setShowCongrats] = useState(false);

    /**
     * congratsShown prevents the modal from reopening repeatedly:
     * - When fillComplete becomes true, we show the modal and set congratsShown=true.
     * - Closing the modal only sets showCongrats=false.
     * - Because congratsShown stays true, the effect will NOT re-open the modal.
     */
    const [congratsShown, setCongratsShown] = useState(false);

    // ---------------------------
    // Helper: normalize "topic" text
    // ---------------------------

    /**
     * Some exercises might have missing/blank topic fields.
     * We normalize those to "General" so the topic system is stable.
     */
    const topicLabel = (t?: string) => (t && t.trim().length ? t : "General");

    // ---------------------------
    // Build list of unique topics from the exercises
    // ---------------------------

    /**
     * topics is a stable sorted list of topic names found in L4_FILL_EXERCISES.
     * We compute this with useMemo so it only recomputes when the exercise list changes.
     */
    const topics = useMemo(() => {
        const set = new Set<string>();
        for (const ex of L4_FILL_EXERCISES) set.add(topicLabel((ex as any).topic));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, []);

    // ---------------------------
    // Reset cursor any time the selected topic changes
    // ---------------------------

    /**
     * If the user switches topics, it makes little sense to keep a cursorId that
     * points to an exercise in the old topic. So we clear it.
     */
    useEffect(() => {
        setCursorId(null);
    }, [selectedTopic]);

    // ---------------------------
    // Load data when this screen is focused
    // ---------------------------

    /**
     * useFocusEffect runs every time the user navigates to this screen.
     * That means the UI always reflects the latest saved progress.
     */
    useFocusEffect(
        useCallback(() => {
            // Alive flag prevents updating state if user navigates away mid-load.
            let alive = true;

            (async () => {
                // 1) Load overall progress to enforce level gating
                const p = await loadProgress();
                if (!alive) return;

                // If Level 4 isn't unlocked, bounce to home
                if (p.unlockedLevel < 4) {
                    router.replace("/");
                    return;
                }

                // 2) Gate access: require MCQs complete (ignoring skipped MCQ topics)
                const mcq = await loadLevel4();

                // Only count MCQs in topics that are NOT skipped in MCQ mode
                const activeMcqs = L4_QUESTIONS.filter((qq) => !mcq.skippedTopics?.[qq.topic]);

                // Count how many of those are solved
                const mcqSolvedCount = activeMcqs.reduce((acc, qq) => acc + (mcq.solved[qq.id] ? 1 : 0), 0);

                // Complete if either:
                // - There are zero active MCQs (all MCQ topics are skipped), OR
                // - All active MCQs are solved
                const mcqComplete = activeMcqs.length === 0 ? true : mcqSolvedCount === activeMcqs.length;

                // If MCQs aren't complete, send user back to MCQ screen
                if (!mcqComplete) {
                    router.replace("/levels/4");
                    return;
                }

                // 3) Load fill-in-the-blank state
                const s = await loadLevel4Fill();
                if (!alive) return;

                setSt(s);

                // Reset popup flags each time user enters screen
                // (so if they complete again later, they can see it again)
                setShowCongrats(false);
                setCongratsShown(false);

                // 4) Pick a good default selected topic:
                // Prefer first topic that:
                // - is NOT skipped in fill mode AND
                // - has at least one UNSOLVED exercise
                //
                // Otherwise: first topic that isn't skipped
                // Otherwise: first topic in the list
                const firstNonSkippedWithUnsolved =
                    topics.find(
                        (t) =>
                            !s.skippedTopics[t] &&
                            L4_FILL_EXERCISES.some((ex) => topicLabel((ex as any).topic) === t && !s.solved[ex.id])
                    ) ??
                    topics.find((t) => !s.skippedTopics[t]) ??
                    (topics[0] ?? null);

                setSelectedTopic(firstNonSkippedWithUnsolved);

                // Ensure cursorId is reset on entry
                setCursorId(null);
            })();

            // Cleanup function for focus effect
            return () => {
                alive = false;
            };
        }, [topics])
    );

    // ---------------------------
    // Derived values (no hooks below this comment)
    // ---------------------------

    /**
     * activeExercises = exercises that are NOT in skipped topics (fill mode).
     * If st is null (still loading), activeExercises is empty.
     */
    const activeExercises = st
        ? L4_FILL_EXERCISES.filter((ex) => !st.skippedTopics[topicLabel((ex as any).topic)])
        : [];

    /**
     * Overall active progress:
     * - solvedCount = how many active exercises are solved
     * - total = how many active exercises exist
     * - pct = progress percentage
     */
    const solvedCount = st ? activeExercises.filter((ex) => st.solved[ex.id]).length : 0;
    const total = activeExercises.length;
    const pct = total === 0 ? 0 : Math.round((solvedCount / total) * 100);

    /**
     * Determine if there is any unsolved active exercise left.
     * If not, user has completed ALL active fill exercises.
     */
    const anyActiveUnsolved = st ? activeExercises.some((ex) => !st.solved[ex.id]) : true;

    /**
     * fillComplete becomes true when either:
     * - there are 0 active exercises (everything skipped), OR
     * - there are no unsolved active exercises
     */
    const fillComplete = !!st && (total === 0 ? true : !anyActiveUnsolved);

    /**
     * Show congrats only once per completion.
     * IMPORTANT:
     * - If you close the modal, showCongrats becomes false.
     * - We do NOT want the effect to reopen it immediately while fillComplete is still true,
     *   so we also set congratsShown = true the first time we open it.
     */
    useEffect(() => {
        if (fillComplete && !congratsShown) {
            setShowCongrats(true);
            setCongratsShown(true);
        }
    }, [fillComplete, congratsShown]);

    /**
     * If we haven't loaded st yet, show a spinner.
     * (This early return is safe because ALL hooks above run every render.)
     */
    if (!st) {
        return <ActivityIndicator style={{ marginTop: 40 }} />;
    }

    // ---------------------------
    // Per-topic pool + per-topic progress
    // ---------------------------

    /**
     * selectedPool is the list of active exercises for the currently selected topic.
     * If no topic is selected, it is empty.
     */
    const selectedPool = selectedTopic
        ? activeExercises.filter((ex) => topicLabel((ex as any).topic) === selectedTopic)
        : [];

    // Topic progress within the selected topic
    const topicSolved = selectedPool.filter((ex) => st.solved[ex.id]).length;
    const topicTotal = selectedPool.length;
    const topicPct = topicTotal === 0 ? 0 : Math.round((topicSolved / topicTotal) * 100);

    // ---------------------------
    // Decide what exercise to show ("effectiveCurrent")
    // ---------------------------

    /**
     * effectiveCurrent is the exercise we actually render.
     *
     * Priority:
     * 1) If cursorId is set and points to an UNSOLVED exercise in selectedPool -> show that.
     * 2) Otherwise -> show the first unsolved exercise in selectedPool.
     * 3) If none unsolved -> null (topic completed)
     */
    const effectiveCurrent = (() => {
        if (!selectedTopic) return null;

        // first unsolved in this topic
        const firstUnsolved = selectedPool.find((ex) => !st.solved[ex.id]) ?? null;

        // If no cursor is set, default to first unsolved
        if (!cursorId) return firstUnsolved;

        // If cursorId exists, see if it points to an exercise in the pool
        const found = selectedPool.find((ex) => ex.id === cursorId) ?? null;

        // Only use cursor if the exercise is NOT solved
        if (found && !st.solved[found.id]) return found;

        // Otherwise fallback
        return firstUnsolved;
    })();

    // ---------------------------
    // Navigation helpers (topic jumping / skipping)
    // ---------------------------

    /**
     * Finds the next best topic to move to that:
     * - isn't skipped
     * - has an unsolved exercise
     *
     * If none exist, picks the first non-skipped topic.
     * If all topics are skipped, it becomes null.
     */
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

    /**
     * Long-press handler: skip/unskip a topic in fill mode.
     * If the user skips the currently-selected topic, we auto-pick a new topic.
     */
    const onToggleSkip = async (t: string) => {
        const nextState = await toggleFillTopicSkip(st, t);
        setSt(nextState);

        // If we just skipped the currently-selected topic, choose a new topic
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

    // ---------------------------
    // "Next Exercise" button logic
    // ---------------------------

    /**
     * Advances within the selected topic:
     * - Move to the next UNSOLVED exercise after the current one.
     * - If none exist in this topic, jump to the next topic with unsolved exercises.
     */
    const onNextExercise = () => {
        // If we somehow have no current exercise, jump topics
        if (!effectiveCurrent) {
            jumpToNextTopicWithUnsolved();
            return;
        }

        // Find where we are in the topic list
        const idx = selectedPool.findIndex((ex) => ex.id === effectiveCurrent.id);
        if (idx < 0) return;

        // Scan forward for the next unsolved exercise in this topic
        for (let i = idx + 1; i < selectedPool.length; i++) {
            if (!st.solved[selectedPool[i].id]) {
                setCursorId(selectedPool[i].id);
                return;
            }
        }

        // If none left, clear cursor and jump topics
        setCursorId(null);
        jumpToNextTopicWithUnsolved();
    };

    // ---------------------------
    // Render UI
    // ---------------------------

    return (
        <View style={{ padding: 16, gap: 12 }}>
            {/* ✅ Congrats popup (Modal) */}
            <Modal
                transparent
                visible={showCongrats}
                animationType="fade"
                onRequestClose={() => setShowCongrats(false)} // Android back button / escape handling
            >
                {/* Dim overlay background */}
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        justifyContent: "center",
                        padding: 20,
                    }}
                >
                    {/* Popup card */}
                    <View style={{ backgroundColor: "white", borderRadius: 14, padding: 16, gap: 12 }}>
                        <Text style={{ fontSize: 20, fontWeight: "900" }}>🎉 Congrats!</Text>
                        <Text style={{ color: "#333" }}>
                            You finished all active Level 4 fill-in-the-blank exercises.
                        </Text>

                        {/* Two action buttons: Home and Back to Level 4 */}
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <Pressable
                                onPress={() => {
                                    // Close modal first so it doesn't flash on the next screen
                                    setShowCongrats(false);
                                    router.replace("/");
                                }}
                                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#0a7ea4" }}
                            >
                                <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>
                                    Return Home
                                </Text>
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

                        {/* Close button (just hides the modal) */}
                        <Pressable onPress={() => setShowCongrats(false)} style={{ padding: 10 }}>
                            <Text style={{ textAlign: "center", fontWeight: "800" }}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <Text style={{ fontSize: 24, fontWeight: "800" }}>Level 4: Fill in the Blank</Text>

            {/* Topics selector */}
            <Card>
                <Text style={{ fontWeight: "800" }}>Topics (tap = select, long-press = skip/unskip)</Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {topics.map((t) => {
                        const skipped = !!st.skippedTopics[t];
                        const isSelected = t === selectedTopic;

                        return (
                            <Pressable
                                key={t}
                                onPress={() => {
                                    // Tap selects topic
                                    setSelectedTopic(t);
                                    setCursorId(null);
                                }}
                                onLongPress={() => onToggleSkip(t)} // Long press toggles skip/unskip
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

                {/* Reset all skipped topics in fill mode */}
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
            </Card>

            {/* Overall progress (active exercises only) */}
            <Card>
                <Text style={{ fontWeight: "800" }}>
                    Overall Progress (active): {solvedCount}/{total} ({pct}%)
                </Text>
                <View style={{ height: 12, borderRadius: 999, borderWidth: 1, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${pct}%`, backgroundColor: "#0a7ea4" }} />
                </View>
            </Card>

            {/* Topic progress (selected topic only) */}
            <Card>
                <Text style={{ fontWeight: "800" }}>
                    Topic: {selectedTopic ?? "None"} — {topicSolved}/{topicTotal} ({topicPct}%)
                </Text>
                <View style={{ height: 12, borderRadius: 999, borderWidth: 1, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${topicPct}%`, backgroundColor: "#0a7ea4" }} />
                </View>
            </Card>

            {/* Exercise section */}
            {!effectiveCurrent ? (
                // If no effectiveCurrent, either:
                // - the selected topic is complete, OR
                // - everything is complete
                <Card>
                    <Text style={{ fontWeight: "800" }}>
                        {anyActiveUnsolved ? "✅ Selected topic complete!" : "🎉 All active fill-blank exercises solved!"}
                    </Text>

                    {/* If there are still unsolved exercises somewhere, let user jump */}
                    {anyActiveUnsolved && (
                        <Pressable
                            onPress={jumpToNextTopicWithUnsolved}
                            style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}
                        >
                            <Text style={{ textAlign: "center", fontWeight: "800" }}>Go to next topic</Text>
                        </Pressable>
                    )}
                </Card>
            ) : (
                // Normal "show current exercise" UI
                <Card style={{ gap: 12 }}>
                    {/* 
            FillBlankCode renders the template, inputs, and "Check" button.
            key={effectiveCurrent.id} forces a full reset of that component when exercise changes
            (so the user doesn't keep previous input values).
          */}
                    <FillBlankCode
                        key={effectiveCurrent.id}
                        exercise={effectiveCurrent}
                        onSolved={async () => {
                            // When FillBlankCode says it's solved, we persist that in storage
                            const next = await markFillSolved(st, effectiveCurrent.id);
                            setSt(next);

                            // Clear cursor so we go back to "first unsolved" behavior
                            setCursorId(null);
                        }}
                    />

                    {/* Next Exercise button uses cursorId logic to jump within topic or to next topic */}
                    <Pressable onPress={onNextExercise} style={{ padding: 12, borderRadius: 10, borderWidth: 1 }}>
                        <Text style={{ textAlign: "center", fontWeight: "800" }}>Next Exercise</Text>
                    </Pressable>
                </Card>
            )}

            {/* Bottom navigation buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
                {/* Back to MCQ screen */}
                <Pressable
                    onPress={() => router.replace("/levels/4")}
                    style={{ flex: 1, padding: 14, borderRadius: 10, borderWidth: 1 }}
                >
                    <Text style={{ textAlign: "center", fontWeight: "800" }}>Back</Text>
                </Pressable>

                {/* Home */}
                <Pressable
                    onPress={() => router.replace("/")}
                    style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: "#0a7ea4" }}
                >
                    <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>Home</Text>
                </Pressable>

                {/* Reset fill progress */}
                <Pressable
                    onPress={async () => {
                        // Clear fill state in storage
                        const cleared = await resetLevel4Fill();
                        setSt(cleared);

                        // Choose a new starting topic (first non-skipped)
                        const firstNonSkipped = topics.find((t) => !cleared.skippedTopics[t]) ?? (topics[0] ?? null);
                        setSelectedTopic(firstNonSkipped);

                        // Clear cursor and modal state
                        setCursorId(null);
                        setShowCongrats(false);
                        setCongratsShown(false);
                    }}
                    style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}
                >
                    <Text style={{ fontWeight: "800" }}>Reset</Text>
                </Pressable>
            </View>
        </View>
    );
}
