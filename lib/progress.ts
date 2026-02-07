// lib/progress.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "interview_prep_progress_v1";

export type Progress = {
    unlockedLevel: 1 | 2 | 3 | 4;
    // checklist items for Level 1
    l1Checklist: Record<string, boolean>;
    // text entry for Level 1 bullet rewrite
    l1BulletRewrite: string;
};

const DEFAULT: Progress = {
    unlockedLevel: 1,
    l1Checklist: {
        onePage: false,
        impactMetrics: false,
        tailoredKeywords: false,
    },
    l1BulletRewrite: "",
};

export async function loadProgress(): Promise<Progress> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Progress) : DEFAULT;
}

export async function saveProgress(p: Progress) {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
}

export function level1Complete(p: Progress): boolean {
    const checklistDone = Object.values(p.l1Checklist).every(Boolean);
    const bulletDone = p.l1BulletRewrite.trim().length > 0;
    return checklistDone && bulletDone;
}

export function unlockLevel2(p: Progress): Progress {
    return { ...p, unlockedLevel: Math.max(p.unlockedLevel, 2) as Progress["unlockedLevel"] };
}
