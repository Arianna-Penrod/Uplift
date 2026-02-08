// components/FillBlankUI.tsx
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import type { FillBlankExercise, BlankRule } from "../data/level4FillBlankQs";

/**
 * Normalize strings for "exact match" checks:
 * - trims ends
 * - collapses any internal whitespace into single spaces
 */
function normalize(s: string) {
    return s.trim().replace(/\s+/g, " ");
}

/**
 * Returns true if the user's input matches the given blank rule.
 *
 * Supports:
 * 1) kind === "exact": input must equal one of the accepted answers (after normalize)
 * 2) regex rule: input must match RegExp(pattern, flags)
 */
function matchBlank(input: string, rule: BlankRule) {
    const raw = input.trim();

    // Exact matching (case-sensitive unless your answers are normalized with same casing)
    if (rule.kind === "exact") {
        const list = Array.isArray(rule.answer) ? rule.answer : [rule.answer];
        const u = normalize(raw);
        return list.some((a) => normalize(a) === u);
    }

    // Regex matching
    const re = new RegExp(rule.pattern, rule.flags ?? "");
    return re.test(raw);
}

/**
 * Splits a single line of the template into parts:
 * - normal text chunks
 * - blank placeholders {{0}}, {{1}}, etc.
 *
 * IMPORTANT: This uses the number *as an array index* into `exercise.blanks`.
 * So {{0}} refers to the first blank rule, {{1}} the second, etc.
 * (If you prefer 1-based placeholders like {{1}} meaning first blank,
 * change `index: Number(m[1])` to `index: Number(m[1]) - 1` below.)
 */
function parseLine(line: string) {
    const re = /{{(\d+)}}/g;
    const parts: Array<
        | { type: "text"; value: string }
        | { type: "blank"; index: number }
    > = [];

    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(line)) !== null) {
        const start = m.index;
        const end = re.lastIndex;

        // Push any text before the placeholder
        if (start > last) parts.push({ type: "text", value: line.slice(last, start) });

        // Push the blank placeholder
        parts.push({ type: "blank", index: Number(m[1]) });

        last = end;
    }

    // Push remaining text after the last placeholder
    if (last < line.length) parts.push({ type: "text", value: line.slice(last) });

    return parts;
}

/**
 * Formats what we show in the "Answers" reveal panel.
 * - Exact: show all accepted answers joined with separators
 * - Regex: show example if provided; otherwise show /pattern/flags
 */
function ruleHint(rule: BlankRule) {
    if (rule.kind === "exact") {
        const list = Array.isArray(rule.answer) ? rule.answer : [rule.answer];
        return list.join("  |  ");
    }

    // regex
    if (rule.example && rule.example.trim().length) return rule.example;
    const flags = rule.flags ?? "";
    return `/${rule.pattern}/${flags}`;
}

/**
 * Main UI component:
 * - Renders a "code-like" template (Menlo) with blanks as TextInputs
 * - Check button validates user answers
 * - Reveal answers button toggles an answers panel (only after at least one check)
 * - Calls onSolved when all blanks pass validation
 */
export function FillBlankCode({
    exercise,
    onSolved,
}: {
    exercise: FillBlankExercise;
    onSolved?: () => void;
}) {
    // Split template into lines once per exercise
    const lines = useMemo(() => exercise.template.split("\n"), [exercise.template]);

    // User inputs, one per blank rule
    const [fills, setFills] = useState<string[]>(() =>
        Array(exercise.blanks.length).fill("")
    );

    // Whether they've hit "Check" at least once
    const [checked, setChecked] = useState(false);

    // Per-blank correctness results
    const [ok, setOk] = useState<boolean[]>(() =>
        Array(exercise.blanks.length).fill(false)
    );

    // Whether to show the answers panel
    const [showAnswers, setShowAnswers] = useState(false);

    // Consider solved only after a check, and every blank is true
    const solved = checked && ok.every(Boolean);

    const onCheck = () => {
        // Validate each blank
        const perBlank = exercise.blanks.map((rule, i) =>
            matchBlank(fills[i] ?? "", rule)
        );

        setOk(perBlank);
        setChecked(true);

        // If everything is correct, let the parent know
        if (perBlank.every(Boolean)) onSolved?.();
    };

    return (
        <View style={{ gap: 12 }}>
            {/* Title */}
            <Text style={{ fontSize: 18, fontWeight: "800" }}>{exercise.title}</Text>

            {/* "Code editor" container */}
            <View style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}>
                {lines.map((line, lineIdx) => {
                    const parts = parseLine(line);

                    return (
                        <View
                            key={lineIdx}
                            style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}
                        >
                            {parts.map((p, idx) => {
                                // Plain text chunks
                                if (p.type === "text") {
                                    return (
                                        <Text key={idx} style={{ fontFamily: "Menlo", lineHeight: 20 }}>
                                            {p.value}
                                        </Text>
                                    );
                                }

                                // Blank placeholder becomes a TextInput
                                const i = p.index;
                                const good = ok[i];

                                return (
                                    <TextInput
                                        key={idx}
                                        value={fills[i] ?? ""}
                                        onChangeText={(t) => {
                                            // Update just this blank’s text
                                            const next = [...fills];
                                            next[i] = t;
                                            setFills(next);

                                            // Reset checked state so colors update only after the next check
                                            setChecked(false);
                                        }}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        placeholder={`blank ${i + 1}`}
                                        style={{
                                            minWidth: 70,
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                            borderWidth: 1,
                                            borderRadius: 6,
                                            marginHorizontal: 2,
                                            fontFamily: "Menlo",

                                            // After "Check", color based on correctness
                                            borderColor: checked ? (good ? "#2e7d32" : "#c62828") : "#999",
                                            backgroundColor: checked
                                                ? good
                                                    ? "#e8f5e9"
                                                    : "#ffebee"
                                                : "transparent",
                                        }}
                                    />
                                );
                            })}

                            {/* Force a newline between template lines */}
                            <Text>{"\n"}</Text>
                        </View>
                    );
                })}
            </View>

            {/* ✅ Check button */}
            <Pressable
                onPress={onCheck}
                style={{ padding: 14, borderRadius: 10, backgroundColor: "black" }}
            >
                <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>
                    Check
                </Text>
            </Pressable>

            {/* ✅ Reveal answers button (requires at least one check attempt) */}
            <Pressable
                onPress={() => setShowAnswers((v) => !v)}
                disabled={!checked}
                style={{
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#999",
                    opacity: checked ? 1 : 0.45,
                }}
            >
                <Text style={{ textAlign: "center", fontWeight: "800" }}>
                    {showAnswers ? "Hide answers" : "Reveal answers"}
                </Text>
            </Pressable>

            {/* Feedback box after checking */}
            {checked && (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}>
                    <Text style={{ fontWeight: "800" }}>
                        {solved ? "✅ Looks correct (matcher passed)!" : "❌ Fix the red blanks and try again."}
                    </Text>

                    {!!exercise.explanation && (
                        <Text style={{ marginTop: 6, color: "#444" }}>{exercise.explanation}</Text>
                    )}
                </View>
            )}

            {/* Answers panel (only shown if checked + toggled on) */}
            {checked && showAnswers && (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 6 }}>
                    <Text style={{ fontWeight: "800" }}>Answers</Text>

                    {exercise.blanks.map((rule, i) => (
                        <Text key={i} style={{ fontFamily: "Menlo", color: "#333" }}>
                            {`Blank ${i + 1}: ${ruleHint(rule)}`}
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
}
