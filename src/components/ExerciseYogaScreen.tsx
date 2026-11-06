import React, { useState } from 'react';

import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const PINK = '#E8558D';
const DEEP_PINK = '#B23A63';
const TEXT = '#512D3D';
const MUTED = '#9A7585';

type ExerciseVideo = {
  id: string;
  title: string;
  duration: string;
  language: 'English' | 'Hindi';
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  kind: 'youtube' | 'local';
  youtubeId?: string;
  source?: number;
};

const VIDEOS: ExerciseVideo[] = [
  {
    id: 'first-month-exercise-hindi',
    title: 'First Month Pregnancy Exercise',
    duration: '7 min 50 sec',
    language: 'Hindi',
    category: 'Exercise & Yoga',
    icon: 'fitness',
    colors: ['#F8B7C9', '#E8799E'],
    kind: 'youtube',
    youtubeId: '-9gr4q2jGGg',
  },
  {
    id: 'pregnancy-yoga-english',
    title: 'Yoga for Pregnancy',
    duration: '12 min 39 sec',
    language: 'English',
    category: 'Exercise & Yoga',
    icon: 'body',
    colors: ['#C9E6D2', '#91C7A5'],
    kind: 'youtube',
    youtubeId: 'CfANK5JX6AI',
  },
];

export default function ExerciseYogaScreen() {
  const { width } = useWindowDimensions();

  const [exerciseDuration, setExerciseDuration] = useState('30');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [durationInput, setDurationInput] = useState('30');

  const cardWidth = Math.min(width - 40, 620);

  const playVideo = async (video: ExerciseVideo) => {
    if (video.kind === 'youtube' && video.youtubeId) {
      const url = `https://www.youtube.com/watch?v=${video.youtubeId}`;

      try {
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert(
          'Unable to open video',
          'Please check your internet connection and try again.',
        );
      }
    }
  };

  const openEditModal = () => {
    setDurationInput(exerciseDuration);
    setEditModalVisible(true);
  };

  const saveDuration = () => {
    const minutes = Number(durationInput);

    if (
      !durationInput.trim() ||
      !Number.isInteger(minutes) ||
      minutes < 0 ||
      minutes > 1440
    ) {
      Alert.alert(
        'Invalid duration',
        'Please enter a valid number of minutes (0–1440).',
      );
      return;
    }

    setExerciseDuration(String(minutes));
    setEditModalVisible(false);
  };

  return (
    <LinearGradient
      colors={['#FDEDF3', '#FBE0E9', '#FFF8FB']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Go back"
            style={styles.backButton}
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace('/home' as any)
            }
          >
            <Ionicons
              name="chevron-back"
              size={25}
              color={DEEP_PINK}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Exercise & Yoga</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          <View style={styles.intro}>
            <Text style={styles.pageTitle}>
              Stay Active & Healthy
            </Text>

            <Text style={styles.pageSubtitle}>
              Gentle movements and exercises to support your
              pregnancy journey.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Guided Videos
            </Text>

            <Text style={styles.viewAll}>
              {VIDEOS.length} Videos
            </Text>
          </View>

          <View style={styles.videoList}>
            {VIDEOS.map((video) => (
              <TouchableOpacity
                key={video.id}
                activeOpacity={0.84}
                style={[
                  styles.videoCard,
                  { width: cardWidth },
                ]}
                onPress={() => playVideo(video)}
              >
                <LinearGradient
                  colors={video.colors}
                  style={styles.thumbnail}
                >
                  <View style={styles.thumbnailIcon}>
                    <Ionicons
                      name={video.icon}
                      size={32}
                      color="#713B54"
                    />
                  </View>

                  <View style={styles.playButton}>
                    <Ionicons
                      name="play"
                      size={18}
                      color={DEEP_PINK}
                    />
                  </View>
                </LinearGradient>

                <View style={styles.videoInfo}>
                  <Text
                    style={styles.videoTitle}
                    numberOfLines={2}
                  >
                    {video.title}
                  </Text>

                  <Text style={styles.category}>
                    {video.category}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.languagePill}>
                      <Ionicons
                        name="language-outline"
                        size={11}
                        color={DEEP_PINK}
                      />

                      <Text style={styles.languageText}>
                        {video.language}
                      </Text>
                    </View>

                    <Text style={styles.duration}>
                      {video.duration}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={DEEP_PINK}
                  style={styles.cardArrow}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>
              Log Your Activity
            </Text>

            <View style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name="fitness"
                  size={22}
                  color={PINK}
                />
              </View>

              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>
                  Exercise & Yoga
                </Text>

                <Text style={styles.activitySubtitle}>
                  Daily activity
                </Text>
              </View>

              <Text style={styles.activityDuration}>
                {exerciseDuration} min
              </Text>

              <TouchableOpacity
                onPress={openEditModal}
                style={styles.editButton}
                accessibilityLabel="Edit exercise duration"
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={DEEP_PINK}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.noteCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#478FC7"
            />

            <Text style={styles.noteText}>
              Choose gentle activities appropriate for your
              pregnancy stage. Consult your healthcare provider
              before starting a new exercise routine.
            </Text>
          </View>

          <Text style={styles.footer}>
            Made with love for you and your little one.
          </Text>

        </ScrollView>

        <View style={styles.bottomNav}>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.replace('/home' as any)}
          >
            <Ionicons
              name="home-outline"
              size={21}
              color={MUTED}
            />
            <Text style={styles.navLabel}>Home</Text>
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
            onPress={() =>
              Alert.alert(
                'Chat with SIA',
                'SIA will be available here.',
              )
            }
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
                'More options will be available here.',
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

        <Modal
          visible={editModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editModal}>

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Edit Exercise & Yoga
                </Text>

                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                >
                  <Ionicons
                    name="close"
                    size={23}
                    color={TEXT}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>
                Duration (minutes)
              </Text>

              <TextInput
                style={styles.durationInput}
                value={durationInput}
                onChangeText={setDurationInput}
                keyboardType="number-pad"
                placeholder="Enter duration"
                placeholderTextColor="#B99AA8"
                maxLength={4}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelText}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveDuration}
                >
                  <Text style={styles.saveText}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>

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

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: DEEP_PINK,
    fontSize: 19,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 38,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
    alignItems: 'center',
  },

  intro: {
    width: '100%',
    marginBottom: 20,
  },

  pageTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: '800',
  },

  pageSubtitle: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  sectionHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
  },

  viewAll: {
    color: PINK,
    fontSize: 11,
    fontWeight: '700',
  },

  videoList: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },

  videoCard: {
    minHeight: 112,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F4DCE6',
    shadowColor: '#A34E70',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  thumbnail: {
    width: 104,
    height: 90,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  thumbnailIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: '#FFFFFF66',
    alignItems: 'center',
    justifyContent: 'center',
  },

  playButton: {
    position: 'absolute',
    right: 7,
    bottom: 7,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  videoInfo: {
    flex: 1,
    paddingHorizontal: 11,
    justifyContent: 'center',
  },

  videoTitle: {
    color: TEXT,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },

  category: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 7,
  },

  languagePill: {
    backgroundColor: '#FCEAF1',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  languageText: {
    color: DEEP_PINK,
    fontSize: 9,
    fontWeight: '800',
  },

  duration: {
    color: MUTED,
    fontSize: 9,
  },

  cardArrow: {
    marginLeft: 1,
  },

  activitySection: {
    width: '100%',
    marginTop: 22,
  },

  activityCard: {
    width: '100%',
    minHeight: 65,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F4DCE6',
    shadowColor: '#A34E70',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FCEAF1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityInfo: {
    flex: 1,
    marginLeft: 10,
  },

  activityName: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '800',
  },

  activitySubtitle: {
    color: MUTED,
    fontSize: 9,
    marginTop: 3,
  },

  activityDuration: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 10,
  },

  editButton: {
    padding: 5,
  },

  noteCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFFFFCC',
    borderRadius: 14,
    padding: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5EEF5',
  },

  noteText: {
    flex: 1,
    color: '#718596',
    fontSize: 10,
    lineHeight: 15,
  },

  footer: {
    color: '#A77C8F',
    fontSize: 10,
    marginTop: 18,
    textAlign: 'center',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  editModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF8FB',
    borderRadius: 20,
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  modalTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
  },

  inputLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },

  durationInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#F0C9D9',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: TEXT,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 22,
  },

  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FCEAF1',
  },

  cancelText: {
    color: DEEP_PINK,
    fontSize: 12,
    fontWeight: '700',
  },

  saveButton: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: DEEP_PINK,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
