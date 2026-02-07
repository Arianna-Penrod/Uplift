import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

export default function Level2Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Level 2: Elevator Pitch</Text>
      <Text style={styles.subtitle}>
        Practice your elevator pitch and get AI feedback.
      </Text>

      <View style={styles.card}>
        <Text style={styles.body}>
          🚀 Coming soon: Record or type your pitch and get personalized feedback
          on clarity, impact, and confidence.
        </Text>
      </View>

      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    marginBottom: 20,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  backText: {
    fontWeight: "600",
  },
});
