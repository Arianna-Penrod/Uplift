import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#4FB6D6', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
        />
      }
    >
      {/* App Title + Slogan */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Uplift</ThemedText>
        <ThemedText type="default" style={styles.slogan}>
          Elevate your future
        </ThemedText>
      </ThemedView>

      {/* Level 1 */}
      <Link href="/levels/1" asChild>
        <ThemedView style={styles.levelCard}>
          <Image
            source={require('@/assets/images/level1.png')}
            style={styles.levelIcon}
          />
          <ThemedView>
            <ThemedText type="subtitle">Level 1: Resume</ThemedText>
            <ThemedText>Tap to open</ThemedText>
          </ThemedView>
        </ThemedView>
      </Link>

      {/* Level 2 */}
      <ThemedView style={[styles.levelCard, styles.locked]}>
        <Image
          source={require('@/assets/images/level2.png')}
          style={styles.levelIcon}
        />
        <ThemedView>
          <ThemedText type="subtitle">Level 2: Elevator Pitch</ThemedText>
          <ThemedText style={styles.lockText}>Locked 🔒</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Level 3 */}
      <ThemedView style={[styles.levelCard, styles.locked]}>
        <Image
          source={require('@/assets/images/level3.png')}
          style={styles.levelIcon}
        />
        <ThemedView>
          <ThemedText type="subtitle">Level 3: Professional Profile</ThemedText>
          <ThemedText style={styles.lockText}>Locked 🔒</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Level 4 */}
      <ThemedView style={[styles.levelCard, styles.locked]}>
        <Image
          source={require('@/assets/images/level4.png')}
          style={styles.levelIcon}
        />
        <ThemedView>
          <ThemedText type="subtitle">Level 4: Technical Interview</ThemedText>
          <ThemedText style={styles.lockText}>Locked 🔒</ThemedText>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  slogan: {
    opacity: 0.7,
    marginTop: 4,
  },
  logo: {
    height: 160,
    width: 160,
    alignSelf: 'center',
    marginTop: 40,
    resizeMode: 'contain',
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    marginBottom: 14,
  },
  levelIcon: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
  locked: {
    opacity: 0.45,
  },
  lockText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
