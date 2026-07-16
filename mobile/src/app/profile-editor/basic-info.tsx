import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Card, CardSectionTitle } from '@/components/form/card';
import { MultiSelectField } from '@/components/form/multi-select-field';
import { SectionScreen } from '@/components/form/section-screen';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { getErrorMessage } from '@/lib/api-error';
import { toNullableFloat, toNullableInt, toNullableString } from '@/lib/form-utils';
import { useOptionLabel, useToOptions, useTranslation } from '@/lib/i18n/locale-context';
import {
  emptyProfile,
  fetchMemberOptions,
  fetchProfileBundle,
  saveProfileSection,
  type MemberOptions,
  type MemberProfileData,
} from '@/lib/profile-api';

export default function BasicInfoScreen() {
  const t = useTranslation();
  const optionLabel = useOptionLabel();
  const toOptions = useToOptions();
  const [options, setOptions] = useState<MemberOptions | null>(null);
  const [profile, setProfile] = useState<MemberProfileData>(emptyProfile);
  const [dateOfBirthText, setDateOfBirthText] = useState('');
  const [heightText, setHeightText] = useState('');
  const [weightText, setWeightText] = useState('');
  const [childrenText, setChildrenText] = useState('');

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchProfileBundle(), fetchMemberOptions()])
      .then(([bundle, memberOptions]) => {
        if (cancelled) return;
        setOptions(memberOptions);
        const loaded = bundle.profile ?? emptyProfile;
        setProfile(loaded);
        setDateOfBirthText(loaded.date_of_birth ?? '');
        setHeightText(loaded.height_cm !== null ? String(loaded.height_cm) : '');
        setWeightText(loaded.weight_kg !== null ? String(loaded.weight_kg) : '');
        setChildrenText(loaded.children !== null ? String(loaded.children) : '');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, t('basicInfo.loadError')));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken, t]);

  const update = <K extends keyof MemberProfileData>(key: K, value: MemberProfileData[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const retry = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadToken((n) => n + 1);
  };

  const onSave = async () => {
    setSaveError(null);
    setIsSaving(true);

    const updatedProfile: MemberProfileData = {
      ...profile,
      date_of_birth: toNullableString(dateOfBirthText),
      height_cm: toNullableInt(heightText),
      weight_kg: toNullableFloat(weightText),
      children: toNullableInt(childrenText),
    };

    try {
      await saveProfileSection({ profile: updatedProfile });
      router.replace('/');
    } catch (err) {
      setSaveError(getErrorMessage(err, t('basicInfo.saveError')));
      setIsSaving(false);
    }
  };

  return (
    <SectionScreen
      title={t('basicInfo.title')}
      isLoading={isLoading}
      loadError={loadError}
      onRetry={retry}
      saveError={saveError}
      isSaving={isSaving}
      onSave={onSave}>
      <Card>
        <CardSectionTitle>{t('basicInfo.personalDetails')}</CardSectionTitle>
        <SelectField
          label={t('basicInfo.gender')}
          value={profile.gender}
          options={options ? toOptions(options.genders) : []}
          onChange={(value) => update('gender', value as string | null)}
        />
        <TextField
          label={t('basicInfo.dob')}
          value={dateOfBirthText}
          onChangeText={setDateOfBirthText}
          placeholder={t('basicInfo.dobPlaceholder')}
          hint={t('basicInfo.dobHint')}
        />
        <SelectField
          label={t('basicInfo.maritalStatus')}
          value={profile.marital_status}
          options={options ? toOptions(options.marital_statuses) : []}
          onChange={(value) => update('marital_status', value as string | null)}
        />
        <TextField
          label={t('basicInfo.children')}
          value={childrenText}
          onChangeText={setChildrenText}
          keyboardType="number-pad"
          placeholder="0"
        />
        <SelectField
          label={t('basicInfo.onBehalf')}
          value={profile.on_behalf}
          options={options ? toOptions(options.on_behalf) : []}
          onChange={(value) => update('on_behalf', value as string | null)}
        />
        <SelectField
          label={t('basicInfo.motherTongue')}
          value={profile.mother_tongue}
          options={options ? toOptions(options.languages) : []}
          onChange={(value) => update('mother_tongue', value as string | null)}
        />
        <MultiSelectField
          label={t('basicInfo.knownLanguages')}
          values={profile.known_languages ?? []}
          options={options?.languages ?? []}
          getLabel={optionLabel}
          onChange={(values) => update('known_languages', values)}
        />
        <TextField
          label={t('basicInfo.about')}
          value={profile.introduction ?? ''}
          onChangeText={(value) => update('introduction', toNullableString(value))}
          multiline
          placeholder={t('basicInfo.aboutPlaceholder')}
        />
      </Card>

      <Card>
        <CardSectionTitle>{t('basicInfo.appearance')}</CardSectionTitle>
        <TextField
          label={t('basicInfo.height')}
          value={heightText}
          onChangeText={setHeightText}
          keyboardType="number-pad"
          placeholder="170"
        />
        <TextField
          label={t('basicInfo.weight')}
          value={weightText}
          onChangeText={setWeightText}
          keyboardType="decimal-pad"
          placeholder="65"
        />
        <SelectField
          label={t('basicInfo.complexion')}
          value={profile.complexion}
          options={options ? toOptions(options.complexions) : []}
          onChange={(value) => update('complexion', value as string | null)}
        />
        <SelectField
          label={t('basicInfo.bodyType')}
          value={profile.body_type}
          options={options ? toOptions(options.body_types) : []}
          onChange={(value) => update('body_type', value as string | null)}
        />
        <SelectField
          label={t('basicInfo.bloodGroup')}
          value={profile.blood_group}
          options={options ? toOptions(options.blood_groups) : []}
          onChange={(value) => update('blood_group', value as string | null)}
        />
        <TextField
          label={t('basicInfo.disability')}
          value={profile.disability ?? ''}
          onChangeText={(value) => update('disability', toNullableString(value))}
          placeholder={t('basicInfo.disabilityPlaceholder')}
        />
        <SelectField
          label={t('basicInfo.diet')}
          value={profile.diet}
          options={options ? toOptions(options.diets) : []}
          onChange={(value) => update('diet', value as string | null)}
        />
        <SelectField
          label={t('basicInfo.drinking')}
          value={profile.drink}
          options={options ? toOptions(options.habit_levels) : []}
          onChange={(value) => update('drink', value as string | null)}
        />
        <SelectField
          label={t('basicInfo.smoking')}
          value={profile.smoke}
          options={options ? toOptions(options.habit_levels) : []}
          onChange={(value) => update('smoke', value as string | null)}
        />
        <SelectField
          label={t('basicInfo.livingWith')}
          value={profile.living_with}
          options={options ? toOptions(options.living_with) : []}
          onChange={(value) => update('living_with', value as string | null)}
        />
      </Card>

      <Card>
        <CardSectionTitle>{t('basicInfo.astrology')}</CardSectionTitle>
        <TextField
          label={t('basicInfo.timeOfBirth')}
          value={profile.time_of_birth ?? ''}
          onChangeText={(value) => update('time_of_birth', toNullableString(value))}
          placeholder={t('basicInfo.timeOfBirthPlaceholder')}
        />
        <TextField
          label={t('basicInfo.birthCity')}
          value={profile.birth_city ?? ''}
          onChangeText={(value) => update('birth_city', toNullableString(value))}
        />
        <SelectField
          label={t('basicInfo.malayalamStar')}
          value={profile.malayalam_star}
          options={options ? toOptions(options.malayalam_stars) : []}
          onChange={(value) => update('malayalam_star', value as string | null)}
        />
        <SelectField
          label={t('basicInfo.manglik')}
          value={profile.manglik}
          options={options ? toOptions(options.manglik) : []}
          onChange={(value) => update('manglik', value as string | null)}
        />
        <SelectField
          label={t('basicInfo.sudhaJathakam')}
          value={profile.sudha_jathakam}
          options={options ? toOptions(options.manglik) : []}
          onChange={(value) => update('sudha_jathakam', value as string | null)}
        />
      </Card>

      <Card>
        <CardSectionTitle>{t('basicInfo.interestsTitle')}</CardSectionTitle>
        <TextField
          label={t('basicInfo.hobbies')}
          value={profile.hobbies ?? ''}
          onChangeText={(value) => update('hobbies', toNullableString(value))}
          multiline
        />
        <TextField
          label={t('basicInfo.interests')}
          value={profile.interests ?? ''}
          onChangeText={(value) => update('interests', toNullableString(value))}
          multiline
        />
        <TextField
          label={t('basicInfo.music')}
          value={profile.music ?? ''}
          onChangeText={(value) => update('music', toNullableString(value))}
          multiline
        />
        <TextField
          label={t('basicInfo.movies')}
          value={profile.movies ?? ''}
          onChangeText={(value) => update('movies', toNullableString(value))}
          multiline
        />
        <TextField
          label={t('basicInfo.sports')}
          value={profile.sports ?? ''}
          onChangeText={(value) => update('sports', toNullableString(value))}
          multiline
        />
        <TextField
          label={t('basicInfo.cuisines')}
          value={profile.cuisines ?? ''}
          onChangeText={(value) => update('cuisines', toNullableString(value))}
          multiline
        />
      </Card>
    </SectionScreen>
  );
}
