/**
 * Formats a date to a time string (HH:MM format)
 * Uses cached formatter for better performance
 */
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export const formatMessageTime = (date: Date): string => {
  return timeFormatter.format(date)
}

