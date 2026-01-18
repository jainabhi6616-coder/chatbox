import { memo } from 'react'
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
  if (!questions || questions.length === 0) return null

  // Limit to 4-5 questions for better UX
  const displayQuestions = questions.slice(0, 5)

  return (
    <div className="suggested-questions">
      <div className="suggested-questions-grid">
        {displayQuestions.map((question, index) => (
          <button
            key={question.id}
            className="suggested-question-card"
            onClick={() => onQuestionClick(question.text)}
            type="button"
            aria-label={`Ask: ${question.text}`}
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <span className="suggested-question-text">{question.text}</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="suggested-question-arrow"
            >
              <path d="M13 7l5 5-5 5M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
})

SuggestedQuestions.displayName = 'SuggestedQuestions'

export default SuggestedQuestions
