import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Answers = {
  lmp: string;
  pregnancyConfirmedDate: string;
  clinicianVisit: string;
  ultrasound: string;
  doctorEdd: string;
  firstPregnancy: string;
  previousComplications: string;
  medicalConditions: string;
  allergies: string;
  medicines: string;
  reports: string;
};

type Props = {
  initialName?: string;
  initialDueDate?: string;
  onBack: () => void;
  onComplete: (answers: Answers) => void;
};

const emptyAnswers: Answers = {
  lmp: '',
  pregnancyConfirmedDate: '',
  clinicianVisit: '',
  ultrasound: '',
  doctorEdd: '',
  firstPregnancy: '',
  previousComplications: '',
  medicalConditions: '',
  allergies: '',
  medicines: '',
  reports: '',
};

const questions = [
  {
    key: 'lmp',
    title: 'When did your last menstrual period start?',
    hint: 'Enter the first day of your last period (DD/MM/YYYY).',
    kind: 'date',
  },
  {
    key: 'pregnancyConfirmedDate',
    title: 'When was your pregnancy confirmed?',
    hint: 'Enter the date of your positive pregnancy test or confirmation (DD/MM/YYYY).',
    kind: 'date',
  },
  {
    key: 'clinicianVisit',
    title: 'Have you visited a doctor or maternity-care professional for this pregnancy?',
    hint: 'Choose the option that best describes your current status.',
    kind: 'choice',
    options: [
      'Yes, I have visited',
      'Appointment scheduled',
      'Not yet',
      'Prefer not to say',
    ],
  },
  {
    key: 'ultrasound',
    title: 'Have you had a dating ultrasound?',
    hint: 'A dating scan may help your clinician estimate the pregnancy stage.',
    kind: 'choice',
    options: [
      'Yes, I have had one',
      'It is scheduled',
      'No',
      'Not sure',
    ],
  },
  {
    key: 'doctorEdd',
    title: 'Did your doctor confirm an estimated due date (EDD)?',
    hint: 'If available, enter the date given by your doctor (DD/MM/YYYY).',
    kind: 'dateOptional',
  },
  {
    key: 'firstPregnancy',
    title: 'Is this your first pregnancy?',
    hint: 'Select the answer that best describes your pregnancy history.',
    kind: 'choice',
    options: ['Yes', 'No', 'Prefer not to say'],
  },
  {
    key: 'previousComplications',
    title: 'Have you experienced any complications in a previous pregnancy or delivery?',
    hint: 'You can briefly describe them, or select none / not applicable.',
    kind: 'text',
    placeholder: 'Describe briefly, or enter None / Not applicable',
  },
  {
    key: 'medicalConditions',
    title: 'Do you have any pre-existing medical conditions?',
    hint: 'For example, diabetes, thyroid conditions, high blood pressure or asthma.',
    kind: 'text',
    placeholder: 'List conditions, or enter None / Not sure',
  },
  {
    key: 'allergies',
    title: 'Do you have any known drug or medicine allergies?',
    hint: 'Include the medicine and reaction if you know it.',
    kind: 'text',
    placeholder: 'List allergies, or enter None / Not sure',
  },
  {
    key: 'medicines',
    title: 'Are you currently taking any medicines or supplements?',
    hint: 'Include the name and dose if known. Do not stop prescribed medicines based on this form.',
    kind: 'text',
    placeholder: 'List medicines / supplements, or enter None / Not sure',
  },
  {
    key: 'reports',
    title: 'Do you have any diagnostic reports you would like to note for your care record?',
    hint: 'You can add report names or details here.',
    kind: 'text',
    placeholder: 'For example: blood test report, ultrasound report, date',
  },
] as const;

type DateField = 'lmp' | 'pregnancyConfirmedDate' | 'doctorEdd';

const dateFields: DateField[] = [
  'lmp',
  'pregnancyConfirmedDate',
  'doctorEdd',
];

const formatDateInput = (input: string) => {
  const digits = input.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseDate = (value: string): Date | null => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return null;
  }

  const [day, month, year] = value.split('/').map(Number);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const today = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDateError = (
  key: DateField,
  value: string
): string => {
  if (!value.trim()) {
    if (key === 'doctorEdd') {
      return '';
    }

    return 'Please enter a date.';
  }

  if (value.length !== 10) {
    return 'Please enter the complete date (DD/MM/YYYY).';
  }

  const parsed = parseDate(value);

  if (!parsed) {
    return 'Please enter a valid calendar date.';
  }

  const currentDate = today();

  if (
    (key === 'lmp' || key === 'pregnancyConfirmedDate') &&
    parsed > currentDate
  ) {
    return 'This date cannot be in the future.';
  }

  if (key === 'doctorEdd' && parsed < currentDate) {
    return 'The estimated due date cannot be in the past.';
  }

  if (key === 'lmp') {
    const earliestAllowed = new Date(currentDate);
    earliestAllowed.setDate(earliestAllowed.getDate() - 300);

    if (parsed < earliestAllowed) {
      return 'Please check the date. It is more than 300 days ago.';
    }
  }

  return '';
};

export default function PregnancyQuestionnaireScreen({
  initialName,
  initialDueDate,
  onBack,
  onComplete,
}: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    ...emptyAnswers,
  });
  const [review, setReview] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const current = questions[step];

  const progress = useMemo(
    () => ((step + 1) / questions.length) * 100,
    [step]
  );

  const update = (key: keyof Answers, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const currentKey = current.key as keyof Answers;
  const currentValue = answers[currentKey];

  const currentDateError =
    dateFields.includes(currentKey as DateField)
      ? getDateError(
          currentKey as DateField,
          currentValue
        )
      : '';

  const validateCurrent = () => {
    setShowErrors(true);

    if (
      current.kind === 'date' ||
      current.kind === 'dateOptional'
    ) {
      return currentDateError === '';
    }

    if (
      current.kind === 'choice' &&
      !currentValue.trim()
    ) {
      return false;
    }

    return true;
  };

  const renderQuestion = () => {
    const key = current.key as keyof Answers;
    const value = answers[key];

    if (current.kind === 'choice') {
      return (
        <View style={styles.options}>
          {current.options.map(option => (
            <Pressable
              key={option}
              onPress={() => update(key, option)}
              style={[
                styles.option,
                value === option && styles.optionSelected,
              ]}
            >
              <View
                style={[
                  styles.radio,
                  value === option && styles.radioSelected,
                ]}
              >
                {value === option ? (
                  <View style={styles.radioDot} />
                ) : null}
              </View>

              <Text
                style={[
                  styles.optionText,
                  value === option && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      );
    }

    const isDate =
      current.kind === 'date' ||
      current.kind === 'dateOptional';

    return (
      <>
        <TextInput
          value={value}
          onChangeText={text => {
            const formatted = isDate
              ? formatDateInput(text)
              : text;

            update(key, formatted);
          }}
          placeholder={
            isDate
              ? 'DD/MM/YYYY'
              : current.placeholder
          }
          placeholderTextColor="#A88D99"
          keyboardType={
            isDate ? 'number-pad' : 'default'
          }
          multiline={current.kind === 'text'}
          style={[
            styles.input,
            current.kind === 'text' && styles.textArea,
            showErrors &&
              currentDateError &&
              styles.inputError,
          ]}
          maxLength={current.kind === 'text' ? 700 : 10}
          autoCorrect={current.kind === 'text'}
        />

        {showErrors && currentDateError ? (
          <Text style={styles.errorText}>
            {currentDateError}
          </Text>
        ) : null}

        {current.kind === 'date' &&
        showErrors &&
        !currentDateError &&
        value.length === 10 ? (
          <View style={styles.validDateRow}>
            <Ionicons
              name="checkmark-circle"
              size={15}
              color="#299B70"
            />
            <Text style={styles.validDateText}>
              Valid date
            </Text>
          </View>
        ) : null}
      </>
    );
  };

  const goNext = () => {
    if (!validateCurrent()) {
      return;
    }

    setShowErrors(false);

    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      setReview(true);
    }
  };

  const finish = () => {
    onComplete(answers);
  };

  const goBack = () => {
    if (review) {
      setReview(false);
      return;
    }

    if (step > 0) {
      setStep(s => Math.max(0, s - 1));
      setShowErrors(false);
    } else {
      onBack();
    }
  };

  const skipQuestion = () => {
    setShowErrors(false);

    if (review) {
      setReview(false);
      return;
    }

    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      setReview(true);
    }
  };

  return (
    <LinearGradient
      colors={['#FFF8FB', '#FCEAF1', '#FFF5F8']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === 'ios' ? 'padding' : undefined
          }
        >
          <View style={styles.header}>
            <Pressable
              onPress={goBack}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={23}
                color="#9E3F68"
              />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>
                MUMWISE • YOUR PREGNANCY
              </Text>

              <Text style={styles.headerTitle}>
                A little more about you
              </Text>
            </View>

            <Text style={styles.stepCount}>
              {review
                ? 'Review'
                : `${step + 1}/${questions.length}`}
            </Text>
          </View>

          {!review ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>
          ) : null}

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCard}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="heart"
                  size={23}
                  color="#D94F87"
                />
              </View>

              <Text style={styles.greeting}>
                {initialName
                  ? `You're doing great, ${initialName}.`
                  : 'You’re doing great.'}
              </Text>

              <Text style={styles.intro}>
                Your answers help MumWise organise your
                pregnancy information. Share only what you
                feel comfortable sharing.
              </Text>

              {initialDueDate ? (
                <Text style={styles.smallNote}>
                  Your sign-up due date: {initialDueDate}.
                  A clinician-confirmed date can take priority.
                </Text>
              ) : null}
            </View>

            {review ? (
              <View style={styles.questionCard}>
                <Text style={styles.questionTitle}>
                  Review your answers
                </Text>

                <Text style={styles.questionHint}>
                  You can go back to change any answer before
                  continuing.
                </Text>

                {questions.map((q, i) => (
                  <View
                    key={q.key}
                    style={styles.reviewRow}
                  >
                    <Text style={styles.reviewLabel}>
                      {i + 1}. {q.title}
                    </Text>

                    <Text style={styles.reviewValue}>
                      {answers[
                        q.key as keyof Answers
                      ].trim() || 'Not provided'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.questionCard}>
                <Text style={styles.questionNumber}>
                  QUESTION {step + 1} OF {questions.length}
                </Text>

                <Text style={styles.questionTitle}>
                  {current.title}
                </Text>

                <Text style={styles.questionHint}>
                  {current.hint}
                </Text>

                {renderQuestion()}

                {current.key === 'doctorEdd' ? (
                  <Text style={styles.optional}>
                    Optional — leave blank if your doctor
                    has not confirmed an EDD.
                  </Text>
                ) : null}

                {current.key === 'reports' ? (
                  <Text style={styles.optional}>
                    Please do not enter highly sensitive
                    identifiers in this notes field.
                  </Text>
                ) : null}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {!review ? (
              <Pressable
                style={styles.primaryButton}
                onPress={goNext}
              >
                <Text style={styles.primaryText}>
                  {step === questions.length - 1
                    ? 'Review my answers'
                    : 'Continue'}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color="#FFF"
                />
              </Pressable>
            ) : (
              <Pressable
                style={styles.primaryButton}
                onPress={finish}
              >
                <Text style={styles.primaryText}>
                  Continue to MumWise
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color="#FFF"
                />
              </Pressable>
            )}

            <Pressable
              style={styles.skipButton}
              onPress={skipQuestion}
            >
              <Text style={styles.skipText}>
                {review
                  ? 'Back to questions'
                  : 'Skip this question'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  eyebrow: {
    color: '#B66A89',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  headerTitle: {
    color: '#71364F',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  stepCount: {
    color: '#9E3F68',
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#F2D6E2',
    marginHorizontal: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    backgroundColor: '#DE6394',
    borderRadius: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  introCard: {
    backgroundColor: '#FFF0F5',
    borderRadius: 20,
    padding: 17,
    marginBottom: 16,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  greeting: {
    color: '#793B57',
    fontSize: 16,
    fontWeight: '800',
  },
  intro: {
    color: '#876777',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  smallNote: {
    color: '#A05274',
    fontSize: 11,
    marginTop: 8,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#9B5674',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  questionNumber: {
    color: '#D45B8B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  questionTitle: {
    color: '#63364B',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 28,
  },
  questionHint: {
    color: '#907786',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 18,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#EBD5DF',
    borderRadius: 14,
    paddingHorizontal: 14,
    color: '#593B4A',
    fontSize: 15,
    backgroundColor: '#FFFCFD',
  },
  inputError: {
    borderColor: '#D9304F',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#D9304F',
    fontSize: 12,
    marginTop: 7,
    fontWeight: '600',
  },
  validDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  validDateText: {
    color: '#299B70',
    fontSize: 12,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 125,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#EBD5DF',
    borderRadius: 14,
    backgroundColor: '#FFFCFD',
  },
  optionSelected: {
    borderColor: '#D85D8E',
    backgroundColor: '#FFF1F6',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C7A7B6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  radioSelected: {
    borderColor: '#D85D8E',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D85D8E',
  },
  optionText: {
    flex: 1,
    color: '#79596A',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#8C3D60',
    fontWeight: '700',
  },
  optional: {
    color: '#A17F90',
    fontSize: 11,
    marginTop: 10,
  },
  reviewRow: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F4E6EC',
  },
  reviewLabel: {
    color: '#81566B',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewValue: {
    color: '#553849',
    fontSize: 14,
    marginTop: 5,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,248,251,0.96)',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#D95387',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 13,
  },
  skipText: {
    color: '#A45A7B',
    fontSize: 13,
    fontWeight: '700',
  },
});
