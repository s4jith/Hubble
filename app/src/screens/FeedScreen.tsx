import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Animated,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Heart, X } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPosts, likePost, setLoading, FeedPost as FeedPostType } from '../store/slices/feedSlice';

const { width, height } = Dimensions.get('window');

// Default images for posts without images - Beautiful stock photos
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
];

// Get consistent default image based on post ID
const getDefaultImage = (postId: string): string => {
  const index = parseInt(postId, 10) % DEFAULT_IMAGES.length;
  return DEFAULT_IMAGES[index] || DEFAULT_IMAGES[0];
};

interface FeedPost {
  id: string;
  type: 'family' | 'public' | 'official';
  author: string;
  authorAvatar: string;
  timestamp: string;
  heading: string;
  content: string;
  likes: number;
  comments: number;
  image: string | null;
  isLiked?: boolean;
}

const FeedScreen = () => {
  const dispatch = useAppDispatch();
  const { posts, isLoading } = useAppSelector((state) => state.feed);
  
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  // BACKEND TODO: Replace with API call to fetch posts
  // API Endpoint: GET /api/feed/posts
  // Query params: { type: 'family' | 'public', page: number, limit: number }
  // Response: { posts: FeedPost[], hasMore: boolean, total: number }
  const fetchPosts = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      // BACKEND TODO: Replace mock data with actual API call
      // const response = await api.get('/feed/posts', { params: { type: activeTab } });
      // dispatch(setPosts(response.data.posts));
      
      // Mock delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data inline to avoid type issues
      const mockFeedPosts: FeedPost[] = [
        {
          id: '1',
          type: 'family',
          author: 'Sarah Johnson',
          authorAvatar: 'https://i.pravatar.cc/150?img=5',
          timestamp: '2 hours ago',
          heading: 'Phishing Alert for Students',
          content: 'Just learned about a new phishing scam targeting students. Stay alert and verify sender emails before clicking links.',
          likes: 45,
          comments: 12,
          image: null,
        },
        {
          id: '2',
          type: 'family',
          author: 'Michael Chen',
          authorAvatar: 'https://i.pravatar.cc/150?img=8',
          timestamp: '5 hours ago',
          heading: 'Standing Against Cyberbullying',
          content: "My daughter experienced cyberbullying last week. We reported it and the school took immediate action. Don't stay silent.",
          likes: 89,
          comments: 23,
          image: null,
        },
        {
          id: '3',
          type: 'public',
          author: 'Cyber Safety India',
          authorAvatar: 'https://i.pravatar.cc/150?img=10',
          timestamp: '1 day ago',
          heading: 'New Deepfake Detection Tools',
          content: 'New deepfake detection tools released by government. Learn how to identify manipulated content.',
          likes: 234,
          comments: 56,
          image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
        },
        {
          id: '4',
          type: 'public',
          author: 'Tech News Daily',
          authorAvatar: 'https://i.pravatar.cc/150?img=12',
          timestamp: '1 day ago',
          heading: 'Cybercrime Rates Drop 15%',
          content: 'Cybercrime rates decreased by 15% this quarter thanks to increased awareness and reporting.',
          likes: 567,
          comments: 89,
          image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
        },
        {
          id: '5',
          type: 'family',
          author: 'Priya Sharma',
          authorAvatar: 'https://i.pravatar.cc/150?img=15',
          timestamp: '2 days ago',
          heading: 'Quick Response from Authorities',
          content: 'Thank you to this community for helping me report harassment. The authorities responded within 24 hours.',
          likes: 156,
          comments: 34,
          image: null,
        },
        {
          id: '6',
          type: 'public',
          author: 'National Cyber Cell',
          authorAvatar: 'https://i.pravatar.cc/150?img=20',
          timestamp: '3 days ago',
          heading: 'Online Safety Guidelines for Parents',
          content: 'New online safety guidelines for parents released. Download the complete guide from our website.',
          likes: 890,
          comments: 123,
          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
        },
      ];
      
      dispatch(setPosts(mockFeedPosts as any));
    } catch (error) {
      // BACKEND TODO: Handle API errors
      // dispatch(setError(error.message));
      console.error('Failed to fetch posts:', error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  // BACKEND TODO: Implement like API call
  // API Endpoint: POST /api/feed/posts/:postId/like
  // Request body: { userId: string }
  // Response: { success: boolean, likes: number, isLiked: boolean }
  const handleLike = async (postId: string) => {
    // Optimistic update
    dispatch(likePost(postId));
    
    // BACKEND TODO: Make API call to like/unlike post
    // try {
    //   await api.post(`/feed/posts/${postId}/like`);
    // } catch (error) {
    //   // Revert optimistic update on error
    //   dispatch(likePost(postId));
    //   console.error('Failed to like post:', error);
    // }
    
    // Show heart animation
    setShowHeartAnimation(true);
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 50,
        friction: 3,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 3,
      }),
      Animated.delay(300),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowHeartAnimation(false));
  };

  const openReadMore = (post: FeedPost) => {
    setSelectedPost(post);
    setShowFullContent(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeReadMore = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowFullContent(false);
      setSelectedPost(null);
    });
  };

  const renderPost = ({ item }: { item: FeedPost }) => {
    const post = posts.find(p => p.id === item.id) || item;
    const imageUrl = item.image || getDefaultImage(item.id);
    
    return (
      <View style={styles.postContainer}>
        {/* Full Screen Image */}
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.fullScreenImage}
          resizeMode="cover"
        />

        {/* Bottom Content Card */}
        <View style={styles.bottomOverlay}>
          <View style={styles.blurContainer}>
            {/* Author Info */}
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.author[0]}</Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{item.author}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
            </View>

            {/* Heading */}
            <Text style={styles.heading} numberOfLines={1}>{item.heading}</Text>

            {/* Content Preview */}
            <Text style={styles.contentPreview} numberOfLines={2}>{item.content}</Text>

            {/* Read More Button */}
            <TouchableOpacity 
              style={styles.readMoreButton}
              onPress={() => openReadMore(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.readMoreText}>Read More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Like Button */}
        <View style={styles.likeContainer}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLike(item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.likeButtonBlur}>
              <Heart
                size={22}
                color={post.isLiked ? '#E53E3E' : '#fff'}
                fill={post.isLiked ? '#E53E3E' : 'transparent'}
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>
          <Text style={styles.likeCount}>{post.likes}</Text>
        </View>

        {/* Heart Animation */}
        {showHeartAnimation && (
          <Animated.View 
            style={[
              styles.heartAnimation,
              { transform: [{ scale: heartScale }] }
            ]}
          >
            <Heart size={80} color="#E53E3E" fill="#E53E3E" />
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      {/* Full Content Modal */}
      <Modal
        visible={showFullContent}
        transparent={true}
        animationType="none"
        onRequestClose={closeReadMore}
      >
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
          {/* Background Image */}
          <Image 
            source={{ uri: selectedPost?.image || getDefaultImage(selectedPost?.id || '1') }} 
            style={styles.blurredBackground}
            blurRadius={25}
          />
          
          <View style={styles.modalBlur}>
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeReadMore}
              activeOpacity={0.7}
            >
              <X size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Author Info */}
              <View style={styles.modalAuthorRow}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>{selectedPost?.author[0]}</Text>
                </View>
                <View>
                  <Text style={styles.modalAuthorName}>{selectedPost?.author}</Text>
                  <Text style={styles.modalTimestamp}>{selectedPost?.timestamp}</Text>
                </View>
              </View>

              {/* Heading */}
              <Text style={styles.modalHeading}>{selectedPost?.heading}</Text>

              {/* Full Content */}
              <Text style={styles.modalFullContent}>{selectedPost?.content}</Text>

              {/* Like Section */}
              <View style={styles.modalLikeSection}>
                <TouchableOpacity
                  style={styles.modalLikeButton}
                  onPress={() => selectedPost && handleLike(selectedPost.id)}
                  activeOpacity={0.7}
                >
                  <Heart
                    size={28}
                    color={posts.find(p => p.id === selectedPost?.id)?.isLiked ? '#E53E3E' : COLORS.primary}
                    fill={posts.find(p => p.id === selectedPost?.id)?.isLiked ? '#E53E3E' : 'transparent'}
                    strokeWidth={2}
                  />
                  <Text style={styles.modalLikeCount}>
                    {posts.find(p => p.id === selectedPost?.id)?.likes || 0} likes
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  postContainer: {
    width: width,
    height: height,
    position: 'relative',
    backgroundColor: '#000',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  blurContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Poppins_400Regular',
  },
  heading: {
    fontSize: 15,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 6,
  },
  contentPreview: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 12,
  },
  readMoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  readMoreText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Poppins_500Medium',
  },
  likeContainer: {
    position: 'absolute',
    right: 20,
    bottom: 180,
    alignItems: 'center',
  },
  likeButton: {
    marginBottom: 4,
  },
  likeButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  likeCount: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Poppins_500Medium',
  },
  heartAnimation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  blurredBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
  modalBlur: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalContent: {
    flex: 1,
    paddingTop: 40,
  },
  modalAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalAvatarText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  modalAuthorName: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalTimestamp: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins_400Regular',
  },
  modalHeading: {
    fontSize: 22,
    color: COLORS.text,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 16,
    lineHeight: 30,
  },
  modalFullContent: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 32,
  },
  modalLikeSection: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 40,
  },
  modalLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalLikeCount: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'Poppins_500Medium',
  },
});

export default FeedScreen;
