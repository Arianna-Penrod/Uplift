// lib/level4FillBlankStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "level4_fill_state_v1";

export type Level4FillState = {
    solved: Record<string, true>; // exerciseId -> true
};

const DEFAULT: Level4FillState = { solved: {} };

export async function loadLevel4Fill(): Promise<Level4FillState> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Level4FillState) : DEFAULT;
}

export async function saveLevel4Fill(s: Level4FillState) {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export async function markFillSolved(state: Level4FillState, id: string) {
    const next: Level4FillState = { ...state, solved: { ...state.solved, [id]: true } };
    await saveLevel4Fill(next);
    return next;
}

export async function resetLevel4Fill() {
    await saveLevel4Fill(DEFAULT);
    return DEFAULT;
}
