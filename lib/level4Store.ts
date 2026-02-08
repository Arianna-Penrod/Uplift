// lib/level4Store.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "level4_state_v2";

/**
 * attempted: last selected choice for a question (saved even if wrong)
 * solved: only set when the question is answered correctly
 * missed: marked if the user ever got that question wrong
 */
export type Level4State = {
    attempted: Record<string, number>; // qid -> last selected index
    solved: Record<string, true>;      // qid -> true (only when correct)
    missed: Record<string, true>;      // qid -> true (if ever wrong)
};

const DEFAULT: Level4State = {
    attempted: {},
    solved: {},
    missed: {},
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
        attempted: { ...state.attempted, [qid]: selectedIndex },
        solved: isCorrect ? { ...state.solved, [qid]: true } : state.solved,
        missed: !isCorrect ? { ...state.missed, [qid]: true } : state.missed,
    };

    await saveLevel4(next);
    return next;
}
