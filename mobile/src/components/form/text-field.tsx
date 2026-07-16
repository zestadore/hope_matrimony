import { StyleSheet, TextInput, type KeyboardTypeOptions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  multiline,
  keyboardType,
  maxLength,
  autoCapitalize,
}: TextFieldProps) {
  return (
    <ThemedView style={[styles.field, styles.transparent]}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && styles.multilineInput]}
      />
      {error ? (
        <ThemedText type="small" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="small" style={styles.hintText}>
          {hint}
        </ThemedText>
      ) : null}
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
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  errorText: {
    color: Colors.danger,
    paddingHorizontal: Spacing.two,
  },
  hintText: {
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.two,
  },
});
