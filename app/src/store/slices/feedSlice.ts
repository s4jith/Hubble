import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FeedPost {
  id: string;
  type: 'family' | 'public';
  author: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  likes: number;
  comments: number;
  image: string | null;
}

interface FeedState {
  posts: FeedPost[];
  activeTab: 'family' | 'public';
  isLoading: boolean;
}

const initialState: FeedState = {
  posts: [],
  activeTab: 'family',
  isLoading: false,
};

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setPosts: (state, action: PayloadAction<FeedPost[]>) => {
      state.posts = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<'family' | 'public'>) => {
      state.activeTab = action.payload;
    },
    addPost: (state, action: PayloadAction<FeedPost>) => {
      state.posts.unshift(action.payload);
    },
    likePost: (state, action: PayloadAction<string>) => {
      const post = state.posts.find(p => p.id === action.payload);
      if (post) {
        post.likes += 1;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setPosts, setActiveTab, addPost, likePost, setLoading } = feedSlice.actions;
export default feedSlice.reducer;
