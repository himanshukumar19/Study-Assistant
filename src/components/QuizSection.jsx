import { useState, useEffect, useRef } from "react";
import { useQuizProgress } from "../hooks/useQuizProgress.js";

/**
 * @param {Object} props
 * @param {import("../services/schema.js").QuizItem[]} props.items
 */
export default function QuizSection({ items }) {
  const {
    state,
    load,
    answer,
    startRetest,
    correctCount,
    totalCount,
    canRetest,
  } = useQuizProgress(items);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(
    /** @type {number | null} */ (null)
  );
  const [isLocked, setIsLocked] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      load();
      loadedRef.current = true;
    }
  }, [load]);

  const entries = [...state.items.values()];
  const currentEntry = entries[currentIndex] || null;
  const allAnswered = entries.every((e) => e.status !== "unanswered");
  const answeredCount = entries.filter((e) => e.status !== "unanswered").length;
  const item = currentEntry ? currentEntry.item : null;
  const isCorrect = currentEntry ? selectedIndex === currentEntry.item.correctIndex : false;

  const handleSelect = (idx) => {
    if (isLocked) return;
    setSelectedIndex(idx);
  };

  const handleLock = () => {
    if (selectedIndex === null || isLocked || !currentEntry) return;
    const correct = selectedIndex === currentEntry.item.correctIndex;
    answer({ id: currentEntry.item.id, correct });
    setIsLocked(true);
  };

  const handleNext = () => {
    setSelectedIndex(null);
    setIsLocked(false);
    setCurrentIndex((prev) => (prev + 1) % entries.length);
  };

  const handleKeyDown = (e) => {
    if (isLocked) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleNext();
      }
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      if (selectedIndex !== null) {
        e.preventDefault();
        handleLock();
      }
    }
  };

  if (!currentEntry || !item) {
    return (
      <div className="quiz-section">
        <p className="quiz-section__empty">No questions to display.</p>
      </div>
    );
  }

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <section
      className="quiz-section"
      onKeyDown={handleKeyDown}
      aria-label="Quiz study set"
    >
      <div className="quiz-section__progress">
        <div className="quiz-section__dots">
          {entries.map((entry, i) => (
            <span
              key={i}
              className={`quiz-section__dot${
                entry.status !== "unanswered" ? " quiz-section__dot--done" : ""
              }${
                entry.status === "correct"
                  ? " quiz-section__dot--correct"
                  : entry.status === "incorrect"
                  ? " quiz-section__dot--incorrect"
                  : ""
              }${i === currentIndex ? " quiz-section__dot--active" : ""}`}
              aria-label={
                entry.status === "correct"
                  ? `Question ${i + 1} correct`
                  : entry.status === "incorrect"
                  ? `Question ${i + 1} incorrect`
                  : `Question ${i + 1} unanswered`
              }
            />
          ))}
        </div>
        <span className="quiz-section__counter">
          {answeredCount} / {entries.length}
        </span>
      </div>

      {!allAnswered && (
        <div className="quiz-section__question-card">
          <p className="quiz-section__question-text">{item.question}</p>

          <div className="quiz-section__options" role="radiogroup" aria-label="Answer options">
            {item.options.map((option, idx) => {
              const isSelected = selectedIndex === idx;
              const isCorrectAnswer = idx === item.correctIndex;
              let optionClass = "quiz-section__option";
              let icon = null;
              let label = null;

              if (isLocked) {
                if (isSelected && isCorrectAnswer) {
                  optionClass += " quiz-section__option--correct";
                  icon = <CheckIcon />;
                  label = "Correct!";
                } else if (isSelected && !isCorrectAnswer) {
                  optionClass += " quiz-section__option--incorrect";
                  icon = <CrossIcon />;
                  label = "Incorrect";
                } else if (isCorrectAnswer) {
                  optionClass += " quiz-section__option--correct";
                  icon = <CheckIcon />;
                } else {
                  optionClass += " quiz-section__option--dimmed";
                }
              } else if (isSelected) {
                optionClass += " quiz-section__option--selected";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={optionClass}
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isLocked}
                  onClick={() => handleSelect(idx)}
                >
                  <span className="quiz-section__option-letter">
                    {optionLabels[idx]}
                  </span>
                  <span className="quiz-section__option-text">{option}</span>
                  {icon && (
                    <span className="quiz-section__option-icon" aria-hidden="true">
                      {icon}
                    </span>
                  )}
                  {label && (
                    <span className="quiz-section__option-label">{label}</span>
                  )}
                </button>
              );
            })}
          </div>

          {!isLocked && (
            <button
              type="button"
              className="quiz-section__lock-btn"
              disabled={selectedIndex === null}
              onClick={handleLock}
            >
              Lock in answer
            </button>
          )}

          {isLocked && (
            <div className="quiz-section__result">
              <div
                className={`quiz-section__result-banner${
                  isCorrect
                    ? " quiz-section__result-banner--correct"
                    : " quiz-section__result-banner--incorrect"
                }`}
              >
                {isCorrect ? (
                  <>
                    <CheckIcon />
                    <span>Correct!</span>
                  </>
                ) : (
                  <>
                    <CrossIcon />
                    <span>Incorrect</span>
                  </>
                )}
              </div>

              <div className="quiz-section__explanation">
                <p className="quiz-section__explanation-label">Explanation</p>
                <p className="quiz-section__explanation-text">
                  {item.explanation}
                </p>
              </div>

              <button
                type="button"
                className="quiz-section__next-btn"
                onClick={handleNext}
              >
                Next question
              </button>
            </div>
          )}
        </div>
      )}

      {allAnswered && (
        <div className="quiz-section__summary">
          <p className="quiz-section__summary-text">
            {correctCount} of {totalCount} correct
          </p>
          {canRetest && (
            <button
              type="button"
              className="quiz-section__retest-btn"
              onClick={() => {
                startRetest();
                setCurrentIndex(0);
                setSelectedIndex(null);
                setIsLocked(false);
              }}
            >
              Retest {state.retestQueue.size} incorrect
            </button>
          )}
          <p className="quiz-section__summary-done">
            {canRetest
              ? "Or review later — incorrect items will be here."
              : "All questions complete."}
          </p>
        </div>
      )}
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 8l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 6l4 4M10 6l-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
