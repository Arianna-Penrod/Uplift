import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
// app/index.tsx
import { useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { loadProgress, saveProgress, type Progress } from "../lib/progress";

type Feedback = {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  tighterVersion: string;
  suggestedNextSentence: string;
};

export default function Level2ElevatorPitch() {
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
    useFocusEffect(
        useCallback(() => {
            let alive = true;
            loadProgress().then((prog) => {
                if (alive) setP(prog);
            });
            return () => {
                alive = false;
            };
        }, [])
    );

  async function getFeedback() {
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch("http://localhost:5050/api/elevator-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitch }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setFeedback(data as Feedback);
    } catch (e: any) {
      setError(e?.message || "Could not reach AI server.");
    } finally {
      setLoading(false);
    }
  }
    const levels = [
        { id: 1, title: "Resume" },
        { id: 2, title: "Elevator Pitch" },
        { id: 3, title: "Professional Profile" },
        { id: 4, title: "Technical" },
    ] as const;

    return (
        <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 26, fontWeight: "700" }}>Interview Prep</Text>

            {/* DEV TOGGLE BUTTON */}
            <Pressable
                onPress={async () => {
                    // If everything is unlocked, lock back down to Level 1.
                    // Otherwise unlock everything.
                    const nextUnlocked = p.unlockedLevel >= 4 ? 1 : 4;

                    const updated: Progress = { ...p, unlockedLevel: nextUnlocked };
                    await saveProgress(updated);
                    setP(updated);
                }}
                style={{
                    padding: 14,
                    borderWidth: 1,
                    borderRadius: 10,
                    backgroundColor: "#eee",
                }}
            >
                <Text style={{ textAlign: "center", fontWeight: "700" }}>
                    {p.unlockedLevel >= 4 ? "DEV: Lock levels (only Level 1)" : "DEV: Unlock all levels"}
                </Text>
            </Pressable>


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Level 2: Elevator Pitch</Text>
      <Text style={styles.subtitle}>Type your pitch and get AI feedback.</Text>

      <TextInput
        value={pitch}
        onChangeText={setPitch}
        placeholder="Hi, I’m … I’m a … I’m interested in …"
        multiline
        style={styles.input}
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={getFeedback}
          disabled={loading || pitch.trim().length < 30}
          style={[styles.button, (loading || pitch.trim().length < 30) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>{loading ? "Analyzing..." : "Get AI Feedback"}</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={[styles.button, styles.secondary]}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {feedback && (
        <View style={styles.card}>
          <Text style={styles.score}>Score: {feedback.overallScore}/10</Text>

          <Text style={styles.heading}>Strengths</Text>
          {feedback.strengths.map((s, i) => (
            <Text key={i} style={styles.bullet}>• {s}</Text>
          ))}

          <Text style={styles.heading}>Improvements</Text>
          {feedback.improvements.map((s, i) => (
            <Text key={i} style={styles.bullet}>• {s}</Text>
          ))}

          <Text style={styles.heading}>Tighter Version</Text>
          <Text style={styles.paragraph}>{feedback.tighterVersion}</Text>

          <Text style={styles.heading}>Suggested Next Sentence</Text>
          <Text style={styles.paragraph}>{feedback.suggestedNextSentence}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { opacity: 0.7, marginBottom: 6 },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    borderColor: "rgba(0,0,0,0.15)",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontWeight: "800" },
  error: { color: "crimson" },
  card: {
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "rgba(0,0,0,0.12)",
    gap: 8,
  },
  score: { fontSize: 18, fontWeight: "900" },
  heading: { marginTop: 10, fontWeight: "900" },
  bullet: { marginTop: 4 },
  paragraph: { marginTop: 4, lineHeight: 20 },
});
