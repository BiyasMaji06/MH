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
  onContinue: (data: {
    name: string;
    dueDate: string;
    firstPregnancy: boolean | null;
    email: string;
    password: string;
    consentToStoreData: boolean;
  }) => void;
  onBack: () => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MAX_DUE_DATE_DAYS_OUT = 294;

function getEmailError(email: string): string | null {
  if (email.length === 0) return null;
  return EMAIL_REGEX.test(email) ? null : 'Enter a valid email address';
}

function getPasswordError(password: string): string | null {
  if (password.length === 0) return null;

  if (password.length < 8) {
    return 'Use at least 8 characters';
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Include at least one letter and one number';
  }

  return null;
}

function getDueDateError(dueDate: string): string | null {
  if (dueDate.length === 0) return null;

  const match = dueDate.match(DATE_REGEX);

  if (!match) {
    return 'Use DD/MM/YYYY format';
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  const parsed = new Date(year, month - 1, day);

  const isRealCalendarDate =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  if (!isRealCalendarDate) {
    return 'Enter a valid date';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  if (parsed < today) {
    return 'Due date cannot be in the past';
  }

  const maxDueDate = new Date(today);
  maxDueDate.setDate(maxDueDate.getDate() + MAX_DUE_DATE_DAYS_OUT);

  if (parsed > maxDueDate) {
    return 'That date seems too far out — check the year';
  }

  return null;
}

function isValidDueDate(dueDate: string): boolean {
  return dueDate.trim().length > 0 && getDueDateError(dueDate) === null;
}

function formatDueDate(text: string): string {
  const numbers = text.replace(/\D/g, '').slice(0, 8);

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  }

  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
}

export default function OnboardingScreen({
  onContinue,
  onBack,
}: Props) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [firstPregnancy, setFirstPregnancy] = useState<boolean | null>(
    null
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consentToStoreData, setConsentToStoreData] = useState(false);

  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
    dueDate?: boolean;
  }>({});

  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);
  const dueDateError = getDueDateError(dueDate);

  const canContinue =
    name.trim().length > 0 &&
    isValidDueDate(dueDate) &&
    firstPregnancy !== null &&
    EMAIL_REGEX.test(email) &&
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password);

  const handleContinue = () => {
    if (!canContinue) return;

    onContinue({
      name,
      dueDate,
      firstPregnancy,
      email,
      password,
      consentToStoreData,
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
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
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
            <Text style={styles.title}>Let's get to know you</Text>

            <Text style={styles.subtitle}>
              This helps us personalize your care plan
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Your Name</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor="#C98FA8"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Expected Due Date</Text>

              <TextInput
                style={[
                  styles.input,
                  touched.dueDate &&
                    dueDateError &&
                    styles.inputError,
                ]}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#C98FA8"
                value={dueDate}
                onChangeText={(text) => {
                  setDueDate(formatDueDate(text));
                }}
                onBlur={() =>
                  setTouched((t) => ({
                    ...t,
                    dueDate: true,
                  }))
                }
                keyboardType="number-pad"
                maxLength={10}
                returnKeyType="next"
              />

              {touched.dueDate && dueDateError && (
                <Text style={styles.errorText}>
                  {dueDateError}
                </Text>
              )}

              {!touched.dueDate && dueDate.length === 0 && (
                <Text style={styles.hintText}>
                  Format: DD/MM/YYYY
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Is this your first pregnancy?
              </Text>

              <View style={styles.choiceRow}>
                <TouchableOpacity
                  style={[
                    styles.choiceBtn,
                    firstPregnancy === true &&
                      styles.choiceBtnActive,
                  ]}
                  onPress={() => setFirstPregnancy(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      firstPregnancy === true &&
                        styles.choiceTextActive,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.choiceBtn,
                    firstPregnancy === false &&
                      styles.choiceBtnActive,
                  ]}
                  onPress={() => setFirstPregnancy(false)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      firstPregnancy === false &&
                        styles.choiceTextActive,
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>
              Create your account
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>

              <TextInput
                style={[
                  styles.input,
                  touched.email &&
                    emailError &&
                    styles.inputError,
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

              {touched.email && emailError && (
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
                  touched.password &&
                    passwordError &&
                    styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password"
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

              {touched.password && passwordError && (
                <Text style={styles.errorText}>
                  {passwordError}
                </Text>
              )}

              {!touched.password &&
                !passwordError &&
                password.length === 0 && (
                  <Text style={styles.hintText}>
                    At least 8 characters, with a letter and a
                    number
                  </Text>
                )}
            </View>

            <View style={styles.consentContainer}>
              <TouchableOpacity
                style={styles.checkboxButton}
                onPress={() =>
                  setConsentToStoreData(!consentToStoreData)
                }
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: consentToStoreData,
                }}
              >
                <Ionicons
                  name={
                    consentToStoreData
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={24}
                  color={
                    consentToStoreData
                      ? '#E8558D'
                      : '#B23A63'
                  }
                />
              </TouchableOpacity>

              <Text style={styles.consentText}>
                I consent to the storage of my personal data
                to provide and personalize my experience in
                the app.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.continueBtn,
                !canContinue &&
                  styles.continueBtnDisabled,
              ]}
              disabled={!canContinue}
              activeOpacity={0.85}
              onPress={handleContinue}
            >
              <Text style={styles.continueText}>
                Create Account & Continue
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
    paddingTop: 20,
    paddingBottom: 60,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#B23A63',
  },

  subtitle: {
    fontSize: 14,
    color: '#8A4A63',
    marginTop: 6,
    marginBottom: 30,
  },

  field: {
    marginBottom: 22,
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
    borderColor: '#E0546B',
    borderWidth: 1.5,
  },

  errorText: {
    color: '#C23A52',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },

  hintText: {
    color: '#A9607A',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },

  choiceRow: {
    flexDirection: 'row',
    gap: 12,
  },

  choiceBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFFAA',
    borderWidth: 1,
    borderColor: '#F3C3D4',
  },

  choiceBtnActive: {
    backgroundColor: '#E8558D',
    borderColor: '#E8558D',
  },

  choiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A4A63',
  },

  choiceTextActive: {
    color: '#fff',
  },

  divider: {
    height: 1,
    backgroundColor: '#F0BCD0',
    marginVertical: 10,
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B23A63',
    marginBottom: 18,
    marginTop: 4,
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

  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: -2,
    marginBottom: 24,
    paddingHorizontal: 2,
  },

  checkboxButton: {
    marginRight: 10,
    paddingTop: 1,
  },

  consentText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#8A4A63',
  },

  continueBtn: {
    backgroundColor: '#E8558D',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#E8558D',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },

  continueBtnDisabled: {
    backgroundColor: '#F0AFC7',
    shadowOpacity: 0,
  },

  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});