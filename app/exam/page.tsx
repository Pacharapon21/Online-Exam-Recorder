
"use client";

import { useEffect, useState } from "react";

type Option = {
  label: string;
  text: string;
};

type Question = {
  id: number;
  question: string;
  options: Option[];
};
type ExamResult = {
  score: number;
  total: number;
  answered: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
};

export default function ExamPage() {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExamResult | null>(null);
const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    
setStudentName(sessionStorage.getItem("examStudentName") || "");
setStudentId(sessionStorage.getItem("examStudentId") || "");


    async function loadQuestions() {
      try {
        const response = await fetch("/api/questions");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "โหลดข้อสอบไม่สำเร็จ");
        }

        setQuestions(data.questions || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "เกิดข้อผิดพลาด"
        );
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  function selectAnswer(questionId: number, label: string) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: label,
    }));
  }
  async function submitExam() {
  if (Object.keys(answers).length !== questions.length) {
    alert(`กรุณาตอบให้ครบ ${questions.length} ข้อ`);
    return;
  }

  const confirmed = window.confirm("ยืนยันส่งข้อสอบหรือไม่?");
  if (!confirmed) return;

  setSubmitting(true);

  
try {
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      answers,
      studentName,
      studentId,
    }),
  });

   
const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || "ตรวจคะแนนไม่สำเร็จ");
}

setResult(data);

if (data.savedToSheets) {
  console.log("บันทึกผลสอบลง Google Sheets สำเร็จ");
} else {
  console.warn("ผลสอบแสดงแล้ว แต่ยังยืนยันการบันทึกลง Google Sheets ไม่ได้");
}


    setResult(data);
  } catch (err) {
    alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
  } finally {
    setSubmitting(false);
  }
}

  if (loading) {
    return (
      <main className="exam-page">
        <div className="status-card">
          <span className="loading-spinner" aria-hidden="true" />
          <p>กำลังเตรียมข้อสอบของคุณ...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="exam-page">
        <div className="status-card error-card" role="alert">
          <span className="status-icon" aria-hidden="true">!</span>
          <h1>ไม่สามารถโหลดข้อสอบได้</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="exam-page">
      <div className="exam-shell">
        <header className="exam-header">
          <div className="exam-brand">
            <div className="exam-brand-icon" aria-hidden="true">✦</div>
            <div>
              <p className="eyebrow">ONLINE EXAMINATION</p>
              <h1>แบบทดสอบออนไลน์</h1>
            </div>
          </div>
          <div className="exam-count">
            <span className="exam-count-label">จำนวนข้อสอบ</span>
            <strong>{questions.length}<small> ข้อ</small></strong>
          </div>
        </header>

        <section className="student-card" aria-label="ข้อมูลผู้เข้าสอบ">
          <div className="student-avatar" aria-hidden="true">
            {(studentName || "น").charAt(0)}
          </div>
          <div className="student-details">
            <span>ผู้เข้าสอบ</span>
            <strong>{studentName || "ไม่พบชื่อ"}</strong>
          </div>
          <div className="student-divider" />
          <div className="student-details student-id">
            <span>รหัสนักศึกษา</span>
            <strong>{studentId || "ไม่พบรหัส"}</strong>
          </div>
        </section>

        <div className="question-list">
          {questions.map((question, index) => (
            <section className="question-card" key={question.id}>
              <div className="question-heading">
                <span className="question-number">{String(index + 1).padStart(2, "0")}</span>
                <h2>{question.question}</h2>
              </div>

              <div className="answer-list">
                {question.options.map((option) => (
                  <label
                    key={option.label}
                    className={`answer-option${answers[question.id] === option.label ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.label}
                      checked={answers[question.id] === option.label}
                      onChange={() =>
                        selectAnswer(question.id, option.label)
                      }
                    />
                    <span className="option-label">{option.label}</span>
                    <span className="option-text">{option.text}</span>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="exam-footer">
          <div className="answer-progress">
            <div className="progress-copy">
              <span>ความคืบหน้าการทำข้อสอบ</span>
              <strong>{Object.keys(answers).length} / {questions.length} ข้อ</strong>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="ความคืบหน้าการตอบข้อสอบ"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={Object.keys(answers).length}
            >
              <span
                style={{
                  width: `${questions.length ? (Object.keys(answers).length / questions.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={submitExam}
            disabled={submitting || result !== null}
            className="submit-button"
          >
            {submitting
              ? "กำลังตรวจคะแนน..."
              : result
                ? "ส่งข้อสอบแล้ว"
                : "ตรวจสอบคำตอบ"}
            {!submitting && !result && <span aria-hidden="true">→</span>}
          </button>
        </footer>

        {result && (
          <section className="result-card" aria-live="polite">
            <div className="result-heading">
              <span className="result-icon" aria-hidden="true">✓</span>
              <div>
                <p className="eyebrow">EXAM COMPLETED</p>
                <h2>ผลการสอบ</h2>
              </div>
              <strong className="result-percentage">{result.percentage}%</strong>
            </div>
            <p className="result-student">{studentName} <span>·</span> {studentId}</p>
            <div className="result-stats">
              <div className="result-stat score-stat">
                <span>คะแนนที่ได้</span>
                <strong>{result.score}<small> / {result.total}</small></strong>
              </div>
              <div className="result-stat">
                <span>ตอบถูก</span>
                <strong>{result.score}<small> ข้อ</small></strong>
              </div>
              <div className="result-stat">
                <span>ตอบผิด</span>
                <strong>{result.incorrect}<small> ข้อ</small></strong>
              </div>
              <div className="result-stat">
                <span>ไม่ได้ตอบ</span>
                <strong>{result.unanswered}<small> ข้อ</small></strong>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
