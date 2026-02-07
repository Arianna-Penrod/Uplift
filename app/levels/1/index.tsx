import { View, Text, Pressable, Alert } from "react-native";
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
      Alert.alert("No file selected");
      return;
    }

    const formData = new FormData();

    formData.append("resume", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "application/pdf",
    } as any);

    try {
      const response = await fetch("http://localhost:5000/analyze-resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log(data);
      Alert.alert("Resume uploaded successfully");

      router.replace("/"); // Go home after success

    } catch (err) {
      Alert.alert("Upload failed");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
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
        style={{
          backgroundColor: "black",
          padding: 14,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Analyze
        </Text>
      </Pressable>

      {/* 🏠 HOME BUTTON */}
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
    </View>
  );
}
