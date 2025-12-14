import { createAsyncThunk } from '@reduxjs/toolkit';
import { feedApi, FeedType } from '../../services/api';

/**
 * Feed Thunks
 * Async actions for community feed
 */

export const fetchPosts = createAsyncThunk(
  'feed/fetchPosts',
  async (
    params: { page?: number; limit?: number; type?: FeedType } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await feedApi.getPosts(params);
      return {
        posts: response.posts.map((post) => ({
          id: post.id,
          type: post.type,
          author: post.author,
          authorAvatar: post.authorAvatar,
          timestamp: post.timestamp,
          heading: post.heading,
          content: post.content,
          image: post.image,
          likes: post.likes,
          comments: post.comments,
          isLiked: post.isLiked,
          isSaved: post.isSaved,
        })),
        hasMore: response.hasMore,
        page: response.page,
        total: response.total,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch posts');
    }
  }
);

export const fetchMorePosts = createAsyncThunk(
  'feed/fetchMorePosts',
  async (
    params: { page: number; limit?: number; type?: FeedType },
    { rejectWithValue }
  ) => {
    try {
      const response = await feedApi.getPosts(params);
      return {
        posts: response.posts.map((post) => ({
          id: post.id,
          type: post.type,
          author: post.author,
          authorAvatar: post.authorAvatar,
          timestamp: post.timestamp,
          heading: post.heading,
          content: post.content,
          image: post.image,
          likes: post.likes,
          comments: post.comments,
          isLiked: post.isLiked,
          isSaved: post.isSaved,
        })),
        hasMore: response.hasMore,
        page: response.page,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch more posts');
    }
  }
);

export const createPost = createAsyncThunk(
  'feed/createPost',
  async (
    data: { type?: FeedType; heading: string; content: string; image?: string },
    { rejectWithValue }
  ) => {
    try {
      const post = await feedApi.createPost(data);
      return post;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create post');
    }
  }
);

export const togglePostLike = createAsyncThunk(
  'feed/toggleLike',
  async (postId: string, { rejectWithValue }) => {
    try {
      const result = await feedApi.toggleLike(postId);
      return { postId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to like post');
    }
  }
);

export const togglePostSave = createAsyncThunk(
  'feed/toggleSave',
  async (postId: string, { rejectWithValue }) => {
    try {
      const result = await feedApi.toggleSave(postId);
      return { postId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save post');
    }
  }
);

export const reportPost = createAsyncThunk(
  'feed/reportPost',
  async ({ postId, reason }: { postId: string; reason: string }, { rejectWithValue }) => {
    try {
      await feedApi.reportPost(postId, reason);
      return { postId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to report post');
    }
  }
);

export const fetchSavedPosts = createAsyncThunk(
  'feed/fetchSavedPosts',
  async (params: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await feedApi.getSavedPosts(params?.page, params?.limit);
      return response.posts;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch saved posts');
    }
  }
);

export const fetchComments = createAsyncThunk(
  'feed/fetchComments',
  async ({ postId, page, limit }: { postId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await feedApi.getComments(postId, page, limit);
      return { postId, comments: response.comments };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch comments');
    }
  }
);

export const addComment = createAsyncThunk(
  'feed/addComment',
  async ({ postId, content }: { postId: string; content: string }, { rejectWithValue }) => {
    try {
      const comment = await feedApi.addComment(postId, content);
      return { postId, comment };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add comment');
    }
  }
);
