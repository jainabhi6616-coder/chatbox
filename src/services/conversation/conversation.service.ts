/**
 * Conversation history management service
 */

interface ApiMessage {
  role: 'user' | 'assistant'
  content: string | { output: unknown }
}

class ConversationService {
  private history = new Map<string, ApiMessage[]>()

  /**
   * Get conversation history for a conversation ID
   */
  getHistory(conversationId: string = 'default'): ApiMessage[] {
    return this.history.get(conversationId) || []
  }

  /**
   * Add user message to conversation history
   */
  addUserMessage(conversationId: string, query: string): void {
    const history = this.getHistory(conversationId)
    history.push({
      role: 'user',
      content: query,
    })
    this.history.set(conversationId, history)
  }

  /**
   * Update conversation history with full message array
   */
  updateHistory(conversationId: string, messages: ApiMessage[]): void {
    this.history.set(conversationId, messages)
  }

  /**
   * Clear conversation history for a specific conversation
   */
  clear(conversationId?: string): void {
    if (conversationId) {
      this.history.delete(conversationId)
    } else {
      this.history.clear()
    }
  }

  /**
   * Build messages array with history and new user message
   */
  buildMessages(conversationId: string, query: string): ApiMessage[] {
    const history = this.getHistory(conversationId)
    return [
      ...history,
      {
        role: 'user',
        content: query,
      },
    ]
  }
}

// Export singleton instance
export const conversationService = new ConversationService()

