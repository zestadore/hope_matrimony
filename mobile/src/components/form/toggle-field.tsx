import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

type ToggleFieldProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleField({ label, value, onChange }: ToggleFieldProps) {
  return (
    <View style={styles.row}>
      <ThemedText type="default" style={styles.label}>
        {label}
      </ThemedText>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(11,29,43,0.14)', true: Colors.primary }}
        thumbColor={Colors.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
    gap: Spacing.three,
  },
  // The Switch is a fixed size and can't give ground, so a long label has to
  // wrap rather than push into it.
  label: {
    flexShrink: 1,
    minWidth: 0,
  },
});
