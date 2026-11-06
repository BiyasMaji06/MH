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
  onGoToSignUp: () => void;
  onForgotPassword: () => void;
  onSignIn: (data: {
    email: string;
    password: string;
  }) => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function SignInScreen({
  onBack,
  onGoToSignUp,
  onForgotPassword,
  onSignIn,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (value: string) => {
    const cleanEmail = value.trim();

    if (!cleanEmail) {
      return 'Please enter your email address';
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return 'Enter a valid email address';
    }

    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return 'Please enter your password';
    }

    if (value.length < 8) {
      return 'Use at least 8 characters';
    }

    if (!/[A-Za-z]/.test(value)) {
      return 'Include at least one letter';
    }

    if (!/\d/.test(value)) {
      return 'Include at least one number';
    }

    if (!PASSWORD_REGEX.test(value)) {
      return 'Enter a valid password';
    }

    return '';
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (emailError) {
      setEmailError(validateEmail(value));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (passwordError) {
      setPasswordError(validatePassword(value));
    }
  };

  const handleSignIn = () => {
    const cleanEmail = email.trim().toLowerCase();

    const emailValidation = validateEmail(cleanEmail);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    if (emailValidation || passwordValidation) {
      return;
    }

    onSignIn({
      email: cleanEmail,
      password,
    });
  };

  return (
    <LinearGradient
      colors={['#FDEDF3', '#FBE0E9', '#FFF8FB']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
            >
              <Ionicons name="arrow-back" size={23} color="#B23A63" />
            </TouchableOpacity>

            <View style={styles.heading}>
              <View style={styles.logoCircle}>
                <Ionicons name="heart" size={31} color="#FFFFFF" />
              </View>

              <Text style={styles.title}>Welcome back</Text>

              <Text style={styles.subtitle}>
                Your MumWise journey continues here.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Sign in to MumWise</Text>

              <Text style={styles.cardSubtitle}>
                Enter your account details to continue.
              </Text>

              <Text style={styles.label}>Email address</Text>

              <View
                style={[
                  styles.inputWithIcon,
                  emailError ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#B23A63"
                />

                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#B99AA7"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              <Text style={styles.label}>Password</Text>

              <View
                style={[
                  styles.inputWithIcon,
                  passwordError ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#B23A63"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#B99AA7"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#B23A63"
                  />
                </TouchableOpacity>
              </View>

              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={onForgotPassword}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleSignIn}
                activeOpacity={0.85}
              >
                <Text style={styles.signInText}>Sign In</Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.signupRow}>
                <Text style={styles.signupPrompt}>
                  New to MumWise?
                </Text>

                <TouchableOpacity onPress={onGoToSignUp}>
                  <Text style={styles.signupLink}> Create an account</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.footerText}>
              Made with love for you and your little one.
            </Text>
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

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 30,
    justifyContent: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  heading: {
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 25,
  },

  logoCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#E8558D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#B23A63',
  },

  subtitle: {
    color: '#8A4A63',
    fontSize: 12,
    marginTop: 7,
    textAlign: 'center',
  },

  formCard: {
    backgroundColor: '#FFFFFFE8',
    borderRadius: 24,
    padding: 21,
    borderWidth: 1,
    borderColor: '#F3D4E0',
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#512D3D',
  },

  cardSubtitle: {
    color: '#9A7585',
    fontSize: 11,
    marginTop: 5,
    marginBottom: 13,
  },

  label: {
    color: '#512D3D',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 17,
    marginBottom: 8,
  },

  inputWithIcon: {
    height: 51,
    borderWidth: 1,
    borderColor: '#EFD2DE',
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBFD',
  },

  inputError: {
    borderColor: '#C43D55',
  },

  input: {
    flex: 1,
    height: '100%',
    color: '#512D3D',
    fontSize: 13,
  },

  errorText: {
    color: '#C43D55',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },

  forgotText: {
    color: '#B23A63',
    fontSize: 12,
    fontWeight: '700',
  },

  signInButton: {
    height: 52,
    borderRadius: 27,
    backgroundColor: '#E8558D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 23,
    shadowColor: '#E8558D',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  signInText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 25,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0D9E2',
  },

  orText: {
    color: '#B99AA7',
    fontSize: 10,
    fontWeight: '700',
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 23,
  },

  signupPrompt: {
    color: '#8A4A63',
    fontSize: 12,
  },

  signupLink: {
    color: '#B23A63',
    fontSize: 12,
    fontWeight: '800',
  },

  footerText: {
    color: '#A77C8F',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 25,
  },
});