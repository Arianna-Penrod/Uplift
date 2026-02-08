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
    // ---------------- Big-O (5) ----------------
    {
        id: "bigo-quad",
        topic: "Big-O",
        prompt: "Doubling n roughly quadruples work in which time complexity?",
        choices: ["O(n)", "O(log n)", "O(n log n)", "O(n^2)"],
        answerIndex: 3,
        explanation: "Quadratic: (2n)^2 = 4n^2.",
    },
    {
        id: "bigo-binary-search",
        topic: "Big-O",
        prompt: "Binary search on a sorted array runs in:",
        choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answerIndex: 1,
        explanation: "Each step halves the remaining search space.",
    },
    {
        id: "bigo-drop-constants",
        topic: "Big-O",
        prompt: "If an algorithm takes 5n + 20 steps, its Big-O is:",
        choices: ["O(5n)", "O(n)", "O(20)", "O(n^2)"],
        answerIndex: 1,
        explanation: "Big-O ignores constant factors and lower-order terms.",
    },
    {
        id: "bigo-dominant-term",
        topic: "Big-O",
        prompt: "If f(n) = n^2 + 100n, the dominant term for large n is:",
        choices: ["100n", "n^2", "n", "100"],
        answerIndex: 1,
        explanation: "n^2 grows faster than n as n increases.",
    },
    {
        id: "bigo-space",
        topic: "Big-O",
        prompt: "Which describes auxiliary space complexity?",
        choices: [
            "Time to run the algorithm",
            "Extra memory used by the algorithm (excluding input)",
            "Number of CPU cores required",
            "How many comparisons are made in worst case only",
        ],
        answerIndex: 1,
        explanation: "Auxiliary space counts extra memory beyond the input.",
    },

    // ---------------- Arrays/Strings (5) ----------------
    {
        id: "arr-two-ptr",
        topic: "Arrays/Strings",
        prompt: "Which technique often finds a pair in a sorted array summing to a target in linear time?",
        choices: ["Two pointers", "DFS", "Heap", "Prefix sums only"],
        answerIndex: 0,
        explanation: "Two pointers moves inward once each step → O(n).",
    },
    {
        id: "arr-sliding-window",
        topic: "Arrays/Strings",
        prompt: "Which technique is commonly used to find a maximum-sum subarray of fixed length k in O(n)?",
        choices: ["Sliding window", "Backtracking", "Heap sort", "Union-Find"],
        answerIndex: 0,
        explanation: "Maintain a running window sum and slide one step at a time.",
    },
    {
        id: "arr-prefix-sum",
        topic: "Arrays/Strings",
        prompt: "Prefix sums are most useful for quickly computing:",
        choices: [
            "The median of an unsorted array",
            "Range sums (sum of elements between i and j)",
            "The maximum element",
            "Whether the array is sorted",
        ],
        answerIndex: 1,
        explanation: "Range sum can be computed via prefix[j] - prefix[i-1].",
    },
    {
        id: "str-anagram",
        topic: "Arrays/Strings",
        prompt: "A common O(n) approach to check if two lowercase strings are anagrams is to:",
        choices: [
            "Sort both strings",
            "Use a frequency count array of size 26",
            "Try all permutations",
            "Use BFS over characters",
        ],
        answerIndex: 1,
        explanation: "Counting letters (26) is linear in string length and avoids sorting.",
    },
    {
        id: "arr-inplace-reverse",
        topic: "Arrays/Strings",
        prompt: "Which approach reverses an array in-place with O(1) extra space?",
        choices: [
            "Copy into a new array and reverse",
            "Swap symmetric elements with two pointers",
            "Push all items onto a queue",
            "Sort the array",
        ],
        answerIndex: 1,
        explanation: "Swap A[l] and A[r] while l<r using two pointers.",
    },

    // ---------------- Hash Maps (5) ----------------
    {
        id: "hash-avg",
        topic: "Hash Maps",
        prompt: "Average-case lookup time for a hash map is closest to:",
        choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answerIndex: 0,
        explanation: "Hash maps are O(1) average with good hashing/resizing.",
    },
    {
        id: "hash-collision",
        topic: "Hash Maps",
        prompt: "A 'collision' in a hash map occurs when:",
        choices: [
            "Two keys are equal",
            "Two different keys map to the same bucket/index",
            "A key is missing",
            "The table is empty",
        ],
        answerIndex: 1,
        explanation: "Different keys can hash to the same location; the map must resolve it.",
    },
    {
        id: "hash-two-sum",
        topic: "Hash Maps",
        prompt: "The typical O(n) solution to Two Sum uses a hash map to store:",
        choices: [
            "Only the maximum element",
            "Each number’s value → its index (or seen status)",
            "The array sorted",
            "All pairs of indices",
        ],
        answerIndex: 1,
        explanation: "Store seen values so you can check if target - x exists in O(1) average.",
    },
    {
        id: "hash-frequency",
        topic: "Hash Maps",
        prompt: "Hash maps are commonly used for frequency counting because they:",
        choices: [
            "Guarantee no collisions",
            "Map keys to counts efficiently",
            "Always stay sorted by key",
            "Use O(1) memory",
        ],
        answerIndex: 1,
        explanation: "They associate each distinct item (key) with its count (value).",
    },
    {
        id: "hash-ordered",
        topic: "Hash Maps",
        prompt: "In general, a hash map iteration order is:",
        choices: [
            "Always sorted by key",
            "Always insertion order in every language/runtime",
            "Not guaranteed to be sorted (depends on implementation)",
            "Always reverse insertion order",
        ],
        answerIndex: 2,
        explanation: "Order depends on implementation; it’s not a sorted structure by default.",
    },

    // ---------------- Stacks/Queues (5) ----------------
    {
        id: "stack-parens",
        topic: "Stacks/Queues",
        prompt: "What data structure is most directly used to validate matching parentheses?",
        choices: ["Queue", "Stack", "Heap", "Trie"],
        answerIndex: 1,
        explanation: "Stack tracks the most recent opening bracket.",
    },
    {
        id: "queue-bfs",
        topic: "Stacks/Queues",
        prompt: "Which data structure is typically used to implement BFS?",
        choices: ["Stack", "Queue", "Heap", "Hash set"],
        answerIndex: 1,
        explanation: "BFS processes nodes in FIFO order (level by level).",
    },
    {
        id: "stack-dfs-iter",
        topic: "Stacks/Queues",
        prompt: "An iterative DFS is most commonly implemented using a:",
        choices: ["Queue", "Stack", "Heap", "Priority queue"],
        answerIndex: 1,
        explanation: "DFS explores deeply first; a stack naturally supports this behavior.",
    },
    {
        id: "mono-stack",
        topic: "Stacks/Queues",
        prompt: "A monotonic stack is often used for problems like 'next greater element' because it:",
        choices: [
            "Keeps elements sorted globally",
            "Maintains a stack with increasing/decreasing order to answer neighbors efficiently",
            "Prevents all duplicates",
            "Always runs in O(log n)",
        ],
        answerIndex: 1,
        explanation: "By maintaining monotonicity, each element is pushed/popped at most once → O(n).",
    },
    {
        id: "deque-sliding-window",
        topic: "Stacks/Queues",
        prompt: "To compute the maximum in each sliding window of size k in O(n), you typically use a:",
        choices: ["Deque", "Stack", "Hash map", "Binary search tree only"],
        answerIndex: 0,
        explanation: "A deque can store candidates in decreasing order for O(1) amortized updates.",
    },

    // ---------------- Trees/Graphs (5) ----------------
    {
        id: "bfs-shortest",
        topic: "Trees/Graphs",
        prompt: "BFS guarantees shortest path (fewest edges) in which kind of graph?",
        choices: ["Weighted", "Unweighted", "Negative edges", "Only DAGs"],
        answerIndex: 1,
        explanation: "BFS explores by layers in unweighted graphs.",
    },
    {
        id: "dfs-use",
        topic: "Trees/Graphs",
        prompt: "DFS is particularly useful for which task?",
        choices: [
            "Finding shortest path in weighted graphs",
            "Detecting cycles / exploring connectivity",
            "Always minimizing edge weights",
            "Sorting numbers faster than O(n log n)",
        ],
        answerIndex: 1,
        explanation: "DFS explores depth-first and is used in cycle detection, components, topological sort, etc.",
    },
    {
        id: "tree-inorder",
        topic: "Trees/Graphs",
        prompt: "In-order traversal of a BST visits nodes in:",
        choices: ["Random order", "Sorted (non-decreasing) key order", "Reverse insertion order", "Level order"],
        answerIndex: 1,
        explanation: "BST property + in-order (left, node, right) produces sorted order.",
    },
    {
        id: "graph-visited",
        topic: "Trees/Graphs",
        prompt: "Why do BFS/DFS on graphs usually track a visited set?",
        choices: [
            "To sort neighbors",
            "To avoid revisiting nodes and getting stuck in cycles",
            "To reduce memory to O(1)",
            "To guarantee a weighted shortest path",
        ],
        answerIndex: 1,
        explanation: "Visited prevents repeated work and infinite loops in cyclic graphs.",
    },
    {
        id: "dijkstra-weighted",
        topic: "Trees/Graphs",
        prompt: "Dijkstra’s algorithm is appropriate for shortest paths when edge weights are:",
        choices: ["All equal", "Non-negative", "Possibly negative", "Only 0 or 1"],
        answerIndex: 1,
        explanation: "Dijkstra assumes non-negative weights to ensure greedy relaxation is correct.",
    },

    // ---------------- Sorting (5) ----------------
    {
        id: "quicksort-worst",
        topic: "Sorting",
        prompt: "Which sort is O(n log n) average but can be O(n^2) worst-case?",
        choices: ["Merge sort", "Heap sort", "Quick sort", "Counting sort"],
        answerIndex: 2,
        explanation: "Quick sort worst-case happens with bad pivot choices.",
    },
    {
        id: "merge-stable",
        topic: "Sorting",
        prompt: "Which sorting algorithm is stable by default?",
        choices: ["Merge sort", "Heap sort", "Selection sort", "Quick sort (in-place)"],
        answerIndex: 0,
        explanation: "Merge sort is stable when merging preserves relative order of equal elements.",
    },
    {
        id: "heapsort-space",
        topic: "Sorting",
        prompt: "Heap sort typically uses how much extra space (beyond the array)?",
        choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answerIndex: 0,
        explanation: "In-place heap sort uses constant extra space (ignoring recursion).",
    },
    {
        id: "counting-when",
        topic: "Sorting",
        prompt: "Counting sort is most appropriate when:",
        choices: [
            "Values are arbitrary large strings",
            "Keys are integers in a small known range",
            "The array is already sorted",
            "You need comparison-based sorting only",
        ],
        answerIndex: 1,
        explanation: "Counting sort runs in O(n + k) where k is the range of keys.",
    },
    {
        id: "nlogn-lower-bound",
        topic: "Sorting",
        prompt: "For comparison-based sorting, the best possible worst-case time is:",
        choices: ["O(n)", "O(n log n)", "O(log n)", "O(n^2)"],
        answerIndex: 1,
        explanation: "There is a lower bound of Ω(n log n) comparisons in the worst case.",
    },

    // ---------------- Searching (5) ----------------
    {
        id: "binsearch-requires",
        topic: "Searching",
        prompt: "Binary search requires:",
        choices: ["Unique values", "Sorted data", "Balanced tree", "Hashing"],
        answerIndex: 1,
        explanation: "Binary search halves the search space based on order.",
    },
    {
        id: "linear-search",
        topic: "Searching",
        prompt: "In the worst case, linear search on an unsorted array of size n takes:",
        choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answerIndex: 2,
        explanation: "You may need to check every element.",
    },
    {
        id: "lower-bound",
        topic: "Searching",
        prompt: "A common 'lower bound' binary search returns:",
        choices: [
            "The last index where value < target",
            "The first index where value >= target",
            "Any index where value == target",
            "The median index always",
        ],
        answerIndex: 1,
        explanation: "Lower bound is the first position to insert target to keep order (first >= target).",
    },
    {
        id: "search-binary-answer",
        topic: "Searching",
        prompt: "Binary search on the answer space is used when:",
        choices: [
            "The input is unsorted and cannot be sorted",
            "A feasibility check is monotonic (true/false changes only once)",
            "You need to find all permutations",
            "You only have a stack available",
        ],
        answerIndex: 1,
        explanation: "If feasibility is monotonic, you can binary search the boundary value.",
    },
    {
        id: "bfs-vs-dfs-shortest",
        topic: "Searching",
        prompt: "To find the shortest path in an unweighted graph, you would typically use:",
        choices: ["DFS", "BFS", "Quick sort", "Hashing"],
        answerIndex: 1,
        explanation: "BFS explores by increasing path length (#edges), guaranteeing shortest path in unweighted graphs.",
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
