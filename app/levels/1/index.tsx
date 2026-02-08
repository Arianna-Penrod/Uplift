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
  const [errorMessage, setErrorMessage] = useState("");

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

  const wordCount = resumeText.trim().split(/\s+/).length;

  /* ---------------- MINIMUM WORD REQUIREMENT ---------------- */
    if (wordCount < 200) {
      const wordsNeeded = 200 - wordCount;

      setErrorMessage(
        `🔒 Add ${wordsNeeded} more word${wordsNeeded === 1 ? "" : "s"} to unlock scoring.`
      );

      setReport(null);
      return;
    }

  /* ---------------- CLEAN WORD PROCESSING ---------------- */

  const words = resumeText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const uniqueWords = new Set(words);
  const uniqueRatio = uniqueWords.size / words.length;

  /* ---------------- ANTI-GIBBERISH DETECTION ---------------- */

  const repeatedCharPattern = /(.)\1{4,}/g;
  const hasRepeatedCharacters = repeatedCharPattern.test(resumeText);

  const lowVocabulary = uniqueRatio < 0.4;
  const isGibberish = hasRepeatedCharacters || lowVocabulary;

  /* ---------------- SENTENCE DETECTION ---------------- */

  const sentences = resumeText.match(/[^.!?]+[.!?]+/g) || [];
  const sentenceCount = sentences.length;

  const hasSentenceStructure = sentenceCount >= 3;

  /* ---------------- CODE DETECTION ---------------- */

const codePatterns = [
  /const\s+/,
  /let\s+/,
  /var\s+/,
  /function\s+/,
  /=>/,
  /import\s+/,
  /export\s+/,
  /{.*}/,
  /<\/?[a-z][\s\S]*>/i, // HTML tags
];

const looksLikeCode = codePatterns.some((pattern) =>
    pattern.test(resumeText)
  );

  if (looksLikeCode) {
    setReport({
      error:
        "This looks like programming code, not a resume. Please paste a professional resume.",
      wordCount,
    });
    return;
  }

  /* ---------------- REPETITION DETECTION ---------------- */

  const repetitionThreshold = 0.15;
  let excessiveRepetition = false;

  words.forEach((word) => {
    const frequency =
      words.filter((w) => w === word).length / words.length;

    if (frequency > repetitionThreshold) {
      excessiveRepetition = true;
    }
  });

  /* ---------------- ORIGINAL SCORING ---------------- */

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

  /* ---------------- INTEGRITY PENALTIES ---------------- */

  let integrityPenalty = 0;

  if (isGibberish) integrityPenalty += 25;
  if (!hasSentenceStructure) integrityPenalty += 20;
  if (excessiveRepetition) integrityPenalty += 20;
  if (looksLikeCode) integrityPenalty += 60;

  const totalScore = Math.max(
    Math.min(
      Math.floor(
        (pageScore + verbScore + keywordScore + atsScore) / 4
      ) - integrityPenalty,
      100
    ),
    0
  );

  /* ---------------- FINAL REPORT ---------------- */

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
    isGibberish,
    excessiveRepetition,
    hasSentenceStructure,
    error: null,
  });
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

      {/* ---------------- QUIZ ---------------- */}

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

      {/* ---------------- ANALYZER ---------------- */}

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
              marginBottom: 10,
            }}
          />

          {/* WORD COUNT DISPLAY */}
          <Text style={{ marginBottom: 10 }}>
            Word Count: {resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0}
          </Text>

          {/* ERROR MESSAGE */}
          {errorMessage !== "" && (
            <View
              style={{
                backgroundColor: "#ffffffff",
                padding: 12,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#5568a9ff", fontWeight: "600" }}>
                {errorMessage}
              </Text>
            </View>
          )}

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

      {/* ---------------- RESULTS ---------------- */}

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


