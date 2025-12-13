import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';
import { X, Users, Globe, Sparkles } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addPost } from '../store/slices/feedSlice';

interface CreatePostScreenProps {
  navigation: any;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [postType, setPostType] = useState<'family' | 'public'>('family');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    const newPost = {
      id: Date.now().toString(),
      type: postType,
      author: user?.name || 'Anonymous',
      authorAvatar: '',
      timestamp: 'Just now',
      content: content.trim(),
      image: null,
      likes: 0,
      comments: 0,
    };

    // BACKEND TODO: POST /api/feed/posts
    // Send post data to backend API
    dispatch(addPost(newPost));
    
    Alert.alert('Success', 'Post created successfully!', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Sparkles size={24} color="#FFD700" />
            <Text style={styles.headerTitle}>Create Post</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <X size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <BlurView intensity={40} tint="light" style={styles.typeSelector}>
          <Text style={styles.label}>Post Type</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, postType === 'family' && styles.activeTypeButton]}
              onPress={() => setPostType('family')}
            >
              <Users size={20} color={postType === 'family' ? '#FFFFFF' : '#666'} />
              <Text style={[styles.typeText, postType === 'family' && styles.activeTypeText]}>
                Family Only
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, postType === 'public' && styles.activeTypeButton]}
              onPress={() => setPostType('public')}
            >
              <Globe size={20} color={postType === 'public' ? '#FFFFFF' : '#666'} />
              <Text style={[styles.typeText, postType === 'public' && styles.activeTypeText]}>
                Public
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        <BlurView intensity={40} tint="light" style={styles.inputContainer}>
          <Text style={styles.label}>What's on your mind?</Text>
          <TextInput
            style={styles.input}
            placeholder="Share your thoughts..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={8}
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />
        </BlurView>

        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.9}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.submitButton}
          >
            <Sparkles size={20} color="#FFFFFF" />
            <Text style={styles.submitText}>Publish Post</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Poppins-Bold',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    padding: SPACING.l,
  },
  typeSelector: {
    borderRadius: 20,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.m,
    fontFamily: 'Poppins-SemiBold',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    gap: SPACING.s,
  },
  activeTypeButton: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins-SemiBold',
  },
  activeTypeText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    borderRadius: 20,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  input: {
    fontSize: 15,
    color: '#333',
    minHeight: 200,
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.l,
    borderRadius: 20,
    gap: SPACING.s,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  submitText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
});

export default CreatePostScreen;
