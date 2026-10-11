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
  onSignIn: (data: { email: string; password: string }) => void;
  onBack: () => void;
  onGoToSignUp: () => void;
  onForgotPassword: () => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignInScreen({
  onSignIn,
  onBack,
  onGoToSignUp,
  onForgotPassword,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const emailError =
    email.trim().length === 0
      ? 'Email is required'
      : !EMAIL_REGEX.test(email.trim())
      ? 'Enter a valid email address'
      : '';

  const passwordError =
    password.length === 0
      ? 'Password is required'
      : password.length < MIN_PASSWORD_LENGTH
      ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      : !/[A-Za-z]/.test(password) || !/\d/.test(password)
      ? 'Include at least one letter and one number'
      : '';

  const canSubmit = !emailError && !passwordError;

  const showEmailError =
    (touched.email || submitAttempted) && !!emailError;

  const showPasswordError =
    (touched.password || submitAttempted) && !!passwordError;

  const handleSignIn = () => {
    setSubmitAttempted(true);

    if (!canSubmit) return;

    onSignIn({
      email: email.trim(),
      password,
    });
  };

  return (
    <LinearGradient
      colors={['#FDEDF3', '#FBE0E9', '#F9D5E5']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color="#B23A63"
            />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="heart"
                size={36}
                color="#E8558D"
              />
            </View>

            <Text style={styles.title}>Welcome Back</Text>

            <Text style={styles.subtitle}>
              Sign in to continue your journey
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
                onBlur={() =>
                  setTouched((t) => ({
                    ...t,
                    email: true,
                  }))
                }
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />

              {showEmailError && (
                <Text style={styles.errorText}>
                  {emailError}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>

              <View
                style={[
                  styles.passwordRow,
                  showPasswordError && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#C98FA8"
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() =>
                    setTouched((t) => ({
                      ...t,
                      password: true,
                    }))
                  }
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowPassword(!showPassword)
                  }
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={20}
                    color="#B23A63"
                  />
                </TouchableOpacity>
              </View>

              {showPasswordError && (
                <Text style={styles.errorText}>
                  {passwordError}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={onForgotPassword}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.signInBtn,
                !canSubmit && styles.signInBtnDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleSignIn}
            >
              <Text style={styles.signInText}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onGoToSignUp}
              style={styles.signUpRow}
            >
              <Text style={styles.signUpText}>
                Don't have an account?{' '}
                <Text style={styles.signUpLink}>
                  Sign Up
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

  keyboardContainer: {
    flex: 1,
  },

  backBtn: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 60,
    flexGrow: 1,
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

  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFFAA',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3C3D4',
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#5A2A3D',
  },

  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 8,
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },

  forgotText: {
    color: '#B23A63',
    fontSize: 13,
    fontWeight: '600',
  },

  signInBtn: {
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

  signInBtnDisabled: {
    backgroundColor: '#F0AFC7',
    shadowOpacity: 0,
  },

  signInText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },

  signUpRow: {
    marginTop: 20,
    alignItems: 'center',
  },

  signUpText: {
    color: '#8A4A63',
    fontSize: 13,
  },

  signUpLink: {
    color: '#E8558D',
    fontWeight: '700',
  },
});