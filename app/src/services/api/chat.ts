import { apiClient } from './client';

/**
 * Chat Types
 */
export type MessageSender = 'user' | 'bot' | 'system';
export type MessageType = 'text' | 'image' | 'file' | 'card' | 'quick_reply';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title: string;
  isActive: boolean;
  messages: ChatMessage[];
  messageCount: number;
  userScore: number;
  scoreCategory: 'safe' | 'moderate' | 'at_risk';
  lastMessageAt?: string;
  createdAt: string;
}

export interface SessionsResponse {
  sessions: Omit<ChatSession, 'messages'>[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  botResponse: ChatMessage;
  session: ChatSession;
}

export interface UserScore {
  score: number;
  category: 'safe' | 'moderate' | 'at_risk';
  totalSessions: number;
}

/**
 * Chat API Service
 */
export const chatApi = {
  /**
   * Create new chat session
   */
  async createSession(title?: string): Promise<ChatSession> {
    return apiClient.post<ChatSession>('/chat/sessions', { title });
  },

  /**
   * Get or create active session
   */
  async getActiveSession(): Promise<ChatSession> {
    return apiClient.get<ChatSession>('/chat/sessions/active');
  },

  /**
   * Get all chat sessions
   */
  async getSessions(params?: {
    page?: number;
    limit?: number;
    activeOnly?: boolean;
  }): Promise<SessionsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.activeOnly) query.append('activeOnly', 'true');

    return apiClient.get<SessionsResponse>(`/chat/sessions?${query.toString()}`);
  },

  /**
   * Get specific session with messages
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    return apiClient.get<ChatSession>(`/chat/sessions/${sessionId}`);
  },

  /**
   * Send message and get AI response
   */
  async sendMessage(sessionId: string, content: string): Promise<SendMessageResponse> {
    return apiClient.post<SendMessageResponse>(`/chat/sessions/${sessionId}/messages`, {
      content,
    });
  },

  /**
   * End chat session
   */
  async endSession(sessionId: string): Promise<ChatSession> {
    return apiClient.post<ChatSession>(`/chat/sessions/${sessionId}/end`);
  },

  /**
   * Get user's overall chat score
   */
  async getUserScore(): Promise<UserScore> {
    return apiClient.get<UserScore>('/chat/score');
  },

  /**
   * Clear chat history
   */
  async clearHistory(): Promise<{ deletedCount: number }> {
    return apiClient.delete<{ deletedCount: number }>('/chat/history');
  },
};
