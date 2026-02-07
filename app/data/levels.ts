// data/levels.ts
export type ModuleId = "resume-checklist" | "bullet-rewrite";

export const LEVEL1 = {
    id: "1",
    title: "Level 1: Resume",
    modules: [
        { id: "resume-checklist" as const, title: "Resume Checklist", type: "checklist" as const },
        { id: "bullet-rewrite" as const, title: "Rewrite a Bullet", type: "text" as const },
    ],
};

export const ALL_LEVELS = [
    { id: "1", title: "Resume" },
    { id: "2", title: "Elevator Pitch" },
    { id: "3", title: "LinkedIn" },
    { id: "4", title: "Technical Interviews" },
] as const;
