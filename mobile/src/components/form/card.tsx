import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export function Card({ children }: { children: ReactNode }) {
  return <ThemedView style={styles.card}>{children}</ThemedView>;
}

export function CardSectionTitle({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="smallBold" style={styles.sectionTitle}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Radius.large,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(0,84,139,0.10)',
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#0B1D2B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  sectionTitle: {
    color: Colors.secondary,
    marginTop: Spacing.one,
  },
});
