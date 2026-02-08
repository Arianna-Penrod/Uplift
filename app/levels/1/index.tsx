import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";

/* ---------------- QUIZ QUESTIONS ---------------- */

const questions = [
  {
    question: "How many pages is your resume?",
    answers: [
      { label: "1 page", xp: 20 },
      { label: "2 pages", xp: 10 },
      { label: "3+ pages", xp: 5 },
    ],
  },
  {
    question: "Do you tailor your resume for each job?",
    answers: [
      { label: "Always", xp: 20 },
      { label: "Sometimes", xp: 10 },
      { label: "Never", xp: 5 },
    ],
  },
  {
    question: "Do you include measurable achievements?",
    answers: [
      { label: "Yes, with numbers", xp: 20 },
      { label: "Some", xp: 10 },
      { label: "No", xp: 5 },
    ],
  },
];

export default function Index() {
  const router = useRouter();

  /* ---------------- STAGE STATE ---------------- */
  const [stage, setStage] = useState<"quiz" | "analyzer">("quiz");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [xp, setXp] = useState(0);

  /* ---------------- ANALYZER STATE ---------------- */
  const [resumeText, setResumeText] = useState("");
  const [report, setReport] = useState<any>(null);

  /* ---------------- QUIZ LOGIC ---------------- */

  const handleAnswer = (earnedXp: number) => {
    setXp((prev) => prev + earnedXp);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStage("analyzer");
    }
  };

  /* ---------------- RESUME ANALYSIS ---------------- */

  const analyzeResume = () => {
    if (!resumeText) return;

    const wordCount = resumeText.split(" ").length;

    const strongVerbs = ["led", "managed", "built", "created", "improved"];
    const weakVerbs = ["responsible", "helped", "worked"];

    const strongMatches = strongVerbs.filter((v) =>
      resumeText.toLowerCase().includes(v)
    );

    const weakMatches = weakVerbs.filter((v) =>
      resumeText.toLowerCase().includes(v)
    );

    const keywordList = ["leadership", "project", "analysis", "team"];
    const keywordMatches = keywordList.filter((k) =>
      resumeText.toLowerCase().includes(k)
    );

    const pageScore = wordCount < 700 ? 95 : 60;
    const verbScore = strongMatches.length * 20;
    const keywordScore = keywordMatches.length * 25;
    const atsScore = resumeText.includes("|") ? 60 : 90;

    const totalScore = Math.min(
      Math.floor((pageScore + verbScore + keywordScore + atsScore) / 4),
      100
    );

    setReport({
      totalScore,
      pageScore,
      verbScore,
      keywordScore,
      atsScore,
      strongMatches,
      weakMatches,
      keywordMatches,
      wordCount,
    });
  };

  /* ---------------- PERSONAL RECOMMENDATIONS ---------------- */

  const generateRecommendations = (report: any) => {
    const recommendations: string[] = [];

    if (report.wordCount > 700) {
      recommendations.push("Consider shortening your resume to improve readability and impact.");
    }

    if (report.weakMatches.length > 0) {
      recommendations.push(
        `Replace weak action verbs like: ${report.weakMatches.join(", ")}`
      );
    }

    if (report.keywordMatches.length < 2) {
      recommendations.push("Add more role-specific keywords from job descriptions.");
    }

    if (report.atsScore < 80) {
      recommendations.push("Simplify formatting to improve ATS compatibility.");
    }

    if (report.totalScore >= 85) {
      recommendations.push("Strong resume overall. Focus on tailoring it to each role.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Great foundation. Continue refining bullet clarity and impact.");
    }

    return recommendations;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#0c3a86ff";
    if (score >= 60) return "#467fdaff";
    return "#8fbaffff";
  };

  const ProgressBar = ({ score }: { score: number }) => (
    <View
      style={{
        height: 10,
        backgroundColor: "#e5e7eb",
        borderRadius: 5,
        marginTop: 6,
      }}
    >
      <View
        style={{
          width: `${score}%`,
          height: 10,
          borderRadius: 5,
          backgroundColor: getScoreColor(score),
        }}
      />
    </View>
  );

  const ScoreCard = ({
    title,
    score,
    children,
  }: {
    title: string;
    score: number;
    children?: any;
  }) => (
    <View
      style={{
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        width: "48%",
        marginBottom: 16,
      }}
    >
      <Text style={{ fontWeight: "600", marginBottom: 6 }}>{title}</Text>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: getScoreColor(score),
        }}
      >
        {score}%
      </Text>
      <ProgressBar score={score} />
      {children}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f7f7f7", padding: 20 }}>

      {/* XP BAR */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: "600" }}>Level 1 Progress</Text>
        <View
          style={{
            height: 10,
            backgroundColor: "#e5e7eb",
            borderRadius: 5,
            marginTop: 6,
          }}
        >
          <View
            style={{
              width: `${(xp / 60) * 100}%`,
              height: 10,
              backgroundColor: "#2563eb",
              borderRadius: 5,
            }}
          />
        </View>
        <Text style={{ marginTop: 6 }}>{xp} XP</Text>
      </View>

      {/* QUIZ */}
      {stage === "quiz" && (
        <View>
          <Text style={{ fontSize: 20, marginBottom: 20 }}>
            {questions[currentQuestion].question}
          </Text>

          {questions[currentQuestion].answers.map((answer, index) => (
            <Pressable
              key={index}
              onPress={() => handleAnswer(answer.xp)}
              style={{
                backgroundColor: "#fff",
                padding: 14,
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <Text>{answer.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* ANALYZER */}
      {stage === "analyzer" && (
        <>
          <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 10 }}>
            Resume Review
          </Text>

          <TextInput
            placeholder="Paste your resume here..."
            multiline
            value={resumeText}
            onChangeText={setResumeText}
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderRadius: 12,
              height: 150,
              borderWidth: 1,
              borderColor: "#ddd",
              marginBottom: 16,
            }}
          />

          <Pressable
            onPress={analyzeResume}
            style={{
              backgroundColor: "#464646ff",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Analyze Resume
            </Text>
          </Pressable>
        </>
      )}

      {/* RESULTS */}
      {report && (
        <>
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 16,
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 6 }}>
              Resume Score
            </Text>
            <Text
              style={{
                fontSize: 42,
                fontWeight: "bold",
                color: getScoreColor(report.totalScore),
              }}
            >
              {report.totalScore}/100
            </Text>
            <ProgressBar score={report.totalScore} />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <ScoreCard title="Page Length" score={report.pageScore}>
              <Text style={{ fontSize: 12, marginTop: 8 }}>
                {report.wordCount} words
              </Text>
            </ScoreCard>

            <ScoreCard title="Keyword Match" score={report.keywordScore} />

            <ScoreCard title="Verb Strength" score={report.verbScore} />

            <ScoreCard title="ATS Compatibility" score={report.atsScore} />
          </View>

          {/* PERSONAL RECOMMENDATIONS */}
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 16,
              marginTop: 10,
            }}
          >
            <Text style={{ fontWeight: "600", marginBottom: 10 }}>
              Personal Recommendations
            </Text>

            {generateRecommendations(report).map(
              (rec: string, index: number) => (
                <Text key={index} style={{ marginBottom: 8 }}>
                  • {rec}
                </Text>
              )
            )}
          </View>

          {/* HOME BUTTON */}
          <Pressable
            onPress={() => router.replace("/")}
            style={{
              backgroundColor: "#464646ff",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Return Home
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}


