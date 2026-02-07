import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Uplift</Text>
      <Text style={styles.subtitle}>
        Helping CS students prepare for their careers
      </Text>

      <Link href="/levels/1" asChild>
        <TouchableOpacity style={styles.levelButton}>
          <Text style={styles.levelTitle}>Level 1</Text>
          <Text style={styles.levelText}>Resume</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/levels/2" asChild>
        <TouchableOpacity style={styles.levelButton}>
          <Text style={styles.levelTitle}>Level 2</Text>
          <Text style={styles.levelText}>Elevator Pitch</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/levels/3/app/profile" asChild>
        <TouchableOpacity style={styles.levelButton}>
          <Text style={styles.levelTitle}>Level 3</Text>
          <Text style={styles.levelText}>Professional Profile</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/levels/4" asChild>
        <TouchableOpacity style={styles.levelButton}>
          <Text style={styles.levelTitle}>Level 4</Text>
          <Text style={styles.levelText}>Technical Interview</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 24,
    justifyContent: "center"
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#e0f2fe",
    marginBottom: 8,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 30,
    textAlign: "center"
  },
  levelButton: {
    backgroundColor: "#1e293b",
    padding: 18,
    borderRadius: 12,
    marginBottom: 14
  },
  levelTitle: {
    color: "#7dd3fc",
    fontSize: 14,
    fontWeight: "600"
  },
  levelText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700"
  }
});
