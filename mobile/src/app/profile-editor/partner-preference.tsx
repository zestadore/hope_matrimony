import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Card, CardSectionTitle } from '@/components/form/card';
import { SectionScreen } from '@/components/form/section-screen';
import { SelectField, type SelectOption } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { getErrorMessage } from '@/lib/api-error';
import { useToOptions, useTranslation } from '@/lib/i18n/locale-context';
import { toNullableInt, toNullableString } from '@/lib/form-utils';
import {
  emptyPartnerPreference,
  fetchCastes,
  fetchEducationLevels,
  fetchIndustries,
  fetchMemberOptions,
  fetchProfileBundle,
  fetchReligions,
  fetchStates,
  saveProfileSection,
  type LookupOption,
  type MemberOptions,
  type MemberPartnerPreferenceData,
} from '@/lib/profile-api';

function toOptions(items: LookupOption[]): SelectOption[] {
  return items.map((item) => ({ label: item.name, value: item.id }));
}

export default function PartnerPreferenceScreen() {
  const t = useTranslation();
  const toStringOptions = useToOptions();
  const [options, setOptions] = useState<MemberOptions | null>(null);
  const [religions, setReligions] = useState<LookupOption[]>([]);
  const [castes, setCastes] = useState<LookupOption[]>([]);
  const [educationLevels, setEducationLevels] = useState<LookupOption[]>([]);
  const [industries, setIndustries] = useState<LookupOption[]>([]);
  const [states, setStates] = useState<LookupOption[]>([]);
  const [preference, setPreference] = useState<MemberPartnerPreferenceData>(emptyPartnerPreference);
  const [ageFromText, setAgeFromText] = useState('');
  const [ageToText, setAgeToText] = useState('');
  const [heightFromText, setHeightFromText] = useState('');
  const [heightToText, setHeightToText] = useState('');

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchProfileBundle(),
      fetchMemberOptions(),
      fetchReligions(),
      fetchEducationLevels(),
      fetchIndustries(),
      fetchStates(),
    ])
      .then(([bundle, memberOptions, religionOptions, educationLevelOptions, industryOptions, stateOptions]) => {
        if (cancelled) return;
        setOptions(memberOptions);
        setReligions(religionOptions);
        setEducationLevels(educationLevelOptions);
        setIndustries(industryOptions);
        setStates(stateOptions);
        const loaded = bundle.partner_preference ?? emptyPartnerPreference;
        setPreference(loaded);
        setAgeFromText(loaded.age_from !== null ? String(loaded.age_from) : '');
        setAgeToText(loaded.age_to !== null ? String(loaded.age_to) : '');
        setHeightFromText(loaded.height_from_cm !== null ? String(loaded.height_from_cm) : '');
        setHeightToText(loaded.height_to_cm !== null ? String(loaded.height_to_cm) : '');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, t('partner.loadError')));
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
    const religionId = preference.religion_id;

    (religionId === null ? Promise.resolve([]) : fetchCastes(religionId).catch(() => []))
      .then((result) => {
        if (!cancelled) setCastes(result);
      });

    return () => {
      cancelled = true;
    };
  }, [preference.religion_id]);

  const update = <K extends keyof MemberPartnerPreferenceData>(key: K, value: MemberPartnerPreferenceData[K]) => {
    setPreference((prev) => ({ ...prev, [key]: value }));
  };

  const retry = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadToken((n) => n + 1);
  };

  const onSave = async () => {
    setSaveError(null);
    setIsSaving(true);

    const updated: MemberPartnerPreferenceData = {
      ...preference,
      age_from: toNullableInt(ageFromText),
      age_to: toNullableInt(ageToText),
      height_from_cm: toNullableInt(heightFromText),
      height_to_cm: toNullableInt(heightToText),
    };

    try {
      await saveProfileSection({ partner_preference: updated });
      router.replace('/');
    } catch (err) {
      setSaveError(getErrorMessage(err, t('partner.saveError')));
      setIsSaving(false);
    }
  };

  return (
    <SectionScreen
      title={t('partner.title')}
      isLoading={isLoading}
      loadError={loadError}
      onRetry={retry}
      saveError={saveError}
      isSaving={isSaving}
      onSave={onSave}>
      <Card>
        <CardSectionTitle>{t('partner.ageHeight')}</CardSectionTitle>
        <TextField label={t('partner.ageFrom')} value={ageFromText} onChangeText={setAgeFromText} keyboardType="number-pad" placeholder="25" />
        <TextField label={t('partner.ageTo')} value={ageToText} onChangeText={setAgeToText} keyboardType="number-pad" placeholder="32" />
        <TextField
          label={t('partner.heightFrom')}
          value={heightFromText}
          onChangeText={setHeightFromText}
          keyboardType="number-pad"
          placeholder="150"
        />
        <TextField
          label={t('partner.heightTo')}
          value={heightToText}
          onChangeText={setHeightToText}
          keyboardType="number-pad"
          placeholder="180"
        />
      </Card>

      <Card>
        <CardSectionTitle>{t('partner.background')}</CardSectionTitle>
        <SelectField
          label={t('partner.maritalStatus')}
          value={preference.marital_status}
          options={options ? toStringOptions(options.marital_statuses) : []}
          onChange={(value) => update('marital_status', value as string | null)}
        />
        <SelectField
          label={t('partner.childrenAcceptable')}
          value={preference.children_acceptable}
          options={options ? toStringOptions(options.children_acceptable) : []}
          onChange={(value) => update('children_acceptable', value as string | null)}
        />
        <SelectField
          label={t('partner.religion')}
          value={preference.religion_id}
          options={toOptions(religions)}
          onChange={(value) =>
            setPreference((prev) => ({
              ...prev,
              religion_id: value as number | null,
              caste_id: prev.religion_id === value ? prev.caste_id : null,
            }))
          }
        />
        <SelectField
          label={t('partner.caste')}
          value={preference.caste_id}
          options={toOptions(castes)}
          onChange={(value) => update('caste_id', value as number | null)}
          disabled={preference.religion_id === null}
          disabledHint={t('partner.casteHint')}
        />
        <TextField
          label={t('partner.subCaste')}
          value={preference.sub_caste ?? ''}
          onChangeText={(value) => update('sub_caste', toNullableString(value))}
        />
        <SelectField
          label={t('partner.minEducation')}
          value={preference.education_level_id}
          options={toOptions(educationLevels)}
          onChange={(value) => update('education_level_id', value as number | null)}
        />
        <SelectField
          label={t('partner.industry')}
          value={preference.industry_id}
          options={toOptions(industries)}
          onChange={(value) => update('industry_id', value as number | null)}
        />
        <SelectField
          label={t('partner.preferredState')}
          value={preference.preferred_state_id}
          options={toOptions(states)}
          onChange={(value) => update('preferred_state_id', value as number | null)}
        />
        <SelectField
          label={t('partner.motherTongue')}
          value={preference.mother_tongue}
          options={options ? toStringOptions(options.languages) : []}
          onChange={(value) => update('mother_tongue', value as string | null)}
        />
      </Card>

      <Card>
        <CardSectionTitle>{t('partner.lifestyle')}</CardSectionTitle>
        <SelectField
          label={t('partner.diet')}
          value={preference.diet}
          options={options ? toStringOptions(options.diets) : []}
          onChange={(value) => update('diet', value as string | null)}
        />
        <SelectField
          label={t('partner.smokingAcceptable')}
          value={preference.smoking_acceptable}
          options={options ? toStringOptions(options.habit_levels) : []}
          onChange={(value) => update('smoking_acceptable', value as string | null)}
        />
        <SelectField
          label={t('partner.drinkingAcceptable')}
          value={preference.drinking_acceptable}
          options={options ? toStringOptions(options.habit_levels) : []}
          onChange={(value) => update('drinking_acceptable', value as string | null)}
        />
        <SelectField
          label={t('partner.bodyType')}
          value={preference.body_type}
          options={options ? toStringOptions(options.body_types) : []}
          onChange={(value) => update('body_type', value as string | null)}
        />
        <SelectField
          label={t('partner.complexion')}
          value={preference.complexion}
          options={options ? toStringOptions(options.complexions) : []}
          onChange={(value) => update('complexion', value as string | null)}
        />
        <SelectField
          label={t('partner.manglik')}
          value={preference.manglik}
          options={options ? toStringOptions(options.manglik) : []}
          onChange={(value) => update('manglik', value as string | null)}
        />
        <SelectField
          label={t('partner.familyValues')}
          value={preference.family_value}
          options={options ? toStringOptions(options.family_values) : []}
          onChange={(value) => update('family_value', value as string | null)}
        />
        <TextField
          label={t('partner.anythingElse')}
          value={preference.general ?? ''}
          onChangeText={(value) => update('general', toNullableString(value))}
          multiline
        />
      </Card>
    </SectionScreen>
  );
}
