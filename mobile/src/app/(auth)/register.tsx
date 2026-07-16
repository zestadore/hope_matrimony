import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n/locale-context';
import { mobileNumberSchema, passwordSchema } from '@/lib/validation';

type RegisterForm = {
  name: string;
  mobile_number: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export default function RegisterScreen() {
  const { register } = useAuth();
  const t = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mirrors backend/app/Http/Requests/Auth/RegisterRequest.php
  const registerSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(1, t('validation.nameRequired')).max(255),
          mobile_number: mobileNumberSchema(t),
          email: z.union([z.literal(''), z.string().trim().email(t('validation.email'))]),
          password: passwordSchema(t),
          password_confirmation: z.string(),
        })
        .refine((data) => data.password === data.password_confirmation, {
          message: t('validation.passwordMismatch'),
          path: ['password_confirmation'],
        }),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', mobile_number: '', email: '', password: '', password_confirmation: '' },
  });

  const onSubmit = async ({ name, mobile_number, email, password, password_confirmation }: RegisterForm) => {
    setFormError(null);
    try {
      await register({
        name,
        mobile_number,
        email: email || undefined,
        password,
        password_confirmation,
      });
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
              {t('register.title')}
            </ThemedText>
            <ThemedText type="default" style={styles.subtitle} themeColor="textSecondary">
              {t('register.subtitle')}
            </ThemedText>

            <ThemedView style={styles.card}>
              <ThemedView style={[styles.field, styles.transparent]}>
                <ThemedText type="smallBold" style={styles.label}>
                  {t('register.nameLabel')}
                </ThemedText>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                      placeholder={t('register.namePlaceholder')}
                      placeholderTextColor={Colors.textSecondary}
                      style={styles.input}
                    />
                  )}
                />
                {errors.name && (
                  <ThemedText type="small" style={styles.errorText}>
                    {errors.name.message}
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedView style={[styles.field, styles.transparent]}>
                <ThemedText type="smallBold" style={styles.label}>
                  {t('register.mobileLabel')}
                </ThemedText>
                <Controller
                  control={control}
                  name="mobile_number"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder={t('register.mobilePlaceholder')}
                      placeholderTextColor={Colors.textSecondary}
                      style={styles.input}
                    />
                  )}
                />
                {errors.mobile_number && (
                  <ThemedText type="small" style={styles.errorText}>
                    {errors.mobile_number.message}
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedView style={[styles.field, styles.transparent]}>
                <ThemedText type="smallBold" style={styles.label}>
                  {t('register.emailLabel')}
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
                      placeholder={t('register.emailPlaceholder')}
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

              <ThemedView style={[styles.field, styles.transparent]}>
                <ThemedText type="smallBold" style={styles.label}>
                  {t('register.passwordLabel')}
                </ThemedText>
                <View style={styles.passwordRow}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showPassword}
                        placeholder={t('register.passwordPlaceholder')}
                        placeholderTextColor={Colors.textSecondary}
                        style={[styles.input, styles.passwordInput]}
                      />
                    )}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={8}
                    style={styles.eyeButton}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? t('common.hidePassword') : t('common.showPassword')}>
                    <SymbolView
                      tintColor={Colors.textSecondary}
                      name={{
                        ios: showPassword ? 'eye.slash' : 'eye',
                        android: showPassword ? 'visibility_off' : 'visibility',
                        web: showPassword ? 'visibility_off' : 'visibility',
                      }}
                      size={18}
                    />
                  </Pressable>
                </View>
                {errors.password ? (
                  <ThemedText type="small" style={styles.errorText}>
                    {errors.password.message}
                  </ThemedText>
                ) : (
                  <ThemedText type="small" style={styles.hintText}>
                    {t('register.passwordHint')}
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedView style={[styles.field, styles.transparent]}>
                <ThemedText type="smallBold" style={styles.label}>
                  {t('register.confirmLabel')}
                </ThemedText>
                <View style={styles.passwordRow}>
                  <Controller
                    control={control}
                    name="password_confirmation"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showConfirmPassword}
                        placeholder={t('register.confirmPlaceholder')}
                        placeholderTextColor={Colors.textSecondary}
                        style={[styles.input, styles.passwordInput]}
                      />
                    )}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    hitSlop={8}
                    style={styles.eyeButton}
                    accessibilityRole="button"
                    accessibilityLabel={showConfirmPassword ? t('common.hidePassword') : t('common.showPassword')}>
                    <SymbolView
                      tintColor={Colors.textSecondary}
                      name={{
                        ios: showConfirmPassword ? 'eye.slash' : 'eye',
                        android: showConfirmPassword ? 'visibility_off' : 'visibility',
                        web: showConfirmPassword ? 'visibility_off' : 'visibility',
                      }}
                      size={18}
                    />
                  </Pressable>
                </View>
                {errors.password_confirmation && (
                  <ThemedText type="small" style={styles.errorText}>
                    {errors.password_confirmation.message}
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
                    {t('register.submit')}
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>

            <View style={styles.loginRow}>
              <ThemedText type="default" themeColor="textSecondary">
                {t('register.haveAccount')}
              </ThemedText>
              <Link href="/(auth)/login" asChild>
                <Pressable hitSlop={8}>
                  <ThemedText type="smallBold" style={styles.loginText}>
                    {t('register.signIn')}
                  </ThemedText>
                </Pressable>
              </Link>
            </View>
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
    marginBottom: Spacing.three,
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
  passwordRow: {
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: Spacing.six,
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.three,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  errorText: {
    color: Colors.danger,
    paddingHorizontal: Spacing.two,
  },
  hintText: {
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.two,
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
  loginRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
  loginText: {
    color: Colors.secondary,
  },
});
