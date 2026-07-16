import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/lib/i18n/locale-context';

type SectionScreenProps = {
  title: string;
  isLoading: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  saveError?: string | null;
  isSaving: boolean;
  onSave: () => void;
  children: ReactNode;
};

export function SectionScreen({
  title,
  isLoading,
  loadError,
  onRetry,
  saveError,
  isSaving,
  onSave,
  children,
}: SectionScreenProps) {
  const t = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}>
            <SymbolView
              tintColor={Colors.secondary}
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
            />
          </Pressable>
          <ThemedText type="smallBold" style={styles.headerTitle} numberOfLines={1}>
            {title}
          </ThemedText>
          <View style={styles.backButton} />
        </View>

        <LanguageSwitcher style={styles.languageSwitcher} />

        {isLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : loadError ? (
          <View style={styles.centerFill}>
            <ThemedView style={styles.card}>
              <ThemedText type="default" style={styles.errorText}>
                {loadError}
              </ThemedText>
              {onRetry && (
                <Pressable onPress={onRetry} style={styles.retryButton}>
                  <ThemedText type="smallBold" style={styles.retryText}>
                    {t('common.tryAgain')}
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>

            <View style={styles.footer}>
              {saveError && (
                <ThemedText type="small" style={styles.saveErrorText}>
                  {saveError}
                </ThemedText>
              )}
              <Pressable
                onPress={onSave}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  isSaving && styles.buttonDisabled,
                ]}>
                {isSaving ? (
                  <ActivityIndicator color={Colors.primaryText} />
                ) : (
                  <ThemedText type="default" style={styles.buttonText}>
                    {t('common.save')}
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  languageSwitcher: {
    marginBottom: Spacing.two,
  },
  headerTitle: {
    color: Colors.secondary,
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'center',
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
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
  errorText: {
    color: Colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'center',
  },
  retryText: {
    color: Colors.secondary,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  saveErrorText: {
    color: Colors.danger,
    textAlign: 'center',
    maxWidth: MaxContentWidth,
  },
  button: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
    color: Colors.primaryText,
  },
});
