import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';
import { Heart, X, Users, Globe, Plus, Sparkles } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPosts, setActiveTab, likePost } from '../store/slices/feedSlice';
import mockData from '../data/mockData.json';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.l * 3) / 2;

interface FeedPost {
  id: string;
  type: 'family' | 'public';
  author: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  image: string | null;
  likes: number;
  comments: number;
}

interface FeedScreenProps {
  navigation: any;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { posts, activeTab } = useAppSelector((state) => state.feed);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [localLikes, setLocalLikes] = useState<{ [key: string]: { isLiked: boolean; count: number } }>({});
  const [loading, setLoading] = useState(true);
  const [cardAnimations] = useState(() => 
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );
  const modalScale = new Animated.Value(0);

  useEffect(() => {
    // BACKEND TODO: Replace with actual API call
    // Fetch feed posts based on active tab
    // For family feed: GET /api/feed/family
    // For public feed: GET /api/feed/public
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    dispatch(setPosts(mockData.feedPosts as any));
    setLoading(false);
    
    // Animate cards in
    Animated.stagger(100, 
      cardAnimations.map(anim => 
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        })
      )
    ).start();
  };

  const handleTabChange = (tab: 'family' | 'public') => {
    dispatch(setActiveTab(tab));
    // BACKEND TODO: Fetch posts for selected tab
    // For family feed: GET /api/feed/family
    // For public feed: GET /api/feed/public
    // Include pagination parameters for infinite scroll
    
    // Reset and animate cards
    cardAnimations.forEach(anim => anim.setValue(0));
    Animated.stagger(80, 
      cardAnimations.map(anim => 
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        })
      )
    ).start();
  };

  const handleLike = (postId: string, currentLikes: number) => {
    // BACKEND TODO: POST /api/feed/:postId/like
    const current = localLikes[postId] || { isLiked: false, count: currentLikes };
    setLocalLikes({
      ...localLikes,
      [postId]: {
        isLiked: !current.isLiked,
        count: current.isLiked ? current.count - 1 : current.count + 1,
      },
    });
  };

  const openModal = (post: FeedPost) => {
    setSelectedPost(post);
    Animated.spring(modalScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedPost(null));
  };

  const getLikeData = (postId: string, originalLikes: number) => {
    return localLikes[postId] || { isLiked: false, count: originalLikes };
  };
  
  const renderMasonryColumn = (columnPosts: FeedPost[], columnIndex: number) => (
    <View style={styles.column} key={columnIndex}>
      {columnPosts.map((item, index) => {
        const cardIndex = index * 2 + columnIndex;
        const animatedStyle = {
          opacity: cardAnimations[cardIndex] || 1,
          transform: [
            {
              translateY: (cardAnimations[cardIndex] || new Animated.Value(1)).interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
            {
              scale: (cardAnimations[cardIndex] || new Animated.Value(1)).interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        };

        return (
          <Animated.View key={item.id} style={animatedStyle}>
            <TouchableOpacity
              style={[
                styles.postCard,
                { height: index % 3 === 0 ? 280 : index % 2 === 0 ? 320 : 240 }
              ]}
              onPress={() => openModal(item)}
              activeOpacity={0.95}
            >
              {item.image && (
                <Image
                  source={{ uri: item.image }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.cardGradient}
              >
                <BlurView intensity={20} tint="dark" style={styles.cardOverlay}>
                  <Text style={styles.cardTitle} numberOfLines={3}>
                    {item.content}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.authorInfo}>
                      <View style={styles.smallAvatar}>
                        <Text style={styles.smallAvatarText}>{item.author[0]}</Text>
                      </View>
                      <Text style={styles.authorName} numberOfLines={1}>
                        {item.author}
                      </Text>
                    </View>
                    <View style={styles.likePreview}>
                      <Heart size={14} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.likeCount}>{item.likes}</Text>
                    </View>
                  </View>
                </BlurView>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );

  const filteredPosts = posts.filter(p => p.type === activeTab);
  const leftColumn = filteredPosts.filter((_, index) => index % 2 === 0);
  const rightColumn = filteredPosts.filter((_, index) => index % 2 === 1);

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Sparkles size={28} color="#FFD700" />
            <Text style={styles.headerTitle}>Feed</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('CreatePost')} style={styles.addButton}>
            <Plus size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </BlurView>

      <BlurView intensity={60} tint="light" style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'family' && styles.activeTab]}
          onPress={() => handleTabChange('family')}
        >
          <Users size={18} color={activeTab === 'family' ? '#FFFFFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'family' && styles.activeTabText]}>
            Family
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'public' && styles.activeTab]}
          onPress={() => handleTabChange('public')}
        >
          <Globe size={18} color={activeTab === 'public' ? '#FFFFFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>
            Public
          </Text>
        </TouchableOpacity>
      </BlurView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading amazing content...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.masonryContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderMasonryColumn(leftColumn, 0)}
          {renderMasonryColumn(rightColumn, 1)}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal
        visible={selectedPost !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ scale: modalScale }],
              }
            ]}
          >
            <BlurView intensity={100} tint="light" style={styles.modalBlur}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <X size={24} color="#333" />
              </TouchableOpacity>

              {selectedPost && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {selectedPost.image && (
                    <Image
                      source={{ uri: selectedPost.image }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.modalBody}>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalAuthor}>
                        <LinearGradient
                          colors={['#FFD700', '#FFA500']}
                          style={styles.avatar}
                        >
                          <Text style={styles.avatarText}>{selectedPost.author[0]}</Text>
                        </LinearGradient>
                        <View>
                          <Text style={styles.modalAuthorName}>{selectedPost.author}</Text>
                          <Text style={styles.timestamp}>{selectedPost.timestamp}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.modalText}>{selectedPost.content}</Text>

                    <BlurView intensity={40} tint="light" style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.modalActionButton}
                        onPress={() => handleLike(selectedPost.id, selectedPost.likes)}
                      >
                        <Heart
                          size={32}
                          color={getLikeData(selectedPost.id, selectedPost.likes).isLiked ? '#FF4444' : '#999'}
                          fill={getLikeData(selectedPost.id, selectedPost.likes).isLiked ? '#FF4444' : 'transparent'}
                        />
                        <Text style={[
                          styles.modalActionText,
                          getLikeData(selectedPost.id, selectedPost.likes).isLiked && styles.likedText
                        ]}>
                          {getLikeData(selectedPost.id, selectedPost.likes).count} likes
                        </Text>
                      </TouchableOpacity>
                    </BlurView>
                  </View>
                </ScrollView>
              )}
            </BlurView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: SPACING.xxl + SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    gap: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.s + 2,
    paddingHorizontal: SPACING.l,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  activeTab: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    marginLeft: SPACING.s,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.m,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  scrollView: {
    flex: 1,
  },
  masonryContainer: {
    flexDirection: 'row',
    padding: SPACING.l,
    gap: SPACING.m,
  },
  column: {
    flex: 1,
    gap: SPACING.m,
  },
  postCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    padding: SPACING.m,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: SPACING.s,
    lineHeight: 22,
    fontFamily: 'Poppins-SemiBold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.s,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  smallAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
  },
  likePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  likeCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  modalBlur: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.m,
    right: SPACING.m,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalImage: {
    width: '100%',
    height: 380,
    backgroundColor: '#F0F0F0',
  },
  modalBody: {
    padding: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  modalAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  modalAuthorName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  timestamp: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  modalText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    marginBottom: SPACING.l,
    fontFamily: 'Poppins-Regular',
  },
  modalActions: {
    flexDirection: 'row',
    paddingVertical: SPACING.l,
    paddingHorizontal: SPACING.l,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalActionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  likedText: {
    color: '#FF4444',
  },
});

export default FeedScreen;
