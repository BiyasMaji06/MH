import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  askSIA,
  submitUnansweredQuestion,
} from '../services/siaService';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'sia';
  time: string;
};

const SUGGESTED_QUESTIONS = [
  'How do I know if I am really pregnant?',
  'Why am I so tired?',
  'What can I eat when I feel nauseous?',
];

export default function SIAChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'sia',
      text:
        "Hello! I'm SIA, your MumWise pregnancy companion. 💗\n\n" +
        'You can ask me questions about pregnancy, nutrition, symptoms and wellbeing.\n\n' +
        "I'll only provide medical information from verified, approved answers. If I don't have a reliable answer, I'll let you know rather than guess.",
      time: getTime(),
    },
  ]);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [emailConsent, setEmailConsent] = useState(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, pendingQuestion]);

  function addSiaMessage(text: string) {
    const message: ChatMessage = {
      id: `${Date.now()}-sia`,
      sender: 'sia',
      text,
      time: getTime(),
    };

    setMessages(previous => [...previous, message]);
  }

  async function sendMessage(text = input) {
    const question = text.trim();

    if (!question || sending) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      sender: 'user',
      text: question,
      time: getTime(),
    };

    setMessages(previous => [...previous, userMessage]);
    setInput('');
    setPendingQuestion(null);
    setEmailConsent(false);
    setSending(true);

    try {
      const result = await askSIA(question);

      if (result.type === 'answer') {
        addSiaMessage(result.answer);
      } else if (result.type === 'urgent') {
        Alert.alert(
          'Urgent Medical Attention',
          result.message
        );
        addSiaMessage(result.message);
      } else if (result.type === 'not_found') {
        addSiaMessage(result.message);

        if (result.reason === 'no_match') {
          setPendingQuestion(question);
        }
      }
    } catch (error) {
      console.error('SIA chat error:', error);

      addSiaMessage(
        "I'm having trouble connecting to my verified information right now. Please try again later or consult your healthcare provider."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleSubmitQuestion() {
    if (!pendingQuestion || submittingQuestion) return;

    setSubmittingQuestion(true);

    try {
      await submitUnansweredQuestion(
        pendingQuestion,
        emailConsent
      );

      setPendingQuestion(null);
      setEmailConsent(false);

      addSiaMessage(
        emailConsent
          ? "Your question has been submitted successfully for review. You've consented to receive an email update when a response is available. Thank you for your patience. 💗"
          : "Your question has been submitted successfully for review. You can check back with MumWise for an update. Thank you for your patience. 💗"
      );
    } catch (error) {
      console.error('Question submission error:', error);

      Alert.alert(
        'Unable to submit',
        error instanceof Error
          ? error.message
          : 'Your question could not be submitted. Please try again.'
      );
    } finally {
      setSubmittingQuestion(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Ionicons name="heart" size={23} color="#FFFFFF" />
            </View>

            <View>
              <Text style={styles.headerTitle}>SIA</Text>
              <Text style={styles.headerSubtitle}>
                Your MumWise companion
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isUser = item.sender === 'user';

            return (
              <View
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.siaRow,
                ]}
              >
                {!isUser && (
                  <View style={styles.smallAvatar}>
                    <Ionicons name="heart" size={13} color="#FFFFFF" />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.siaBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUser
                        ? styles.userMessageText
                        : styles.siaMessageText,
                    ]}
                  >
                    {item.text}
                  </Text>

                  <Text
                    style={[
                      styles.messageTime,
                      isUser ? styles.userTime : styles.siaTime,
                    ]}
                  >
                    {item.time}
                  </Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            sending ? (
              <View style={styles.typingRow}>
                <View style={styles.smallAvatar}>
                  <Ionicons name="heart" size={13} color="#FFFFFF" />
                </View>
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>
                    SIA is checking verified answers...
                  </Text>
                </View>
              </View>
            ) : undefined
          }
        />

        {pendingQuestion && !sending && (
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewTitle}>
              Would you like to submit this question for review?
            </Text>

            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setEmailConsent(previous => !previous)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={emailConsent ? 'checkbox' : 'square-outline'}
                size={21}
                color="#B23A63"
              />
              <Text style={styles.consentText}>
                I agree to receive an email update when a response is available.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                submittingQuestion && { opacity: 0.6 },
              ]}
              onPress={handleSubmitQuestion}
              disabled={submittingQuestion}
            >
              <Text style={styles.submitButtonText}>
                {submittingQuestion ? 'Submitting...' : 'Submit for review'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setPendingQuestion(null);
                setEmailConsent(false);
              }}
              disabled={submittingQuestion}
            >
              <Text style={styles.cancelButtonText}>Not now</Text>
            </TouchableOpacity>
          </View>
        )}

        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>
              You could ask me...
            </Text>

            {SUGGESTED_QUESTIONS.map(question => (
              <TouchableOpacity
                key={question}
                style={styles.suggestion}
                onPress={() => sendMessage(question)}
                disabled={sending}
                activeOpacity={0.75}
              >
                <Text style={styles.suggestionText}>
                  {question}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#C45C83"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask SIA a question..."
              placeholderTextColor="#A49AA0"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              editable={!sending}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => sendMessage()}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || sending}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            SIA is a pregnancy information companion, not a substitute
            for professional medical advice.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF7FA',
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E7EC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#D9789B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#3D3037',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#887780',
    marginTop: 2,
  },
  messageList: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  siaRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  smallAvatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#D9789B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    marginBottom: 3,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 17,
  },
  siaBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F1E5EA',
  },
  userBubble: {
    backgroundColor: '#D9789B',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  siaMessageText: {
    color: '#493B42',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
  siaTime: {
    color: '#A99BA2',
  },
  userTime: {
    color: '#FCE8F0',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  typingText: {
    fontSize: 12,
    color: '#887780',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 13,
    color: '#78666F',
    fontWeight: '600',
    marginBottom: 9,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0DCE5',
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  suggestionText: {
    color: '#66535D',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  reviewContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 13,
    marginBottom: 10,
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F0DCE5',
  },
  reviewTitle: {
    color: '#493B42',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  consentText: {
    flex: 1,
    color: '#78666F',
    fontSize: 11,
    lineHeight: 17,
  },
  submitButton: {
    backgroundColor: '#D9789B',
    minHeight: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 9,
  },
  cancelButtonText: {
    color: '#9B7182',
    fontSize: 12,
    fontWeight: '600',
  },
  inputArea: {
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0E5EA',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F3F5',
    borderRadius: 25,
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 49,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#493B42',
    fontSize: 14,
  },
  sendButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#D9789B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D9C4CD',
  },
  disclaimer: {
    textAlign: 'center',
    color: '#A3949B',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
    paddingHorizontal: 8,
  },
});