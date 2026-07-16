import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/lib/i18n/locale-context';

export type SelectOption = { label: string; value: string | number };

type SelectFieldProps = {
  label: string;
  value: string | number | null;
  options: SelectOption[];
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  disabledHint?: string;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
  disabled,
  disabledHint,
}: SelectFieldProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const placeholderText = placeholder ?? t('common.select');

  const selected = options.find((option) => option.value === value);
  const showSearch = options.length > 8;

  const filteredOptions = useMemo(() => {
    if (!showSearch || search.trim() === '') return options;
    const query = search.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search, showSearch]);

  return (
    <ThemedView style={[styles.field, styles.transparent]}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={[styles.input, disabled && styles.inputDisabled]}>
        <ThemedText
          type="default"
          style={selected ? styles.valueText : styles.placeholderText}
          numberOfLines={1}>
          {selected?.label ?? placeholderText}
        </ThemedText>
        <SymbolView
          tintColor={Colors.textSecondary}
          name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
          size={16}
        />
      </Pressable>
      {error ? (
        <ThemedText type="small" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : disabled && disabledHint ? (
        <ThemedText type="small" style={styles.hintText}>
          {disabledHint}
        </ThemedText>
      ) : null}

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
                      {t('common.close')}
                    </ThemedText>
                  </Pressable>
                </View>

                {showSearch && (
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t('common.search')}
                    placeholderTextColor={Colors.textSecondary}
                    style={styles.searchInput}
                  />
                )}

                <FlatList
                  data={filteredOptions}
                  keyExtractor={(item) => String(item.value)}
                  style={styles.list}
                  keyboardShouldPersistTaps="handled"
                  ListHeaderComponent={
                    value !== null ? (
                      <Pressable
                        style={styles.option}
                        onPress={() => {
                          onChange(null);
                          setOpen(false);
                          setSearch('');
                        }}>
                        <ThemedText type="default" themeColor="textSecondary">
                          {t('common.clearSelection')}
                        </ThemedText>
                      </Pressable>
                    ) : null
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.option}
                      onPress={() => {
                        onChange(item.value);
                        setOpen(false);
                        setSearch('');
                      }}>
                      <ThemedText
                        type="default"
                        style={[styles.optionText, item.value === value && styles.optionSelected]}>
                        {item.label}
                      </ThemedText>
                      {item.value === value && (
                        <SymbolView
                          tintColor={Colors.primary}
                          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                          size={16}
                        />
                      )}
                    </Pressable>
                  )}
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
  },
  inputDisabled: {
    opacity: 0.5,
  },
  valueText: {
    color: Colors.text,
    flexShrink: 1,
  },
  placeholderText: {
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  errorText: {
    color: Colors.danger,
    paddingHorizontal: Spacing.two,
  },
  hintText: {
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.two,
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
  searchInput: {
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderColor: 'rgba(11,29,43,0.14)',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    fontSize: 16,
    color: Colors.text,
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
