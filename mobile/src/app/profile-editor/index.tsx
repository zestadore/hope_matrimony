import { Link, router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/api-error';
import { useTranslation } from '@/lib/i18n/locale-context';
import { SECTION_LABEL_KEYS, SECTION_ROUTES } from '@/lib/section-routes';

type DashboardSection = { key: string; label: string; percent: number; complete: boolean };

type DashboardData = {
  completion: { percent: number; sections: DashboardSection[] };
};

export default function ProfileEditorScreen() {
  const t = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api
      .get<DashboardData>('/member/dashboard')
      .then((response) => {
        if (!cancelled) setData(response.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, t('editor.loadError')));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken, t]);

  const retry = () => {
    setIsLoading(true);
    setError(null);
    setReloadToken((n) => n + 1);
  };

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
            {t('editor.title')}
          </ThemedText>
          <View style={styles.backButton} />
        </View>

        <LanguageSwitcher style={styles.languageSwitcher} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="default" style={styles.subtitle} themeColor="textSecondary">
            {t('editor.subtitle')}
          </ThemedText>

          {isLoading ? (
            <ThemedView style={styles.card}>
              <ActivityIndicator color={Colors.primary} />
            </ThemedView>
          ) : error ? (
            <ThemedView style={styles.card}>
              <ThemedText type="default" style={styles.errorText}>
                {error}
              </ThemedText>
              <Pressable onPress={retry} style={styles.retryButton}>
                <ThemedText type="smallBold" style={styles.retryText}>
                  {t('common.tryAgain')}
                </ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            data && (
              <ThemedView style={styles.card}>
                <View style={styles.completionHeader}>
                  <ThemedText type="subtitle" style={styles.percentText}>
                    {data.completion.percent}%
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('home.profileComplete')}
                  </ThemedText>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${data.completion.percent}%` }]} />
                </View>

                <View style={styles.sectionList}>
                  {data.completion.sections.map((section) => (
                    <Link key={section.key} href={SECTION_ROUTES[section.key] ?? ('/profile-editor' as Href)} asChild>
                      <Pressable style={({ pressed }) => [styles.sectionRow, pressed && styles.sectionRowPressed]}>
                        <View style={styles.sectionRowTop}>
                          <View style={styles.sectionRowLeft}>
                            <SymbolView
                              tintColor={section.complete ? Colors.primary : Colors.textSecondary}
                              name={{
                                ios: section.complete ? 'checkmark.circle.fill' : 'circle',
                                android: section.complete ? 'check_circle' : 'radio_button_unchecked',
                                web: section.complete ? 'check_circle' : 'radio_button_unchecked',
                              }}
                              size={20}
                            />
                            <ThemedText
                              type="default"
                              style={section.complete ? styles.sectionLabelDone : styles.sectionLabel}
                              numberOfLines={1}>
                              {SECTION_LABEL_KEYS[section.key] ? t(SECTION_LABEL_KEYS[section.key]) : section.label}
                            </ThemedText>
                          </View>
                          <View style={styles.sectionRowRight}>
                            <ThemedText type="small" themeColor="textSecondary">
                              {section.percent}%
                            </ThemedText>
                            <SymbolView
                              tintColor={Colors.textSecondary}
                              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                              size={16}
                            />
                          </View>
                        </View>
                        <View style={styles.sectionMiniTrack}>
                          <View style={[styles.sectionMiniFill, { width: `${section.percent}%` }]} />
                        </View>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </ThemedView>
            )
          )}
        </ScrollView>
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
  languageSwitcher: {
    marginBottom: Spacing.two,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    color: Colors.secondary,
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: MaxContentWidth,
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
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  percentText: {
    fontSize: 28,
    lineHeight: 34,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,84,139,0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  sectionList: {
    gap: Spacing.one,
  },
  sectionRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,84,139,0.08)',
  },
  sectionRowPressed: {
    opacity: 0.7,
  },
  sectionRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
    minWidth: 0,
  },
  // The percentage and chevron are the row's fixed anchor: they keep their
  // size and the label ellipsises against them.
  sectionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 0,
  },
  sectionMiniTrack: {
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,84,139,0.10)',
    overflow: 'hidden',
  },
  sectionMiniFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    flexShrink: 1,
    minWidth: 0,
  },
  sectionLabelDone: {
    color: Colors.text,
    flexShrink: 1,
    minWidth: 0,
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
});
