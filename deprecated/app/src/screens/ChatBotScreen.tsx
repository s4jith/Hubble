import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Send, ArrowLeft, MoreHorizontal, Copy, Bot, AlertTriangle, Heart } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  addMessage, 
  setTyping, 
  addToGeminiHistory,
  startNewSession,
  addRecentTopic,
  setEmotionalState,
  setUserScore,
  clearFollowUp,
  GeminiHistoryMessage,
} from '../store/slices/chatSlice';
import { sendMessageToGemini, ChatMessage as GeminiMessage, UserContext } from '../services/gemini';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
}

interface ChatBotScreenProps {
  navigation: any;
}

// Theme colors based on score
const getThemeColors = (score: number) => {
  if (score >= 70) {
    // HIGH SCORE - RED theme (bullying behavior detected)
    return {
      primary: '#DC2626',      // Red
      primaryLight: '#FEE2E2', // Light red bg
      accent: '#EF4444',
      botBubbleBg: '#FEF2F2',
      headerBg: '#DC2626',
      headerText: '#fff',
      statusText: 'Behavior Alert',
      icon: AlertTriangle,
    };
  } else if (score <= 30) {
    // LOW SCORE - GREEN theme (victim, needs support)
    return {
      primary: '#059669',      // Green
      primaryLight: '#D1FAE5', // Light green bg
      accent: '#10B981',
      botBubbleBg: '#ECFDF5',
      headerBg: '#059669',
      headerText: '#fff',
      statusText: 'Support Mode',
      icon: Heart,
    };
  } else {
    // MEDIUM SCORE - Default blue theme
    return {
      primary: COLORS.primary,
      primaryLight: COLORS.accent,
      accent: COLORS.secondary,
      botBubbleBg: COLORS.surface,
      headerBg: COLORS.background,
      headerText: COLORS.text,
      statusText: 'Digital Wellness',
      icon: Bot,
    };
  }
};

const ChatBotScreen: React.FC<ChatBotScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { 
    messages, 
    isTyping, 
    geminiHistory, 
    userScore: userScoreData,
    needsFollowUp,
    followUpReason,
    lastConversationSummary,
    sessionId,
  } = useAppSelector((state) => state.chat);
  
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Get the actual score from Redux
  const userScore = userScoreData.score;
  
  // Get theme colors based on score
  const theme = getThemeColors(userScore);
  const StatusIcon = theme.icon;

  // Start a new session when screen opens
  useEffect(() => {
    if (!sessionId) {
      dispatch(startNewSession());
    }
  }, []);

  // Initial welcome message with follow-up context
  useEffect(() => {
    if (messages.length === 0) {
      let welcomeMessage = '';
      
      // Check if we need to follow up from last session
      if (needsFollowUp && lastConversationSummary) {
        if (userScore >= 70) {
          welcomeMessage = `Welcome back. 🔴 Last time we talked about ${followUpReason || 'your online behavior'}. I hope you've had time to reflect. How have things been going since then?`;
        } else if (userScore <= 30) {
          welcomeMessage = `Hey, welcome back! 💚 I've been thinking about our last conversation about ${followUpReason || 'what you were going through'}. How are you feeling today? Remember, I'm always here for you.`;
        } else {
          welcomeMessage = `Hi again! 👋 Great to see you back. Last time we discussed ${followUpReason || 'digital wellness'}. How can I help you today?`;
        }
        // Clear follow-up after addressing it
        dispatch(clearFollowUp());
      } else {
        // First time or no follow-up needed
        if (userScore >= 70) {
          welcomeMessage = "Hi there. I'm Hubble. 🔴 I noticed some concerning patterns in your online activity. I'm not here to judge you - I want to help you understand how our words can affect others. Can we talk about it?";
        } else if (userScore <= 30) {
          welcomeMessage = "Hey there! 💚 I'm Hubble, and I'm here for you. Whatever you're going through, you're not alone. You're stronger than you think, and your voice matters. How are you feeling today?";
        } else {
          welcomeMessage = "Hi! 👋 I'm Hubble, your digital wellness companion. I'm here to help with anything related to online safety. What would you like to talk about?";
        }
      }
      
      dispatch(addMessage({
        id: '1',
        text: welcomeMessage,
        isBot: true,
        timestamp: new Date().toISOString(),
      }));
      
      // Add to Gemini history for context
      dispatch(addToGeminiHistory({
        role: 'model',
        parts: [{ text: welcomeMessage }]
      }));
    }
  }, []);

  // Detect emotional state and topics from user messages
  const analyzeMessage = (message: string) => {
    const lowerMsg = message.toLowerCase();
    
    // Topic detection
    const topics = ['bullying', 'scared', 'hurt', 'angry', 'sad', 'help', 'school', 'friends', 'parents', 'sorry', 'mistake'];
    topics.forEach(topic => {
      if (lowerMsg.includes(topic)) {
        dispatch(addRecentTopic(topic));
      }
    });
    
    // Emotional state detection
    if (lowerMsg.includes('scared') || lowerMsg.includes('afraid') || lowerMsg.includes('worried') || lowerMsg.includes('help')) {
      dispatch(setEmotionalState('distressed'));
    } else if (lowerMsg.includes('sorry') || lowerMsg.includes('didn\'t mean') || lowerMsg.includes('my fault')) {
      dispatch(setEmotionalState('improving'));
    } else if (lowerMsg.includes('whatever') || lowerMsg.includes('don\'t care') || lowerMsg.includes('not my problem')) {
      dispatch(setEmotionalState('defensive'));
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date().toISOString(),
    };

    dispatch(addMessage(userMessage as any));
    const messageToSend = inputText.trim();
    setInputText('');
    
    // Analyze user message for context
    analyzeMessage(messageToSend);
    
    dispatch(setTyping(true));
    
    // Add user message to Gemini history (Redux)
    dispatch(addToGeminiHistory({
      role: 'user',
      parts: [{ text: messageToSend }]
    }));

    try {
      // Build user context for personalized responses
      const userContext: UserContext = {
        emotionalState: userScoreData.emotionalState,
        recentTopics: userScoreData.recentTopics,
        sessionCount: userScoreData.sessionCount,
        isFollowUp: needsFollowUp,
      };
      
      // Use geminiHistory from Redux for full context
      const response = await sendMessageToGemini(messageToSend, geminiHistory, userScore, userContext);
      
      // Add bot response to Redux history
      dispatch(addToGeminiHistory({
        role: 'model',
        parts: [{ text: response }]
      }));
      
      dispatch(setTyping(false));
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessage(botMessage as any));
    } catch (error) {
      dispatch(setTyping(false));
      console.error('Chat error:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = (text: string) => {
    // BACKEND TODO: Implement clipboard functionality
    console.log('Copy:', text);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Color changes based on score */}
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.headerText} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <View style={styles.headerTitleRow}>
            <StatusIcon size={18} color={theme.headerText} />
            <Text style={[styles.headerText, { color: theme.headerText }]}>Hubble</Text>
          </View>
          <Text style={[styles.headerSubtext, { color: userScore >= 70 || userScore <= 30 ? 'rgba(255,255,255,0.8)' : COLORS.textSecondary }]}>
            {theme.statusText}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton}>
          <MoreHorizontal size={24} color={theme.headerText} />
        </TouchableOpacity>
      </View>

      {/* Score Indicator Banner */}
      {(userScore >= 70 || userScore <= 30) && (
        <View style={[styles.scoreBanner, { backgroundColor: theme.primaryLight }]}>
          <StatusIcon size={16} color={theme.primary} />
          <Text style={[styles.scoreBannerText, { color: theme.primary }]}>
            {userScore >= 70 
              ? "Let's work on understanding how our words affect others"
              : "You're doing great! Remember, you have the strength to speak up"}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((message) => (
            <View key={message.id} style={styles.messageGroup}>
              {message.isBot ? (
                // Bot Message
                <View style={styles.botMessageContainer}>
                  <View style={[styles.botAvatarSmall, { backgroundColor: theme.primaryLight }]}>
                    <StatusIcon size={16} color={theme.primary} />
                  </View>
                  <View style={styles.botMessageContent}>
                    <Text style={[styles.botLabel, { color: theme.primary }]}>Hubble</Text>
                    <View style={[styles.botBubble, { backgroundColor: theme.botBubbleBg }]}>
                      <Text style={styles.botMessageText}>{message.text}</Text>
                    </View>
                    <View style={styles.messageFooter}>
                      <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
                      <TouchableOpacity 
                        style={styles.copyButton}
                        onPress={() => copyToClipboard(message.text)}
                      >
                        <Copy size={14} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                // User Message
                <View style={styles.userMessageContainer}>
                  <View style={[styles.userBubble, { backgroundColor: theme.primary }]}>
                    <Text style={styles.userLabel}>You</Text>
                    <Text style={styles.userMessageText}>{message.text}</Text>
                  </View>
                  <Text style={styles.userTimestamp}>{formatTime(message.timestamp)}</Text>
                </View>
              )}
            </View>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.botMessageContainer}>
              <View style={[styles.botAvatarSmall, { backgroundColor: theme.primaryLight }]}>
                <StatusIcon size={16} color={theme.primary} />
              </View>
              <View style={[styles.typingBubble, { backgroundColor: theme.botBubbleBg }]}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.typingText}>Hubble is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions - different based on score */}
        {messages.length > 1 && (
          <View style={styles.quickActions}>
            {userScore <= 30 ? (
              // Support mode quick actions
              <>
                <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.quickActionText, { color: theme.primary }]}>Build confidence</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButtonOutline}>
                  <Text style={styles.quickActionTextOutline}>Get help</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButtonOutline}>
                  <Text style={styles.quickActionTextOutline}>Resources</Text>
                </TouchableOpacity>
              </>
            ) : userScore >= 70 ? (
              // Intervention mode quick actions
              <>
                <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.quickActionText, { color: theme.primary }]}>Learn empathy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButtonOutline}>
                  <Text style={styles.quickActionTextOutline}>Consequences</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButtonOutline}>
                  <Text style={styles.quickActionTextOutline}>Make amends</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={20} color={inputText.trim() ? COLORS.primary : COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.text,
  },
  headerSubtext: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  scoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  scoreBannerText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageGroup: {
    marginBottom: 16,
  },
  // Bot Message Styles
  botMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  botAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  botMessageContent: {
    flex: 1,
    maxWidth: '85%',
  },
  botLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  botBubble: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
  },
  botMessageText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.text,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textMuted,
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  // User Message Styles
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 14,
    maxWidth: '85%',
  },
  userLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  userMessageText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#fff',
    lineHeight: 22,
  },
  userTimestamp: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textMuted,
    marginTop: 6,
  },
  // Typing Indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  quickActionText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.primary,
  },
  quickActionButtonOutline: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionTextOutline: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textSecondary,
  },
  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.background,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.text,
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatBotScreen;
