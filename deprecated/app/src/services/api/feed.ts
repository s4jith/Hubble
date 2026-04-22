import { apiClient } from './client';

/**
 * Feed Types
 */
export type FeedType = 'family' | 'public' | 'official';

export interface FeedPost {
  id: string;
  type: FeedType;
  author: string;
  authorAvatar: string;
  timestamp: string;
  heading: string;
  content: string;
  image: string | null;
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface PostsResponse {
  posts: FeedPost[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Feed API Service
 */
export const feedApi = {
  /**
   * Get posts
   */
  async getPosts(params?: {
    page?: number;
    limit?: number;
    type?: FeedType;
    authorId?: string;
  }): Promise<PostsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.type) query.append('type', params.type);
    if (params?.authorId) query.append('authorId', params.authorId);

    return apiClient.get<PostsResponse>(`/feed/posts?${query.toString()}`);
  },

  /**
   * Get single post
   */
  async getPost(postId: string): Promise<FeedPost> {
    return apiClient.get<FeedPost>(`/feed/posts/${postId}`);
  },

  /**
   * Create post
   */
  async createPost(data: {
    type?: FeedType;
    heading: string;
    content: string;
    image?: string;
    visibleTo?: string[];
  }): Promise<FeedPost> {
    return apiClient.post<FeedPost>('/feed/posts', data);
  },

  /**
   * Update post
   */
  async updatePost(
    postId: string,
    data: { heading?: string; content?: string; image?: string }
  ): Promise<FeedPost> {
    return apiClient.put<FeedPost>(`/feed/posts/${postId}`, data);
  },

  /**
   * Delete post
   */
  async deletePost(postId: string): Promise<void> {
    return apiClient.delete(`/feed/posts/${postId}`);
  },

  /**
   * Like/unlike post
   */
  async toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
    return apiClient.post<{ liked: boolean; likeCount: number }>(`/feed/posts/${postId}/like`);
  },

  /**
   * Save/unsave post
   */
  async toggleSave(postId: string): Promise<{ saved: boolean }> {
    return apiClient.post<{ saved: boolean }>(`/feed/posts/${postId}/save`);
  },

  /**
   * Report post
   */
  async reportPost(postId: string, reason: string): Promise<{ reported: boolean }> {
    return apiClient.post<{ reported: boolean }>(`/feed/posts/${postId}/report`, { reason });
  },

  /**
   * Get saved posts
   */
  async getSavedPosts(page?: number, limit?: number): Promise<PostsResponse> {
    const query = new URLSearchParams();
    if (page) query.append('page', page.toString());
    if (limit) query.append('limit', limit.toString());

    return apiClient.get<PostsResponse>(`/feed/saved?${query.toString()}`);
  },

  /**
   * Get comments for a post
   */
  async getComments(postId: string, page?: number, limit?: number): Promise<CommentsResponse> {
    const query = new URLSearchParams();
    if (page) query.append('page', page.toString());
    if (limit) query.append('limit', limit.toString());

    return apiClient.get<CommentsResponse>(`/feed/posts/${postId}/comments?${query.toString()}`);
  },

  /**
   * Add comment to post
   */
  async addComment(postId: string, content: string): Promise<Comment> {
    return apiClient.post<Comment>(`/feed/posts/${postId}/comments`, { content });
  },

  /**
   * Delete comment
   */
  async deleteComment(commentId: string): Promise<void> {
    return apiClient.delete(`/feed/comments/${commentId}`);
  },
};
