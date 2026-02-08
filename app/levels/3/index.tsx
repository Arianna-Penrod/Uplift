import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useState } from "react";

export default function Profile() {
  const theme = useColorScheme();
  const isDark = theme === "dark";

  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [projects, setProjects] = useState("");
  const [goal, setGoal] = useState("");

  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [bio, setBio] = useState("");

  const generateProfile = () => {
    setHeadline(`${role} | ${skills}`);

    setSummary(
      `I am a computer science student interested in ${role.toLowerCase()} roles. ` +
        `I have experience with ${skills} and have worked on ${projects}. ` +
        `My current goal is ${goal}.`
    );

    setBio(`CS student interested in ${role.toLowerCase()} opportunities.`);
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
    >
      <Text style={[styles.title, isDark && styles.titleDark]}>
        Level 3: Professional Profile
      </Text>

      <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
        Build a professional profile you can use anywhere.
      </Text>

      {/* Inputs */}
      <Text style={[styles.label, isDark && styles.labelDark]}>Target Role</Text>
      <TextInput
        value={role}
        onChangeText={setRole}
        placeholder="Software Engineer Intern"
        placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
        style={[styles.input, isDark && styles.inputDark]}
      />

      <Text style={[styles.label, isDark && styles.labelDark]}>Skills</Text>
      <TextInput
        value={skills}
        onChangeText={setSkills}
        placeholder="Java, React, SQL"
        placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
        style={[styles.input, isDark && styles.inputDark]}
      />

      <Text style={[styles.label, isDark && styles.labelDark]}>
        Projects / Experience
      </Text>
      <TextInput
        value={projects}
        onChangeText={setProjects}
        placeholder="Hackathon project, class projects"
        placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
        style={[styles.input, isDark && styles.inputDark]}
      />

      <Text style={[styles.label, isDark && styles.labelDark]}>Career Goal</Text>
      <TextInput
        value={goal}
        onChangeText={setGoal}
        placeholder="a summer internship"
        placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
        style={[styles.input, isDark && styles.inputDark]}
      />

      {/* Generate Button */}
      <TouchableOpacity onPress={generateProfile} style={styles.button}>
        <Text style={styles.buttonText}>Generate Profile</Text>
      </TouchableOpacity>

      {/* Outputs */}
      {headline !== "" && (
        <>
          <Text style={[styles.outputTitle, isDark && styles.outputTitleDark]}>
            Headline
          </Text>
          <Text style={[styles.outputBox, isDark && styles.outputBoxDark]}>
            {headline}
          </Text>

          <Text style={[styles.outputTitle, isDark && styles.outputTitleDark]}>
            Professional Summary
          </Text>
          <Text style={[styles.outputBox, isDark && styles.outputBoxDark]}>
            {summary}
          </Text>

          <Text style={[styles.outputTitle, isDark && styles.outputTitleDark]}>
            Short Bio
          </Text>
          <Text style={[styles.outputBox, isDark && styles.outputBoxDark]}>
            {bio}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  containerDark: {
    backgroundColor: "#020617",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#020617",
    marginBottom: 8,
  },
  titleDark: {
    color: "#e0f2fe",
  },

  subtitle: {
    color: "#475569",
    marginBottom: 20,
  },
  subtitleDark: {
    color: "#94a3b8",
  },

  label: {
    color: "#334155",
    marginBottom: 4,
    marginTop: 12,
  },
  labelDark: {
    color: "#cbd5f5",
  },

  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#ffffff",
    color: "#020617",
    marginBottom: 10,
  },
  inputDark: {
    borderColor: "#334155",
    backgroundColor: "#020617",
    color: "#ffffff",
  },

  button: {
    backgroundColor: "#38bdf8",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: {
    color: "#020617",
    fontWeight: "bold",
    fontSize: 16,
  },

  outputTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0284c7",
    marginTop: 20,
  },
  outputTitleDark: {
    color: "#7dd3fc",
  },

  outputBox: {
    backgroundColor: "#e5e7eb",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    color: "#020617",
  },
  outputBoxDark: {
    backgroundColor: "#1e293b",
    color: "#ffffff",
  },
});
