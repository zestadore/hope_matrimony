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
  emptyEducationRow,
  fetchEducationLevels,
  fetchProfileBundle,
  fetchQualifications,
  saveProfileSection,
  type LookupOption,
  type MemberEducationRow,
} from '@/lib/profile-api';

function toOptions(items: LookupOption[]): SelectOption[] {
  return items.map((item) => ({ label: item.name, value: item.id }));
}

type Row = MemberEducationRow & { key: string };

let rowKeySeq = 0;
function nextRowKey() {
  rowKeySeq += 1;
  return `row-${rowKeySeq}`;
}

function withKeys(rows: MemberEducationRow[]): Row[] {
  return rows.length ? rows.map((row) => ({ ...row, key: nextRowKey() })) : [{ ...emptyEducationRow, key: nextRowKey() }];
}

function stripKeys(rows: Row[]): MemberEducationRow[] {
  return rows.map(({ key: _key, ...row }) => row);
}

function EducationRowCard({
  row,
  index,
  educationLevels,
  qualifications,
  onLevelChange,
  onChange,
  onRemove,
  canRemove,
}: {
  row: Row;
  index: number;
  educationLevels: LookupOption[];
  qualifications: LookupOption[];
  onLevelChange: (levelId: number | null) => void;
  onChange: <K extends keyof MemberEducationRow>(key: K, value: MemberEducationRow[K]) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const t = useTranslation();

  return (
    <Card>
      <View style={styles.rowHeader}>
        <CardSectionTitle>{t('education.rowTitle', { n: index + 1 })}</CardSectionTitle>
        {canRemove && (
          <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('education.remove')}>
            <SymbolView
              tintColor={Colors.danger}
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={18}
            />
          </Pressable>
        )}
      </View>
      <SelectField
        label={t('education.level')}
        value={row.education_level_id}
        options={toOptions(educationLevels)}
        onChange={(value) => onLevelChange(value as number | null)}
      />
      <SelectField
        label={t('education.qualification')}
        value={row.qualification_id}
        options={toOptions(qualifications)}
        onChange={(value) => onChange('qualification_id', value as number | null)}
        disabled={row.education_level_id === null}
        disabledHint={t('education.qualificationHint')}
      />
      <TextField
        label={t('education.institution')}
        value={row.institution ?? ''}
        onChangeText={(value) => onChange('institution', toNullableString(value))}
      />
      <TextField
        label={t('education.startYear')}
        value={row.start_year !== null ? String(row.start_year) : ''}
        onChangeText={(value) => onChange('start_year', toNullableInt(value))}
        keyboardType="number-pad"
        placeholder="2010"
      />
      <TextField
        label={t('education.endYear')}
        value={row.end_year !== null ? String(row.end_year) : ''}
        onChangeText={(value) => onChange('end_year', toNullableInt(value))}
        keyboardType="number-pad"
        placeholder="2014"
      />
      <ToggleField label={t('education.currentlyStudying')} value={row.is_current} onChange={(value) => onChange('is_current', value)} />
    </Card>
  );
}

export default function EducationScreen() {
  const t = useTranslation();
  const [educationLevels, setEducationLevels] = useState<LookupOption[]>([]);
  const [qualificationsByLevel, setQualificationsByLevel] = useState<Record<number, LookupOption[]>>({});
  const [rows, setRows] = useState<Row[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchProfileBundle(), fetchEducationLevels()])
      .then(([bundle, levels]) => {
        if (cancelled) return;
        setEducationLevels(levels);
        const loadedRows = withKeys(bundle.educations);
        setRows(loadedRows);

        const levelIds = Array.from(
          new Set(loadedRows.map((row) => row.education_level_id).filter((id): id is number => id !== null)),
        );
        Promise.all(levelIds.map((id) => fetchQualifications(id).then((quals) => [id, quals] as const)))
          .then((pairs) => {
            if (cancelled) return;
            setQualificationsByLevel(Object.fromEntries(pairs));
          })
          .catch(() => undefined);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, t('education.loadError')));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken, t]);

  const updateRow = (key: string) => <K extends keyof MemberEducationRow>(field: K, value: MemberEducationRow[K]) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const onLevelChange = (key: string) => (levelId: number | null) => {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? { ...row, education_level_id: levelId, qualification_id: row.education_level_id === levelId ? row.qualification_id : null }
          : row,
      ),
    );

    if (levelId !== null && !qualificationsByLevel[levelId]) {
      fetchQualifications(levelId)
        .then((quals) => setQualificationsByLevel((prev) => ({ ...prev, [levelId]: quals })))
        .catch(() => undefined);
    }
  };

  const addRow = () => setRows((prev) => [...prev, { ...emptyEducationRow, key: nextRowKey() }]);
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
      await saveProfileSection({ educations: stripKeys(rows) });
      router.replace('/');
    } catch (err) {
      setSaveError(getErrorMessage(err, t('education.saveError')));
      setIsSaving(false);
    }
  };

  return (
    <SectionScreen
      title={t('education.title')}
      isLoading={isLoading}
      loadError={loadError}
      onRetry={retry}
      saveError={saveError}
      isSaving={isSaving}
      onSave={onSave}>
      {rows.map((row, index) => (
        <EducationRowCard
          key={row.key}
          row={row}
          index={index}
          educationLevels={educationLevels}
          qualifications={row.education_level_id !== null ? qualificationsByLevel[row.education_level_id] ?? [] : []}
          onLevelChange={onLevelChange(row.key)}
          onChange={updateRow(row.key)}
          onRemove={() => removeRow(row.key)}
          canRemove={rows.length > 1}
        />
      ))}

      <Pressable onPress={addRow} style={styles.addButton}>
        <SymbolView tintColor={Colors.secondary} name={{ ios: 'plus', android: 'add', web: 'add' }} size={16} />
        <ThemedText type="smallBold" style={styles.addButtonText}>
          {t('education.addAnother')}
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
