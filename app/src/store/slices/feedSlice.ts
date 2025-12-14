import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchPosts, createPost, togglePostLike, togglePostSave, addComment as addCommentThunk } from '../thunks/feedThunks';

type FeedType = 'family' | 'public' | 'official';
type PostCategory = 'awareness' | 'support' | 'news' | 'tips' | 'story' | 'resource';

interface PostAuthor {
  id: string;
  name: string;
  avatar: string;
  isVerified?: boolean;
  role?: 'user' | 'expert' | 'official' | 'admin';
}

interface PostComment {
  id: string;
  author: PostAuthor;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: PostComment[];
}

interface FeedPost {
  id: string;
  type: FeedType;
  author: string;
  authorData?: PostAuthor;
  authorAvatar: string;
  timestamp: string;
  heading: string;
  content: string;
  likes: number;
  comments: number;
  shares?: number;
  image: string | null;
  images?: string[];
  video?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isSaved?: boolean;
  category?: PostCategory;
  tags?: string[];
  commentsList?: PostComment[];
  isReported?: boolean;
  reportReason?: string;
}

interface CreatePostDraft {
  type: FeedType;
  heading: string;
  content: string;
  images: string[];
  category: PostCategory | null;
  tags: string[];
}

interface FeedFilters {
  type: FeedType | 'all';
  category: PostCategory | 'all';
  sortBy: 'recent' | 'popular' | 'trending';
  searchQuery: string;
}

interface FeedState {
  posts: FeedPost[];
  trendingPosts: FeedPost[];
  savedPosts: FeedPost[];
  currentPost: FeedPost | null;
  activeTab: FeedType;
  filters: FeedFilters;
  draft: CreatePostDraft;
  isLoading: boolean;
  isRefreshing: boolean;
  isCreatingPost: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;
  successMessage: string | null;
}

const initialDraft: CreatePostDraft = {
  type: 'family',
  heading: '',
  content: '',
  images: [],
  category: null,
  tags: [],
};

const initialFilters: FeedFilters = {
  type: 'all',
  category: 'all',
  sortBy: 'recent',
  searchQuery: '',
};

const initialState: FeedState = {
  posts: [],
  trendingPosts: [],
  savedPosts: [],
  currentPost: null,
  activeTab: 'family',
  filters: initialFilters,
  draft: initialDraft,
  isLoading: false,
  isRefreshing: false,
  isCreatingPost: false,
  hasMore: true,
  page: 1,
  error: null,
  successMessage: null,
};

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    // Fetch posts
    fetchPostsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    setPosts: (state, action: PayloadAction<FeedPost[]>) => {
      state.posts = action.payload;
      state.isLoading = false;
      state.isRefreshing = false;
    },
    appendPosts: (state, action: PayloadAction<FeedPost[]>) => {
      state.posts = [...state.posts, ...action.payload];
      state.isLoading = false;
      state.page += 1;
      state.hasMore = action.payload.length > 0;
    },
    fetchPostsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isRefreshing = false;
      state.error = action.payload;
    },

    // Trending
    setTrendingPosts: (state, action: PayloadAction<FeedPost[]>) => {
      state.trendingPosts = action.payload;
    },

    // Saved posts
    setSavedPosts: (state, action: PayloadAction<FeedPost[]>) => {
      state.savedPosts = action.payload;
    },
    toggleSavePost: (state, action: PayloadAction<string>) => {
      const post = state.posts.find(p => p.id === action.payload);
      if (post) {
        post.isSaved = !post.isSaved;
        if (post.isSaved) {
          state.savedPosts.unshift(post);
        } else {
          state.savedPosts = state.savedPosts.filter(p => p.id !== action.payload);
        }
      }
    },

    // Tab navigation
    setActiveTab: (state, action: PayloadAction<FeedType>) => {
      state.activeTab = action.payload;
    },

    // Single post
    setCurrentPost: (state, action: PayloadAction<FeedPost | null>) => {
      state.currentPost = action.payload;
    },

    // Create post
    createPostStart: (state) => {
      state.isCreatingPost = true;
      state.error = null;
    },
    addPost: (state, action: PayloadAction<FeedPost>) => {
      state.posts.unshift(action.payload);
      state.isCreatingPost = false;
      state.successMessage = 'Post created successfully!';
      state.draft = initialDraft;
    },
    createPostFailure: (state, action: PayloadAction<string>) => {
      state.isCreatingPost = false;
      state.error = action.payload;
    },

    // Update post
    updatePost: (state, action: PayloadAction<FeedPost>) => {
      const index = state.posts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    },

    // Delete post
    deletePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(p => p.id !== action.payload);
      state.savedPosts = state.savedPosts.filter(p => p.id !== action.payload);
    },

    // Interactions
    likePost: (state, action: PayloadAction<string>) => {
      const post = state.posts.find(p => p.id === action.payload);
      if (post) {
        post.isLiked = !post.isLiked;
        post.likes += post.isLiked ? 1 : -1;
      }
    },
    sharePost: (state, action: PayloadAction<string>) => {
      const post = state.posts.find(p => p.id === action.payload);
      if (post) {
        post.shares = (post.shares || 0) + 1;
      }
    },
    bookmarkPost: (state, action: PayloadAction<string>) => {
      const post = state.posts.find(p => p.id === action.payload);
      if (post) {
        post.isBookmarked = !post.isBookmarked;
      }
    },

    // Comments
    addComment: (state, action: PayloadAction<{ postId: string; comment: PostComment }>) => {
      const post = state.posts.find(p => p.id === action.payload.postId);
      if (post) {
        if (!post.commentsList) {
          post.commentsList = [];
        }
        post.commentsList.unshift(action.payload.comment);
        post.comments += 1;
      }
    },
    likeComment: (state, action: PayloadAction<{ postId: string; commentId: string }>) => {
      const post = state.posts.find(p => p.id === action.payload.postId);
      if (post?.commentsList) {
        const comment = post.commentsList.find(c => c.id === action.payload.commentId);
        if (comment) {
          comment.isLiked = !comment.isLiked;
          comment.likes += comment.isLiked ? 1 : -1;
        }
      }
    },

    // Report post
    reportPost: (state, action: PayloadAction<{ postId: string; reason: string }>) => {
      const post = state.posts.find(p => p.id === action.payload.postId);
      if (post) {
        post.isReported = true;
        post.reportReason = action.payload.reason;
      }
      state.successMessage = 'Post reported successfully. We will review it shortly.';
    },

    // Draft
    updateDraft: (state, action: PayloadAction<Partial<CreatePostDraft>>) => {
      state.draft = { ...state.draft, ...action.payload };
    },
    clearDraft: (state) => {
      state.draft = initialDraft;
    },

    // Filters
    setFilters: (state, action: PayloadAction<Partial<FeedFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialFilters;
    },

    // Refresh
    refreshFeed: (state) => {
      state.isRefreshing = true;
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },

    // Loading
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Messages
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    // Reset
    resetFeed: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts thunk
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        const posts = action.payload.posts.map((post: any) => ({
          id: post.id,
          type: post.type || 'public',
          author: post.author || 'Unknown',
          authorAvatar: post.authorAvatar || '',
          timestamp: post.timestamp,
          heading: post.heading,
          content: post.content,
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: 0,
          image: post.image || null,
          images: post.image ? [post.image] : [],
          isLiked: post.isLiked || false,
          isSaved: post.isSaved || false,
        }));
        if (action.meta.arg?.page && action.meta.arg.page > 1) {
          state.posts = [...state.posts, ...posts];
        } else {
          state.posts = posts;
        }
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload as string;
      })
      // Create post thunk
      .addCase(createPost.pending, (state) => {
        state.isCreatingPost = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isCreatingPost = false;
        const post = action.payload;
        state.posts.unshift({
          id: post.id,
          type: post.type || 'public',
          author: post.author || 'You',
          authorAvatar: post.authorAvatar || '',
          timestamp: post.timestamp,
          heading: post.heading,
          content: post.content,
          likes: 0,
          comments: 0,
          shares: 0,
          image: post.image || null,
          isLiked: false,
          isSaved: false,
        });
        state.successMessage = 'Post created successfully!';
        state.draft = {
          type: 'family',
          heading: '',
          content: '',
          images: [],
          category: null,
          tags: [],
        };
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isCreatingPost = false;
        state.error = action.payload as string;
      })
      // Like post thunk
      .addCase(togglePostLike.fulfilled, (state, action) => {
        const { postId } = action.payload;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          post.isLiked = !post.isLiked;
          post.likes = post.isLiked ? post.likes + 1 : post.likes - 1;
        }
      })
      // Save post thunk
      .addCase(togglePostSave.fulfilled, (state, action) => {
        const { postId } = action.payload;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          post.isSaved = !post.isSaved;
          if (post.isSaved) {
            state.savedPosts.unshift(post);
          } else {
            state.savedPosts = state.savedPosts.filter(p => p.id !== postId);
          }
        }
      })
      // Add comment thunk
      .addCase(addCommentThunk.fulfilled, (state, action) => {
        const { postId } = action.payload;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          post.comments += 1;
        }
      });
  },
});

export const { 
  fetchPostsStart,
  setPosts, 
  appendPosts,
  fetchPostsFailure,
  setTrendingPosts,
  setSavedPosts,
  toggleSavePost,
  setActiveTab, 
  setCurrentPost,
  createPostStart,
  addPost, 
  createPostFailure,
  updatePost,
  deletePost,
  likePost,
  sharePost,
  bookmarkPost,
  addComment,
  likeComment,
  reportPost,
  updateDraft,
  clearDraft,
  setFilters,
  clearFilters,
  refreshFeed,
  setLoading,
  setError,
  setSuccessMessage,
  clearMessages,
  resetFeed,
} = feedSlice.actions;

export type { FeedPost, FeedType, PostCategory, PostAuthor, PostComment, CreatePostDraft, FeedFilters };
export default feedSlice.reducer;
