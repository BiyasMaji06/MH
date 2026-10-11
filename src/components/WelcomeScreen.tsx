import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Props = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; line1: string; line2: string }[] = [
  { icon: 'woman', title: 'Mumwise', line1: 'Healthy Mothers', line2: 'Brighter Tomorrows' },
  { icon: 'pulse', title: 'Track Your Health', line1: 'Blood pressure, weight,', line2: 'glucose & more' },
  { icon: 'chatbubbles', title: 'Chat with SIA', line1: 'Your AI pregnancy', line2: 'assistant, anytime' },
];

export default function WelcomeScreen({ onGetStarted, onSignIn }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  return (
    <LinearGradient colors={['#FDEDF3', '#FBE0E9', '#F9D5E5']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumEnd}
          style={styles.carousel}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              <View style={styles.illustrationWrap}>
                <View style={styles.illustrationCircle}>
                  <Ionicons name="heart" size={40} color="#E8558D" style={styles.heartIcon} />
                  <Ionicons name={slide.icon} size={90} color="#C24E72" />
                </View>
              </View>

              <View style={styles.textBlock}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.line1}</Text>
                <Text style={styles.subtitle}>{slide.line2}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.bottomBlock}>
          <TouchableOpacity
            style={styles.getStartedBtn}
            activeOpacity={0.85}
            onPress={onGetStarted}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>

          <Text style={styles.tagline}>Your Pregnancy Partner At Every Step</Text>

          <TouchableOpacity onPress={onSignIn} style={styles.signInRow}>
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between', paddingVertical: 40 },
  carousel: { flexGrow: 0 },
  slide: { alignItems: 'center', paddingTop: 40 },
  illustrationWrap: { alignItems: 'center' },
  illustrationCircle: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: '#FFFFFF88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: { position: 'absolute', top: 20, right: 30 },
  textBlock: { alignItems: 'center', marginTop: 10 },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#B23A63',
    fontFamily: 'System',
    textAlign: 'center',
  },
  subtitle: { fontSize: 15, color: '#8A4A63', marginTop: 2 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E8B7C8' },
  dotActive: { backgroundColor: '#E8558D', width: 18 },
  bottomBlock: { width: '100%', alignItems: 'center', paddingHorizontal: 30 },
  getStartedBtn: {
    backgroundColor: '#E8558D',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#E8558D',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  getStartedText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  tagline: { color: '#A9607A', fontSize: 13, marginTop: 14, textAlign: 'center' },
  signInRow: { marginTop: 18 },
  signInText: { color: '#8A4A63', fontSize: 13 },
  signInLink: { color: '#E8558D', fontWeight: '700' },
});