// lib/level4Store.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

// Keep your existing key so users don't lose progress
const KEY = "level4_state_v3";

/**
 * attempted: last selected choice for a question (saved even if wrong)
 * solved: only set when the question is answered correctly
 * missed: marked if the user ever got that question wrong
 * showAnswers: per-question reveal toggle (MCQ UI can use this)
 * skippedTopics: topic -> true (skipped)
 */
export type Level4State = {
    attempted: Record<string, number>;
    solved: Record<string, true>;
    missed: Record<string, true>;
    showAnswers: Record<string, true>;
    skippedTopics: Record<string, true>;
};

const DEFAULT: Level4State = {
    attempted: {},
    solved: {},
    missed: {},
    showAnswers: {},
    skippedTopics: {},
};

export async function loadLevel4(): Promise<Level4State> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT;

    try {
        const parsed = JSON.parse(raw) as Partial<Level4State>;
        return {
            attempted: parsed.attempted ?? {},
            solved: parsed.solved ?? {},
            missed: parsed.missed ?? {},
            showAnswers: parsed.showAnswers ?? {},
            skippedTopics: parsed.skippedTopics ?? {},
        };
    } catch {
        return DEFAULT;
    }
}

export async function saveLevel4(s: Level4State) {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export async function resetLevel4(): Promise<Level4State> {
    await saveLevel4(DEFAULT);
    return DEFAULT;
}

export async function recordAnswer(
    state: Level4State,
    qid: string,
    selectedIndex: number,
    isCorrect: boolean
): Promise<Level4State> {
    const next: Level4State = {
        ...state,
        attempted: { ...state.attempted, [qid]: selectedIndex },
        solved: isCorrect ? { ...state.solved, [qid]: true } : state.solved,
        missed: !isCorrect ? { ...state.missed, [qid]: true } : state.missed,
    };

    await saveLevel4(next);
    return next;
}

// --- MCQ show answers helpers (optional UI usage) ---
export async function toggleShowAnswer(state: Level4State, qid: string): Promise<Level4State> {
    const nextShow = { ...state.showAnswers };
    if (nextShow[qid]) delete nextShow[qid];
    else nextShow[qid] = true;

    const next: Level4State = { ...state, showAnswers: nextShow };
    await saveLevel4(next);
    return next;
}

export async function hideAllAnswers(state: Level4State): Promise<Level4State> {
    const next: Level4State = { ...state, showAnswers: {} };
    await saveLevel4(next);
    return next;
}

// --- Topic skipping ---
export async function toggleSkipTopic(state: Level4State, topic: string): Promise<Level4State> {
    const nextSkipped = { ...state.skippedTopics };
    if (nextSkipped[topic]) delete nextSkipped[topic];
    else nextSkipped[topic] = true;

    const next: Level4State = { ...state, skippedTopics: nextSkipped };
    await saveLevel4(next);
    return next;
}

export async function resetSkippedTopics(state: Level4State): Promise<Level4State> {
    const next: Level4State = { ...state, skippedTopics: {} };
    await saveLevel4(next);
    return next;
}
