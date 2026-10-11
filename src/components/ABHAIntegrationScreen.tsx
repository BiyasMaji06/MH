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

type Props = {
  onBack?: () => void;
  onSkip?: () => void;
};

type Step =
  | 'landing'
  | 'create'
  | 'abha'
  | 'otp'
  | 'confirm'
  | 'linked';

type Profile = {
  abhaId: string;
  name: string;
  yearOfBirth: number;
  gender: string;
  state: string;
  district: string;
};

const API_URL = 'http://192.168.31.190:3000/api/abha';

export default function ABHAIntegrationScreen({
  onBack,
  onSkip,
}: Props) {
  const [step, setStep] = useState<Step>('landing');
  const [abhaId, setAbhaId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [name, setName] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  const formatABHA = (text: string) => {
    const numbers = text.replace(/\D/g, '').slice(0, 14);

    if (numbers.length <= 2) return numbers;

    if (numbers.length <= 6) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    }

    if (numbers.length <= 10) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }

    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}-${numbers.slice(10)}`;
  };

  const handleCreateABHA = async () => {
    if (
      !name.trim() ||
      !yearOfBirth.trim() ||
      !gender.trim() ||
      !state.trim() ||
      !district.trim() ||
      !mobile.trim()
    ) {
      Alert.alert('Missing details', 'Please fill in all required fields.');
      return;
    }

    if (!/^\d{4}$/.test(yearOfBirth)) {
      Alert.alert('Invalid year', 'Enter a valid four-digit year of birth.');
      return;
    }

    if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
      Alert.alert('Invalid mobile number', 'Enter a 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          yearOfBirth: Number(yearOfBirth),
          gender,
          state: state.trim(),
          district: district.trim(),
          mobile: mobile.replace(/\D/g, ''),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create ABHA profile.');
      }

      setProfile(data.profile);
      setAbhaId(data.profile.abhaId);
      setStep('linked');

      Alert.alert(
        'ABHA profile created',
        'Your test ABHA profile has been saved.'
      );
    } catch (error: any) {
      Alert.alert(
        'Creation failed',
        error.message || 'Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const requestOTP = async () => {
    const cleanABHA = abhaId.replace(/\D/g, '');

    if (cleanABHA.length !== 14) {
      Alert.alert(
        'Invalid ABHA Number',
        'Please enter your 14-digit ABHA number.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abhaId: cleanABHA,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send OTP.');
      }

      setOtp('');
      setStep('otp');

      if (data.demoOtp) {
        Alert.alert(
          'OTP',
          `Your OTP is ${data.demoOtp}`
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Unable to send OTP',
        error.message || 'Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abhaId: abhaId.replace(/\D/g, ''),
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Incorrect OTP.');
      }

      setProfile(data.profile);
      setStep('confirm');
    } catch (error: any) {
      Alert.alert(
        'Verification failed',
        error.message || 'Please check the OTP and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'create' || step === 'abha') {
      setStep('landing');
    } else if (step === 'otp') {
      setStep('abha');
    } else if (step === 'confirm') {
      setStep('otp');
    } else {
      onBack?.();
    }
  };

  const renderBackButton = () => (
    <TouchableOpacity onPress={goBack} style={styles.backButton}>
      <Ionicons name="chevron-back" size={26} color="#B23A63" />
    </TouchableOpacity>
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: 'default' | 'number-pad' | 'email-address' = 'default'
  ) => (
    <View style={styles.formField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C98FA8"
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
    </View>
  );

  if (step === 'landing') {
    return (
      <LinearGradient
        colors={['#FDEDF3', '#FBE0E9', '#F9D5E5']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {renderBackButton()}

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.abhaLogo}>
                <Text style={styles.abhaLogoText}>ABHA</Text>
              </View>

              <Text style={styles.title}>Connect your ABHA</Text>

              <Text style={styles.subtitle}>
                ABHA helps you securely identify and manage your digital health records.
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={22}
                  color="#20A878"
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Secure & private</Text>
                <Text style={styles.infoText}>
                  Your health information is accessed securely and only with your consent.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() => setStep('abha')}
            >
              <Text style={styles.primaryButtonText}>
                I already have ABHA
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={() => setStep('create')}
            >
              <Text style={styles.secondaryButtonText}>Create ABHA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>

            <Text style={styles.bottomText}>
              You can connect your ABHA later from your profile.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (step === 'create') {
    return (
      <LinearGradient
        colors={['#FDEDF3', '#FBE0E9', '#F9D5E5']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {renderBackButton()}

          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.stepLabel}>NEW HEALTH PROFILE</Text>
              <Text style={styles.title}>Create ABHA</Text>
              <Text style={styles.subtitle}>
                Enter your details to create a test ABHA profile in MumWise.
              </Text>

              {renderInput('Full Name *', name, setName, 'Enter your full name')}
              {renderInput(
                'Year of Birth *',
                yearOfBirth,
                text => setYearOfBirth(text.replace(/\D/g, '').slice(0, 4)),
                'YYYY',
                'number-pad'
              )}

              <View style={styles.formField}>
                <Text style={styles.label}>Gender *</Text>
                <View style={styles.genderContainer}>
                  {['Female', 'Male', 'Other'].map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.genderOption,
                        gender === option && styles.genderOptionSelected,
                      ]}
                      onPress={() => setGender(option)}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          gender === option && styles.genderTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {renderInput('State *', state, setState, 'Enter your state')}
              {renderInput(
                'District *',
                district,
                setDistrict,
                'Enter your district'
              )}
              {renderInput(
                'Mobile Number *',
                mobile,
                text => setMobile(text.replace(/\D/g, '').slice(0, 10)),
                '10-digit mobile number',
                'number-pad'
              )}
              {renderInput(
                'Email (optional)',
                email,
                setEmail,
                'Enter your email',
                'email-address'
              )}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  loading && styles.primaryButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleCreateABHA}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Creating profile...' : 'Create Profile'}
                </Text>
                {!loading && (
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              <Text style={styles.consentText}>
                This creates a test profile in your app's database. It does not create an official ABHA account.
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (step === 'abha') {
    return (
      <LinearGradient
        colors={['#FDEDF3', '#FBE0E9', '#F9D5E5']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {renderBackButton()}

          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.stepLabel}>DIGITAL HEALTH IDENTITY</Text>
              <Text style={styles.title}>Enter your ABHA number</Text>
              <Text style={styles.subtitle}>
                Enter the ABHA number associated with your health records.
              </Text>

              <View style={styles.formField}>
                <Text style={styles.label}>ABHA Number</Text>
                <TextInput
                  style={styles.input}
                  value={abhaId}
                  onChangeText={text => setAbhaId(formatABHA(text))}
                  placeholder="12-3456-7890-1234"
                  placeholderTextColor="#C98FA8"
                  keyboardType="number-pad"
                  maxLength={17}
                />
                <Text style={styles.hint}>
                  Enter your 14-digit ABHA number
                </Text>
              </View>

              <View style={styles.otpInfoCard}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={23}
                  color="#B23A63"
                />
                <Text style={styles.otpInfoText}>
                  We'll generate a OTP for the mobile number associated with your test profile.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  loading && styles.primaryButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={requestOTP}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (step === 'otp') {
    return (
      <LinearGradient
        colors={['#FDEDF3', '#FBE0E9', '#F9D5E5']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {renderBackButton()}

          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.otpScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.otpIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={38}
                  color="#B23A63"
                />
              </View>

              <Text style={styles.titleCenter}>Verify your identity</Text>
              <Text style={styles.subtitleCenter}>
                Enter the 6-digit OTP generated for your test profile.
              </Text>

              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={text =>
                  setOtp(text.replace(/\D/g, '').slice(0, 6))
                }
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor="#C98FA8"
              />

              <TouchableOpacity
                style={[
                  styles.otpVerifyButton,
                  loading && styles.primaryButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={verifyOTP}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={requestOTP}
                disabled={loading}
              >
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (step === 'confirm') {
    return (
      <LinearGradient
        colors={['#FDEDF3', '#FBE0E9', '#F9D5E5']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {renderBackButton()}

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepLabel}>ABHA PROFILE</Text>
            <Text style={styles.title}>Confirm your details</Text>
            <Text style={styles.subtitle}>
              We found these details associated with your ABHA number.
            </Text>

            <View style={styles.profileCard}>
              <ProfileRow icon="person-outline" label="Name" value={profile?.name} />
              <ProfileRow
                icon="calendar-outline"
                label="Year of Birth"
                value={String(profile?.yearOfBirth ?? '')}
              />
              <ProfileRow
                icon="people-outline"
                label="Gender"
                value={profile?.gender}
              />
              <ProfileRow
                icon="location-outline"
                label="State"
                value={profile?.state}
              />
              <ProfileRow
                icon="business-outline"
                label="District"
                value={profile?.district}
              />
              <ProfileRow
                icon="card-outline"
                label="ABHA Number"
                value={formatABHA(profile?.abhaId || abhaId)}
                last
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() => setStep('linked')}
            >
              <Text style={styles.primaryButtonText}>Confirm & Link ABHA</Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.consentText}>
              By continuing, you confirm that these details belong to you and consent to linking your ABHA with MumWise.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FDEDF3', '#FBE0E9', '#F9D5E5']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.linkedContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.linkedIcon}>
            <Ionicons name="checkmark" size={42} color="#FFFFFF" />
          </View>

          <Text style={styles.titleCenter}>
            {profile ? 'ABHA profile ready' : 'ABHA linked successfully'}
          </Text>

          <Text style={styles.subtitleCenter}>
            {profile
              ? 'Your test profile has been saved in MumWise.'
              : 'Your ABHA is now connected to MumWise.'}
          </Text>

          <View style={styles.linkedCard}>
            <View style={styles.linkedCardHeader}>
              <View style={styles.smallAbhaLogo}>
                <Text style={styles.smallAbhaText}>ABHA</Text>
              </View>

              <View style={styles.linkedCardHeading}>
                <Text style={styles.linkedCardTitle}>
                  Digital Health Identity
                </Text>
                <Text style={styles.linkedCardSubtitle}>
                  Ayushman Bharat Health Account
                </Text>
              </View>
            </View>

            {profile?.name ? (
              <Text style={styles.profileName}>{profile.name}</Text>
            ) : null}

            <View style={styles.linkedStatus}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color="#20A878"
              />
              <Text style={styles.linkedStatusText}>
                {profile ? 'Profile saved' : 'Your ABHA ID is linked'}
              </Text>
            </View>

            <Text style={styles.linkedNumber}>
              {formatABHA(profile?.abhaId || abhaId)}
            </Text>
          </View>

          <View style={styles.benefitsCard}>
            <BenefitRow
              icon="lock-closed-outline"
              text="Secure and private"
            />
            <BenefitRow
              icon="document-text-outline"
              text="Access your health records with consent"
            />
            <BenefitRow
              icon="share-social-outline"
              text="Share with your doctor"
            />
            <BenefitRow
              icon="heart-outline"
              text="Helps in continuity of care"
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={onSkip}
          >
            <Text style={styles.primaryButtonText}>Continue to Home</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.profileRow, !last && styles.profileRowBorder]}>
      <Ionicons name={icon} size={20} color="#B23A63" />
      <View style={styles.profileRowContent}>
        <Text style={styles.profileLabel}>{label}</Text>
        <Text style={styles.profileValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

function BenefitRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.benefitRow}>
      <Ionicons name={icon} size={20} color="#20A878" />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
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
  backButton: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 22,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 28,
  },
  abhaLogo: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#F3C3D4',
    elevation: 2,
  },
  abhaLogoText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#B23A63',
  },
  smallAbhaLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  smallAbhaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B23A63',
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: '#B23A63',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#8A4A63',
    marginTop: 8,
  },
  titleCenter: {
    fontSize: 26,
    fontWeight: '700',
    color: '#B23A63',
    textAlign: 'center',
  },
  subtitleCenter: {
    fontSize: 14,
    lineHeight: 22,
    color: '#8A4A63',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FBF6',
    borderRadius: 18,
    padding: 17,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#CBEBDD',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DDF5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: '#28795C',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  infoText: {
    color: '#52786A',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 30,
    backgroundColor: '#E8558D',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    marginTop: 16,
    paddingHorizontal: 18,
    shadowColor: '#E8558D',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  otpVerifyButton: {
    width: 190,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8558D',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 22,
    elevation: 3,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 30,
    backgroundColor: '#FFFFFF99',
    borderWidth: 1.5,
    borderColor: '#E8558D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 13,
  },
  secondaryButtonText: {
    color: '#B23A63',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  skipText: {
    color: '#8A4A63',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomText: {
    color: '#A9607A',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 5,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#C14D75',
    marginBottom: 7,
  },
  formField: {
    marginTop: 20,
  },
  label: {
    fontSize: 13,
    color: '#8A4A63',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 56,
    backgroundColor: '#FFFFFFCC',
    borderRadius: 15,
    paddingHorizontal: 17,
    fontSize: 16,
    color: '#5A2A3D',
    borderWidth: 1,
    borderColor: '#F3C3D4',
  },
  hint: {
    color: '#A9607A',
    fontSize: 12,
    marginTop: 7,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3C3D4',
    backgroundColor: '#FFFFFF99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#E8558D',
    borderColor: '#E8558D',
  },
  genderText: {
    color: '#8A4A63',
    fontSize: 13,
    fontWeight: '600',
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  otpInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF80',
    borderRadius: 16,
    padding: 16,
    marginTop: 22,
  },
  otpInfoText: {
    flex: 1,
    color: '#7B4960',
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 12,
  },
  otpScrollContent: {
    paddingHorizontal: 30,
    paddingTop: 50,
    paddingBottom: 60,
    alignItems: 'center',
  },
  otpIcon: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F3C3D4',
  },
  otpInput: {
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0C5D5',
    marginTop: 26,
    textAlign: 'center',
    letterSpacing: 7,
    fontSize: 24,
    fontWeight: '600',
    color: '#5A2A3D',
    paddingHorizontal: 12,
  },
  resendButton: {
    paddingVertical: 18,
  },
  resendText: {
    color: '#B23A63',
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#FFFFFFCC',
    borderRadius: 20,
    paddingHorizontal: 18,
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#F3C3D4',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  profileRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3DDE5',
  },
  profileRowContent: {
    flex: 1,
    marginLeft: 13,
  },
  profileLabel: {
    color: '#A16A7F',
    fontSize: 11,
    marginBottom: 3,
  },
  profileValue: {
    color: '#5A2A3D',
    fontSize: 15,
    fontWeight: '600',
  },
  consentText: {
    color: '#8A4A63',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 8,
  },
  linkedContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 55,
    paddingBottom: 50,
    alignItems: 'center',
  },
  linkedIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#20A878',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  linkedCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#EBDDE3',
    elevation: 2,
  },
  linkedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkedCardHeading: {
    flex: 1,
    flexShrink: 1,
  },
  linkedCardTitle: {
    color: '#26356B',
    fontSize: 15,
    fontWeight: '700',
  },
  linkedCardSubtitle: {
    color: '#8A909C',
    fontSize: 11,
    marginTop: 3,
  },
  profileName: {
    color: '#5A2A3D',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 18,
  },
  linkedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECF9F3',
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  linkedStatusText: {
    color: '#28795C',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  linkedNumber: {
    color: '#26356B',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF80',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 12,
  },
  benefitText: {
    flex: 1,
    flexShrink: 1,
    color: '#6C5360',
    fontSize: 13,
    lineHeight: 20,
  },
});