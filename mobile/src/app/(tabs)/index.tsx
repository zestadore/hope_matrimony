import { Link, useFocusEffect, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageSwitcher } from '@/components/language-switcher';
import { SectionProgressCircle } from '@/components/section-progress-circle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';
import type { Locale } from '@/lib/i18n/translations';
import { SECTION_LABEL_KEYS, SECTION_ROUTES } from '@/lib/section-routes';

// Slack for anything the window width can't tell us about the real content
// width — on web `innerWidth` includes the scrollbar (~15px), and onLayout
// isn't usable here (it never fires for this grid under RN Web).
const WIDTH_SLACK = 16;

/**
 * The section grid adapts instead of using a fixed 4-up row: a row of 56px
 * rings overflows its cells on narrow phones, so we drop to 3 or 2 columns
 * first, then shrink the ring to fit the column that's left.
 *
 * Cells are sized as a percentage of the grid, never in pixels, so they fit
 * their real container exactly whatever the estimate below gets wrong. Only
 * the coarse column count and the ring size come from the window width, and
 * both tolerate the estimate being off: the estimate is deliberately low, so
 * the ring can only ever come out smaller than the space available, never
 * wider.
 */
function gridMetrics(windowWidth: number) {
  const estimate = Math.min(windowWidth - Spacing.four * 2, MaxContentWidth) - Spacing.four * 2 - WIDTH_SLACK;
  const columns = estimate < 260 ? 2 : estimate < 340 ? 3 : 4;
  const columnWidth = estimate / columns;
  const circleSize = Math.max(36, Math.min(56, Math.floor(columnWidth - Spacing.three)));
  return { columns, columnWidth: `${100 / columns}%` as const, circleSize };
}

type DashboardSection = { key: string; label: string; percent: number; complete: boolean };

type DashboardData = {
  member: { profile_id: string | null; status: string; member_since: string };
  completion: { percent: number; sections: DashboardSection[] };
};

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

// Month names have to follow the chosen language too, so this takes the
// active locale rather than always formatting as en-IN.
function formatMemberSince(dateString: string, locale: Locale): string {
  return new Date(dateString).toLocaleDateString(`${locale}-IN`, { month: 'short', year: 'numeric' });
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { t, locale } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { width: windowWidth } = useWindowDimensions();

  const { columnWidth, circleSize } = gridMetrics(windowWidth);

  const loadDashboard = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    api
      .get<DashboardData>('/member/dashboard')
      .then((response) => {
        if (!cancelled) setData(response.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, t('home.loadError')));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  // Refetch every time this tab regains focus, so returning here right after
  // saving a profile-editor section shows the up-to-date completion state.
  useFocusEffect(
    useCallback(() => {
      return loadDashboard();
    }, [loadDashboard]),
  );

  const retry = () => {
    loadDashboard();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>
          <View style={styles.header}>
            <View style={styles.headerIdentity}>
              <View style={styles.avatar}>
                <ThemedText type="smallBold" style={styles.avatarText}>
                  {user ? initials(user.name) : ''}
                </ThemedText>
              </View>
              <View style={styles.headerText}>
                <ThemedText type="default" style={styles.greeting} numberOfLines={1}>
                  {t('home.welcome', { name: user?.name ?? '' })}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {user?.mobile_number}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={logout}
              hitSlop={8}
              style={styles.logoutButton}
              accessibilityRole="button"
              accessibilityLabel={t('home.signOut')}>
              <SymbolView
                tintColor={Colors.secondary}
                name={{
                  ios: 'rectangle.portrait.and.arrow.right',
                  android: 'logout',
                  web: 'logout',
                }}
                size={18}
              />
            </Pressable>
          </View>

          <LanguageSwitcher style={styles.languageSwitcher} />

          <View style={styles.trustRow}>
            {data?.member.profile_id && (
              <View style={styles.trustBadge}>
                <ThemedText type="small" style={styles.trustText}>
                  {t('home.profileId', { id: data.member.profile_id })}
                </ThemedText>
              </View>
            )}
            <View style={styles.trustBadge}>
              <ThemedText type="small" style={styles.trustText}>
                {data?.member.status === 'active' ? t('home.statusActive') : (data?.member.status ?? '—')}
              </ThemedText>
            </View>
            {data?.member.member_since && (
              <View style={styles.trustBadge}>
                <ThemedText type="small" style={styles.trustText}>
                  {t('home.memberSince', { date: formatMemberSince(data.member.member_since, locale) })}
                </ThemedText>
              </View>
            )}
          </View>

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
              <>
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

                  <View style={styles.sectionGrid}>
                    {data.completion.sections.map((section) => (
                      // The grid-cell sizing lives on this plain View, not on the
                      // Pressable below — Link's `asChild` doesn't reliably forward
                      // width/alignItems style onto the rendered anchor on web, so
                      // sized cells silently collapsed to content size. The anchor
                      // instead stretches to this cell, and the inner View fills it.
                      <View key={section.key} style={[styles.sectionCell, { width: columnWidth }]}>
                        <Link href={SECTION_ROUTES[section.key] ?? ('/profile-editor' as Href)} asChild>
                          <Pressable style={({ pressed }) => [pressed && styles.sectionCellPressed]}>
                            {/* Centring lives on this inner View, not on the Pressable:
                                Link's `asChild` doesn't forward style onto the anchor it
                                renders on web, so `alignItems` was silently dropped and
                                the fixed-width ring sat flush left under a wider label. */}
                            <View style={styles.sectionCellInner}>
                              <SectionProgressCircle percent={section.percent} size={circleSize} />
                              <ThemedText
                                type="small"
                                style={section.complete ? styles.sectionLabelDone : styles.sectionLabel}
                                numberOfLines={2}>
                                {SECTION_LABEL_KEYS[section.key]
                                  ? t(SECTION_LABEL_KEYS[section.key])
                                  : section.label}
                              </ThemedText>
                            </View>
                          </Pressable>
                        </Link>
                      </View>
                    ))}
                  </View>

                  {data.completion.percent < 100 && (
                    <Link href={'/profile-editor' as Href} asChild>
                      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
                        <ThemedText type="default" style={styles.buttonText}>
                          {t('home.completeProfile')}
                        </ThemedText>
                      </Pressable>
                    </Link>
                  )}
                </ThemedView>

                <ThemedView style={styles.card}>
                  <ThemedText type="smallBold" style={styles.quickActionsTitle}>
                    {t('home.quickActions')}
                  </ThemedText>
                  <View style={styles.quickActions}>
                    <Link href={'/profile-editor' as Href} asChild>
                      <Pressable style={styles.quickAction}>
                        <ThemedText type="small" style={styles.quickActionText}>
                          {t('home.editProfile')}
                        </ThemedText>
                      </Pressable>
                    </Link>
                    <Link href="/profile-editor/photos" asChild>
                      <Pressable style={styles.quickAction}>
                        <ThemedText type="small" style={styles.quickActionText}>
                          {t('home.managePhotos')}
                        </ThemedText>
                      </Pressable>
                    </Link>
                    <Link href="/profile-editor/partner-preference" asChild>
                      <Pressable style={styles.quickAction}>
                        <ThemedText type="small" style={styles.quickActionText}>
                          {t('home.partnerPreference')}
                        </ThemedText>
                      </Pressable>
                    </Link>
                  </View>
                </ThemedView>
              </>
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
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Guarantees breathing room once the name ellipsises right up against the
    // sign-out button on narrow screens.
    gap: Spacing.three,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flexShrink: 1,
    // Without minWidth a flex child refuses to shrink below its content width,
    // so the name block would keep its full width and run under the sign-out
    // button instead of ellipsising.
    minWidth: 0,
  },
  headerText: {
    flexShrink: 1,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: Radius.medium,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.primaryText,
  },
  greeting: {
    fontWeight: '700',
  },
  logoutButton: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,84,139,0.16)',
  },
  languageSwitcher: {
    marginBottom: Spacing.three,
  },
  trustRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  trustBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.small,
    backgroundColor: 'rgba(0,84,139,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,84,139,0.16)',
  },
  trustText: {
    color: Colors.secondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
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
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.three,
  },
  // No columnGap: the cells' percentage widths sum to exactly 100%, and a gap
  // on top of that would overflow the row and wrap a column early. Horizontal
  // breathing room comes from padding inside each cell instead.
  sectionCell: {
    paddingHorizontal: Spacing.one,
  },
  sectionCellInner: {
    alignItems: 'center',
    gap: Spacing.one,
    width: '100%',
  },
  sectionCellPressed: {
    opacity: 0.7,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 15,
    // Two lines' worth, so a wrapped label doesn't push its row taller than
    // the neighbours and break the shared baseline across the grid.
    minHeight: 30,
  },
  sectionLabelDone: {
    color: Colors.text,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 15,
    minHeight: 30,
  },
  button: {
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
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
    color: Colors.primaryText,
  },
  quickActionsTitle: {
    color: Colors.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  quickAction: {
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  quickActionText: {
    color: Colors.secondary,
    fontWeight: '700',
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
