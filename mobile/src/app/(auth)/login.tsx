import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Image } from 'expo-image';
import { useState } from 'react';
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

// Mirrors backend/app/Http/Requests/Auth/LoginRequest.php
const loginSchema = z.object({
  mobile_number: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobile_number: '', password: '' },
  });

  const onSubmit = async ({ mobile_number, password }: LoginForm) => {
    setFormError(null);
    try {
      await login(mobile_number, password);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
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
            <ThemedView style={styles.logoGlow}>
              <ThemedView style={styles.logoWrap}>
                <Image
                  source={require('@/assets/images/hope-matrimony-logo.png')}
                  style={styles.logo}
                  contentFit="contain"
                  loading="eager"
                />
              </ThemedView>
            </ThemedView>

            <ThemedText type="subtitle" style={styles.title}>
              Welcome back <ThemedText style={styles.titleHeart}>💗</ThemedText>
            </ThemedText>
            <ThemedText type="default" style={styles.subtitle} themeColor="textSecondary">
              Sign in to continue your journey
            </ThemedText>

            <ThemedView style={styles.card}>
              <ThemedView style={[styles.field, styles.transparent]}>
                <ThemedText type="smallBold" style={styles.label}>
                  Mobile number
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
                      placeholder="9876543210"
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
                  Password
                </ThemedText>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry
                      placeholder="Password"
                      placeholderTextColor={Colors.textSecondary}
                      style={styles.input}
                    />
                  )}
                />
                {errors.password && (
                  <ThemedText type="small" style={styles.errorText}>
                    {errors.password.message}
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
                    Sign in 🤍
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>

            <ThemedText type="small" style={styles.footer} themeColor="textSecondary">
              Hope Matrimony · Trusted matchmaking
            </ThemedText>
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
  logoGlow: {
    width: 200,
    height: 96,
    borderRadius: Radius.large,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  logoWrap: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  logo: {
    width: 168,
    height: 46,
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 32,
  },
  titleHeart: {
    fontSize: 22,
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
    backgroundColor: Colors.backgroundElement,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 3,
  },
  field: {
    gap: Spacing.two,
  },
  label: {
    color: Colors.secondary,
  },
  input: {
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
  formError: {
    color: Colors.danger,
    textAlign: 'center',
  },
  button: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
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
    color: Colors.primaryText,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
