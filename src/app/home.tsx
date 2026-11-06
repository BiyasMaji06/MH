
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import { supabase } from '../services/supabase';

const PINK = '#E8558D';
const DEEP_PINK = '#B23A63';
const TEXT = '#512D3D';
const MUTED = '#9A7585';

const WEARABLE_DEMO = {
  steps: '6,482 steps',
  heartRate: '72 bpm',
  spo2: '98%',
  sleep: '7 h 15 m',
  lastSynced: '02 Dec 2026, 8:30 AM',
};

type Feature = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route?: string;
};

type RouteParams = {
  name?: string | string[];
  edd?: string | string[];
  dueDate?: string | string[];
  lmp?: string | string[];
  doctorConfirmedEdd?: string | string[];
  pregnancyAnswers?: string | string[];
};

function getParam(value?: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function parseDate(value: string): Date | null {
  if (!value) return null;

  let day: number;
  let month: number;
  let year: number;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    [year, month, day] = value.split('-').map(Number);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    [day, month, year] = value.split('/').map(Number);
  } else {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function calculateEddFromLmp(lmp: string): Date | null {
  const date = parseDate(lmp);
  if (!date) return null;

  date.setDate(date.getDate() + 280);
  return date;
}

function getPregnancyProgress(edd: Date | null) {
  if (!edd) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(edd);
  due.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil(
    (due.getTime() - today.getTime()) / 86400000
  );

  const daysPregnant = 280 - daysRemaining;

  if (daysPregnant < 0 || daysPregnant > 294) return null;

  const weeks = Math.floor(daysPregnant / 7);
  const days = daysPregnant % 7;

  const trimester =
    weeks < 13
      ? 'First trimester'
      : weeks < 28
      ? 'Second trimester'
      : 'Third trimester';

  return { weeks, days, daysRemaining, trimester };
}

function safeJson(value: string): Record<string, any> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function displayValue(value: any, fallback = 'Not provided'): string {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : fallback;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

function escapeHtml(value: any): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char] as string));
}

function buildSummaryHtml(
  patientRows: [string, string][],
  gpal: string
): string {
  const rowHtml = patientRows
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @page { margin: 18mm 14mm; }
      body {
        font-family: Arial, sans-serif;
        color: #512D3D;
        padding: 8px;
        font-size: 12px;
      }
      .top {
        background: #B23A63;
        color: white;
        padding: 22px;
        border-radius: 14px;
        margin-bottom: 20px;
      }
      h1 { font-size: 23px; margin: 0 0 6px; }
      .sub { font-size: 11px; }
      h2 {
        font-size: 15px;
        color: #B23A63;
        margin: 22px 0 9px;
        border-bottom: 1px solid #F1C9D8;
        padding-bottom: 7px;
      }
      table { width: 100%; border-collapse: collapse; }
      th, td {
        text-align: left;
        padding: 9px 8px;
        border-bottom: 1px solid #F2E1E8;
        vertical-align: top;
        overflow-wrap: anywhere;
      }
      th {
        width: 42%;
        color: #795466;
        font-weight: 600;
      }
      td { color: #512D3D; }
      .metric {
        display: inline-block;
        background: #FCEAF1;
        border-radius: 9px;
        padding: 10px 12px;
        margin: 4px;
        min-width: 105px;
      }
      .metric b {
        display: block;
        font-size: 15px;
        color: #B23A63;
        margin-top: 4px;
      }
      .small {
        font-size: 10px;
        color: #8A6A7A;
        line-height: 1.5;
        margin-top: 18px;
      }
    </style>
  </head>
  <body>
    <div class="top">
      <h1>MumWise Pregnancy Summary</h1>
      <div class="sub">A patient-provided pregnancy overview</div>
    </div>

    <h2>Pregnancy overview</h2>
    <table>${rowHtml}</table>

    <h2>Obstetric history</h2>
    <table>
      <tr>
        <th>Gravida / Para / Abortions / Living</th>
        <td>${escapeHtml(gpal)}</td>
      </tr>
    </table>

    <h2>Wearable summary</h2>
    <div class="metric">Steps<b>${escapeHtml(WEARABLE_DEMO.steps)}</b></div>
    <div class="metric">Heart rate<b>${escapeHtml(WEARABLE_DEMO.heartRate)}</b></div>
    <div class="metric">SpO₂<b>${escapeHtml(WEARABLE_DEMO.spo2)}</b></div>
    <div class="metric">Sleep<b>${escapeHtml(WEARABLE_DEMO.sleep)}</b></div>

    <p class="small">
      Last synced: ${escapeHtml(WEARABLE_DEMO.lastSynced)}.
      Wearable values shown are demo values.
    </p>
  </body>
  </html>`;
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<RouteParams>();

  const [staffRole, setStaffRole] = useState<string | null>(null);
  const [checkingStaffRole, setCheckingStaffRole] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const name = getParam(params.name).trim() || 'Mother';
  const lmp = getParam(params.lmp);
  const doctorConfirmedEdd = getParam(params.doctorConfirmedEdd);
  const registrationDueDate = getParam(params.dueDate);
  const alternativeEdd = getParam(params.edd);

  const answers = useMemo(
    () => safeJson(getParam(params.pregnancyAnswers)),
    [params.pregnancyAnswers]
  );

  useEffect(() => {
    let isMounted = true;

    const checkStaffRole = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (isMounted) setStaffRole(null);
          return;
        }

        const { data, error } = await supabase
          .from('staff_users')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Staff role lookup error:', error.message);
          if (isMounted) setStaffRole(null);
          return;
        }

        if (isMounted) {
          setStaffRole(data?.role ?? null);
        }
      } catch (error) {
        console.error('Staff role check failed:', error);
        if (isMounted) setStaffRole(null);
      } finally {
        if (isMounted) setCheckingStaffRole(false);
      }
    };

    checkStaffRole();

    return () => {
      isMounted = false;
    };
  }, []);

  const edd = useMemo(
    () =>
      parseDate(String(answers.doctorEdd ?? doctorConfirmedEdd)) ||
      parseDate(alternativeEdd) ||
      calculateEddFromLmp(String(answers.lmp ?? lmp)) ||
      parseDate(registrationDueDate),
    [
      answers.doctorEdd,
      answers.lmp,
      doctorConfirmedEdd,
      alternativeEdd,
      lmp,
      registrationDueDate,
    ]
  );

  const pregnancy = useMemo(
    () => getPregnancyProgress(edd),
    [edd]
  );

  const formattedEdd = edd
    ? edd.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const firstPregnancyValue = String(
    answers.firstPregnancy ?? ''
  ).toLowerCase();

  const isFirstPregnancy = [
    'yes',
    'true',
    'first pregnancy',
  ].includes(firstPregnancyValue);

  const gpal = isFirstPregnancy
    ? 'G1 / P0 / A0 / L0'
    : 'G2 / P1 / A0 / L1';

  const features: Feature[] = [
    {
      title: 'My Health',
      description: 'Your health overview',
      icon: 'heart-outline',
      color: '#FCE3ED',
      route: '/health-tracking',
    },
    {
      title: 'Nutrition',
      description: 'Meals and nutrients',
      icon: 'nutrition-outline',
      color: '#FCE3ED',
      route: '/nutrition',
    },
    {
      title: 'Exercise & Yoga',
      description: 'Gentle movement',
      icon: 'body-outline',
      color: '#E5F3EA',
      route: '/exercise-yoga',
    },
    {
      title: 'Care Plan',
      description: 'Your pregnancy care',
      icon: 'clipboard-outline',
      color: '#E9E5FC',
    },
    {
      title: 'Learn',
      description: 'Pregnancy guidance',
      icon: 'book-outline',
      color: '#FFF0D9',
      route: '/learn',
    },
    {
      title: 'Chat with SIA',
      description: 'Your AI companion',
      icon: 'chatbubbles-outline',
      color: '#E3F1FA',
      route: '/sia',
    },
    {
      title: 'ABHA',
      description: 'Health account',
      icon: 'shield-checkmark-outline',
      color: '#E5F3EA',
    },
    {
      title: 'Baby Growth',
      description: 'Week-by-week updates',
      icon: 'sparkles-outline',
      color: '#FCE3ED',
    },
    {
      title: 'Emergency Contact',
      description: 'Important contacts',
      icon: 'call-outline',
      color: '#FCE8E3',
    },
    {
      title: 'Clinician Summary',
      description: 'Prepare for your next doctor visit',
      icon: 'document-text-outline',
      color: '#FCE3ED',
      route: '/clinician-summary',
    },
  ];

  const openFeature = (feature: Feature) => {
    if (feature.title === 'Clinician Summary') {
      router.push({
        pathname: '/clinician-summary',
        params: {
          name,
          lmp: String(answers.lmp ?? lmp),
          edd: alternativeEdd,
          dueDate: registrationDueDate,
          doctorConfirmedEdd: String(
            answers.doctorEdd ?? doctorConfirmedEdd
          ),
          pregnancyAnswers: JSON.stringify(answers),
          gestationalAge: pregnancy
            ? `${pregnancy.weeks} weeks and ${pregnancy.days} days`
            : '',
          trimester: pregnancy?.trimester ?? '',
          formattedEdd,
        },
      });
      return;
    }

    if (feature.route) {
      router.push(feature.route as any);
      return;
    }

    Alert.alert(
      feature.title,
      'This section is not available yet.'
    );
  };

  const handleSummary = async () => {
    if (generatingPdf) return;

    setGeneratingPdf(true);

    try {
      const patientRows: [string, string][] = [
        ['Patient name', name],
        [
          'Last menstrual period (LMP)',
          displayValue(answers.lmp ?? lmp),
        ],
        [
          'Pregnancy confirmed date',
          displayValue(answers.pregnancyConfirmedDate),
        ],
        [
          'Clinician visit',
          displayValue(answers.clinicianVisit),
        ],
        [
          'Dating ultrasound',
          displayValue(answers.ultrasound),
        ],
        [
          'Doctor-confirmed EDD',
          displayValue(answers.doctorEdd ?? doctorConfirmedEdd),
        ],
        [
          'Estimated due date used by app',
          displayValue(formattedEdd),
        ],
        [
          'Current gestational age',
          pregnancy
            ? `${pregnancy.weeks} weeks + ${pregnancy.days} days`
            : 'Unable to calculate from available dates',
        ],
        [
          'Trimester',
          pregnancy?.trimester ?? 'Unable to calculate',
        ],
        [
          'First pregnancy',
          displayValue(answers.firstPregnancy),
        ],
        [
          'Previous pregnancy / delivery complications',
          displayValue(answers.previousComplications),
        ],
        [
          'Medical conditions',
          displayValue(answers.medicalConditions),
        ],
        [
          'Drug allergies',
          displayValue(answers.allergies),
        ],
        [
          'Current medicines / supplements',
          displayValue(answers.medicines),
        ],
        [
          'Diagnostic reports',
          displayValue(answers.reports),
        ],
      ];

      const html = buildSummaryHtml(patientRows, gpal);

      await Print.printAsync({ html });
    } catch (error) {
      console.error('Pregnancy summary PDF error:', error);
      Alert.alert(
        'Could not open PDF print screen',
        'Please try again.'
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const cardWidth = (width - 52) / 2;

  return (
    <LinearGradient
      colors={['#FDEDF3', '#FBE0E9', '#FFF8FB']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>
                Hello, {name} 💗
              </Text>
              <Text style={styles.subtitle}>
                Your pregnancy journey, one day at a time.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() =>
                Alert.alert(
                  'My Profile',
                  'Profile settings will be available here.'
                )
              }
            >
              <Ionicons
                name="person-outline"
                size={23}
                color={DEEP_PINK}
              />
            </TouchableOpacity>
          </View>

          {!checkingStaffRole &&
            (staffRole === 'admin' || staffRole === 'doctor') && (
              <View style={styles.staffSection}>
                <Text style={styles.staffHeading}>
                  Staff Workspace
                </Text>

                {staffRole === 'admin' && (
                  <TouchableOpacity
                    style={styles.staffButton}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push('/admin-dashboard' as any)
                    }
                  >
                    <View style={styles.staffIcon}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={23}
                        color={DEEP_PINK}
                      />
                    </View>

                    <View style={styles.staffTextContainer}>
                      <Text style={styles.staffButtonTitle}>
                        Admin Dashboard
                      </Text>
                      <Text style={styles.staffButtonDescription}>
                        Manage questions, doctors and FAQ approvals
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={DEEP_PINK}
                    />
                  </TouchableOpacity>
                )}

                {staffRole === 'doctor' && (
                  <TouchableOpacity
                    style={styles.staffButton}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push('/doctor-dashboard' as any)
                    }
                  >
                    <View style={styles.staffIcon}>
                      <Ionicons
                        name="medkit-outline"
                        size={23}
                        color={DEEP_PINK}
                      />
                    </View>

                    <View style={styles.staffTextContainer}>
                      <Text style={styles.staffButtonTitle}>
                        Doctor Dashboard
                      </Text>
                      <Text style={styles.staffButtonDescription}>
                        Review assigned questions and submit responses
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={DEEP_PINK}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

          <LinearGradient
            colors={['#E8558D', '#B23A63']}
            style={styles.progressCard}
          >
            <View style={styles.progressTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>
                  YOUR PREGNANCY JOURNEY
                </Text>

                {pregnancy ? (
                  <>
                    <Text style={styles.weekNumber}>
                      Week {pregnancy.weeks}
                    </Text>
                    <Text style={styles.weekDays}>
                      {pregnancy.days} days into your week
                    </Text>
                    <Text style={styles.trimester}>
                      {pregnancy.trimester}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.progressTitle}>
                      Every little step matters.
                    </Text>
                    <Text style={styles.progressDescription}>
                      Complete your pregnancy questionnaire to see
                      your personalised pregnancy progress.
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.babyIcon}>
                <Ionicons
                  name="heart"
                  size={43}
                  color="#FFFFFF"
                />
                <Ionicons
                  name="sparkles"
                  size={17}
                  color="#FFE6EF"
                  style={styles.sparkle}
                />
              </View>
            </View>

            {pregnancy && formattedEdd !== '' && (
              <View style={styles.eddRow}>
                <View>
                  <Text style={styles.eddLabel}>
                    ESTIMATED DUE DATE
                  </Text>
                  <Text style={styles.eddDate}>
                    {formattedEdd}
                  </Text>
                </View>

                <View style={styles.daysBadge}>
                  <Text style={styles.daysNumber}>
                    {pregnancy.daysRemaining}
                  </Text>
                  <Text style={styles.daysLabel}>
                    days to go
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Your Daily Care
            </Text>
          </View>

          <View style={styles.featureGrid}>
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.title}
                style={[
                  styles.featureCard,
                  { width: cardWidth },
                ]}
                activeOpacity={0.8}
                onPress={() => openFeature(feature)}
              >
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: feature.color },
                  ]}
                >
                  <Ionicons
                    name={feature.icon}
                    size={25}
                    color={DEEP_PINK}
                  />
                </View>

                <Text style={styles.featureTitle}>
                  {feature.title}
                </Text>

                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={DEEP_PINK}
                  style={styles.cardArrow}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.summaryButton,
              generatingPdf && { opacity: 0.7 },
            ]}
            activeOpacity={0.85}
            onPress={handleSummary}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons
                name="document-text-outline"
                size={21}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.summaryButtonText}>
              {generatingPdf
                ? 'Opening PDF print screen…'
                : 'Generate Pregnancy Summary'}
            </Text>

            {!generatingPdf && (
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>

          <View style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <Ionicons
                name="water-outline"
                size={25}
                color="#478FC7"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>
                A gentle reminder
              </Text>
              <Text style={styles.reminderDescription}>
                Stay hydrated, eat nourishing meals and make time
                to rest.
              </Text>
            </View>
          </View>

          <Text style={styles.footerText}>
            Made with love for you and your little one.
          </Text>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={21} color={PINK} />
            <Text style={styles.navLabelActive}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              router.push('/health-tracking' as any)
            }
          >
            <Ionicons
              name="pulse-outline"
              size={21}
              color={MUTED}
            />
            <Text style={styles.navLabel}>Track</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/learn' as any)}
          >
            <Ionicons
              name="book-outline"
              size={21}
              color={MUTED}
            />
            <Text style={styles.navLabel}>Learn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/sia' as any)}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={21}
              color={MUTED}
            />
            <Text style={styles.navLabel}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              Alert.alert(
                'More',
                'More options will be available here.'
              )
            }
          >
            <Ionicons
              name="grid-outline"
              size={21}
              color={MUTED}
            />
            <Text style={styles.navLabel}>More</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 25,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
  },

  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: DEEP_PINK,
  },

  subtitle: {
    fontSize: 12,
    color: '#8A4A63',
    marginTop: 5,
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3C3D4',
  },

  staffSection: { marginBottom: 18 },

  staffHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 10,
  },

  staffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3C3D4',
  },

  staffIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#FCE3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  staffTextContainer: {
    flex: 1,
    paddingRight: 8,
  },

  staffButtonTitle: {
    fontSize: 14,
    color: TEXT,
    fontWeight: '800',
  },

  staffButtonDescription: {
    fontSize: 10,
    color: MUTED,
    marginTop: 4,
    lineHeight: 14,
  },

  progressCard: {
    borderRadius: 25,
    padding: 20,
    marginBottom: 27,
  },

  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  eyebrow: {
    fontSize: 9,
    color: '#FFE5EF',
    fontWeight: '800',
    letterSpacing: 1,
  },

  weekNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 7,
  },

  weekDays: {
    fontSize: 12,
    color: '#FFEAF1',
    marginTop: 2,
  },

  trimester: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 8,
  },

  progressTitle: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 9,
  },

  progressDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#FFEAF1',
    marginTop: 9,
    maxWidth: 230,
  },

  babyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF30',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  sparkle: {
    position: 'absolute',
    right: 5,
    top: 5,
  },

  eddRow: {
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF55',
    marginTop: 18,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eddLabel: {
    fontSize: 9,
    color: '#FFE5EF',
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  eddDate: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },

  daysBadge: {
    backgroundColor: '#FFFFFF25',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 8,
    alignItems: 'center',
  },

  daysNumber: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  daysLabel: {
    color: '#FFEAF1',
    fontSize: 9,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  featureCard: {
    minHeight: 137,
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    padding: 13,
    borderWidth: 1,
    borderColor: '#F7DFE8',
    shadowColor: '#A34E70',
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  featureIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  featureTitle: {
    fontSize: 13,
    color: TEXT,
    fontWeight: '700',
  },

  featureDescription: {
    fontSize: 10,
    color: MUTED,
    marginTop: 4,
    lineHeight: 14,
    paddingRight: 7,
  },

  cardArrow: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },

  summaryButton: {
    backgroundColor: DEEP_PINK,
    borderRadius: 17,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
    marginLeft: 10,
  },

  reminderCard: {
    marginTop: 17,
    backgroundColor: '#FFFFFFCC',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3D4E0',
  },

  reminderIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#E7F3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  reminderTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
  },

  reminderDescription: {
    color: '#8A6677',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  footerText: {
    textAlign: 'center',
    color: '#A77C8F',
    fontSize: 11,
    marginTop: 22,
  },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3D4E0',
    paddingTop: 9,
    paddingBottom: 5,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  navLabel: {
    fontSize: 9,
    color: MUTED,
  },

  navLabelActive: {
    fontSize: 9,
    color: PINK,
    fontWeight: '700',
  },
});