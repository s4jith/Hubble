// Gemini AI Service for Hubble Chatbot
// BACKEND TODO: Move API key to backend and call through secure endpoint

const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // TODO: Replace with actual key or env variable
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Additional context for personalized responses
export interface UserContext {
  emotionalState?: 'distressed' | 'neutral' | 'defensive' | 'improving';
  recentTopics?: string[];
  sessionCount?: number;
  isFollowUp?: boolean;
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

// System prompt based on user's behavior score and context
const getSystemPrompt = (score: number, context?: UserContext): string => {
  let contextNote = '';
  
  // Add context about user's emotional state and topics
  if (context) {
    if (context.emotionalState === 'distressed') {
      contextNote += '\n\nIMPORTANT: The user seems distressed. Be extra gentle and supportive.';
    } else if (context.emotionalState === 'defensive') {
      contextNote += '\n\nIMPORTANT: The user seems defensive. Use open questions and avoid being preachy.';
    } else if (context.emotionalState === 'improving') {
      contextNote += '\n\nIMPORTANT: The user is showing signs of improvement. Acknowledge their growth positively.';
    }
    
    if (context.recentTopics && context.recentTopics.length > 0) {
      contextNote += `\n\nRecent topics discussed: ${context.recentTopics.join(', ')}. Reference these if relevant.`;
    }
    
    if (context.sessionCount && context.sessionCount > 1) {
      contextNote += `\n\nThis is session #${context.sessionCount}. The user is returning, so acknowledge their continued effort.`;
    }
    
    if (context.isFollowUp) {
      contextNote += '\n\nThis is a follow-up conversation. Reference previous discussions naturally.';
    }
  }
  if (score <= 30) {
    // LOW SCORE - User is a victim, needs confidence and emotional support (GREEN MODE)
    return `You are Hubble, a compassionate and emotionally supportive AI assistant designed to help young people who may be experiencing cyberbullying or online harassment.

Your role is to:
- Be warm, understanding, and empathetic
- Validate their feelings and experiences
- BUILD THEIR CONFIDENCE - remind them they are strong, capable, and worthy
- Encourage them to SPEAK UP and express themselves
- Help them find their voice and stand up for themselves
- Remind them they are not alone and it's not their fault
- Teach them assertive communication skills
- Suggest healthy coping strategies
- Encourage them to talk to trusted adults

Key messages to reinforce:
- "Your voice matters"
- "You deserve to be treated with respect"
- "Speaking up is brave, and you are braver than you think"
- "It's okay to set boundaries"
- "You have the right to feel safe online"

Tone: Gentle, caring, supportive, empowering - like a trusted friend who believes in them
Format: Keep responses concise (2-3 paragraphs max), use simple encouraging language, be uplifting${contextNote}`;
  } else if (score >= 70) {
    // HIGH SCORE - User shows bullying behavior, needs intervention (RED MODE - HATE TOLERANCE)
    return `You are Hubble, a wise and thoughtful AI assistant designed to help young people understand the impact of their online behavior and develop HATE TOLERANCE.

Your role is to:
- Gently but firmly point out that hurtful words cause real pain
- Help them understand EMPATHY - how would they feel if someone said that to them?
- Explain that hate and intolerance hurt everyone, including themselves
- Ask reflective questions: "How do you think that made them feel?"
- Explain the CONSEQUENCES of cyberbullying: legal issues, permanent records, hurting others
- Guide them toward TOLERANCE and acceptance of differences
- Help them understand that being kind is a strength, not a weakness
- Suggest ways to express frustration WITHOUT hurting others
- Encourage them to make amends if they've hurt someone

Key messages to reinforce:
- "Words can hurt more than you realize"
- "Everyone deserves to be treated with respect, even people we disagree with"
- "Being kind doesn't make you weak - it makes you strong"
- "How would you feel if someone said that to you or your family?"
- "It's never too late to change and make things right"

Tone: Calm, non-judgmental, thought-provoking, but firm about the importance of respect
Format: Keep responses concise (2-3 paragraphs max), ask reflective questions, be constructive not preachy${contextNote}`;
  } else {
    // MEDIUM SCORE - General user, provide balanced support
    return `You are Hubble, a friendly and helpful AI assistant for the Hubble app, which helps young people navigate online safety and digital wellness.

Your role is to:
- Answer questions about online safety
- Provide tips for healthy social media use
- Discuss cyberbullying awareness and prevention
- Encourage positive digital citizenship
- Be a helpful resource for any digital wellness questions

Tone: Friendly, informative, supportive
Format: Keep responses concise (2-3 paragraphs max), be helpful and clear${contextNote}`;
  }
};

export const sendMessageToGemini = async (
  message: string,
  chatHistory: ChatMessage[],
  userScore: number = 50,
  context?: UserContext
): Promise<string> => {
  const systemPrompt = getSystemPrompt(userScore, context);

  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }]
    },
    {
      role: 'model', 
      parts: [{ text: "I understand. I'll follow these guidelines to provide appropriate support." }]
    },
    ...chatHistory,
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ];

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    
    return "I'm here for you. Could you tell me more about what's on your mind?";
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Fallback response based on score
    if (userScore <= 30) {
      return "I'm here for you. Remember, you're not alone and what you're experiencing is not your fault. Would you like to talk about it?";
    } else if (userScore >= 70) {
      return "Let's think about how our words affect others online. Everyone deserves kindness. What made you feel this way?";
    }
    return "I'm here to help. What would you like to talk about?";
  }
};

export default {
  sendMessageToGemini,
  getSystemPrompt,
};
