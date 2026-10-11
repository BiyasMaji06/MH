import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onBack: () => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const emailError =
    email.trim().length === 0
      ? 'Email is required'
      : !EMAIL_REGEX.test(email.trim())
      ? 'Enter a valid email address'
      : '';

  const canSubmit = !emailError;

  const handleReset = () => {
    setSubmitAttempted(true);
    if (!canSubmit) return;
    console.log('Reset password for:', email.trim());
  };

  const showEmailError = submitAttempted && !!emailError;

  return (
    <LinearGradient
      colors={['#FDEDF3', '#FBE0E9', '#F9D5E5']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons
              name="chevron-back"
              size={26}
              color="#B23A63"
            />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="lock-closed"
                size={34}
                color="#E8558D"
              />
            </View>

            <Text style={styles.title}>Forgot Password?</Text>

            <Text style={styles.subtitle}>
              No worries! Enter your email address and we'll help you
              reset your password.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>

              <TextInput
                style={[
                  styles.input,
                  showEmailError && styles.inputError,
                ]}
                placeholder="you@example.com"
                placeholderTextColor="#C98FA8"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setSubmitAttempted(true)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />

              {showEmailError && (
                <Text style={styles.errorText}>
                  {emailError}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.resetBtn,
                !canSubmit && styles.resetBtnDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleReset}
            >
              <Text style={styles.resetText}>
                Send Reset Link
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onBack}
              style={styles.signInRow}
            >
              <Text style={styles.signInText}>
                Remember your password?{' '}
                <Text style={styles.signInLink}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  backBtn: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#B23A63',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#8A4A63',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 30,
    lineHeight: 21,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    color: '#8A4A63',
    marginBottom: 8,
    fontWeight: '600',
  },

  input: {
    backgroundColor: '#FFFFFFAA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#5A2A3D',
    borderWidth: 1,
    borderColor: '#F3C3D4',
  },

  inputError: {
    borderColor: '#E8558D',
    borderWidth: 1.5,
  },

  errorText: {
    color: '#D6336C',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },

  resetBtn: {
    backgroundColor: '#E8558D',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#E8558D',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },

  resetBtnDisabled: {
    backgroundColor: '#F0AFC7',
    shadowOpacity: 0,
  },

  resetText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },

  signInRow: {
    marginTop: 20,
    alignItems: 'center',
  },

  signInText: {
    color: '#8A4A63',
    fontSize: 13,
  },

  signInLink: {
    color: '#E8558D',
    fontWeight: '700',
  },
});