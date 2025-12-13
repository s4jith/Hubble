// Update FeedScreen.tsx
// Replace setActiveTab with handleTabChange
// Filter posts by type

// Update ChatBotScreen.tsx  
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setMessages, addMessage, setTyping } from '../store/slices/chatSlice';
import mockData from '../data/mockData.json';

// In useEffect load initial messages
dispatch(setMessages(mockData.chatMessages as any));

// In handleSend
dispatch(addMessage({ id: String(Date.now()), text: message, isBot: false, timestamp: new Date().toISOString() }));
dispatch(setTyping(true));
// BACKEND TODO: Call POST /api/chat/message with Gemini API
// Simulate bot response from mockData.botResponses
const botResponse = mockData.botResponses.support[Math.floor(Math.random() * mockData.botResponses.support.length)];
dispatch(addMessage({ id: String(Date.now() + 1), text: botResponse, isBot: true, timestamp: new Date().toISOString() }));
dispatch(setTyping(false));

// Update ComplaintUploadScreen.tsx
import { useAppDispatch } from '../store/hooks';
import { addComplaint } from '../store/slices/complaintSlice';

// In handleSubmit
const newComplaint = {
  id: String(Date.now()),
  type: complaintType,
  title: description.substring(0, 50),
  description,
  status: 'pending' as const,
  submittedDate: new Date().toISOString().split('T')[0],
  authority: 'Under Assignment',
  severity: 'medium' as const,
  imageUrl: null,
};
dispatch(addComplaint(newComplaint));
// BACKEND TODO: POST /api/complaints/submit

// Update ReportsLogScreen.tsx
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setComplaints, setActiveFilter } from '../store/slices/complaintSlice';
import mockData from '../data/mockData.json';

// In useEffect
dispatch(setComplaints(mockData.complaints as any));

// Use Redux state
const { complaints, activeFilter } = useAppSelector((state) => state.complaint);
const filteredReports = activeFilter === 'all' ? complaints : complaints.filter(c => c.status === activeFilter);

// In tab press
dispatch(setActiveFilter(status));

// Update SettingsScreenNew.tsx
import { useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

// In handleLogout onPress
dispatch(logout());
