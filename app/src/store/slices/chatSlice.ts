import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchActiveSession, sendChatMessage, fetchUserChatScore, endChatSession, createNewChatSession } from '../thunks/chatThunks';

// Chat message displayed in UI
export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
}

// Gemini history format for context
export interface GeminiHistoryMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// User behavior/score data
export interface UserScoreData {
  score: number;           // 0-100 cyberbullying score
  category: 'victim' | 'neutral' | 'bully';
  lastUpdated: string;
  // Contextual data for follow-up
  recentTopics: string[];  // Topics discussed in chat
  emotionalState: 'distressed' | 'neutral' | 'defensive' | 'improving';
  sessionCount: number;    // Number of chat sessions
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  // Gemini conversation history for context
  geminiHistory: GeminiHistoryMessage[];
  // User score and behavior tracking
  userScore: UserScoreData;
  // Session info
  sessionId: string;
  sessionStartTime: string | null;
  // Follow-up context
  lastConversationSummary: string | null;
  needsFollowUp: boolean;
  followUpReason: string | null;
}

// Determine category based on score
const getCategory = (score: number): 'victim' | 'neutral' | 'bully' => {
  if (score <= 30) return 'victim';
  if (score >= 70) return 'bully';
  return 'neutral';
};

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  geminiHistory: [],
  userScore: {
    score: 50,              // Default neutral score
    category: 'neutral',
    lastUpdated: new Date().toISOString(),
    recentTopics: [],
    emotionalState: 'neutral',
    sessionCount: 0,
  },
  sessionId: '',
  sessionStartTime: null,
  lastConversationSummary: null,
  needsFollowUp: false,
  followUpReason: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Message management
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },

    // Gemini history for context continuity
    setGeminiHistory: (state, action: PayloadAction<GeminiHistoryMessage[]>) => {
      state.geminiHistory = action.payload;
    },
    addToGeminiHistory: (state, action: PayloadAction<GeminiHistoryMessage>) => {
      state.geminiHistory.push(action.payload);
    },
    clearGeminiHistory: (state) => {
      state.geminiHistory = [];
    },

    // User score management
    setUserScore: (state, action: PayloadAction<number>) => {
      const score = Math.max(0, Math.min(100, action.payload)); // Clamp 0-100
      state.userScore.score = score;
      state.userScore.category = getCategory(score);
      state.userScore.lastUpdated = new Date().toISOString();
    },
    updateUserScoreData: (state, action: PayloadAction<Partial<UserScoreData>>) => {
      state.userScore = { ...state.userScore, ...action.payload };
      if (action.payload.score !== undefined) {
        state.userScore.category = getCategory(action.payload.score);
      }
    },
    addRecentTopic: (state, action: PayloadAction<string>) => {
      // Keep last 5 topics for context
      state.userScore.recentTopics = [
        action.payload,
        ...state.userScore.recentTopics.slice(0, 4)
      ];
    },
    setEmotionalState: (state, action: PayloadAction<UserScoreData['emotionalState']>) => {
      state.userScore.emotionalState = action.payload;
    },

    // Session management
    startNewSession: (state) => {
      const now = new Date().toISOString();
      state.sessionId = `session_${Date.now()}`;
      state.sessionStartTime = now;
      state.userScore.sessionCount += 1;
    },
    endSession: (state, action: PayloadAction<{ summary: string; needsFollowUp: boolean; reason?: string }>) => {
      state.lastConversationSummary = action.payload.summary;
      state.needsFollowUp = action.payload.needsFollowUp;
      state.followUpReason = action.payload.reason || null;
    },

    // Follow-up management
    setFollowUp: (state, action: PayloadAction<{ needed: boolean; reason?: string }>) => {
      state.needsFollowUp = action.payload.needed;
      state.followUpReason = action.payload.reason || null;
    },
    clearFollowUp: (state) => {
      state.needsFollowUp = false;
      state.followUpReason = null;
    },

    // Full reset
    resetChat: (state) => {
      return {
        ...initialState,
        userScore: state.userScore, // Preserve user score across resets
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch active session
      .addCase(fetchActiveSession.fulfilled, (state, action) => {
        const { sessionId, messages, userScore, scoreCategory } = action.payload;
        state.sessionId = sessionId;
        state.sessionStartTime = new Date().toISOString();
        
        // Load existing messages
        if (messages && messages.length > 0) {
          state.messages = messages.map((msg: any) => ({
            id: msg.id || `msg_${Date.now()}`,
            text: msg.content,
            isBot: msg.sender === 'bot' || msg.sender === 'system',
            timestamp: msg.timestamp,
          }));
        }
        
        // Set user score data
        if (userScore !== undefined) {
          state.userScore.score = userScore;
          state.userScore.category = getCategory(userScore);
        }
      })
      // Create new session
      .addCase(createNewChatSession.fulfilled, (state, action) => {
        const { sessionId, messages } = action.payload;
        state.sessionId = sessionId;
        state.sessionStartTime = new Date().toISOString();
        state.messages = [];
        state.geminiHistory = [];
        state.userScore.sessionCount += 1;
      })
      // Send message
      .addCase(sendChatMessage.pending, (state) => {
        state.isTyping = true;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.isTyping = false;
        const { userMessage, botResponse, userScore, scoreCategory } = action.payload;
        
        // Add user message if not already added
        const userMsgExists = state.messages.some(m => m.text === action.meta.arg.content);
        if (!userMsgExists) {
          state.messages.push({
            id: userMessage.id || `user_${Date.now()}`,
            text: userMessage.content,
            isBot: false,
            timestamp: userMessage.timestamp,
          });
        }
        
        // Add bot response
        state.messages.push({
          id: botResponse.id || `bot_${Date.now()}`,
          text: botResponse.content,
          isBot: true,
          timestamp: botResponse.timestamp,
        });
        
        // Update Gemini history
        state.geminiHistory.push(
          { role: 'user', parts: [{ text: userMessage.content }] },
          { role: 'model', parts: [{ text: botResponse.content }] }
        );
        
        // Update score if provided
        if (userScore !== undefined) {
          state.userScore.score = userScore;
          state.userScore.category = getCategory(userScore);
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isTyping = false;
        // Add error message
        state.messages.push({
          id: `error_${Date.now()}`,
          text: 'Sorry, I encountered an error. Please try again.',
          isBot: true,
          timestamp: new Date().toISOString(),
        });
      })
      // Get chat score
      .addCase(fetchUserChatScore.fulfilled, (state, action) => {
        const { score } = action.payload;
        if (score !== undefined) {
          state.userScore.score = score;
          state.userScore.category = getCategory(score);
        }
        state.userScore.lastUpdated = new Date().toISOString();
      })
      // End session
      .addCase(endChatSession.fulfilled, (state) => {
        state.messages = [];
        state.geminiHistory = [];
        state.sessionId = '';
        state.sessionStartTime = null;
      });
  },
});

export const {
  setMessages,
  addMessage,
  setTyping,
  clearMessages,
  setGeminiHistory,
  addToGeminiHistory,
  clearGeminiHistory,
  setUserScore,
  updateUserScoreData,
  addRecentTopic,
  setEmotionalState,
  startNewSession,
  endSession,
  setFollowUp,
  clearFollowUp,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
