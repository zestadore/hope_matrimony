import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/lib/i18n/locale-context';

type MultiSelectFieldProps = {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  /**
   * Maps a stored option value to its display label. The values here are their
   * own stored value, so this translates what's shown without touching what's
   * saved. Defaults to showing the value as-is.
   */
  getLabel?: (value: string) => string;
};

export function MultiSelectField({
  label,
  values,
  options,
  onChange,
  placeholder,
  getLabel = (value) => value,
}: MultiSelectFieldProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);

  const placeholderText = placeholder ?? t('common.select');

  const toggle = (option: string) => {
    onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option]);
  };

  return (
    <ThemedView style={[styles.field, styles.transparent]}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable onPress={() => setOpen(true)} style={styles.input}>
        <ThemedText type="default" style={values.length ? styles.valueText : styles.placeholderText} numberOfLines={2}>
          {values.length ? values.map(getLabel).join(', ') : placeholderText}
        </ThemedText>
        <SymbolView
          tintColor={Colors.textSecondary}
          name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
          size={16}
        />
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheetWrap} onPress={(event) => event.stopPropagation()}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.sheet}>
                <View style={styles.sheetHeader}>
                  <ThemedText type="smallBold" style={styles.sheetTitle}>
                    {label}
                  </ThemedText>
                  <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                    <ThemedText type="smallBold" style={styles.closeText}>
                      {t('common.done')}
                    </ThemedText>
                  </Pressable>
                </View>

                <FlatList
                  data={options}
                  keyExtractor={(item) => item}
                  style={styles.list}
                  renderItem={({ item }) => {
                    const checked = values.includes(item);
                    return (
                      <Pressable style={styles.option} onPress={() => toggle(item)}>
                        <ThemedText type="default" style={[styles.optionText, checked && styles.optionSelected]}>
                          {getLabel(item)}
                        </ThemedText>
                        {checked && (
                          <SymbolView
                            tintColor={Colors.primary}
                            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                            size={16}
                          />
                        )}
                      </Pressable>
                    );
                  }}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  label: {
    color: Colors.secondary,
  },
  input: {
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderColor: 'rgba(11,29,43,0.14)',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  valueText: {
    color: Colors.text,
    flexShrink: 1,
  },
  placeholderText: {
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,29,43,0.35)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    maxHeight: '75%',
  },
  sheet: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: Colors.secondary,
  },
  closeText: {
    color: Colors.primary,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  // Option labels are server data and can be long — let them wrap instead of
  // running under the checkmark.
  optionText: {
    flexShrink: 1,
    minWidth: 0,
  },
  optionSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,84,139,0.08)',
  },
});
