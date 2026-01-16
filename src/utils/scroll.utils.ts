/**
 * Scrolls an element into view smoothly
 */
export const scrollToBottom = (element: HTMLElement | null): void => {
  element?.scrollIntoView({ behavior: 'smooth' })
}

