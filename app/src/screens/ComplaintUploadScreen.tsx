import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';
import { Upload, Camera, FileText, AlertCircle, Send, Link, ArrowLeft } from 'lucide-react-native';

interface ComplaintUploadScreenProps {
  navigation: any;
}

const ComplaintUploadScreen: React.FC<ComplaintUploadScreenProps> = ({
  navigation,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [complaintText, setComplaintText] = useState('');
  const [complaintType, setComplaintType] = useState<'deepfake' | 'cyberbully' | 'threat' | null>(null);
  const [incidentUrl, setIncidentUrl] = useState('');

  const handleImagePick = () => {
    // BACKEND TODO: Implement image picker
    // Use expo-image-picker to select image from gallery
    // Upload image to backend endpoint: POST /api/complaints/upload-image
    // Store image URL in state
    Alert.alert('Image Picker', 'Select image from gallery');
  };

  const handleCamera = () => {
    // BACKEND TODO: Implement camera capture
    // Use expo-camera or expo-image-picker to capture photo
    // Upload captured image to backend endpoint: POST /api/complaints/upload-image
    // Store image URL in state
    Alert.alert('Camera', 'Capture photo using camera');
  };

  const handleSubmit = () => {
    if (!complaintType) {
      Alert.alert('Error', 'Please select a complaint type');
      return;
    }

    if (!complaintText.trim() && !selectedImage) {
      Alert.alert('Error', 'Please provide either a description or image');
      return;
    }

    // BACKEND TODO: Submit complaint to backend
    // POST /api/complaints/submit
    // Request body: {
    //   type: complaintType,
    //   description: complaintText,
    //   imageUrl: selectedImage,
    //   incidentUrl: incidentUrl,
    //   userId: currentUserId
    // }
    // Backend will analyze severity using ML model
    // Send to appropriate authorities based on severity
    // Create complaint report and notify user
    
    // Generate report context
    const reportContext = {
      type: complaintType,
      description: complaintText,
      url: incidentUrl || 'No URL provided',
      hasEvidence: !!selectedImage,
      submittedAt: new Date().toISOString(),
    };
    console.log('Report submitted:', reportContext);
    
    Alert.alert(
      'Complaint Submitted',
      'Your complaint has been received and will be reviewed by our team. We will take appropriate action.',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Reports'),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>File a Complaint</Text>
        <Text style={styles.subtitle}>
          Report incidents of deepfakes, cyberbullying, or online threats. We will take immediate action.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Complaint Type</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              complaintType === 'deepfake' && styles.typeButtonActive,
            ]}
            onPress={() => setComplaintType('deepfake')}
          >
            <View style={styles.typeIcon}>
              <Camera size={24} color={complaintType === 'deepfake' ? COLORS.yellow : COLORS.textSecondary} />
            </View>
            <Text style={[styles.typeText, complaintType === 'deepfake' && styles.typeTextActive]}>
              Deepfake
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              complaintType === 'cyberbully' && styles.typeButtonActive,
            ]}
            onPress={() => setComplaintType('cyberbully')}
          >
            <View style={styles.typeIcon}>
              <AlertCircle size={24} color={complaintType === 'cyberbully' ? COLORS.yellow : COLORS.textSecondary} />
            </View>
            <Text style={[styles.typeText, complaintType === 'cyberbully' && styles.typeTextActive]}>
              Cyberbullying
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              complaintType === 'threat' && styles.typeButtonActive,
            ]}
            onPress={() => setComplaintType('threat')}
          >
            <View style={styles.typeIcon}>
              <FileText size={24} color={complaintType === 'threat' ? COLORS.yellow : COLORS.textSecondary} />
            </View>
            <Text style={[styles.typeText, complaintType === 'threat' && styles.typeTextActive]}>
              Threat
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Evidence</Text>
        <View style={styles.uploadContainer}>
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
                <Upload size={32} color={COLORS.yellow} />
                <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={handleCamera}>
                <Camera size={32} color={COLORS.yellow} />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>URL / Link (Optional)</Text>
        <View style={styles.urlInputContainer}>
          <Link size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.urlInput}
            placeholder="Paste the link to the content (e.g., social media post)"
            placeholderTextColor={COLORS.textLight}
            value={incidentUrl}
            onChangeText={setIncidentUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe what happened in detail. Include any relevant information that can help us understand the situation."
          placeholderTextColor={COLORS.textLight}
          value={complaintText}
          onChangeText={setComplaintText}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient
            colors={[COLORS.red, '#FF6666']}
            style={styles.submitGradient}
          >
            <Send size={20} color={COLORS.white} />
            <Text style={styles.submitButtonText}>Submit Complaint</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <AlertCircle size={20} color={COLORS.yellow} />
          <Text style={styles.infoText}>
            Your complaint will be reviewed and appropriate action will be taken based on the severity of the incident.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xxl + SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  content: {
    padding: SPACING.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.m,
    marginTop: SPACING.m,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.m,
  },
  urlInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.s,
    paddingVertical: SPACING.s,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  typeButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  typeButtonActive: {
    borderColor: COLORS.yellow,
    backgroundColor: COLORS.yellow + '10',
  },
  typeIcon: {
    marginBottom: SPACING.s,
  },
  typeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  typeTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  uploadContainer: {
    marginBottom: SPACING.m,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.l,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginTop: SPACING.s,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: SPACING.m,
  },
  removeButton: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    backgroundColor: COLORS.red,
    borderRadius: 8,
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    fontSize: 14,
    color: COLORS.text,
    height: 150,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.l,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.l,
  },
  submitGradient: {
    flexDirection: 'row',
    paddingVertical: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.s,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.yellow + '15',
    borderRadius: 12,
    padding: SPACING.m,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.s,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default ComplaintUploadScreen;
