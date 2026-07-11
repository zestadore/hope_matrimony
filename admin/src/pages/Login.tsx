import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Phone } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  mobile_number: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null)

    try {
      await login(values.mobile_number, values.password)
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(redirectTo, { replace: true })
    } catch {
      // Deliberately generic — never echo backend detail that could aid
      // account enumeration (e.g. distinguishing "locked" from "wrong password").
      setFormError('Invalid mobile number or password.')
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue to-brand-pink p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 size-96 rounded-full bg-brand-pink/30 blur-3xl" />

        <span className="relative text-sm font-medium tracking-wide text-white/80 uppercase">
          Admin Panel
        </span>

        <div className="relative flex flex-1 items-center justify-center">
          <div className="rounded-2xl bg-white/95 px-10 py-8 shadow-2xl backdrop-blur">
            <img src="/logo.png" alt="Hope Matrimony" className="w-72" />
          </div>
        </div>

        <blockquote className="relative text-sm text-white/85">
          "Connecting hearts, building families." Manage matches, members and staff — all in
          one place.
        </blockquote>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <img src="/logo.png" alt="Hope Matrimony" className="h-14" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your mobile number and password.
            </p>
          </div>

          <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate className="grid gap-5">
            <div className="grid gap-1.5">
              <Label htmlFor="mobile_number">Mobile number</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="mobile_number"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="username"
                  maxLength={10}
                  placeholder="9876543210"
                  aria-invalid={!!errors.mobile_number}
                  className="h-11 pl-9"
                  {...register('mobile_number')}
                />
              </div>
              {errors.mobile_number && (
                <p className="text-sm text-destructive">{errors.mobile_number.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className="h-11 pl-9"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            {formError && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full bg-gradient-to-r from-brand-blue to-brand-pink text-white hover:opacity-90"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Hope Matrimony · Staff &amp; administration access only
          </p>
        </div>
      </div>
    </div>
  )
}
