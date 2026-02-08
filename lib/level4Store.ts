// lib/level4Store.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "level4_state_v1";

export type Level4State = {
    correct: number;
    total: number;
    answered: Record<string, number>; // questionId -> selectedIndex
    missed: Record<string, true>;     // questionId -> true
};

const DEFAULT: Level4State = {
    correct: 0,
    total: 0,
    answered: {},
    missed: {},
};

export async function loadLevel4(): Promise<Level4State> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Level4State) : DEFAULT;
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
) {
    const alreadySolved = Object.prototype.hasOwnProperty.call(state.answered, qid);

    const next: Level4State = {
        // count attempts as "total" (optional—keep if you want)
        total: state.total + 1,

        // only add to correct score the first time they solve it
        correct: state.correct + (isCorrect && !alreadySolved ? 1 : 0),

        // ✅ only mark "answered" when correct (this is what prevents skipping)
        answered: isCorrect ? { ...state.answered, [qid]: selectedIndex } : state.answered,

        // track misses if you want
        missed: isCorrect ? state.missed : { ...state.missed, [qid]: true },
    };

    await saveLevel4(next);
    return next;
}
