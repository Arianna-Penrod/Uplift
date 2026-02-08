// data/level4Questions.ts
export type Topic =
    | "Big-O"
    | "Arrays/Strings"
    | "Hash Maps"
    | "Stacks/Queues"
    | "Trees/Graphs"
    | "Sorting"
    | "Searching";

export type MCQ = {
    id: string;
    topic: Topic;
    prompt: string;
    choices: string[];
    answerIndex: number;
    explanation: string;
};

export const L4_QUESTIONS: MCQ[] = [
    {
        id: "bigo-quad",
        topic: "Big-O",
        prompt: "Doubling n roughly quadruples work in which time complexity?",
        choices: ["O(n)", "O(log n)", "O(n log n)", "O(n^2)"],
        answerIndex: 3,
        explanation: "Quadratic: (2n)^2 = 4n^2.",
    },
    {
        id: "arr-two-ptr",
        topic: "Arrays/Strings",
        prompt: "Which technique often finds a pair in a sorted array summing to a target in linear time?",
        choices: ["Two pointers", "DFS", "Heap", "Prefix sums only"],
        answerIndex: 0,
        explanation: "Two pointers moves inward once each step → O(n).",
    },
    {
        id: "hash-avg",
        topic: "Hash Maps",
        prompt: "Average-case lookup time for a hash map is closest to:",
        choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answerIndex: 0,
        explanation: "Hash maps are O(1) average with good hashing/resizing.",
    },
    {
        id: "stack-parens",
        topic: "Stacks/Queues",
        prompt: "What data structure is most directly used to validate matching parentheses?",
        choices: ["Queue", "Stack", "Heap", "Trie"],
        answerIndex: 1,
        explanation: "Stack tracks the most recent opening bracket.",
    },
    {
        id: "bfs-shortest",
        topic: "Trees/Graphs",
        prompt: "BFS guarantees shortest path (fewest edges) in which kind of graph?",
        choices: ["Weighted", "Unweighted", "Negative edges", "Only DAGs"],
        answerIndex: 1,
        explanation: "BFS explores by layers in unweighted graphs.",
    },
    {
        id: "quicksort-worst",
        topic: "Sorting",
        prompt: "Which sort is O(n log n) average but can be O(n^2) worst-case?",
        choices: ["Merge sort", "Heap sort", "Quick sort", "Counting sort"],
        answerIndex: 2,
        explanation: "Quick sort worst-case happens with bad pivot choices.",
    },
    {
        id: "binsearch-requires",
        topic: "Searching",
        prompt: "Binary search requires:",
        choices: ["Unique values", "Sorted data", "Balanced tree", "Hashing"],
        answerIndex: 1,
        explanation: "Binary search halves the search space based on order.",
    },
];

export const L4_TOPICS: Topic[] = [
    "Big-O",
    "Arrays/Strings",
    "Hash Maps",
    "Stacks/Queues",
    "Trees/Graphs",
    "Sorting",
    "Searching",
];
