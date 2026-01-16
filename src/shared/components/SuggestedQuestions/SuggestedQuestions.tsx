import { memo, useCallback } from 'react'
import './SuggestedQuestions.css'

interface SuggestedQuestion {
  id: string
  text: string
}

interface SuggestedQuestionsProps {
  questions: SuggestedQuestion[]
  onQuestionClick: (question: string) => void
}

const SuggestedQuestions = memo(({
  questions,
  onQuestionClick,
}: SuggestedQuestionsProps) => {
  if (questions.length === 0) return null

  return (
    <div className="suggested-questions">
      <div className="suggested-questions-list">
        {questions.map((question) => (
          <button
            key={question.id}
            className="suggested-question-item"
            onClick={() => onQuestionClick(question.text)}
            type="button"
          >
            <span className="suggested-question-text">{question.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
})

SuggestedQuestions.displayName = 'SuggestedQuestions'

export default SuggestedQuestions

