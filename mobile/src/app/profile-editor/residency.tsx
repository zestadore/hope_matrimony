import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Card, CardSectionTitle } from '@/components/form/card';
import { SectionScreen } from '@/components/form/section-screen';
import { SelectField, type SelectOption } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { getErrorMessage } from '@/lib/api-error';
import { toNullableString } from '@/lib/form-utils';
import { useTranslation } from '@/lib/i18n/locale-context';
import {
  emptyResidency,
  fetchDistricts,
  fetchProfileBundle,
  fetchStates,
  saveProfileSection,
  type LookupOption,
  type MemberResidencyData,
} from '@/lib/profile-api';

function toOptions(items: LookupOption[]): SelectOption[] {
  return items.map((item) => ({ label: item.name, value: item.id }));
}

export default function ResidencyScreen() {
  const t = useTranslation();
  const [states, setStates] = useState<LookupOption[]>([]);
  const [nativeDistricts, setNativeDistricts] = useState<LookupOption[]>([]);
  const [currentDistricts, setCurrentDistricts] = useState<LookupOption[]>([]);
  const [residency, setResidency] = useState<MemberResidencyData>(emptyResidency);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchProfileBundle(), fetchStates()])
      .then(([bundle, stateOptions]) => {
        if (cancelled) return;
        setStates(stateOptions);
        setResidency(bundle.residency ?? emptyResidency);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, t('residency.loadError')));
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
    const stateId = residency.native_state_id;

    (stateId === null ? Promise.resolve([]) : fetchDistricts(stateId).catch(() => []))
      .then((result) => {
        if (!cancelled) setNativeDistricts(result);
      });

    return () => {
      cancelled = true;
    };
  }, [residency.native_state_id]);

  useEffect(() => {
    let cancelled = false;
    const stateId = residency.current_state_id;

    (stateId === null ? Promise.resolve([]) : fetchDistricts(stateId).catch(() => []))
      .then((result) => {
        if (!cancelled) setCurrentDistricts(result);
      });

    return () => {
      cancelled = true;
    };
  }, [residency.current_state_id]);

  const update = <K extends keyof MemberResidencyData>(key: K, value: MemberResidencyData[K]) => {
    setResidency((prev) => ({ ...prev, [key]: value }));
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
      await saveProfileSection({ residency });
      router.replace('/');
    } catch (err) {
      setSaveError(getErrorMessage(err, t('residency.saveError')));
      setIsSaving(false);
    }
  };

  return (
    <SectionScreen
      title={t('residency.title')}
      isLoading={isLoading}
      loadError={loadError}
      onRetry={retry}
      saveError={saveError}
      isSaving={isSaving}
      onSave={onSave}>
      <Card>
        <CardSectionTitle>{t('residency.nativePlace')}</CardSectionTitle>
        <SelectField
          label={t('residency.nativeState')}
          value={residency.native_state_id}
          options={toOptions(states)}
          onChange={(value) =>
            setResidency((prev) => ({
              ...prev,
              native_state_id: value as number | null,
              native_district_id: prev.native_state_id === value ? prev.native_district_id : null,
            }))
          }
        />
        <SelectField
          label={t('residency.nativeDistrict')}
          value={residency.native_district_id}
          options={toOptions(nativeDistricts)}
          onChange={(value) => update('native_district_id', value as number | null)}
          disabled={residency.native_state_id === null}
          disabledHint={t('residency.stateHint')}
        />
      </Card>

      <Card>
        <CardSectionTitle>{t('residency.currentResidence')}</CardSectionTitle>
        <SelectField
          label={t('residency.currentState')}
          value={residency.current_state_id}
          options={toOptions(states)}
          onChange={(value) =>
            setResidency((prev) => ({
              ...prev,
              current_state_id: value as number | null,
              current_district_id: prev.current_state_id === value ? prev.current_district_id : null,
            }))
          }
        />
        <SelectField
          label={t('residency.currentDistrict')}
          value={residency.current_district_id}
          options={toOptions(currentDistricts)}
          onChange={(value) => update('current_district_id', value as number | null)}
          disabled={residency.current_state_id === null}
          disabledHint={t('residency.stateHint')}
        />
        <TextField
          label={t('residency.currentAddress')}
          value={residency.current_address ?? ''}
          onChangeText={(value) => update('current_address', toNullableString(value))}
          multiline
        />
        <TextField
          label={t('residency.postalCode')}
          value={residency.postal_code ?? ''}
          onChangeText={(value) => update('postal_code', toNullableString(value))}
          keyboardType="number-pad"
        />
        <TextField
          label={t('residency.immigrationStatus')}
          value={residency.immigration_status ?? ''}
          onChangeText={(value) => update('immigration_status', toNullableString(value))}
          placeholder={t('residency.immigrationPlaceholder')}
        />
      </Card>
    </SectionScreen>
  );
}
