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
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';
import { Send, Bot, User } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setMessages, addMessage, setTyping } from '../store/slices/chatSlice';
import mockData from '../data/mockData.json';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
}

interface ChatBotScreenProps {
  navigation: any;
}

const ChatBotScreen: React.FC<ChatBotScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { messages, isTyping } = useAppSelector((state) => state.chat);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // BACKEND TODO: Load chat history from API GET /api/chat/history
    if (messages.length === 0) {
      dispatch(setMessages(mockData.chatMessages as any));
    }
  }, []);

  // Animation for bot breathing effect
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Breathing animation for bot avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for background
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date().toISOString(),
    };

    dispatch(addMessage(userMessage as any));
    setInputText('');

    // BACKEND TODO: Call Gemini API to get bot response
    // Send message to backend endpoint: POST /api/chat/message
    // Request body: { message: inputText, sessionId: userId }
    // Backend will call Gemini API and return formatted response
    // Format the response to be natural and supportive
    
    dispatch(setTyping(true));
    setTimeout(() => {
      dispatch(setTyping(false));
      
      // Get random bot response from mock data
      const responses = mockData.botResponses.support;
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessage(botMessage as any));
    }, 1500);
  };

  const backgroundColorInterpolate = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E8F5E9', '#F1F8E9'],
  });

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: backgroundColorInterpolate }]}
    >
      <View style={styles.header}>
        <View style={styles.botInfo}>
          <Animated.View
            style={[
              styles.botAvatar,
              { transform: [{ scale: breatheAnim }] },
            ]}
          >
            <LinearGradient
              colors={['#4CAF50', '#8BC34A']}
              style={styles.botAvatarGradient}
            >
              <Bot size={32} color={COLORS.white} />
            </LinearGradient>
          </Animated.View>
          <View>
            <Text style={styles.botName}>Echo</Text>
            <Text style={styles.botStatus}>Your AI Assistant</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={90}
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
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                !message.isBot
                  ? styles.userMessageWrapper
                  : styles.botMessageWrapper,
              ]}
            >
              {message.isBot && (
                <View style={styles.messageAvatar}>
                  <Bot size={20} color={COLORS.success} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  !message.isBot
                    ? styles.userMessageBubble
                    : styles.botMessageBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    !message.isBot
                      ? styles.userMessageText
                      : styles.botMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
              {!message.isBot && (
                <View style={styles.messageAvatar}>
                  <User size={20} color={COLORS.yellow} />
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              style={styles.sendButtonGradient}
            >
              <Send size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: SPACING.xxl + SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  botInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    marginRight: SPACING.m,
  },
  botAvatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  botStatus: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.l,
    paddingBottom: SPACING.m,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: SPACING.m,
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.s,
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s + 4,
    borderRadius: 16,
  },
  userMessageBubble: {
    backgroundColor: COLORS.yellow,
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userMessageText: {
    color: COLORS.white,
  },
  botMessageText: {
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s + 2,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    marginRight: SPACING.s,
  },
  sendButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatBotScreen;
