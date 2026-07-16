import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/form/card';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { API_BASE_URL } from '@/lib/api';
import { getErrorMessage } from '@/lib/api-error';
import { useTranslation } from '@/lib/i18n/locale-context';
import { deleteMemberPhoto, fetchProfileBundle, uploadMemberPhoto, type MemberPhotoData } from '@/lib/profile-api';

const MAX_PHOTOS = 4;

/**
 * Builds a photo URL against the origin this app talks to, rather than trusting
 * the absolute `url` the backend derives from its own APP_URL — on a device or
 * emulator those hosts differ, and only API_BASE_URL is reachable. `path` is
 * relative to the backend's public disk, which is served under /storage.
 */
function resolvePhotoUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${origin}/storage/${path.replace(/^\/+/, '')}`;
}

export default function PhotosScreen() {
  const t = useTranslation();
  const [photos, setPhotos] = useState<MemberPhotoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchProfileBundle()
      .then((bundle) => {
        if (!cancelled) setPhotos(bundle.photos);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, t('photos.loadError')));
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
    setLoadError(null);
    setReloadToken((n) => n + 1);
  };

  const pickAndUpload = async () => {
    setActionError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setActionError(t('photos.permissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    setBusyKey('upload');
    try {
      const updated = await uploadMemberPhoto({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
      setPhotos(updated);
    } catch (err) {
      setActionError(getErrorMessage(err, t('photos.uploadError')));
    } finally {
      setBusyKey(null);
    }
  };

  const removePhoto = async (photo: MemberPhotoData) => {
    setActionError(null);
    setBusyKey(`delete-${photo.id}`);
    try {
      const updated = await deleteMemberPhoto(photo.id);
      setPhotos(updated);
    } catch (err) {
      setActionError(getErrorMessage(err, t('photos.removeError')));
    } finally {
      setBusyKey(null);
    }
  };

  const slots = Array.from({ length: MAX_PHOTOS }, (_, index) => photos[index] ?? null);

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
          <ThemedText type="smallBold" style={styles.headerTitle}>
            {t('photos.title')}
          </ThemedText>
          <View style={styles.backButton} />
        </View>

        <LanguageSwitcher style={styles.languageSwitcher} />

        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : loadError ? (
            <Card>
              <ThemedText type="default" style={styles.errorText}>
                {loadError}
              </ThemedText>
              <Pressable onPress={retry} style={styles.retryButton}>
                <ThemedText type="smallBold" style={styles.retryText}>
                  {t('common.tryAgain')}
                </ThemedText>
              </Pressable>
            </Card>
          ) : (
            <Card>
              <ThemedText type="default" themeColor="textSecondary" style={styles.hint}>
                {t('photos.hint', { max: MAX_PHOTOS })}
              </ThemedText>

              {actionError && (
                <ThemedText type="small" style={styles.errorText}>
                  {actionError}
                </ThemedText>
              )}

              <View style={styles.grid}>
                {slots.map((photo, index) =>
                  photo ? (
                    <View key={photo.id} style={styles.slot}>
                      <Image source={{ uri: resolvePhotoUrl(photo.path) }} style={styles.photo} contentFit="cover" />
                      {photo.is_default && (
                        <View style={styles.badge}>
                          <ThemedText type="small" style={styles.badgeText}>
                            {t('photos.primary')}
                          </ThemedText>
                        </View>
                      )}
                      <Pressable
                        onPress={() => removePhoto(photo)}
                        disabled={busyKey === `delete-${photo.id}`}
                        style={styles.removeButton}
                        accessibilityRole="button"
                        accessibilityLabel={t('photos.remove')}>
                        {busyKey === `delete-${photo.id}` ? (
                          <ActivityIndicator size="small" color={Colors.primaryText} />
                        ) : (
                          <SymbolView
                            tintColor={Colors.primaryText}
                            name={{ ios: 'xmark', android: 'close', web: 'close' }}
                            size={14}
                          />
                        )}
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      key={`empty-${index}`}
                      onPress={pickAndUpload}
                      disabled={busyKey === 'upload'}
                      style={styles.slotEmpty}>
                      {busyKey === 'upload' ? (
                        <ActivityIndicator color={Colors.secondary} />
                      ) : (
                        <SymbolView
                          tintColor={Colors.secondary}
                          name={{ ios: 'plus', android: 'add', web: 'add' }}
                          size={24}
                        />
                      )}
                    </Pressable>
                  ),
                )}
              </View>
            </Card>
          )}
        </View>
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
  },
  headerTitle: {
    color: Colors.secondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  hint: {
    marginBottom: Spacing.one,
  },
  errorText: {
    color: Colors.danger,
  },
  retryButton: {
    alignSelf: 'center',
  },
  retryText: {
    color: Colors.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  slot: {
    width: 140,
    height: 140,
    borderRadius: Radius.medium,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundElement,
  },
  slotEmpty: {
    width: 140,
    height: 140,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderColor: 'rgba(11,29,43,0.14)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    left: Spacing.one,
    bottom: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.small,
    backgroundColor: 'rgba(0,84,139,0.85)',
  },
  badgeText: {
    color: Colors.primaryText,
    fontSize: 11,
    lineHeight: 14,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 24,
    height: 24,
    borderRadius: Radius.small,
    backgroundColor: 'rgba(11,29,43,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
