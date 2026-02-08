import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { useState } from "react";

export default function Profile() {
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Level 3: Professional Profile</Text>

      <Text style={styles.subtitle}>
        Build a professional profile you can use anywhere.
      </Text>

      {/* Inputs */}
      <Text style={styles.label}>Target Role</Text>
      <TextInput
        value={role}
        onChangeText={setRole}
        placeholder="Software Engineer Intern"
        placeholderTextColor="#64748b"
        style={styles.input}
      />

      <Text style={styles.label}>Skills</Text>
      <TextInput
        value={skills}
        onChangeText={setSkills}
        placeholder="Java, React, SQL"
        placeholderTextColor="#64748b"
        style={styles.input}
      />

      <Text style={styles.label}>Projects / Experience</Text>
      <TextInput
        value={projects}
        onChangeText={setProjects}
        placeholder="Hackathon project, class projects"
        placeholderTextColor="#64748b"
        style={styles.input}
      />

      <Text style={styles.label}>Career Goal</Text>
      <TextInput
        value={goal}
        onChangeText={setGoal}
        placeholder="a summer internship"
        placeholderTextColor="#64748b"
        style={styles.input}
      />

      {/* Generate Button */}
      <TouchableOpacity onPress={generateProfile} style={styles.button}>
        <Text style={styles.buttonText}>Generate Profile</Text>
      </TouchableOpacity>

      {/* Outputs */}
      {headline !== "" && (
        <>
          <Text style={styles.outputTitle}>Headline</Text>
          <Text style={styles.outputBox}>{headline}</Text>

          <Text style={styles.outputTitle}>Professional Summary</Text>
          <Text style={styles.outputBox}>{summary}</Text>

          <Text style={styles.outputTitle}>Short Bio</Text>
          <Text style={styles.outputBox}>{bio}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 20
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#e0f2fe",
    marginBottom: 8
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: 20
  },
  label: {
    color: "#cbd5f5",
    marginBottom: 4,
    marginTop: 12
  },
  input: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 10,
    color: "#ffffff",
    marginBottom: 10
  },
  button: {
    backgroundColor: "#7dd3fc",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20
  },
  buttonText: {
    color: "#020617",
    fontWeight: "bold",
    fontSize: 16
  },
  outputTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7dd3fc",
    marginTop: 20
  },
  outputBox: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    color: "#ffffff"
  }
});

