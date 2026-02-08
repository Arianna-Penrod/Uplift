// lib/level4FillBlankStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

// bump version because we added topic skipping
const KEY = "level4_fill_state_v2";

export type Level4FillState = {
    solved: Record<string, true>;         // exerciseId -> true
    skippedTopics: Record<string, true>;  // topic -> true
};

const DEFAULT: Level4FillState = { solved: {}, skippedTopics: {} };

export async function loadLevel4Fill(): Promise<Level4FillState> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT;

    try {
        const parsed = JSON.parse(raw) as Partial<Level4FillState>;
        return {
            solved: parsed.solved ?? {},
            skippedTopics: parsed.skippedTopics ?? {},
        };
    } catch {
        return DEFAULT;
    }
}

export async function saveLevel4Fill(s: Level4FillState) {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

export async function markFillSolved(state: Level4FillState, id: string): Promise<Level4FillState> {
    const next: Level4FillState = { ...state, solved: { ...state.solved, [id]: true } };
    await saveLevel4Fill(next);
    return next;
}

// ✅ long-press uses this
export async function toggleFillTopicSkip(state: Level4FillState, topic: string): Promise<Level4FillState> {
    const isSkipped = !!state.skippedTopics[topic];
    const nextSkipped = { ...state.skippedTopics };

    if (isSkipped) delete nextSkipped[topic];
    else nextSkipped[topic] = true;

    const next: Level4FillState = { ...state, skippedTopics: nextSkipped };
    await saveLevel4Fill(next);
    return next;
}

export async function resetFillTopicSkips(state?: Level4FillState): Promise<Level4FillState> {
    const next: Level4FillState = { ...(state ?? DEFAULT), skippedTopics: {} };
    await saveLevel4Fill(next);
    return next;
}

export async function resetLevel4Fill(): Promise<Level4FillState> {
    await saveLevel4Fill(DEFAULT);
    return DEFAULT;
}
