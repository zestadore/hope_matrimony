import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/api-error';
import { useTranslation } from '@/lib/i18n/locale-context';

type ForgotPasswordForm = { email: string };

export default function ForgotPasswordScreen() {
  const t = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Mirrors backend/app/Http/Requests/Auth/ForgotPasswordRequest.php
  const forgotPasswordSchema = useMemo(
    () => z.object({ email: z.string().trim().email(t('validation.email')) }),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordForm) => {
    setFormError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setFormError(getErrorMessage(err, t('common.genericError')));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <ThemedView style={styles.logoWrap}>
              <Image
                source={require('@/assets/images/hope-matrimony-logo.png')}
                style={styles.logo}
                contentFit="contain"
                loading="eager"
              />
            </ThemedView>

            <LanguageSwitcher style={styles.languageSwitcher} />

            <ThemedText type="subtitle" style={styles.title}>
              {t('forgot.title')}
            </ThemedText>
            <ThemedText type="default" style={styles.subtitle} themeColor="textSecondary">
              {t('forgot.subtitle')}
            </ThemedText>

            <ThemedView style={styles.card}>
              {submitted ? (
                <ThemedText type="default" style={styles.confirmText}>
                  {t('forgot.sent')}
                </ThemedText>
              ) : (
                <>
                  <ThemedView style={[styles.field, styles.transparent]}>
                    <ThemedText type="smallBold" style={styles.label}>
                      {t('forgot.emailLabel')}
                    </ThemedText>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          placeholder={t('forgot.emailPlaceholder')}
                          placeholderTextColor={Colors.textSecondary}
                          style={styles.input}
                        />
                      )}
                    />
                    {errors.email && (
                      <ThemedText type="small" style={styles.errorText}>
                        {errors.email.message}
                      </ThemedText>
                    )}
                  </ThemedView>

                  {formError && (
                    <ThemedText type="small" style={styles.formError}>
                      {formError}
                    </ThemedText>
                  )}

                  <Pressable
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                      isSubmitting && styles.buttonDisabled,
                    ]}>
                    {isSubmitting ? (
                      <ActivityIndicator color={Colors.primaryText} />
                    ) : (
                      <ThemedText type="default" style={styles.buttonText}>
                        {t('forgot.submit')}
                      </ThemedText>
                    )}
                  </Pressable>
                </>
              )}
            </ThemedView>

            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.backLink} hitSlop={8}>
                <ThemedText type="smallBold" style={styles.backText}>
                  {t('forgot.backToLogin')}
                </ThemedText>
              </Pressable>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  logoWrap: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: Spacing.four,
  },
  logo: {
    width: 190,
    height: 52,
  },
  languageSwitcher: {
    marginBottom: Spacing.three,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: Spacing.one,
    marginBottom: Spacing.five,
    paddingHorizontal: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Radius.large,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(0,84,139,0.10)',
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#0B1D2B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  field: {
    gap: Spacing.two,
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
  errorText: {
    color: Colors.danger,
    paddingHorizontal: Spacing.two,
  },
  confirmText: {
    textAlign: 'center',
    color: Colors.secondary,
  },
  formError: {
    color: Colors.danger,
    textAlign: 'center',
  },
  button: {
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
    color: Colors.primaryText,
  },
  backLink: {
    marginTop: Spacing.five,
  },
  backText: {
    color: Colors.secondary,
  },
});
