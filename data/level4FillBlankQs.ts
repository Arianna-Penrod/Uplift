// data/level4FillBlank.ts
export type BlankRule =
    | { kind: "exact"; answer: string | string[] }
    | { kind: "regex"; pattern: string; flags?: string; example?: string };

export type FillBlankExercise = {
    id: string;
    title: string;
    topic?: string;
    template: string;       // uses {{0}}, {{1}}, ...
    blanks: BlankRule[];    // rules for each placeholder index
    explanation?: string;
};

export const L4_FILL_EXERCISES: FillBlankExercise[] = [
    {
        id: "fib-two-sum",
        topic: "Hash Maps",
        title: "Two Sum (Hash Map) — fill the blanks",
        template: `function twoSum(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; {{0}}) {
    const complement = {{1}};
    if (map[complement] !== undefined) {
      return [map[complement], i];
    }
    {{2}};
  }
}`,
        blanks: [
            { kind: "regex", pattern: "^i\\s*(\\+\\+|\\+=\\s*1)$", example: "i++" },
            { kind: "exact", answer: ["target - nums[i]", "target-nums[i]"] },
            {
                kind: "regex",
                pattern: "^map\\s*\\[\\s*nums\\s*\\[\\s*i\\s*\\]\\s*\\]\\s*=\\s*i\\s*;?$",
                example: "map[nums[i]] = i",
            },
        ],
        explanation: "Compute the complement, check if it exists, then store the current index.",
    },
];
