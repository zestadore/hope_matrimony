import { Pressable, StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/lib/i18n/locale-context';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/translations';

/**
 * Segmented English/Malayalam toggle. Deliberately shows both options at once
 * rather than hiding them behind a menu — most users reach for it on the very
 * first screen they see, before they can read the labels around it.
 */
export function LanguageSwitcher({ style }: { style?: StyleProp<ViewStyle> }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <View style={[styles.row, style]} accessibilityRole="radiogroup" accessibilityLabel={t('common.language')}>
      {LOCALES.map((code) => {
        const selected = code === locale;

        return (
          <Pressable
            key={code}
            onPress={() => setLocale(code)}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={LOCALE_LABELS[code]}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && styles.pressed,
            ]}>
            <ThemedText type="small" style={[styles.text, selected && styles.textSelected]}>
              {LOCALE_LABELS[code]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 3,
    gap: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  option: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
  },
  pressed: {
    opacity: 0.75,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: Colors.secondary,
  },
  textSelected: {
    color: Colors.primaryText,
  },
});
