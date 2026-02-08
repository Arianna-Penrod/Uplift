// lib/level4FillBlankStore.ts

/**
 * This file is the persistence layer (storage) for Level 4 "Fill in the Blank".
 *
 * It uses AsyncStorage (React Native) to save/load the user's progress so it
 * survives app restarts.
 *
 * What we store:
 * - solved:        which fill exercises have been solved (exerciseId -> true)
 * - skippedTopics: which topics have been skipped (topicName -> true)
 *
 * Why this exists:
 * - Your UI needs a reliable source of truth for progress + skips.
 * - Keeping this logic in one file keeps your UI components simpler.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Storage key for AsyncStorage.
 *
 * "v2" means this is a newer schema than the previous version.
 * You bumped the version because you added `skippedTopics`.
 *
 * Why bump the version?
 * - If you changed the structure of what is saved, older saved JSON might not match.
 * - Using a new key lets you avoid parsing errors and avoids mixing old/new formats.
 */
const KEY = "level4_fill_state_v2";

/**
 * The shape of the fill-in-the-blank state we persist.
 *
 * solved:
 *  - Record<string, true>
 *  - If solved["fib-two-sum"] === true, that exercise is completed.
 *  - We only store `true` keys; unsolved exercises just don't exist in the object.
 *
 * skippedTopics:
 *  - Record<string, true>
 *  - If skippedTopics["Hash Maps"] === true, we treat that topic as skipped.
 *  - Again, we store only `true` keys. If a topic is NOT skipped, it won't be in the map.
 */
export type Level4FillState = {
    solved: Record<string, true>; // exerciseId -> true
    skippedTopics: Record<string, true>; // topic -> true
};

/**
 * Default state when there is nothing saved yet (first app launch, or after reset).
 */
const DEFAULT: Level4FillState = { solved: {}, skippedTopics: {} };

/**
 * Loads fill state from AsyncStorage.
 *
 * Steps:
 * 1) Read the raw JSON string from AsyncStorage via the KEY.
 * 2) If nothing exists -> return DEFAULT.
 * 3) Try to JSON.parse it.
 * 4) Use nullish coalescing (??) so missing fields fall back safely.
 * 5) If parsing fails -> return DEFAULT (prevents crashing on corrupted storage).
 */
export async function loadLevel4Fill(): Promise<Level4FillState> {
    const raw = await AsyncStorage.getItem(KEY);

    // If nothing stored yet, return fresh default state
    if (!raw) return DEFAULT;

    try {
        // Parse JSON. We type it as Partial because it might be missing keys.
        const parsed = JSON.parse(raw) as Partial<Level4FillState>;

        // Return a fully-shaped object, filling missing pieces with defaults.
        return {
            solved: parsed.solved ?? {},
            skippedTopics: parsed.skippedTopics ?? {},
        };
    } catch {
        // If the data is corrupted or not valid JSON, fail safely.
        return DEFAULT;
    }
}

/**
 * Saves the given state object to AsyncStorage.
 *
 * We JSON.stringify the state because AsyncStorage stores strings.
 */
export async function saveLevel4Fill(s: Level4FillState) {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

/**
 * Marks a fill exercise as solved.
 *
 * - We create a new state object (`next`) immutably:
 *   - copy existing state
 *   - copy existing solved map
 *   - add/overwrite [id] = true
 *
 * - Then we persist it and return it so the caller can update React state.
 *
 * Why return `next`?
 * - UI code can do:
 *     const next = await markFillSolved(st, exerciseId);
 *     setSt(next);
 *   so UI and storage stay in sync.
 */
export async function markFillSolved(state: Level4FillState, id: string): Promise<Level4FillState> {
    const next: Level4FillState = {
        ...state,
        solved: { ...state.solved, [id]: true },
    };

    await saveLevel4Fill(next);
    return next;
}

/**
 * Toggles skipping for a topic.
 *
 * Used by long-press in your fill screen.
 *
 * Behavior:
 * - If topic is currently skipped, unskip it (remove the key).
 * - If topic is not skipped, skip it (set skippedTopics[topic] = true).
 *
 * Notes:
 * - We "delete" the key when unskipping. This keeps the object small and consistent
 *   with the pattern "presence of key = true means enabled".
 */
export async function toggleFillTopicSkip(state: Level4FillState, topic: string): Promise<Level4FillState> {
    // Convert to boolean: true if topic key exists and is truthy
    const isSkipped = !!state.skippedTopics[topic];

    // Copy the map so we don't mutate state.skippedTopics directly
    const nextSkipped = { ...state.skippedTopics };

    if (isSkipped) {
        // Unskip: remove the key entirely
        delete nextSkipped[topic];
    } else {
        // Skip: add key -> true
        nextSkipped[topic] = true;
    }

    // Build the next state object and persist it
    const next: Level4FillState = { ...state, skippedTopics: nextSkipped };
    await saveLevel4Fill(next);
    return next;
}

/**
 * Clears ALL skipped topics (but keeps solved progress).
 *
 * This is the "Reset skipped topics" button in your fill screen.
 *
 * Why accept an optional state param?
 * - Sometimes you already have `st` loaded and want to reset skips from that.
 * - Sometimes you want to call it without caring about current state.
 *
 * Behavior:
 * - Use the provided state if given, otherwise DEFAULT.
 * - Set skippedTopics to {} (meaning: nothing is skipped).
 * - Save + return.
 */
export async function resetFillTopicSkips(state?: Level4FillState): Promise<Level4FillState> {
    const next: Level4FillState = { ...(state ?? DEFAULT), skippedTopics: {} };
    await saveLevel4Fill(next);
    return next;
}

/**
 * Full reset for fill-in-the-blank progress.
 *
 * - Clears BOTH solved and skipped topics (back to DEFAULT).
 * - Saves and returns DEFAULT so UI can update immediately.
 */
export async function resetLevel4Fill(): Promise<Level4FillState> {
    await saveLevel4Fill(DEFAULT);
    return DEFAULT;
}
