// data/level4FillBlank.ts
export type BlankRule =
    | { kind: "exact"; answer: string | string[] }
    | { kind: "regex"; pattern: string; flags?: string; example?: string };

export type FillBlankExercise = {
    id: string;
    title: string;
    topic?: string;
    template: string; // uses {{0}}, {{1}}, ...
    blanks: BlankRule[]; // rules for each placeholder index
    explanation?: string;
};

export const L4_FILL_EXERCISES: FillBlankExercise[] = [
    // ===================== Big-O (3) =====================
    {
        id: "bigo-binary-search",
        topic: "Big-O",
        title: "Binary Search Time Complexity",
        template: `Binary search halves the search space each step, so its time complexity is {{0}}.`,
        blanks: [{ kind: "exact", answer: ["O(log n)", "O(logn)"] }],
        explanation: "Binary search divides the remaining range by 2 each iteration → logarithmic.",
    },
    {
        id: "bigo-drop-constants",
        topic: "Big-O",
        title: "Drop Constants and Lower Terms",
        template: `If f(n) = 3n^2 + 10n + 7, then f(n) is {{0}} in Big-O notation.`,
        blanks: [{ kind: "exact", answer: ["O(n^2)", "O(n2)"] }],
        explanation: "The n^2 term dominates asymptotically.",
    },
    {
        id: "bigo-nested-loops",
        topic: "Big-O",
        title: "Nested Loops",
        template: `A loop inside a loop, each running n times, does about n * n = {{0}} operations, so the time is {{1}}.`,
        blanks: [
            { kind: "exact", answer: ["n^2", "n2"] },
            { kind: "exact", answer: ["O(n^2)", "O(n2)"] },
        ],
        explanation: "Two n-sized loops multiply to n^2 work.",
    },

    // ===================== Arrays/Strings (3) =====================
    {
        id: "arr-two-pointers-sorted",
        topic: "Arrays/Strings",
        title: "Two Pointers on Sorted Array",
        template: `In a sorted array, the {{0}} technique can find a target pair sum in {{1}} time.`,
        blanks: [
            { kind: "exact", answer: ["two pointers", "two-pointers", "two pointers technique"] },
            { kind: "exact", answer: ["O(n)", "O(n )", "O(n) "] },
        ],
        explanation: "Move left/right pointers inward once per step → linear.",
    },
    {
        id: "arr-sliding-window",
        topic: "Arrays/Strings",
        title: "Sliding Window",
        template: `To compute the max sum of a fixed-size window k in linear time, we use a {{0}} approach.`,
        blanks: [{ kind: "exact", answer: ["sliding window", "sliding-window"] }],
        explanation: "Keep a running sum and slide one element at a time.",
    },
    {
        id: "arr-prefix-sums",
        topic: "Arrays/Strings",
        title: "Prefix Sums for Range Sum",
        template: `If prefix[i] stores the sum of nums[0..i], then sum of nums[l..r] is prefix[r] - {{0}}.`,
        blanks: [{ kind: "exact", answer: ["prefix[l-1]", "prefix[l - 1]"] }],
        explanation: "Range sums can be computed in O(1) after O(n) preprocessing.",
    },

    // ===================== Hash Maps (3) =====================
    {
        id: "hash-two-sum",
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
    {
        id: "hash-frequency-count",
        topic: "Hash Maps",
        title: "Frequency Counting",
        template: `To count frequencies, we store each item as a key and its {{0}} as the value in a hash map.`,
        blanks: [{ kind: "exact", answer: ["count", "frequency"] }],
        explanation: "Keys are items; values are how many times they appear.",
    },
    {
        id: "hash-collision",
        topic: "Hash Maps",
        title: "Hash Collision Definition",
        template: `A hash {{0}} happens when two different keys map to the same bucket/index.`,
        blanks: [{ kind: "exact", answer: ["collision"] }],
        explanation: "Collisions are resolved using chaining or open addressing.",
    },

    // ===================== Stacks/Queues (3) =====================
    {
        id: "sq-parens-stack",
        topic: "Stacks/Queues",
        title: "Valid Parentheses",
        template: `To validate matching parentheses, we typically use a {{0}} because it is LIFO.`,
        blanks: [{ kind: "exact", answer: ["stack", "Stack"] }],
        explanation: "The last opening bracket must match the first closing bracket encountered.",
    },
    {
        id: "sq-bfs-queue",
        topic: "Stacks/Queues",
        title: "BFS Uses Queue",
        template: `Breadth-first search (BFS) is implemented with a {{0}} to process nodes in FIFO order.`,
        blanks: [{ kind: "exact", answer: ["queue", "Queue"] }],
        explanation: "FIFO ensures level-by-level exploration.",
    },
    {
        id: "sq-mono-stack",
        topic: "Stacks/Queues",
        title: "Monotonic Stack",
        template: `A monotonic stack maintains elements in {{0}} or decreasing order to solve 'next greater element' efficiently.`,
        blanks: [{ kind: "exact", answer: ["increasing"] }],
        explanation: "Each element is pushed/popped at most once → O(n).",
    },

    // ===================== Trees/Graphs (3) =====================
    {
        id: "tg-bfs-unweighted-shortest",
        topic: "Trees/Graphs",
        title: "BFS Shortest Path",
        template: `In an {{0}} graph, BFS finds the shortest path in terms of number of edges.`,
        blanks: [{ kind: "exact", answer: ["unweighted", "Unweighted"] }],
        explanation: "BFS explores by distance layers (edge count).",
    },
    {
        id: "tg-dfs-cycle",
        topic: "Trees/Graphs",
        title: "DFS for Cycle Detection",
        template: `DFS is commonly used to detect {{0}} in graphs by tracking visited nodes (and recursion stack in directed graphs).`,
        blanks: [{ kind: "exact", answer: ["cycles", "a cycle", "cycle"] }],
        explanation: "Back edges indicate cycles; visited tracking avoids infinite loops.",
    },
    {
        id: "tg-bst-inorder",
        topic: "Trees/Graphs",
        title: "BST In-order Traversal",
        template: `An in-order traversal of a BST outputs keys in {{0}} order.`,
        blanks: [{ kind: "exact", answer: ["sorted", "ascending", "non-decreasing"] }],
        explanation: "Left, node, right respects the BST ordering property.",
    },

    // ===================== Sorting (3) =====================
    {
        id: "sort-quicksort-worst",
        topic: "Sorting",
        title: "Quicksort Worst Case",
        template: `Quicksort is {{0}} average but can be {{1}} in the worst case with bad pivots.`,
        blanks: [
            { kind: "exact", answer: ["O(n log n)", "O(nlogn)", "O(n logn)"] },
            { kind: "exact", answer: ["O(n^2)", "O(n2)"] },
        ],
        explanation: "Worst case happens when partitions are extremely unbalanced.",
    },
    {
        id: "sort-merge-stable",
        topic: "Sorting",
        title: "Stable Sort",
        template: `A sorting algorithm is stable if equal elements keep their {{0}} order after sorting.`,
        blanks: [{ kind: "exact", answer: ["relative", "original relative"] }],
        explanation: "Stability preserves the ordering of equal keys.",
    },
    {
        id: "sort-counting-range",
        topic: "Sorting",
        title: "Counting Sort Requirement",
        template: `Counting sort works best when keys are integers in a {{0}} known range.`,
        blanks: [{ kind: "exact", answer: ["small", "limited"] }],
        explanation: "It runs in O(n + k), where k is the range size.",
    },

    // ===================== Searching (3) =====================
    {
        id: "search-binary-requires-sorted",
        topic: "Searching",
        title: "Binary Search Requirement",
        template: `Binary search requires the data to be {{0}}.`,
        blanks: [{ kind: "exact", answer: ["sorted", "Sorted"] }],
        explanation: "Binary search relies on ordering to discard half the search space.",
    },
    {
        id: "search-linear-worst",
        topic: "Searching",
        title: "Linear Search Worst Case",
        template: `Linear search on an unsorted array has worst-case time complexity {{0}}.`,
        blanks: [{ kind: "exact", answer: ["O(n)", "O(n )"] }],
        explanation: "You may have to check every element.",
    },
    {
        id: "search-bfs-shortest",
        topic: "Searching",
        title: "Shortest in Unweighted Graph",
        template: `To find the shortest path in an unweighted graph, use {{0}}.`,
        blanks: [{ kind: "exact", answer: ["BFS", "bfs", "breadth-first search"] }],
        explanation: "BFS explores by increasing edge distance, guaranteeing shortest paths.",
    },
];

export const L4_FILL_TOPICS: string[] = [
    "Big-O",
    "Arrays/Strings",
    "Hash Maps",
    "Stacks/Queues",
    "Trees/Graphs",
    "Sorting",
    "Searching",
];
