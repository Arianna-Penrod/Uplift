// components/FillBlankUI.tsx
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import type { FillBlankExercise, BlankRule } from "../data/level4FillBlankQs";

function normalize(s: string) {
    return s.trim().replace(/\s+/g, " ");
}

function matchBlank(input: string, rule: BlankRule) {
    const raw = input.trim();

    if (rule.kind === "exact") {
        const list = Array.isArray(rule.answer) ? rule.answer : [rule.answer];
        const u = normalize(raw);
        return list.some((a) => normalize(a) === u);
    }

    const re = new RegExp(rule.pattern, rule.flags ?? "");
    return re.test(raw);
}

function ruleHint(rule: BlankRule) {
    if (rule.kind === "exact") {
        const list = Array.isArray(rule.answer) ? rule.answer : [rule.answer];
        return list.join(" / ");
    }

    // If your data includes an optional example for regex rules, show it
    if ("example" in (rule as any) && (rule as any).example) {
        return (rule as any).example as string;
    }

    const flags = rule.flags ?? "";
    return `/${rule.pattern}/${flags}`;
}

function parseLine(line: string) {
    const re = /{{(\d+)}}/g;
    const parts: Array<{ type: "text"; value: string } | { type: "blank"; index: number }> = [];
    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(line)) !== null) {
        const start = m.index;
        const end = re.lastIndex;
        if (start > last) parts.push({ type: "text", value: line.slice(last, start) });
        parts.push({ type: "blank", index: Number(m[1]) });
        last = end;
    }
    if (last < line.length) parts.push({ type: "text", value: line.slice(last) });
    return parts;
}

export function FillBlankCode({
    exercise,
    onSolved,
}: {
    exercise: FillBlankExercise;
    onSolved?: () => void;
}) {
    const lines = useMemo(() => exercise.template.split("\n"), [exercise.template]);

    const [fills, setFills] = useState<string[]>(() => Array(exercise.blanks.length).fill(""));
    const [checked, setChecked] = useState(false);
    const [ok, setOk] = useState<boolean[]>(() => Array(exercise.blanks.length).fill(false));

    // ✅ reveal answers toggle
    const [showAnswers, setShowAnswers] = useState(false);

    const solved = checked && ok.every(Boolean);

    const onCheck = () => {
        const perBlank = exercise.blanks.map((rule, i) => matchBlank(fills[i] ?? "", rule));
        setOk(perBlank);
        setChecked(true);
        if (perBlank.every(Boolean)) onSolved?.();
    };

    return (
        <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "800" }}>{exercise.title}</Text>

            {/* ✅ Reveal answers toggle */}
            <Pressable
                onPress={() => setShowAnswers((v) => !v)}
                style={{
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#999",
                    backgroundColor: showAnswers ? "#f6f6f6" : "transparent",
                }}
            >
                <Text style={{ textAlign: "center", fontWeight: "800" }}>
                    {showAnswers ? "Hide answers" : "Reveal answers"}
                </Text>
            </Pressable>

            {showAnswers && (
                <View style={{ padding: 12, borderWidth: 1, borderRadius: 10, gap: 6 }}>
                    <Text style={{ fontWeight: "800" }}>Answer key</Text>
                    {exercise.blanks.map((rule, i) => (
                        <Text key={i} style={{ color: "#333" }}>
                            Blank {i + 1}: {ruleHint(rule)}
                        </Text>
                    ))}
                </View>
            )}

            <View style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}>
                {lines.map((line, lineIdx) => {
                    const parts = parseLine(line);

                    return (
                        <View
                            key={lineIdx}
                            style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}
                        >
                            {parts.map((p, idx) => {
                                if (p.type === "text") {
                                    return (
                                        <Text key={idx} style={{ fontFamily: "Menlo", lineHeight: 20 }}>
                                            {p.value}
                                        </Text>
                                    );
                                }

                                const i = p.index;
                                const good = ok[i];

                                return (
                                    <TextInput
                                        key={idx}
                                        value={fills[i] ?? ""}
                                        onChangeText={(t) => {
                                            const next = [...fills];
                                            next[i] = t;
                                            setFills(next);
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
                                            borderColor: checked ? (good ? "#2e7d32" : "#c62828") : "#999",
                                            backgroundColor: checked ? (good ? "#e8f5e9" : "#ffebee") : "transparent",
                                        }}
                                    />
                                );
                            })}
                            {/* newline spacer */}
                            <Text>{"\n"}</Text>
                        </View>
                    );
                })}
            </View>

            <Pressable onPress={onCheck} style={{ padding: 14, borderRadius: 10, backgroundColor: "black" }}>
                <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>Check</Text>
            </Pressable>

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
        </View>
    );
}

// Optional: default export for convenience
export default FillBlankCode;
