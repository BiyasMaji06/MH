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
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

const SLIDES: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  line1: string;
  line2: string;
  description: string;
}[] = [
  {
    icon: 'woman-outline',
    title: 'MumWise',
    line1: 'Healthy Mothers,',
    line2: 'Brighter Tomorrows',
    description: 'Your pregnancy journey deserves care at every step.',
  },
  {
    icon: 'pulse-outline',
    title: 'Track Your Health',
    line1: 'Stay connected with',
    line2: 'your wellbeing',
    description: 'Keep track of your health, daily habits and progress.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Chat with SIA',
    line1: 'A caring companion',
    line2: 'through your journey',
    description: 'Find helpful pregnancy information and everyday support.',
  },
];

export default function WelcomeScreen({
  onGetStarted,
  onSignIn,
}: Props) {
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const compact = height < 700;
  const circleSize = Math.min(width * 0.67, compact ? 225 : 265);

  const handleMomentumEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / width
    );
    setActiveIndex(
      Math.max(0, Math.min(index, SLIDES.length - 1))
    );
  };

  return (
    <LinearGradient
      colors={['#FFF7FA', '#FDEDF3', '#F9DCE8']}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.brandHeader}>
          <View style={styles.brandIcon}>
            <Ionicons
              name="heart"
              size={18}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.brandName}>MumWise</Text>
        </View>

        <View style={styles.carouselArea}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            bounces={false}
            onMomentumScrollEnd={handleMomentumEnd}
            style={styles.carousel}
          >
            {SLIDES.map((slide, index) => (
              <View
                key={index}
                style={[styles.slide, { width }]}
              >
                <View
                  style={[
                    styles.illustrationCircle,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                    },
                  ]}
                >
                  <View style={styles.innerCircle}>
                    <Ionicons
                      name={slide.icon}
                      size={circleSize * 0.43}
                      color="#B23A63"
                    />
                  </View>

                  <View style={styles.floatingHeart}>
                    <Ionicons
                      name="heart"
                      size={23}
                      color="#E8558D"
                    />
                  </View>

                  <View style={styles.floatingSparkle}>
                    <Ionicons
                      name="sparkles"
                      size={22}
                      color="#D88BA7"
                    />
                  </View>

                  <View style={styles.floatingCircle} />
                </View>

                <View style={styles.textBlock}>
                  <Text style={styles.title}>
                    {slide.title}
                  </Text>

                  <Text style={styles.slideHeading}>
                    {slide.line1}
                  </Text>

                  <Text style={styles.slideHeading}>
                    {slide.line2}
                  </Text>

                  <Text style={styles.description}>
                    {slide.description}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.dotsRow}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomBlock}>
          <TouchableOpacity
            style={styles.getStartedBtn}
            activeOpacity={0.85}
            onPress={onGetStarted}
          >
            <Text style={styles.getStartedText}>
              Get Started
            </Text>
            <Ionicons
              name="arrow-forward"
              size={19}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.tagline}>
            Your pregnancy partner at every step
          </Text>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={onSignIn}
              activeOpacity={0.7}
              style={styles.signInButton}
            >
              <Text style={styles.signInLink}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Made with love for mothers and little ones
          </Text>
        </View>
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
    justifyContent: 'space-between',
    paddingBottom: 12,
  },

  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 9,
  },

  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#E8558D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#B23A63',
    letterSpacing: 0.3,
  },

  carouselArea: {
    flex: 1,
    justifyContent: 'center',
  },

  carousel: {
    flexGrow: 0,
  },

  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 8,
  },

  illustrationCircle: {
    backgroundColor: '#FFFFFF99',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F6D5E1',
  },

  innerCircle: {
    width: '76%',
    height: '76%',
    borderRadius: 999,
    backgroundColor: '#FCE5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  floatingHeart: {
    position: 'absolute',
    top: '12%',
    right: '13%',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  floatingSparkle: {
    position: 'absolute',
    bottom: '17%',
    left: '9%',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  floatingCircle: {
    position: 'absolute',
    top: '35%',
    left: '6%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EFAAC2',
  },

  textBlock: {
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 15,
  },

  title: {
    fontSize: 29,
    fontWeight: '800',
    color: '#B23A63',
    textAlign: 'center',
    marginBottom: 12,
  },

  slideHeading: {
    fontSize: 19,
    fontWeight: '700',
    color: '#65384B',
    textAlign: 'center',
    lineHeight: 27,
  },

  description: {
    fontSize: 13,
    color: '#987083',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
    maxWidth: 290,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    marginBottom: 8,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E8B7C8',
  },

  dotActive: {
    width: 23,
    backgroundColor: '#E8558D',
  },

  bottomBlock: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  getStartedBtn: {
    width: '100%',
    backgroundColor: '#E8558D',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#B23A63',
    shadowOpacity: 0.23,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  tagline: {
    color: '#A9607A',
    fontSize: 12,
    marginTop: 13,
    textAlign: 'center',
  },

  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 19,
    gap: 4,
  },

  signInText: {
    color: '#8A4A63',
    fontSize: 13,
  },

  signInButton: {
    paddingVertical: 5,
    paddingHorizontal: 3,
  },

  signInLink: {
    color: '#E8558D',
    fontSize: 13,
    fontWeight: '800',
  },

  footer: {
    color: '#B28A9B',
    fontSize: 10,
    marginTop: 17,
    textAlign: 'center',
  },
});
