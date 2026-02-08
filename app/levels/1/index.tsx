import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";

export default function Level1() {
  const router = useRouter();
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "text/plain"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;
    setFile(result.assets[0]);
  };

  const uploadResume = async () => {
    if (!file) {
      Alert.alert("You must upload a resume first.");
      return;
    }

    Alert.alert("Analyze button pressed (placeholder)");
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>

      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 20 }}>
        Level 1: Upload Resume
      </Text>

      <Pressable
        onPress={pickDocument}
        style={{
          backgroundColor: "#333",
          padding: 14,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Choose Resume File
        </Text>
      </Pressable>

      {file && (
        <Text style={{ marginBottom: 20 }}>
          Selected: {file.name}
        </Text>
      )}

      <Pressable
        onPress={uploadResume}
        disabled={!file}
        style={{
          backgroundColor: file ? "black" : "#ccc",
          padding: 14,
          borderRadius: 8,
          marginBottom: 30,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Analyze
        </Text>
      </Pressable>

      {/* 🔥 Resume Tips Section */}

      <View
        style={{
          backgroundColor: "#f2f2f2",
          padding: 16,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 10 }}>
          General Resume Tips
        </Text>

        <Text style={{ marginBottom: 8 }}>
          • No more than one page if you are still in school or have been out of school for less than 4 years
        </Text>

        <Text style={{ marginBottom: 8 }}>
          • Keep in chronological order
        </Text>

        <Text style={{ marginBottom: 8 }}>
          • Use relevant action verbs to describe skills and accomplishments
        </Text>

        <Text style={{ marginBottom: 8 }}>
          • Quantify results whenever possible, use specific numbers or metrics to highlight your accomplishments
        </Text>

        <Text>
          • Tailor resume to job opening
        </Text>
      </View>

      {/* 🏠 Back Home */}
      <Pressable
        onPress={() => router.replace("/")}
        style={{
          backgroundColor: "#888",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          Back Home
        </Text>
      </Pressable>

    </ScrollView>
  );
}

