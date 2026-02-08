import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";

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
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function speakToText() {
    if (Platform.OS !== "web") {
      setError("Speech-to-text is web-only right now.");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Your browser doesn't support speech recognition. Try Chrome.");
      return;
    }

    setError(null);

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onerror = (e: any) => {
      setListening(false);
      setError(e?.error ? `Speech error: ${e.error}` : "Speech recognition failed.");
    };

    rec.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript ?? "";
      const cleaned = text.trim();
      if (!cleaned) {
        setError("Didn’t catch that—try again.");
        return;
      }
      setPitch(cleaned);
    };

    rec.start();
  }

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

  const canSubmit = pitch.trim().length >= 30 && !loading;
  const score = feedback?.overallScore ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {/* Header */}
      <View style={styles.hero}>
        <Text style={styles.kicker}>Level 2</Text>
        <Text style={styles.title}>Elevator Pitch</Text>
        <Text style={styles.subtitle}>
          Speak or type your pitch—then get coach-style feedback.
        </Text>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Your pitch</Text>
          <Text style={styles.helperText}>
            {pitch.trim().length}/30+
          </Text>
        </View>

        <TextInput
          value={pitch}
          onChangeText={setPitch}
          placeholder="Example: I’m a junior CS student who loves building practical apps…"
          multiline
          style={styles.input}
          placeholderTextColor={"rgba(15,23,42,0.45)"}
        />

        <View style={styles.btnRow}>
          <Pressable
            onPress={speakToText}
            disabled={listening || loading}
            style={({ pressed }) => [
              styles.btn,
              styles.btnGhost,
              (listening || loading) && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnGhostText}>
              {listening ? "🎙️ Listening..." : "🎤 Speak"}
            </Text>
          </Pressable>

          <Pressable
            onPress={getFeedback}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              !canSubmit && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnPrimaryText}>
              {loading ? "Analyzing..." : "Get feedback"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            setPitch("");
            setFeedback(null);
            setError(null);
          }}
          style={({ pressed }) => [styles.linkBtn, pressed && styles.linkPressed]}
        >
          <Text style={styles.linkText}>Clear</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.linkPressed]}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {error && (
          <View style={styles.alert}>
            <Text style={styles.alertTitle}>Something went wrong</Text>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Feedback */}
      {feedback && (
        <View style={styles.feedbackCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Your feedback</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Score {score}/10</Text>
            </View>
          </View>

          <View style={styles.meterWrap}>
            <View style={[styles.meterFill, { width: `${Math.min(100, score * 10)}%` }]} />
          </View>

          <Text style={styles.subSection}>Strengths</Text>
          {feedback.strengths.map((s, i) => (
            <Text key={i} style={styles.bullet}>• {s}</Text>
          ))}

          <Text style={styles.subSection}>Improvements</Text>
          {feedback.improvements.map((s, i) => (
            <Text key={i} style={styles.bullet}>• {s}</Text>
          ))}

          <Text style={styles.subSection}>Tighter version</Text>
          <Text style={styles.paragraph}>{feedback.tighterVersion}</Text>

          <Text style={styles.subSection}>Suggested next sentence</Text>
          <Text style={styles.paragraph}>{feedback.suggestedNextSentence}</Text>
        </View>
      )}

      {/* Tiny footer */}
      <Text style={styles.footer}>
        Tip: Aim for 45–80 words: who you are + what you’ve built + what you want next.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 18,
    paddingBottom: 28,
    gap: 14,
    backgroundColor: "#F6FAFF",
  },

  hero: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#0B2A3A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  kicker: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.80)",
    marginTop: 6,
    lineHeight: 20,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(2, 6, 23, 0.10)",
    shadowColor: "black",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  feedbackCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(2, 6, 23, 0.10)",
    shadowColor: "black",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    gap: 8,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  helperText: {
    fontSize: 12,
    color: "rgba(15,23,42,0.55)",
    fontWeight: "700",
  },

  input: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    borderColor: "rgba(15,23,42,0.14)",
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    marginTop: 10,
    lineHeight: 20,
  },

  btnRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    backgroundColor: "#0EA5E9",
    borderColor: "rgba(0,0,0,0.08)",
  },
  btnPrimaryText: {
    color: "white",
    fontWeight: "900",
  },

  btnGhost: {
    backgroundColor: "white",
    borderColor: "rgba(15,23,42,0.16)",
  },
  btnGhostText: {
    color: "#0F172A",
    fontWeight: "900",
  },

  btnDisabled: {
    opacity: 0.45,
  },
  btnPressed: {
    opacity: 0.85,
  },

  linkBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  linkPressed: { backgroundColor: "rgba(15,23,42,0.06)" },
  linkText: { color: "#0EA5E9", fontWeight: "800" },
  backText: { color: "rgba(15,23,42,0.75)", fontWeight: "800" },

  alert: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  alertTitle: { fontWeight: "900", color: "#991B1B", marginBottom: 4 },
  alertText: { color: "#7F1D1D" },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(14,165,233,0.12)",
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.25)",
  },
  badgeText: { color: "#0369A1", fontWeight: "900", fontSize: 12 },

  meterWrap: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(2, 6, 23, 0.08)",
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    backgroundColor: "#0EA5E9",
  },

  subSection: {
    marginTop: 12,
    fontWeight: "900",
    color: "#0F172A",
  },
  bullet: {
    marginTop: 6,
    color: "rgba(15,23,42,0.85)",
    lineHeight: 20,
  },
  paragraph: {
    marginTop: 6,
    color: "rgba(15,23,42,0.85)",
    lineHeight: 20,
  },

  footer: {
    marginTop: 6,
    textAlign: "center",
    color: "rgba(15,23,42,0.55)",
    fontSize: 12,
  },
});
