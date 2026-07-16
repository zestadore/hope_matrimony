import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Card } from '@/components/form/card';
import { SectionScreen } from '@/components/form/section-screen';
import { SelectField, type SelectOption } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { getErrorMessage } from '@/lib/api-error';
import { toNullableString } from '@/lib/form-utils';
import { useToOptions, useTranslation } from '@/lib/i18n/locale-context';
import {
  emptyFamily,
  fetchCastes,
  fetchMemberOptions,
  fetchProfileBundle,
  fetchReligions,
  saveProfileSection,
  type LookupOption,
  type MemberFamilyData,
  type MemberOptions,
} from '@/lib/profile-api';

function toOptions(items: LookupOption[]): SelectOption[] {
  return items.map((item) => ({ label: item.name, value: item.id }));
}

export default function FamilyScreen() {
  const t = useTranslation();
  const toStringOptions = useToOptions();
  const [options, setOptions] = useState<MemberOptions | null>(null);
  const [religions, setReligions] = useState<LookupOption[]>([]);
  const [castes, setCastes] = useState<LookupOption[]>([]);
  const [family, setFamily] = useState<MemberFamilyData>(emptyFamily);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchProfileBundle(), fetchMemberOptions(), fetchReligions()])
      .then(([bundle, memberOptions, religionOptions]) => {
        if (cancelled) return;
        setOptions(memberOptions);
        setReligions(religionOptions);
        setFamily(bundle.family ?? emptyFamily);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, t('family.loadError')));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken, t]);

  useEffect(() => {
    let cancelled = false;
    const religionId = family.religion_id;

    (religionId === null ? Promise.resolve([]) : fetchCastes(religionId).catch(() => []))
      .then((result) => {
        if (!cancelled) setCastes(result);
      });

    return () => {
      cancelled = true;
    };
  }, [family.religion_id]);

  const update = <K extends keyof MemberFamilyData>(key: K, value: MemberFamilyData[K]) => {
    setFamily((prev) => ({ ...prev, [key]: value }));
  };

  const retry = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadToken((n) => n + 1);
  };

  const onSave = async () => {
    setSaveError(null);
    setIsSaving(true);

    try {
      await saveProfileSection({ family });
      router.replace('/');
    } catch (err) {
      setSaveError(getErrorMessage(err, t('family.saveError')));
      setIsSaving(false);
    }
  };

  return (
    <SectionScreen
      title={t('family.title')}
      isLoading={isLoading}
      loadError={loadError}
      onRetry={retry}
      saveError={saveError}
      isSaving={isSaving}
      onSave={onSave}>
      <Card>
        <SelectField
          label={t('family.religion')}
          value={family.religion_id}
          options={toOptions(religions)}
          onChange={(value) =>
            setFamily((prev) => ({
              ...prev,
              religion_id: value as number | null,
              caste_id: prev.religion_id === value ? prev.caste_id : null,
            }))
          }
        />
        <SelectField
          label={t('family.caste')}
          value={family.caste_id}
          options={toOptions(castes)}
          onChange={(value) => update('caste_id', value as number | null)}
          disabled={family.religion_id === null}
          disabledHint={t('family.casteHint')}
        />
        <TextField
          label={t('family.subCaste')}
          value={family.sub_caste ?? ''}
          onChangeText={(value) => update('sub_caste', toNullableString(value))}
        />
        <TextField
          label={t('family.community')}
          value={family.community_value ?? ''}
          onChangeText={(value) => update('community_value', toNullableString(value))}
        />
        <TextField
          label={t('family.fatherName')}
          value={family.father_name ?? ''}
          onChangeText={(value) => update('father_name', toNullableString(value))}
        />
        <TextField
          label={t('family.motherName')}
          value={family.mother_name ?? ''}
          onChangeText={(value) => update('mother_name', toNullableString(value))}
        />
        <TextField
          label={t('family.siblings')}
          value={family.siblings ?? ''}
          onChangeText={(value) => update('siblings', toNullableString(value))}
          placeholder={t('family.siblingsPlaceholder')}
        />
        <SelectField
          label={t('family.familyStatus')}
          value={family.family_status}
          options={options ? toStringOptions(options.family_statuses) : []}
          onChange={(value) => update('family_status', value as string | null)}
        />
        <SelectField
          label={t('family.familyValues')}
          value={family.family_value}
          options={options ? toStringOptions(options.family_values) : []}
          onChange={(value) => update('family_value', value as string | null)}
        />
      </Card>
    </SectionScreen>
  );
}
