import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, CardSectionTitle } from '@/components/form/card';
import { SectionScreen } from '@/components/form/section-screen';
import { SelectField, type SelectOption } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { ToggleField } from '@/components/form/toggle-field';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api-error';
import { useTranslation } from '@/lib/i18n/locale-context';
import { toNullableInt, toNullableString } from '@/lib/form-utils';
import {
  emptyCareerRow,
  fetchIndustries,
  fetchProfileBundle,
  saveProfileSection,
  type LookupOption,
  type MemberCareerRow,
} from '@/lib/profile-api';

function toOptions(items: LookupOption[]): SelectOption[] {
  return items.map((item) => ({ label: item.name, value: item.id }));
}

type Row = MemberCareerRow & { key: string };

let rowKeySeq = 0;
function nextRowKey() {
  rowKeySeq += 1;
  return `career-row-${rowKeySeq}`;
}

function withKeys(rows: MemberCareerRow[]): Row[] {
  return rows.map((row) => ({ ...row, key: nextRowKey() }));
}

function stripKeys(rows: Row[]): MemberCareerRow[] {
  return rows.map(({ key: _key, ...row }) => row);
}

function CareerRowCard({
  row,
  index,
  industries,
  onChange,
  onRemove,
}: {
  row: Row;
  index: number;
  industries: LookupOption[];
  onChange: <K extends keyof MemberCareerRow>(key: K, value: MemberCareerRow[K]) => void;
  onRemove: () => void;
}) {
  const t = useTranslation();

  return (
    <Card>
      <View style={styles.rowHeader}>
        <CardSectionTitle>{t('career.rowTitle', { n: index + 1 })}</CardSectionTitle>
        <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('career.remove')}>
          <SymbolView tintColor={Colors.danger} name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={18} />
        </Pressable>
      </View>
      <TextField
        label={t('career.designation')}
        value={row.designation ?? ''}
        onChangeText={(value) => onChange('designation', toNullableString(value))}
      />
      <TextField
        label={t('career.company')}
        value={row.company ?? ''}
        onChangeText={(value) => onChange('company', toNullableString(value))}
      />
      <SelectField
        label={t('career.industry')}
        value={row.industry_id}
        options={toOptions(industries)}
        onChange={(value) => onChange('industry_id', value as number | null)}
      />
      <TextField
        label={t('career.startYear')}
        value={row.start_year !== null ? String(row.start_year) : ''}
        onChangeText={(value) => onChange('start_year', toNullableInt(value))}
        keyboardType="number-pad"
        placeholder="2015"
      />
      <TextField
        label={t('career.endYear')}
        value={row.end_year !== null ? String(row.end_year) : ''}
        onChangeText={(value) => onChange('end_year', toNullableInt(value))}
        keyboardType="number-pad"
        placeholder="2020"
      />
      <ToggleField label={t('career.currentlyWorking')} value={row.is_current} onChange={(value) => onChange('is_current', value)} />
    </Card>
  );
}

export default function CareerScreen() {
  const t = useTranslation();
  const [industries, setIndustries] = useState<LookupOption[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchProfileBundle(), fetchIndustries()])
      .then(([bundle, industryOptions]) => {
        if (cancelled) return;
        setIndustries(industryOptions);
        setRows(withKeys(bundle.careers));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, t('career.loadError')));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken, t]);

  const updateRow = (key: string) => <K extends keyof MemberCareerRow>(field: K, value: MemberCareerRow[K]) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, { ...emptyCareerRow, key: nextRowKey() }]);
  const removeRow = (key: string) => setRows((prev) => prev.filter((row) => row.key !== key));

  const retry = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadToken((n) => n + 1);
  };

  const onSave = async () => {
    setSaveError(null);
    setIsSaving(true);

    try {
      await saveProfileSection({ careers: stripKeys(rows) });
      router.replace('/');
    } catch (err) {
      setSaveError(getErrorMessage(err, t('career.saveError')));
      setIsSaving(false);
    }
  };

  return (
    <SectionScreen
      title={t('career.title')}
      isLoading={isLoading}
      loadError={loadError}
      onRetry={retry}
      saveError={saveError}
      isSaving={isSaving}
      onSave={onSave}>
      {rows.map((row, index) => (
        <CareerRowCard
          key={row.key}
          row={row}
          index={index}
          industries={industries}
          onChange={updateRow(row.key)}
          onRemove={() => removeRow(row.key)}
        />
      ))}

      <Pressable onPress={addRow} style={styles.addButton}>
        <SymbolView tintColor={Colors.secondary} name={{ ios: 'plus', android: 'add', web: 'add' }} size={16} />
        <ThemedText type="smallBold" style={styles.addButtonText}>
          {rows.length ? t('career.addAnother') : t('career.addFirst')}
        </ThemedText>
      </Pressable>
    </SectionScreen>
  );
}

const styles = StyleSheet.create({
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three,
    width: '100%',
    maxWidth: 800,
  },
  addButtonText: {
    color: Colors.secondary,
  },
});
