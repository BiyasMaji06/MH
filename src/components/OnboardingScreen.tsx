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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

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

function isValidDueDate(value: string) {
  const match = value.match(DATE_REGEX);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const days = Math.ceil(
    (date.getTime() - today.getTime()) / 86400000
  );

  return days > 0 && days <= 294;
}

export default function OnboardingScreen({
  onContinue,
  onBack,
}: Props) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [firstPregnancy, setFirstPregnancy] =
    useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consentToStoreData, setConsentToStoreData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};

    if (!name.trim()) {
      next.name = 'Please enter your name';
    }

    if (!dueDate.trim()) {
      next.dueDate = 'Please enter your expected due date';
    } else if (!isValidDueDate(dueDate)) {
      next.dueDate = 'Enter a valid future date within 294 days';
    }

    if (firstPregnancy === null) {
      next.firstPregnancy = 'Please select an option';
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }

    if (password.length < 8) {
      next.password = 'Use at least 8 characters';
    } else if (
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      next.password = 'Include at least one letter and one number';
    }

    if (!consentToStoreData) {
      next.consent = 'Please provide your consent to continue';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = async () => {
    if (isSubmitting) return;

    if (!validate()) {
      Alert.alert(
        'Check your details',
        'Please correct the highlighted fields before continuing.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
            due_date: dueDate.trim(),
            first_pregnancy: firstPregnancy,
            consent_to_store_data: consentToStoreData,
          },
        },
      });

      if (error) {
        Alert.alert('Registration failed', error.message);
        return;
      }

      if (!data.user) {
        Alert.alert(
          'Registration incomplete',
          'We could not create your account. Please try again.'
        );
        return;
      }

      if (!data.session) {
        Alert.alert(
          'Account created',
          'Your account was created, but no active session was returned. Check your Supabase email confirmation settings before continuing.'
        );
        return;
      }

      onContinue({
        name: name.trim(),
        dueDate: dueDate.trim(),
        firstPregnancy,
        email: cleanEmail,
        password,
        consentToStoreData,
      });
    } catch (error) {
      console.error('Registration error:', error);

      Alert.alert(
        'Something went wrong',
        'Unable to connect to MumWise. Please check your internet connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDate = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;

    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    setDueDate(formatted);
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
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
            >
              <Ionicons name="arrow-back" size={23} color="#B23A63" />
            </TouchableOpacity>

            <View style={styles.heading}>
              <View style={styles.logoCircle}>
                <Ionicons name="heart" size={30} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Let's get to know you</Text>
              <Text style={styles.subtitle}>
                This helps us personalise your care journey.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.label}>Your name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#B99AA7"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {!!errors.name && (
                <Text style={styles.error}>{errors.name}</Text>
              )}

              <Text style={styles.label}>Expected due date</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#B99AA7"
                  value={dueDate}
                  onChangeText={updateDate}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#B23A63"
                />
              </View>
              {!!errors.dueDate && (
                <Text style={styles.error}>{errors.dueDate}</Text>
              )}
              <Text style={styles.helper}>
                You can confirm or update your due date in the pregnancy questionnaire.
              </Text>

              <Text style={styles.label}>
                Is this your first pregnancy?
              </Text>
              <View style={styles.choiceRow}>
                {[
                  { label: 'Yes', value: true },
                  { label: 'No', value: false },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.choiceButton,
                      firstPregnancy === item.value &&
                        styles.choiceSelected,
                    ]}
                    onPress={() => setFirstPregnancy(item.value)}
                  >
                    <Ionicons
                      name={
                        firstPregnancy === item.value
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={19}
                      color={
                        firstPregnancy === item.value
                          ? '#FFFFFF'
                          : '#B23A63'
                      }
                    />
                    <Text
                      style={[
                        styles.choiceText,
                        firstPregnancy === item.value &&
                          styles.choiceTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!errors.firstPregnancy && (
                <Text style={styles.error}>
                  {errors.firstPregnancy}
                </Text>
              )}

              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#B99AA7"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!!errors.email && (
                <Text style={styles.error}>{errors.email}</Text>
              )}

              <Text style={styles.label}>Create password</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#B99AA7"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={
                      showPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={21}
                    color="#B23A63"
                  />
                </TouchableOpacity>
              </View>
              {!!errors.password && (
                <Text style={styles.error}>{errors.password}</Text>
              )}

              <TouchableOpacity
                style={styles.consentRow}
                activeOpacity={0.8}
                onPress={() =>
                  setConsentToStoreData(!consentToStoreData)
                }
              >
                <Ionicons
                  name={
                    consentToStoreData
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={22}
                  color="#B23A63"
                />
                <Text style={styles.consentText}>
                  I agree to the collection and storage of the information I
                  provide so MumWise can personalise my pregnancy experience.
                </Text>
              </TouchableOpacity>
              {!!errors.consent && (
                <Text style={styles.error}>{errors.consent}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  isSubmitting && { opacity: 0.6 },
                ]}
                onPress={handleContinue}
                activeOpacity={0.85}
                disabled={isSubmitting}
              >
                <Text style={styles.continueText}>
                  {isSubmitting
                    ? 'Creating Account...'
                    : 'Create Account & Continue'}
                </Text>
                {!isSubmitting && (
                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>

              <Text style={styles.bottomNote}>
                Your pregnancy journey deserves thoughtful care.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 35,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    alignItems: 'center',
    marginTop: 13,
    marginBottom: 22,
  },
  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E8558D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  title: {
    color: '#B23A63',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
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
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3D4E0',
  },
  label: {
    color: '#512D3D',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    height: 49,
    borderWidth: 1,
    borderColor: '#EFD2DE',
    borderRadius: 13,
    paddingHorizontal: 14,
    color: '#512D3D',
    backgroundColor: '#FFFBFD',
    fontSize: 13,
  },
  inputWithIcon: {
    height: 49,
    borderWidth: 1,
    borderColor: '#EFD2DE',
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBFD',
  },
  dateInput: {
    flex: 1,
    height: '100%',
    color: '#512D3D',
    fontSize: 13,
  },
  helper: {
    color: '#9A7585',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceButton: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#EFD2DE',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFBFD',
  },
  choiceSelected: {
    backgroundColor: '#E8558D',
    borderColor: '#E8558D',
  },
  choiceText: {
    color: '#B23A63',
    fontWeight: '700',
    fontSize: 13,
  },
  choiceTextSelected: { color: '#FFFFFF' },
  error: {
    color: '#C62850',
    fontSize: 11,
    marginTop: 5,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 22,
    gap: 9,
  },
  consentText: {
    flex: 1,
    color: '#8A4A63',
    fontSize: 11,
    lineHeight: 17,
  },
  continueButton: {
    height: 52,
    borderRadius: 27,
    backgroundColor: '#E8558D',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    shadowColor: '#E8558D',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomNote: {
    textAlign: 'center',
    color: '#A77C8F',
    fontSize: 10,
    marginTop: 17,
  },
});
