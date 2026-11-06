
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';

const PINK = '#E8558D';
const DEEP_PINK = '#B23A63';
const TEXT = '#512D3D';
const MUTED = '#9A7585';

type LearnVideo = {
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

const VIDEOS: LearnVideo[] = [
  {
    id: 'pregnancy-companion-english',
    title: 'Pregnancy Companion Guide',
    duration: '1 min 52 sec',
    language: 'English',
    category: 'Pregnancy guidance',
    icon: 'book',
    colors: ['#C8DDF4', '#8EB7E3'],
    kind: 'local',
    source: require('../../assets/videos/Pregnancy Companion Guide.mp4'),
  },
  {
    id: 'pregnancy-companion-hindi',
    title: 'Pregnancy Companion Guide (Hindi)',
    duration: '2 min 19 sec',
    language: 'Hindi',
    category: 'Pregnancy guidance',
    icon: 'book',
    colors: ['#D5C9F0', '#A99AD8'],
    kind: 'local',
    source: require('../../assets/videos/Pregnancy Companion Guide (Hindi).mp4'),
  },
  {
    id: 'first-trimester-local',
    title: 'First Trimester: What to Expect',
    duration: '1 min 31 sec',
    language: 'Hindi',
    category: 'First trimester',
    icon: 'heart',
    colors: ['#F8B7C9', '#E8799E'],
    kind: 'local',
    source: require('../../assets/videos/First Trimester.mp4'),
  },
  {
    id: 'first-trimester-facts',
    title: 'Important Facts Regarding First Trimester',
    duration: '2 min 7 sec',
    language: 'English',
    category: 'First trimester',
    icon: 'information-circle',
    colors: ['#F7C9B5', '#E99A83'],
    kind: 'youtube',
    youtubeId: 'mAbKepdNqYA',
  },
  {
    id: 'first-trimester-ultrasound',
    title: 'First Trimester Ultrasound',
    duration: '1 min 42 sec',
    language: 'English',
    category: 'Tests & scans',
    icon: 'scan',
    colors: ['#C8DDF4', '#8EB7E3'],
    kind: 'youtube',
    youtubeId: 'PYaPcvc831Y',
  },
  {
    id: 'serum-screening',
    title: 'First Trimester Serum Screening Test',
    duration: '2 min 47 sec',
    language: 'English',
    category: 'Tests & scans',
    icon: 'flask',
    colors: ['#D7D0F2', '#A99AE0'],
    kind: 'youtube',
    youtubeId: '2kc7lUxlqmY',
  },
  {
    id: 'morning-sickness',
    title: 'Morning Sickness & Upset Stomach',
    duration: '2 min 52 sec',
    language: 'English',
    category: 'Common symptoms',
    icon: 'cafe',
    colors: ['#F6D9A9', '#E9B96E'],
    kind: 'youtube',
    youtubeId: '-AvU6N-RuxU',
  },
  {
    id: 'cravings',
    title: 'Cravings During Pregnancy',
    duration: '4 min 22 sec',
    language: 'English',
    category: 'Nutrition & wellbeing',
    icon: 'nutrition',
    colors: ['#C9E6D2', '#91C7A5'],
    kind: 'youtube',
    youtubeId: 'xBy1Fz_VQV8',
  },
  {
    id: 'constipation',
    title: 'Constipation During Pregnancy',
    duration: '2 min 2 sec',
    language: 'English',
    category: 'Common symptoms',
    icon: 'leaf',
    colors: ['#D8E7C3', '#A9C68A'],
    kind: 'youtube',
    youtubeId: '1H4oAO1X86s',
  },
  {
    id: 'vaccines',
    title: 'Vaccines For Preventing Infection',
    duration: '4 min 1 sec',
    language: 'English',
    category: 'Preventive care',
    icon: 'shield-checkmark',
    colors: ['#C6E4E8', '#8CC7CE'],
    kind: 'youtube',
    youtubeId: 'BGaspa0bpM4',
  },
  {
    id: 'second-trimester-local',
    title: 'Second Trimester: What to Expect',
    duration: '3 min 04 sec',
    language: 'Hindi',
    category: 'Second trimester',
    icon: 'sparkles',
    colors: ['#D5C9F0', '#A99AD8'],
    kind: 'local',
    source: require('../../assets/videos/Second Trimester.mp4'),
  }
];

export default function LearnScreen() {
  const { width } = useWindowDimensions();
  const [selectedVideo, setSelectedVideo] =
    useState<LearnVideo | null>(null);

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = false;
  });

  useEffect(() => {
    if (selectedVideo?.kind === 'local' && selectedVideo.source) {
      player.replace(selectedVideo.source);
      player.play();
    } else {
      player.pause();
    }
  }, [selectedVideo, player]);

  const closePlayer = () => {
    player.pause();
    setSelectedVideo(null);
  };

  const playVideo = async (video: LearnVideo) => {
    if (video.kind === 'local') {
      setSelectedVideo(video);
      return;
    }

    const url = `https://www.youtube.com/watch?v=${video.youtubeId}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Unable to open video',
        'Please check your internet connection and try again.',
      );
    }
  };

  const cardWidth = Math.min(width - 40, 620);

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

          <Text style={styles.headerTitle}>Learn</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.intro}>
            <Text style={styles.pageTitle}>
              Learn at your own pace
            </Text>
            <Text style={styles.pageSubtitle}>
              Helpful videos for each stage of your pregnancy journey.
            </Text>
          </View>

          <View style={styles.videoList}>
            {VIDEOS.map((video) => (
              <TouchableOpacity
                key={video.id}
                activeOpacity={0.84}
                style={[styles.videoCard, { width: cardWidth }]}
                onPress={() => playVideo(video)}
              >
                <LinearGradient
                  colors={video.colors}
                  style={styles.thumbnail}
                >
                  <View style={styles.thumbnailIcon}>
                    <Ionicons
                      name={video.icon}
                      size={31}
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

          <View style={styles.noteCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#478FC7"
            />
            <Text style={styles.noteText}>
              Video information is for learning and does not replace
              advice from your doctor.
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

          <View style={styles.navItem}>
            <Ionicons
              name="book"
              size={21}
              color={PINK}
            />
            <Text style={styles.navLabelActive}>Learn</Text>
          </View>

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
          visible={selectedVideo !== null}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={closePlayer}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={closePlayer}
                style={styles.modalClose}
              >
                <Ionicons
                  name="close"
                  size={25}
                  color={TEXT}
                />
              </TouchableOpacity>

              <Text
                style={styles.modalTitle}
                numberOfLines={2}
              >
                {selectedVideo?.title ?? 'Video'}
              </Text>
            </View>

            {selectedVideo?.kind === 'local' && (
              <View style={styles.playerWrap}>
                <VideoView
                  player={player}
                  style={styles.videoPlayer}
                  contentFit="contain"
                  nativeControls
                />
              </View>
            )}

            <View style={styles.modalMeta}>
              <Text style={styles.modalLanguage}>
                Language: {selectedVideo?.language}
              </Text>

              <Text style={styles.modalHint}>
                Take a moment to pause and note any questions for
                your next antenatal visit.
              </Text>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

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

  headerSpacer: { width: 38 },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
    alignItems: 'center',
  },

  intro: {
    width: '100%',
    marginBottom: 17,
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

  cardArrow: { marginLeft: 1 },

  noteCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFFFFCC',
    borderRadius: 14,
    padding: 12,
    marginTop: 18,
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

  navLabelActive: {
    fontSize: 9,
    color: PINK,
    fontWeight: '700',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF8FB',
  },

  modalHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3D4E0',
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCEAF1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
  },

  playerWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#171217',
    marginTop: 20,
  },

  videoPlayer: {
    width: '100%',
    height: '100%',
  },

  modalMeta: { padding: 18 },

  modalLanguage: {
    color: DEEP_PINK,
    fontSize: 12,
    fontWeight: '800',
  },

  modalHint: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
});
