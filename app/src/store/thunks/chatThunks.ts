import { createAsyncThunk } from '@reduxjs/toolkit';
import { chatApi } from '../../services/api';

/**
 * Chat Thunks
 * Async actions for AI chatbot
 */

export const fetchActiveSession = createAsyncThunk(
  'chat/fetchActiveSession',
  async (_, { rejectWithValue }) => {
    try {
      const session = await chatApi.getActiveSession();
      return {
        sessionId: session.id,
        messages: session.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp,
        })),
        userScore: session.userScore,
        scoreCategory: session.scoreCategory,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch chat session');
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ sessionId, content }: { sessionId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await chatApi.sendMessage(sessionId, content);
      return {
        userMessage: {
          id: response.userMessage.id,
          content: response.userMessage.content,
          sender: response.userMessage.sender,
          timestamp: response.userMessage.timestamp,
        },
        botResponse: {
          id: response.botResponse.id,
          content: response.botResponse.content,
          sender: response.botResponse.sender,
          timestamp: response.botResponse.timestamp,
        },
        userScore: response.session.userScore,
        scoreCategory: response.session.scoreCategory,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const fetchUserChatScore = createAsyncThunk(
  'chat/fetchUserScore',
  async (_, { rejectWithValue }) => {
    try {
      const score = await chatApi.getUserScore();
      return score;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch score');
    }
  }
);

export const createNewChatSession = createAsyncThunk(
  'chat/createSession',
  async (title: string | undefined, { rejectWithValue }) => {
    try {
      const session = await chatApi.createSession(title);
      return {
        sessionId: session.id,
        messages: session.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp,
        })),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create session');
    }
  }
);

export const endChatSession = createAsyncThunk(
  'chat/endSession',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      await chatApi.endSession(sessionId);
      return { sessionId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to end session');
    }
  }
);

export const clearChatHistory = createAsyncThunk(
  'chat/clearHistory',
  async (_, { rejectWithValue }) => {
    try {
      await chatApi.clearHistory();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear history');
    }
  }
);
