import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { createTeamUser, getUser, updateTeamUser, type TeamUserPayload } from '@/api/users'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'accounts', label: 'Accounts' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
    return firstFieldError ?? data?.message ?? 'Something went wrong.'
  }
  return 'Something went wrong.'
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile_number: z.string().min(1, 'Mobile number is required'),
  email: z.string(),
  password: z.string(),
  status: z.string().min(1, 'Status is required'),
  role: z.string().min(1, 'Role is required'),
})

type FormValues = z.infer<typeof formSchema>

function buildSchema(isCreate: boolean) {
  return formSchema.superRefine((values, ctx) => {
    if (isCreate && values.password.trim().length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Password must be at least 8 characters',
      })
    }
  })
}

const emptyValues: FormValues = {
  name: '',
  mobile_number: '',
  email: '',
  password: '',
  status: 'active',
  role: '',
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export default function TeamForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const canSave = isEdit
    ? (currentUser?.permissions.includes('users.update') ?? false)
    : (currentUser?.permissions.includes('users.create') ?? false)

  const [loadingInitial, setLoadingInitial] = useState(isEdit)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(!isEdit)),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!isEdit || !id) return

    let cancelled = false
    void (async () => {
      try {
        const detail = await getUser(Number(id))
        if (cancelled) return
        reset({
          name: detail.name,
          mobile_number: detail.mobile_number,
          email: detail.email ?? '',
          password: '',
          status: detail.status,
          role: detail.roles[0] ?? '',
        })
      } catch {
        toast.error('Failed to load account.')
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, isEdit, reset])

  const onSubmit = async (values: FormValues) => {
    const payload: TeamUserPayload = {
      name: values.name.trim(),
      mobile_number: values.mobile_number.trim(),
      email: values.email.trim() === '' ? null : values.email.trim(),
      ...(values.password.trim() ? { password: values.password } : {}),
      status: values.status,
      role: values.role,
    }

    try {
      if (isEdit && id) {
        await updateTeamUser(Number(id), payload)
        toast.success('Account updated.')
      } else {
        await createTeamUser(payload)
        toast.success('Account created.')
      }
      navigate('/admin/team')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  if (loadingInitial) {
    return (
      <AdminLayout title={isEdit ? 'Edit account' : 'New account'}>
        <div className="mx-auto max-w-2xl py-12 text-center text-sm text-muted-foreground">Loading…</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title={isEdit ? 'Edit account' : 'New account'}
      description="Super Admin, Admin and Accounts staff accounts"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/team')}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canSave || isSubmitting}
            onClick={() => void handleSubmit(onSubmit)()}
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-2xl">
        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name?.message}>
                <Input {...register('name')} aria-invalid={!!errors.name} />
              </Field>
              <Field label="Mobile number" required error={errors.mobile_number?.message}>
                <Input {...register('mobile_number')} aria-invalid={!!errors.mobile_number} />
              </Field>
              <Field label="Email">
                <Input type="email" {...register('email')} />
              </Field>
              <Field
                label={isEdit ? 'New password (leave blank to keep current)' : 'Password'}
                required={!isEdit}
                error={errors.password?.message}
              >
                <Input type="password" {...register('password')} aria-invalid={!!errors.password} />
              </Field>
              <Field label="Role" required error={errors.role?.message}>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-invalid={!!errors.role}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Status" required error={errors.status?.message}>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  )
}
