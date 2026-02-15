import type { SuggestedQuestion } from '../services/graphql/types'

/** Default suggested questions per account (3 per account) */
const DEFAULT_QUESTIONS_BY_ACCOUNT: Record<string, Omit<SuggestedQuestion, 'id'>[]> = {
  'ORGANIC NET REVENUES': [
    { text: 'What is the year-to-date revenue for the current year?', tabInformation: 'base question' },
    { text: 'What is the revenue for the latest month?', tabInformation: 'sales deep dive' },
    { text: 'What is the revenue for the ongoing quarter?', tabInformation: 'product & channel level' },
  ],
  'SG&A': [
    { text: 'What is the year-to-date SG&A for the current year?', tabInformation: 'base question' },
    { text: 'What is the SG&A for the latest month?', tabInformation: 'sales deep dive' },
    { text: 'What is the SG&A for the ongoing quarter?', tabInformation: 'product & channel level' },
  ],
  'COST OF GOODS SOLD TOTAL': [
    { text: 'What is the year-to-date COGS for the current year?', tabInformation: 'base question' },
    { text: 'What is the COGS for the latest month?', tabInformation: 'sales deep dive' },
    { text: 'What is the COGS for the ongoing quarter?', tabInformation: 'product & channel level' },
  ],
  EBIT: [
    { text: 'What is the year-to-date EBIT for the current year?', tabInformation: 'base question' },
    { text: 'What is the EBIT for the latest month?', tabInformation: 'sales deep dive' },
    { text: 'What is the EBIT for the ongoing quarter?', tabInformation: 'product & channel level' },
  ],
}

/**
 * Returns the 3 default suggested questions for the given account.
 * Falls back to ORGANIC NET REVENUES defaults if account is unknown.
 */
export function getDefaultSuggestedQuestionsForAccount(account: string): SuggestedQuestion[] {
  const questions = DEFAULT_QUESTIONS_BY_ACCOUNT[account] ?? DEFAULT_QUESTIONS_BY_ACCOUNT['ORGANIC NET REVENUES']
  return questions.map((q, i) => ({
    id: `default-${account}-${i + 1}`.replace(/\s+/g, '-'),
    text: q.text,
    tabInformation: q.tabInformation,
  }))
}

/** @deprecated Use getDefaultSuggestedQuestionsForAccount(account) for account-specific defaults */
export const DEFAULT_SUGGESTED_QUESTIONS: SuggestedQuestion[] = getDefaultSuggestedQuestionsForAccount('ORGANIC NET REVENUES')
