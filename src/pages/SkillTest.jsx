import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, LockKeyhole, RotateCcw, XCircle } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { Badge, Button, Card, EmptyState, LoadingState, PageHeader } from "../components/ui";
import { api } from "../services/api";

const DEFAULT_SKILLS = ["HTML", "CSS", "JavaScript", "React", "Python", "Java", "SQL", "Git"];

function getClassification(score) {
  if (score < 40) return "Beginner";
  if (score < 70) return "Developing";
  if (score < 85) return "Intermediate";
  return "Strong";
}

function SkillTest() {
  const [availableSkills, setAvailableSkills] = useState(DEFAULT_SKILLS);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [confidenceLoading, setConfidenceLoading] = useState(false);
  const [confidenceMessage, setConfidenceMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.skillTests.getAvailable()
      .then((skills) => {
        if (Array.isArray(skills) && skills.length > 0) {
          setAvailableSkills(skills);
        }
      })
      .catch(() => {});
  }, []);

  const loadTest = async (skillName) => {
    setSelectedSkill(skillName);
    setTest(null);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setMessage("");

    if (!skillName) return;

    setLoading(true);

    try {
      const data = await api.skillTests.getTest(skillName);
      setTest(data);
    } catch (error) {
      setMessage(error.message || "Unable to load this skill test");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (answer) => {
    const questionId = test.questions[currentIndex].questionId;
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answer,
    }));
  };

  const submitTest = async () => {
    setSubmitting(true);
    setMessage("");

    try {
      const data = await api.skillTests.submit({
        skillName: selectedSkill,
        answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer })),
      });

      setResult(data);

      const [historyData, summaryData] = await Promise.all([
        api.skillTests.getHistory("me").catch(() => []),
        api.skillTests.getSummary(selectedSkill, "me").catch(() => null),
      ]);

      if (Array.isArray(historyData)) {
        setHistory(historyData.filter((attempt) => attempt.skillName === selectedSkill));
      }

      if (summaryData) {
        setSummary(summaryData);
      }
    } catch (error) {
      setMessage(error.message || "Unable to submit this skill test");
    } finally {
      setSubmitting(false);
    }
  };

  const resetTest = () => {
    setResult(null);
    setHistory([]);
    setSummary(null);
    setConfidence(null);
    setConfidenceMessage("");
    setMessage("");
    loadTest(selectedSkill);
  };

  const calculateConfidence = async () => {
    setConfidenceLoading(true);
    setConfidenceMessage("");

    try {
      const data = await api.skillConfidence.calculate(selectedSkill);
      setConfidence(data);
    } catch (error) {
      setConfidenceMessage(error.message || "Unable to calculate skill confidence");
    } finally {
      setConfidenceLoading(false);
    }
  };

  const currentQuestion = test?.questions[currentIndex];
  const isLastQuestion = test && currentIndex === test.questions.length - 1;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Practical knowledge check"
        title="Skill Test"
        description="Test your knowledge with randomized questions and verify your skill score."
      />

      {!result && (
        <Card className="skill-test-card">
          <div className="skill-test-heading">
            <span className="dashboard-icon"><ClipboardCheck size={20} /></span>
            <div><p className="card-kicker">Step 1 · Choose a skill</p><h2>What would you like to test?</h2></div>
          </div>
          <div className="skill-choice-grid">
            {availableSkills.map((skill) => (
              <button
                className={`skill-choice ${selectedSkill === skill ? "is-selected" : ""}`}
                type="button"
                key={skill}
                onClick={() => loadTest(skill)}
              >
                <span>{skill}</span>
                {selectedSkill === skill && <CheckCircle2 size={16} />}
              </button>
            ))}
          </div>
        </Card>
      )}

      {loading && <Card className="skill-test-card"><LoadingState label="Loading your skill test" /></Card>}
      {message && <div className="form-message skill-test-message" role="alert">{message}</div>}

      {!result && test && currentQuestion && !loading && (
        <Card className="question-card">
          <div className="question-meta"><Badge tone="violet">Step 2 · Question {currentIndex + 1} of {test.questions.length}</Badge><span>{selectedSkill}</span></div>
          <h2>{currentQuestion.question}</h2>
          <div className="answer-list">
            {currentQuestion.options.map((option) => (
              <button className={`answer-option ${answers[currentQuestion.questionId] === option ? "is-selected" : ""}`} type="button" key={option} onClick={() => selectAnswer(option)}>
                <span className="answer-marker">{String.fromCharCode(65 + currentQuestion.options.indexOf(option))}</span>
                <span>{option}</span>
              </button>
            ))}
          </div>
          <div className="question-actions">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => setCurrentIndex((index) => index - 1)} disabled={currentIndex === 0}>Previous</Button>
            {isLastQuestion ? (
              <Button icon={ClipboardCheck} onClick={submitTest} disabled={submitting}>{submitting ? "Submitting..." : "Submit Test"}</Button>
            ) : (
              <Button icon={ArrowRight} iconAfter onClick={() => setCurrentIndex((index) => index + 1)} disabled={!answers[currentQuestion.questionId]}>Next</Button>
            )}
          </div>
          <p className="skill-test-security"><LockKeyhole size={13} /> Correct answers stay hidden until you submit.</p>
        </Card>
      )}

      {!result && !test && !loading && !message && (
        <Card className="skill-test-empty"><EmptyState title="Choose a skill to begin" description="Each test contains beginner-friendly practical questions. Your score is calculated securely by the backend." /></Card>
      )}

      {result && (
        <div className="test-result-stack">
          <Card className="test-result-card">
            <div className="result-icon"><CheckCircle2 size={24} /></div>
            <Badge tone="green">Test complete</Badge>
            <p className="card-kicker">{result.result.skillName}</p>
            <h2>{result.result.score}/100</h2>
            <p className="result-classification">{getClassification(result.result.score)}</p>
            <p className="result-summary">You answered {result.result.correctAnswers} of {result.result.totalQuestions} questions correctly.</p>
            <p className="result-disclaimer">SkillGap AI project classification only. This is not an official industry certification.</p>
            <Button variant="ghost" icon={RotateCcw} onClick={resetTest}>Retake Test</Button>
            {summary && (
              <div className="test-history-summary">
                <div><span>Best score</span><strong>{summary.bestScore ?? "—"}/100</strong></div>
                <div><span>Latest score</span><strong>{summary.latestScore ?? "—"}/100</strong></div>
                <div><span>Total attempts</span><strong>{summary.totalAttempts}</strong></div>
              </div>
            )}
            {history.length > 0 && (
              <div className="test-history-list">
                <p className="card-kicker">Your Test History</p>
                {history.map((attempt, index) => (
                  <div className="test-history-row" key={`${attempt.createdAt}-${index}`}><span>Attempt {history.length - index}</span><strong>{attempt.score}/100</strong></div>
                ))}
              </div>
            )}
            <Button icon={LockKeyhole} onClick={calculateConfidence} disabled={confidenceLoading}>{confidenceLoading ? "Calculating..." : "Calculate Skill Confidence"}</Button>
            {confidenceMessage && <div className="form-message confidence-message" role="alert">{confidenceMessage}</div>}
            {confidence && (
              <div className="confidence-result-card">
                <Badge tone="green">Skill Confidence</Badge>
                <h3>{confidence.skillName}</h3>
                <strong className="confidence-score">{confidence.confidenceScore}<span>/100</span></strong>
                <p className="confidence-level">{confidence.level}</p>
                <div className="confidence-inputs"><div><span>Self Assessment</span><strong>{confidence.selfAssessmentScore}/100</strong></div><div><span>Mini Test</span><strong>{confidence.miniTestScore}/100</strong></div></div>
                <small>Project classification only, not an official industry certification.</small>
              </div>
            )}
          </Card>
          <Card className="explanation-card">
            <div className="skill-test-heading"><span className="dashboard-icon"><ClipboardCheck size={20} /></span><div><p className="card-kicker">Review</p><h2>Question explanations</h2></div></div>
            <div className="explanation-list">
              {result.review.map((item, index) => (
                <div className={`explanation-item ${item.isCorrect ? "is-correct" : "is-wrong"}`} key={item.questionId}>
                  <div className="explanation-status">{item.isCorrect ? <CheckCircle2 size={17} /> : <XCircle size={17} />}</div>
                  <div><strong>{index + 1}. {item.question}</strong><p>Your answer: {item.selectedAnswer || "Not answered"}</p><p>Correct answer: {item.correctAnswer}</p><small>{item.explanation}</small></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

export default SkillTest;
