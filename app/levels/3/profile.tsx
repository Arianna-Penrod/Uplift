import { ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
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
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: "bold" }}>
        Level 3: Professional Profile
      </Text>

      <Text style={{ color: "#aaa", marginVertical: 10 }}>
        Build a professional profile you can use anywhere.
      </Text>

      <Text>Target Role</Text>
      <TextInput
        value={role}
        onChangeText={setRole}
        placeholder="Software Engineer Intern"
        style={styles.input}
      />

      <Text>Skills</Text>
      <TextInput
        value={skills}
        onChangeText={setSkills}
        placeholder="Java, React, SQL"
        style={styles.input}
      />

      <Text>Projects / Experience</Text>
      <TextInput
        value={projects}
        onChangeText={setProjects}
        placeholder="Hackathon project, class projects"
        style={styles.input}
      />

      <Text>Career Goal</Text>
      <TextInput
        value={goal}
        onChangeText={setGoal}
        placeholder="a summer internship"
        style={styles.input}
      />

      <TouchableOpacity onPress={generateProfile} style={styles.button}>
        <Text style={{ color: "#000", fontWeight: "bold" }}>
          Generate Profile
        </Text>
      </TouchableOpacity>

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

const styles = {
  input: {
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    color: "#fff"
  },
  button: {
    backgroundColor: "#7dd3fc",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 15
  },
  outputTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20
  },
  outputBox: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    color: "#fff"
  }
};
