import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import {
  Briefcase,
  GraduationCap,
  HeartHandshake,
  Home,
  IdCard,
  ImagePlus,
  Images,
  MapPin,
  Palette,
  Plus,
  Ruler,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { listCastes, listReligions, type Caste, type Religion } from '@/api/castes'
import { listDistricts, listStates, getLookups, type District, type LookupOptions, type State } from '@/api/lookups'
import { listIndustries, type Industry } from '@/api/industries'
import {
  listEducationLevels,
  listQualifications,
  type EducationLevel,
  type Qualification,
} from '@/api/qualifications'
import { listRoles, type Role } from '@/api/roles'
import {
  createUser,
  deleteJathakam,
  deletePhoto,
  getUser,
  setDefaultPhoto,
  updateUser,
  uploadJathakam,
  uploadPhoto,
  type MemberCareer,
  type MemberEducation,
  type MemberPhoto,
  type UserDetail,
  type UserPayload,
} from '@/api/users'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const NONE = '__none__'

interface TabMeta {
  value: string
  label: string
  icon: LucideIcon
  title: string
  description: string
}

const TABS: TabMeta[] = [
  { value: 'account', label: 'Account', icon: IdCard, title: 'Account', description: 'Login credentials, role and account status.' },
  { value: 'photos', label: 'Photos', icon: Images, title: 'Photos', description: 'Up to 4 photos — mark one as the profile photo.' },
  { value: 'personal', label: 'Personal', icon: UserRound, title: 'Personal details', description: 'Basic info, appearance, lifestyle and astrology.' },
  { value: 'family', label: 'Family', icon: Users, title: 'Family & religion', description: 'Community background and family details.' },
  { value: 'location', label: 'Location', icon: MapPin, title: 'Location', description: 'Native place and current residence.' },
  { value: 'education', label: 'Education', icon: GraduationCap, title: 'Education', description: 'Academic qualifications and institutions.' },
  { value: 'career', label: 'Career', icon: Briefcase, title: 'Career', description: 'Work history and professional details.' },
  { value: 'partner', label: 'Partner', icon: HeartHandshake, title: 'Partner preferences', description: "What the member is looking for in a match." },
]

function SectionHeading({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold leading-none">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

function RepeatCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="group grid gap-3 rounded-xl border bg-muted/20 p-4 shadow-sm transition-colors hover:border-primary/30">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

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

function useOptions<T>(fetcher: () => Promise<T[]>, deps: React.DependencyList): T[] {
  const [options, setOptions] = useState<T[]>([])

  useEffect(() => {
    let cancelled = false
    fetcher()
      .then((data) => {
        if (!cancelled) setOptions(data)
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return options
}

// Every field always has a defined default (see `emptyValues`/`detailToFormValues`),
// so these are plain `z.string()`/`z.boolean()` rather than `.optional().default(...)` —
// the latter makes zod's inferred input/output types diverge, which breaks
// zodResolver's generic matching against `FormValues`.
const optionalString = z.string()

const educationRowSchema = z.object({
  education_level_id: z.string().min(1, 'Education level is required'),
  qualification_id: optionalString,
  institution: optionalString,
  start_year: optionalString,
  end_year: optionalString,
  is_current: z.boolean(),
})

const careerRowSchema = z.object({
  designation: optionalString,
  company: optionalString,
  industry_id: optionalString,
  start_year: optionalString,
  end_year: optionalString,
  is_current: z.boolean(),
})

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile_number: z.string().min(1, 'Mobile number is required'),
  email: optionalString,
  password: optionalString,
  status: z.string().min(1, 'Status is required'),
  role: z.string().min(1, 'Role is required'),
  profile: z.object({
    gender: z.string().min(1, 'Gender is required'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    marital_status: optionalString,
    children: optionalString,
    on_behalf: optionalString,
    mother_tongue: optionalString,
    known_languages: z.array(z.string()),
    introduction: optionalString,
    height_cm: optionalString,
    weight_kg: optionalString,
    complexion: optionalString,
    body_type: optionalString,
    blood_group: optionalString,
    disability: optionalString,
    diet: optionalString,
    drink: optionalString,
    smoke: optionalString,
    living_with: optionalString,
    time_of_birth: optionalString,
    birth_city: optionalString,
    malayalam_star: optionalString,
    manglik: optionalString,
    sudha_jathakam: optionalString,
    jathakam_path: optionalString,
    jathakam_original_name: optionalString,
    hobbies: optionalString,
    interests: optionalString,
    music: optionalString,
    movies: optionalString,
    sports: optionalString,
    cuisines: optionalString,
  }),
  family: z.object({
    religion_id: optionalString,
    caste_id: optionalString,
    sub_caste: optionalString,
    community_value: optionalString,
    father_name: optionalString,
    mother_name: optionalString,
    siblings: optionalString,
    family_status: optionalString,
    family_value: optionalString,
  }),
  residency: z.object({
    native_state_id: optionalString,
    native_district_id: optionalString,
    current_state_id: optionalString,
    current_district_id: optionalString,
    current_address: optionalString,
    postal_code: optionalString,
    immigration_status: optionalString,
  }),
  educations: z.array(educationRowSchema).min(1, 'Add at least one education entry'),
  careers: z.array(careerRowSchema),
  partner_preference: z.object({
    age_from: optionalString,
    age_to: optionalString,
    height_from_cm: optionalString,
    height_to_cm: optionalString,
    marital_status: optionalString,
    children_acceptable: optionalString,
    religion_id: optionalString,
    caste_id: optionalString,
    sub_caste: optionalString,
    education_level_id: z.string().min(1, 'Partner education level is required'),
    industry_id: optionalString,
    diet: optionalString,
    smoking_acceptable: optionalString,
    drinking_acceptable: optionalString,
    body_type: optionalString,
    complexion: optionalString,
    manglik: optionalString,
    mother_tongue: optionalString,
    family_value: optionalString,
    preferred_state_id: optionalString,
    general: optionalString,
  }),
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

const emptyEducationRow = {
  education_level_id: '',
  qualification_id: '',
  institution: '',
  start_year: '',
  end_year: '',
  is_current: false,
}

const emptyCareerRow = {
  designation: '',
  company: '',
  industry_id: '',
  start_year: '',
  end_year: '',
  is_current: false,
}

const emptyValues: FormValues = {
  name: '',
  mobile_number: '',
  email: '',
  password: '',
  status: 'active',
  role: '',
  profile: {
    gender: '',
    date_of_birth: '',
    marital_status: '',
    children: '',
    on_behalf: '',
    mother_tongue: '',
    known_languages: [],
    introduction: '',
    height_cm: '',
    weight_kg: '',
    complexion: '',
    body_type: '',
    blood_group: '',
    disability: '',
    diet: '',
    drink: '',
    smoke: '',
    living_with: '',
    time_of_birth: '',
    birth_city: '',
    malayalam_star: '',
    manglik: '',
    sudha_jathakam: '',
    jathakam_path: '',
    jathakam_original_name: '',
    hobbies: '',
    interests: '',
    music: '',
    movies: '',
    sports: '',
    cuisines: '',
  },
  family: {
    religion_id: '',
    caste_id: '',
    sub_caste: '',
    community_value: '',
    father_name: '',
    mother_name: '',
    siblings: '',
    family_status: '',
    family_value: '',
  },
  residency: {
    native_state_id: '',
    native_district_id: '',
    current_state_id: '',
    current_district_id: '',
    current_address: '',
    postal_code: '',
    immigration_status: '',
  },
  educations: [emptyEducationRow],
  careers: [],
  partner_preference: {
    age_from: '',
    age_to: '',
    height_from_cm: '',
    height_to_cm: '',
    marital_status: '',
    children_acceptable: '',
    religion_id: '',
    caste_id: '',
    sub_caste: '',
    education_level_id: '',
    industry_id: '',
    diet: '',
    smoking_acceptable: '',
    drinking_acceptable: '',
    body_type: '',
    complexion: '',
    manglik: '',
    mother_tongue: '',
    family_value: '',
    preferred_state_id: '',
    general: '',
  },
}

function detailToFormValues(detail: UserDetail): FormValues {
  const p = detail.profile
  const f = detail.family
  const r = detail.residency
  const pp = detail.partner_preference

  return {
    name: detail.name,
    mobile_number: detail.mobile_number,
    email: detail.email ?? '',
    password: '',
    status: detail.status,
    role: detail.roles[0] ?? '',
    profile: {
      gender: p?.gender ?? '',
      date_of_birth: p?.date_of_birth ? p.date_of_birth.slice(0, 10) : '',
      marital_status: p?.marital_status ?? '',
      children: p?.children?.toString() ?? '',
      on_behalf: p?.on_behalf ?? '',
      mother_tongue: p?.mother_tongue ?? '',
      known_languages: p?.known_languages ?? [],
      introduction: p?.introduction ?? '',
      height_cm: p?.height_cm?.toString() ?? '',
      weight_kg: p?.weight_kg?.toString() ?? '',
      complexion: p?.complexion ?? '',
      body_type: p?.body_type ?? '',
      blood_group: p?.blood_group ?? '',
      disability: p?.disability ?? '',
      diet: p?.diet ?? '',
      drink: p?.drink ?? '',
      smoke: p?.smoke ?? '',
      living_with: p?.living_with ?? '',
      time_of_birth: p?.time_of_birth ?? '',
      birth_city: p?.birth_city ?? '',
      malayalam_star: p?.malayalam_star ?? '',
      manglik: p?.manglik ?? '',
      sudha_jathakam: p?.sudha_jathakam ?? '',
      jathakam_path: p?.jathakam_path ?? '',
      jathakam_original_name: p?.jathakam_original_name ?? '',
      hobbies: p?.hobbies ?? '',
      interests: p?.interests ?? '',
      music: p?.music ?? '',
      movies: p?.movies ?? '',
      sports: p?.sports ?? '',
      cuisines: p?.cuisines ?? '',
    },
    family: {
      religion_id: f?.religion_id?.toString() ?? '',
      caste_id: f?.caste_id?.toString() ?? '',
      sub_caste: f?.sub_caste ?? '',
      community_value: f?.community_value ?? '',
      father_name: f?.father_name ?? '',
      mother_name: f?.mother_name ?? '',
      siblings: f?.siblings ?? '',
      family_status: f?.family_status ?? '',
      family_value: f?.family_value ?? '',
    },
    residency: {
      native_state_id: r?.native_state_id?.toString() ?? '',
      native_district_id: r?.native_district_id?.toString() ?? '',
      current_state_id: r?.current_state_id?.toString() ?? '',
      current_district_id: r?.current_district_id?.toString() ?? '',
      current_address: r?.current_address ?? '',
      postal_code: r?.postal_code ?? '',
      immigration_status: r?.immigration_status ?? '',
    },
    educations:
      detail.educations.length > 0
        ? detail.educations.map((e) => ({
            education_level_id: e.education_level_id?.toString() ?? '',
            qualification_id: e.qualification_id?.toString() ?? '',
            institution: e.institution ?? '',
            start_year: e.start_year?.toString() ?? '',
            end_year: e.end_year?.toString() ?? '',
            is_current: e.is_current,
          }))
        : [emptyEducationRow],
    careers: detail.careers.map((c) => ({
      designation: c.designation ?? '',
      company: c.company ?? '',
      industry_id: c.industry_id?.toString() ?? '',
      start_year: c.start_year?.toString() ?? '',
      end_year: c.end_year?.toString() ?? '',
      is_current: c.is_current,
    })),
    partner_preference: {
      age_from: pp?.age_from?.toString() ?? '',
      age_to: pp?.age_to?.toString() ?? '',
      height_from_cm: pp?.height_from_cm?.toString() ?? '',
      height_to_cm: pp?.height_to_cm?.toString() ?? '',
      marital_status: pp?.marital_status ?? '',
      children_acceptable: pp?.children_acceptable ?? '',
      religion_id: pp?.religion_id?.toString() ?? '',
      caste_id: pp?.caste_id?.toString() ?? '',
      sub_caste: pp?.sub_caste ?? '',
      education_level_id: pp?.education_level_id?.toString() ?? '',
      industry_id: pp?.industry_id?.toString() ?? '',
      diet: pp?.diet ?? '',
      smoking_acceptable: pp?.smoking_acceptable ?? '',
      drinking_acceptable: pp?.drinking_acceptable ?? '',
      body_type: pp?.body_type ?? '',
      complexion: pp?.complexion ?? '',
      manglik: pp?.manglik ?? '',
      mother_tongue: pp?.mother_tongue ?? '',
      family_value: pp?.family_value ?? '',
      preferred_state_id: pp?.preferred_state_id?.toString() ?? '',
      general: pp?.general ?? '',
    },
  }
}

function toNum(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

function toStr(value: string): string | null {
  return value.trim() === '' ? null : value
}

function buildPayload(values: FormValues): UserPayload {
  return {
    name: values.name.trim(),
    mobile_number: values.mobile_number.trim(),
    email: toStr(values.email),
    ...(values.password.trim() ? { password: values.password } : {}),
    status: values.status,
    role: values.role,
    profile: {
      gender: values.profile.gender as 'male' | 'female',
      date_of_birth: values.profile.date_of_birth,
      marital_status: toStr(values.profile.marital_status),
      children: toNum(values.profile.children),
      on_behalf: toStr(values.profile.on_behalf),
      mother_tongue: toStr(values.profile.mother_tongue),
      known_languages: values.profile.known_languages.length ? values.profile.known_languages : null,
      introduction: toStr(values.profile.introduction),
      height_cm: toNum(values.profile.height_cm),
      weight_kg: toNum(values.profile.weight_kg),
      complexion: toStr(values.profile.complexion),
      body_type: toStr(values.profile.body_type),
      blood_group: toStr(values.profile.blood_group),
      disability: toStr(values.profile.disability),
      diet: toStr(values.profile.diet),
      drink: toStr(values.profile.drink),
      smoke: toStr(values.profile.smoke),
      living_with: toStr(values.profile.living_with),
      time_of_birth: toStr(values.profile.time_of_birth),
      birth_city: toStr(values.profile.birth_city),
      malayalam_star: toStr(values.profile.malayalam_star),
      manglik: toStr(values.profile.manglik),
      sudha_jathakam: toStr(values.profile.sudha_jathakam),
      jathakam_path: toStr(values.profile.jathakam_path),
      jathakam_original_name: toStr(values.profile.jathakam_original_name),
      hobbies: toStr(values.profile.hobbies),
      interests: toStr(values.profile.interests),
      music: toStr(values.profile.music),
      movies: toStr(values.profile.movies),
      sports: toStr(values.profile.sports),
      cuisines: toStr(values.profile.cuisines),
    },
    family: {
      religion_id: toNum(values.family.religion_id),
      caste_id: toNum(values.family.caste_id),
      sub_caste: toStr(values.family.sub_caste),
      community_value: toStr(values.family.community_value),
      father_name: toStr(values.family.father_name),
      mother_name: toStr(values.family.mother_name),
      siblings: toStr(values.family.siblings),
      family_status: toStr(values.family.family_status),
      family_value: toStr(values.family.family_value),
    },
    residency: {
      native_state_id: toNum(values.residency.native_state_id),
      native_district_id: toNum(values.residency.native_district_id),
      current_state_id: toNum(values.residency.current_state_id),
      current_district_id: toNum(values.residency.current_district_id),
      current_address: toStr(values.residency.current_address),
      postal_code: toStr(values.residency.postal_code),
      immigration_status: toStr(values.residency.immigration_status),
    },
    educations: values.educations.map(
      (e): MemberEducation => ({
        education_level_id: toNum(e.education_level_id),
        qualification_id: toNum(e.qualification_id),
        institution: toStr(e.institution),
        start_year: toNum(e.start_year),
        end_year: toNum(e.end_year),
        is_current: e.is_current,
      }),
    ),
    careers: values.careers.map(
      (c): MemberCareer => ({
        designation: toStr(c.designation),
        company: toStr(c.company),
        industry_id: toNum(c.industry_id),
        start_year: toNum(c.start_year),
        end_year: toNum(c.end_year),
        is_current: c.is_current,
      }),
    ),
    partner_preference: {
      age_from: toNum(values.partner_preference.age_from),
      age_to: toNum(values.partner_preference.age_to),
      height_from_cm: toNum(values.partner_preference.height_from_cm),
      height_to_cm: toNum(values.partner_preference.height_to_cm),
      marital_status: toStr(values.partner_preference.marital_status),
      children_acceptable: toStr(values.partner_preference.children_acceptable),
      religion_id: toNum(values.partner_preference.religion_id),
      caste_id: toNum(values.partner_preference.caste_id),
      sub_caste: toStr(values.partner_preference.sub_caste),
      education_level_id: toNum(values.partner_preference.education_level_id),
      industry_id: toNum(values.partner_preference.industry_id),
      diet: toStr(values.partner_preference.diet),
      smoking_acceptable: toStr(values.partner_preference.smoking_acceptable),
      drinking_acceptable: toStr(values.partner_preference.drinking_acceptable),
      body_type: toStr(values.partner_preference.body_type),
      complexion: toStr(values.partner_preference.complexion),
      manglik: toStr(values.partner_preference.manglik),
      mother_tongue: toStr(values.partner_preference.mother_tongue),
      family_value: toStr(values.partner_preference.family_value),
      preferred_state_id: toNum(values.partner_preference.preferred_state_id),
      general: toStr(values.partner_preference.general),
    },
  } as UserPayload
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
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

function FieldSelect({
  value,
  onChange,
  placeholder = 'Select…',
  options,
  includeNone = true,
  disabled,
  error,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  options: { value: string; label: string }[]
  includeNone?: boolean
  disabled?: boolean
  error?: string
}) {
  return (
    <Select value={value === '' ? NONE : value} onValueChange={(v) => onChange(v === NONE ? '' : v)} disabled={disabled}>
      <SelectTrigger className="w-full" aria-invalid={!!error}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeNone && <SelectItem value={NONE}>—</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function toOptions(values: string[]): { value: string; label: string }[] {
  return values.map((value) => ({ value, label: value }))
}

function cmToFeetInches(cm: number): string {
  // Round the total inches first, then split — rounding feet/inches
  // separately lets inches hit 12, which should roll over into the next foot.
  const totalInches = Math.round(cm / 2.54)
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${feet}'${inches}"`
}

const HEIGHT_OPTIONS = Array.from({ length: 213 - 122 + 1 }, (_, i) => {
  const cm = 122 + i
  return { value: String(cm), label: `${cm} cm (${cmToFeetInches(cm)})` }
})

const WEIGHT_OPTIONS = Array.from({ length: 150 - 30 + 1 }, (_, i) => {
  const kg = 30 + i
  return { value: String(kg), label: `${kg} kg` }
})

interface RowLookups {
  educationLevels: EducationLevel[]
  industries: Industry[]
}

function EducationRow({
  index,
  control,
  register,
  errors,
  onRemove,
  canRemove,
  lookups,
}: {
  index: number
  control: Control<FormValues>
  register: UseFormRegister<FormValues>
  errors: FieldErrors<FormValues>
  onRemove: () => void
  canRemove: boolean
  lookups: RowLookups
}) {
  const educationLevelId = useWatch({ control, name: `educations.${index}.education_level_id` })
  const qualifications = useOptions(
    () =>
      educationLevelId
        ? listQualifications({ educationLevelId: Number(educationLevelId) }).then((r) => r.qualifications)
        : Promise.resolve([] as Qualification[]),
    [educationLevelId],
  )
  const rowErrors = errors.educations?.[index]

  return (
    <RepeatCard title={`Education #${index + 1}`}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Education level" required error={rowErrors?.education_level_id?.message}>
          <Controller
            control={control}
            name={`educations.${index}.education_level_id`}
            render={({ field }) => (
              <FieldSelect
                value={field.value}
                onChange={field.onChange}
                includeNone={false}
                placeholder="Select level"
                options={lookups.educationLevels.map((e) => ({ value: String(e.id), label: e.name }))}
                error={rowErrors?.education_level_id?.message}
              />
            )}
          />
        </Field>
        <Field label="Qualification">
          <Controller
            control={control}
            name={`educations.${index}.qualification_id`}
            render={({ field }) => (
              <FieldSelect
                value={field.value}
                onChange={field.onChange}
                placeholder="Select qualification"
                options={qualifications.map((q) => ({ value: String(q.id), label: q.name }))}
                disabled={!educationLevelId}
              />
            )}
          />
        </Field>
        <Field label="Institution">
          <Input {...register(`educations.${index}.institution`)} placeholder="e.g. Osmania University" />
        </Field>
        <Field label="Start year">
          <Input type="number" {...register(`educations.${index}.start_year`)} placeholder="2015" />
        </Field>
        <Field label="End year">
          <Input type="number" {...register(`educations.${index}.end_year`)} placeholder="2019" />
        </Field>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Controller
              control={control}
              name={`educations.${index}.is_current`}
              render={({ field }) => (
                <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(!!c)} />
              )}
            />
            Currently studying
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={!canRemove}>
          <Trash2 />
          Remove
        </Button>
      </div>
    </RepeatCard>
  )
}

function CareerRow({
  index,
  control,
  register,
  onRemove,
  industries,
}: {
  index: number
  control: Control<FormValues>
  register: UseFormRegister<FormValues>
  onRemove: () => void
  industries: Industry[]
}) {
  return (
    <RepeatCard title={`Employment #${index + 1}`}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Designation">
          <Input {...register(`careers.${index}.designation`)} placeholder="e.g. Software Engineer" />
        </Field>
        <Field label="Company">
          <Input {...register(`careers.${index}.company`)} placeholder="e.g. Acme Corp" />
        </Field>
        <Field label="Industry">
          <Controller
            control={control}
            name={`careers.${index}.industry_id`}
            render={({ field }) => (
              <FieldSelect
                value={field.value}
                onChange={field.onChange}
                placeholder="Select industry"
                options={industries.map((i) => ({ value: String(i.id), label: i.name }))}
              />
            )}
          />
        </Field>
        <Field label="Start year">
          <Input type="number" {...register(`careers.${index}.start_year`)} placeholder="2019" />
        </Field>
        <Field label="End year">
          <Input type="number" {...register(`careers.${index}.end_year`)} placeholder="2023" />
        </Field>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Controller
              control={control}
              name={`careers.${index}.is_current`}
              render={({ field }) => (
                <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(!!c)} />
              )}
            />
            Current job
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 />
          Remove
        </Button>
      </div>
    </RepeatCard>
  )
}

const MAX_PHOTOS = 4
const MAX_PHOTO_MB = 5
const PHOTO_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'

function PhotoManager({
  userId,
  photos,
  onChange,
  canEdit,
}: {
  userId: number | null
  photos: MemberPhoto[]
  onChange: (photos: MemberPhoto[]) => void
  canEdit: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center">
        <Images className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Save the member first</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Photos can be added once the profile has been created. Save the form, then return to this
          tab to upload up to {MAX_PHOTOS} photos.
        </p>
      </div>
    )
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast.error(`Each photo must be ${MAX_PHOTO_MB} MB or smaller.`)
      return
    }

    setBusy(true)
    try {
      onChange(await uploadPhoto(userId, file))
      toast.success('Photo uploaded.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (photoId: number) => {
    setBusy(true)
    try {
      onChange(await deletePhoto(userId, photoId))
      toast.success('Photo removed.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSetDefault = async (photoId: number) => {
    setBusy(true)
    try {
      onChange(await setDefaultPhoto(userId, photoId))
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {photos.length} of {MAX_PHOTOS} photos · JPG, PNG or WebP up to {MAX_PHOTO_MB} MB.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
          >
            <img src={photo.path} alt="" className="size-full object-cover" />
            {photo.is_default && (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground shadow">
                <Star className="size-3 fill-current" />
                Profile
              </span>
            )}
            {canEdit && (
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {!photo.is_default ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 gap-1 px-2 text-xs"
                    disabled={busy}
                    onClick={() => void handleSetDefault(photo.id)}
                  >
                    <Star className="size-3.5" />
                    Set default
                  </Button>
                ) : (
                  <span />
                )}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="destructive"
                  className="size-7"
                  aria-label="Delete photo"
                  disabled={busy}
                  onClick={() => void handleDelete(photo.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            )}
          </div>
        ))}

        {canEdit && photos.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
          >
            <ImagePlus className="size-6" />
            <span className="text-xs font-medium">{busy ? 'Uploading…' : 'Add photo'}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        className="hidden"
        onChange={(event) => void handleUpload(event)}
      />
    </div>
  )
}

export default function UserForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const canSave = isEdit
    ? (currentUser?.permissions.includes('users.update') ?? false)
    : (currentUser?.permissions.includes('users.create') ?? false)

  const [loadingInitial, setLoadingInitial] = useState(true)
  const [tab, setTab] = useState('account')
  const [memberId, setMemberId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<MemberPhoto[]>([])
  const [lookups, setLookups] = useState<LookupOptions | null>(null)
  const [states, setStates] = useState<State[]>([])
  const [religions, setReligions] = useState<Religion[]>([])
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(!isEdit)),
    defaultValues: emptyValues,
  })

  const educationArray = useFieldArray({ control, name: 'educations' })
  const careerArray = useFieldArray({ control, name: 'careers' })

  const jathakamInputRef = useRef<HTMLInputElement>(null)
  const [jathakamBusy, setJathakamBusy] = useState(false)
  // On a new profile there is no user id to attach the file to yet, so the
  // chosen file is held here and uploaded straight after the user is created.
  const [pendingJathakam, setPendingJathakam] = useState<File | null>(null)
  const jathakamPath = useWatch({ control, name: 'profile.jathakam_path' })
  const jathakamOriginalName = useWatch({ control, name: 'profile.jathakam_original_name' })

  const handleJathakamUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    // Creating: defer the upload until the user record exists (see onSubmit).
    if (!isEdit || !id) {
      setPendingJathakam(file)
      return
    }

    setJathakamBusy(true)
    try {
      const result = await uploadJathakam(Number(id), file)
      setValue('profile.jathakam_path', result.jathakam_path, { shouldDirty: true })
      setValue('profile.jathakam_original_name', result.jathakam_original_name, { shouldDirty: true })
      toast.success('Horoscope uploaded.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setJathakamBusy(false)
    }
  }

  const handleJathakamRemove = async () => {
    if (pendingJathakam) {
      setPendingJathakam(null)
      return
    }

    if (!id) return

    setJathakamBusy(true)
    try {
      await deleteJathakam(Number(id))
      setValue('profile.jathakam_path', '', { shouldDirty: true })
      setValue('profile.jathakam_original_name', '', { shouldDirty: true })
      toast.success('Horoscope removed.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setJathakamBusy(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const [lookupData, stateData, religionData, educationLevelData, industryData, roleData] = await Promise.all([
          getLookups(),
          listStates(),
          listReligions(),
          listEducationLevels(),
          listIndustries({}).then((r) => r.industries),
          listRoles(),
        ])

        if (cancelled) return

        setLookups(lookupData)
        setStates(stateData)
        setReligions(religionData)
        setEducationLevels(educationLevelData)
        setIndustries(industryData)
        setRoles(roleData)

        if (isEdit && id) {
          const detail = await getUser(Number(id))
          if (!cancelled) {
            setMemberId(detail.profile_id)
            setPhotos(detail.photos ?? [])
            reset(detailToFormValues(detail))
          }
        }
      } catch {
        toast.error('Failed to load form data.')
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, isEdit, reset])

  const familyReligionId = useWatch({ control, name: 'family.religion_id' })
  const familyCastes = useOptions(
    () =>
      familyReligionId
        ? listCastes({ religionId: Number(familyReligionId) }).then((r) => r.castes)
        : Promise.resolve([] as Caste[]),
    [familyReligionId],
  )

  const ppReligionId = useWatch({ control, name: 'partner_preference.religion_id' })
  const ppCastes = useOptions(
    () =>
      ppReligionId
        ? listCastes({ religionId: Number(ppReligionId) }).then((r) => r.castes)
        : Promise.resolve([] as Caste[]),
    [ppReligionId],
  )

  const nativeStateId = useWatch({ control, name: 'residency.native_state_id' })
  const nativeDistricts = useOptions(
    () => (nativeStateId ? listDistricts(Number(nativeStateId)) : Promise.resolve([] as District[])),
    [nativeStateId],
  )

  const currentStateId = useWatch({ control, name: 'residency.current_state_id' })
  const currentDistricts = useOptions(
    () => (currentStateId ? listDistricts(Number(currentStateId)) : Promise.resolve([] as District[])),
    [currentStateId],
  )

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = buildPayload(values)
      if (isEdit && id) {
        await updateUser(Number(id), payload)
        toast.success('User updated.')
      } else {
        const created = await createUser(payload)
        if (pendingJathakam) {
          try {
            await uploadJathakam(created.id, pendingJathakam)
            setPendingJathakam(null)
          } catch (err) {
            // The profile itself saved — surface the file failure without
            // discarding the created user; it can be re-uploaded from edit.
            toast.error(extractErrorMessage(err))
          }
        }
        toast.success('User created.')
        navigate(`/admin/users/${created.id}/edit`, { replace: true })
        return
      }
      navigate('/admin/users')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const stateOptions = states.map((s) => ({ value: String(s.id), label: s.name }))
  const religionOptions = religions.map((r) => ({ value: String(r.id), label: r.name }))
  const educationLevelOptions = educationLevels.map((e) => ({ value: String(e.id), label: e.name }))
  const industryOptions = industries.map((i) => ({ value: String(i.id), label: i.name }))
  const roleOptions = roles.map((r) => ({ value: r.name, label: r.name }))

  if (loadingInitial) {
    return (
      <AdminLayout title={isEdit ? 'Edit user' : 'New user'}>
        <div className="mx-auto max-w-5xl py-12 text-center text-sm text-muted-foreground">Loading…</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title={isEdit ? 'Edit user' : 'New user'}
      description="Member profile, family & religion, education and partner preferences"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
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
      <div className="mx-auto max-w-5xl">
        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
          <Card className="overflow-hidden py-0">
            <CardContent className="p-0">
              <Tabs value={tab} onValueChange={setTab}>
                <div className="border-b bg-muted/30 p-3">
                  <div className="-mx-1 overflow-x-auto px-1 pb-1">
                    <TabsList className="h-auto w-full min-w-max flex-wrap justify-center gap-1.5 bg-transparent p-0 group-data-horizontal/tabs:h-auto sm:min-w-0">
                      {TABS.map(({ value, label, icon: Icon }) => (
                        <TabsTrigger
                          key={value}
                          value={value}
                          className="h-auto flex-none gap-1.5 rounded-full border border-transparent px-3 py-1 text-xs font-medium data-active:border-primary/20 data-active:bg-background data-active:text-primary data-active:shadow-sm dark:data-active:bg-background [&_svg:not([class*='size-'])]:size-3.5"
                        >
                          <Icon />
                          {label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>

                {TABS.filter((t) => t.value === tab).map((t) => (
                  <div key={t.value} className="flex items-center gap-3 border-b bg-gradient-to-r from-primary/5 to-transparent px-6 py-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <t.icon className="size-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold leading-none">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </div>
                  </div>
                ))}

                <div className="p-6">

                <TabsContent value="account" className="grid gap-4 sm:grid-cols-2">
                  {isEdit && memberId && (
                    <Field label="Member ID">
                      <Input value={memberId} readOnly className="bg-muted font-mono" />
                    </Field>
                  )}
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
                        <FieldSelect
                          value={field.value}
                          onChange={field.onChange}
                          includeNone={false}
                          placeholder="Select role"
                          options={roleOptions}
                          error={errors.role?.message}
                        />
                      )}
                    />
                  </Field>
                  <Field label="Status" required error={errors.status?.message}>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <FieldSelect
                          value={field.value}
                          onChange={field.onChange}
                          includeNone={false}
                          options={[
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                            { value: 'suspended', label: 'Suspended' },
                          ]}
                        />
                      )}
                    />
                  </Field>
                </TabsContent>

                <TabsContent value="photos">
                  <PhotoManager
                    userId={isEdit && id ? Number(id) : null}
                    photos={photos}
                    onChange={setPhotos}
                    canEdit={canSave}
                  />
                </TabsContent>

                <TabsContent value="personal" className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Gender" required error={errors.profile?.gender?.message}>
                      <Controller
                        control={control}
                        name="profile.gender"
                        render={({ field }) => (
                          <FieldSelect
                            value={field.value}
                            onChange={field.onChange}
                            includeNone={false}
                            options={toOptions(lookups?.genders ?? [])}
                            error={errors.profile?.gender?.message}
                          />
                        )}
                      />
                    </Field>
                    <Field label="Date of birth" required error={errors.profile?.date_of_birth?.message}>
                      <Input type="date" {...register('profile.date_of_birth')} aria-invalid={!!errors.profile?.date_of_birth} />
                    </Field>
                    <Field label="Marital status">
                      <Controller
                        control={control}
                        name="profile.marital_status"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.marital_statuses ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Children">
                      <Input type="number" min={0} {...register('profile.children')} />
                    </Field>
                    <Field label="Profile created by">
                      <Controller
                        control={control}
                        name="profile.on_behalf"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.on_behalf ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Mother tongue">
                      <Controller
                        control={control}
                        name="profile.mother_tongue"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.languages ?? [])} />
                        )}
                      />
                    </Field>
                  </div>

                  <Controller
                    control={control}
                    name="profile.known_languages"
                    render={({ field }) => (
                      <Field label="Known languages">
                        <div className="grid grid-cols-2 gap-2 rounded-lg border border-input p-3 sm:grid-cols-4">
                          {(lookups?.languages ?? []).map((lang) => {
                            const checked = field.value.includes(lang)
                            return (
                              <label key={lang} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(c) =>
                                    field.onChange(
                                      c ? [...field.value, lang] : field.value.filter((l) => l !== lang),
                                    )
                                  }
                                />
                                {lang}
                              </label>
                            )
                          })}
                        </div>
                      </Field>
                    )}
                  />

                  <Field label="Introduction">
                    <Textarea {...register('profile.introduction')} rows={3} placeholder="A short bio about the member…" />
                  </Field>

                  <Separator />
                  <SectionHeading icon={Ruler} title="Physical & lifestyle" description="Appearance, habits and living details." />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Height">
                      <Controller
                        control={control}
                        name="profile.height_cm"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={HEIGHT_OPTIONS} placeholder="Select height" />
                        )}
                      />
                    </Field>
                    <Field label="Weight">
                      <Controller
                        control={control}
                        name="profile.weight_kg"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={WEIGHT_OPTIONS} placeholder="Select weight" />
                        )}
                      />
                    </Field>
                    <Field label="Complexion">
                      <Controller
                        control={control}
                        name="profile.complexion"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.complexions ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Body type">
                      <Controller
                        control={control}
                        name="profile.body_type"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.body_types ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Blood group">
                      <Controller
                        control={control}
                        name="profile.blood_group"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.blood_groups ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Disability (if any)">
                      <Input {...register('profile.disability')} />
                    </Field>
                    <Field label="Diet">
                      <Controller
                        control={control}
                        name="profile.diet"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.diets ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Drink">
                      <Controller
                        control={control}
                        name="profile.drink"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.habit_levels ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Smoke">
                      <Controller
                        control={control}
                        name="profile.smoke"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.habit_levels ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Living with">
                      <Controller
                        control={control}
                        name="profile.living_with"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.living_with ?? [])} />
                        )}
                      />
                    </Field>
                  </div>

                  <Separator />
                  <SectionHeading icon={Sparkles} title="Astrology" description="Horoscope and birth-chart details." />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Malayalam star">
                      <Controller
                        control={control}
                        name="profile.malayalam_star"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.malayalam_stars ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Time of birth">
                      <Input {...register('profile.time_of_birth')} placeholder="e.g. 10:45 AM" />
                    </Field>
                    <Field label="Birth city">
                      <Input {...register('profile.birth_city')} />
                    </Field>
                    <Field label="Chowa Dosham">
                      <Controller
                        control={control}
                        name="profile.manglik"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.manglik ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Sudha Jathakam">
                      <Controller
                        control={control}
                        name="profile.sudha_jathakam"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.manglik ?? [])} />
                        )}
                      />
                    </Field>
                  </div>

                  <Field label="Jathakam document (.jpg or .pdf)">
                    <div className="flex flex-wrap items-center gap-2">
                      {pendingJathakam ? (
                        <span className="text-sm text-muted-foreground">{pendingJathakam.name}</span>
                      ) : (
                        jathakamPath && (
                          <a
                            href={jathakamPath}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline underline-offset-2"
                          >
                            {jathakamOriginalName || 'View uploaded file'}
                          </a>
                        )
                      )}
                      <input
                        ref={jathakamInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
                        className="hidden"
                        onChange={(event) => void handleJathakamUpload(event)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={jathakamBusy}
                        onClick={() => jathakamInputRef.current?.click()}
                      >
                        <Upload />
                        {pendingJathakam || jathakamPath ? 'Replace file' : 'Upload file'}
                      </Button>
                      {(pendingJathakam || jathakamPath) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={jathakamBusy}
                          onClick={() => void handleJathakamRemove()}
                        >
                          <Trash2 />
                          Remove
                        </Button>
                      )}
                    </div>
                    {pendingJathakam && (
                      <p className="text-xs text-muted-foreground">
                        Will be uploaded when you save the profile.
                      </p>
                    )}
                  </Field>

                  <Separator />
                  <SectionHeading icon={Palette} title="Hobbies & interests" description="Personality and lifestyle interests." />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Hobbies">
                      <Input {...register('profile.hobbies')} placeholder="Comma separated" />
                    </Field>
                    <Field label="Interests">
                      <Input {...register('profile.interests')} placeholder="Comma separated" />
                    </Field>
                    <Field label="Music">
                      <Input {...register('profile.music')} />
                    </Field>
                    <Field label="Movies">
                      <Input {...register('profile.movies')} />
                    </Field>
                    <Field label="Sports">
                      <Input {...register('profile.sports')} />
                    </Field>
                    <Field label="Cuisines">
                      <Input {...register('profile.cuisines')} />
                    </Field>
                  </div>
                </TabsContent>

                <TabsContent value="family" className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Religion">
                      <Controller
                        control={control}
                        name="family.religion_id"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={religionOptions} placeholder="Select religion" />
                        )}
                      />
                    </Field>
                    <Field label="Caste">
                      <Controller
                        control={control}
                        name="family.caste_id"
                        render={({ field }) => (
                          <FieldSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={familyCastes.map((c) => ({ value: String(c.id), label: c.name }))}
                            placeholder="Select caste"
                            disabled={!familyReligionId}
                          />
                        )}
                      />
                    </Field>
                    <Field label="Sub-caste">
                      <Input {...register('family.sub_caste')} />
                    </Field>
                    <Field label="Community value">
                      <Input {...register('family.community_value')} />
                    </Field>
                    <Field label="Family status">
                      <Controller
                        control={control}
                        name="family.family_status"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.family_statuses ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Family value">
                      <Controller
                        control={control}
                        name="family.family_value"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.family_values ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Father's name">
                      <Input {...register('family.father_name')} />
                    </Field>
                    <Field label="Mother's name">
                      <Input {...register('family.mother_name')} />
                    </Field>
                    <Field label="Siblings">
                      <Input {...register('family.siblings')} placeholder="e.g. 1 brother, 1 sister" />
                    </Field>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="grid gap-4">
                  <SectionHeading icon={MapPin} title="Native place" description="Where the member is originally from." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Native state">
                      <Controller
                        control={control}
                        name="residency.native_state_id"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={stateOptions} placeholder="Select state" />
                        )}
                      />
                    </Field>
                    <Field label="Native district">
                      <Controller
                        control={control}
                        name="residency.native_district_id"
                        render={({ field }) => (
                          <FieldSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={nativeDistricts.map((d) => ({ value: String(d.id), label: d.name }))}
                            placeholder="Select district"
                            disabled={!nativeStateId}
                          />
                        )}
                      />
                    </Field>
                  </div>

                  <Separator />
                  <SectionHeading icon={Home} title="Current residence" description="Where the member currently lives." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Current state">
                      <Controller
                        control={control}
                        name="residency.current_state_id"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={stateOptions} placeholder="Select state" />
                        )}
                      />
                    </Field>
                    <Field label="Current district">
                      <Controller
                        control={control}
                        name="residency.current_district_id"
                        render={({ field }) => (
                          <FieldSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={currentDistricts.map((d) => ({ value: String(d.id), label: d.name }))}
                            placeholder="Select district"
                            disabled={!currentStateId}
                          />
                        )}
                      />
                    </Field>
                    <Field label="Address">
                      <Textarea {...register('residency.current_address')} rows={2} />
                    </Field>
                    <Field label="Postal code">
                      <Input {...register('residency.postal_code')} />
                    </Field>
                    <Field label="Immigration status">
                      <Input {...register('residency.immigration_status')} placeholder="e.g. Citizen, NRI, Work Visa" />
                    </Field>
                  </div>
                </TabsContent>

                <TabsContent value="education" className="grid gap-4">
                  {errors.educations?.message && (
                    <p className="text-sm text-destructive">{errors.educations.message}</p>
                  )}
                  {educationArray.fields.map((field, index) => (
                    <EducationRow
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      errors={errors}
                      onRemove={() => educationArray.remove(index)}
                      canRemove={educationArray.fields.length > 1}
                      lookups={{ educationLevels, industries }}
                    />
                  ))}
                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={() => educationArray.append(emptyEducationRow)}>
                      <Plus />
                      Add education
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="career" className="grid gap-4">
                  {careerArray.fields.length === 0 && (
                    <p className="text-sm text-muted-foreground">No career history added yet.</p>
                  )}
                  {careerArray.fields.map((field, index) => (
                    <CareerRow
                      key={field.id}
                      index={index}
                      control={control}
                      register={register}
                      onRemove={() => careerArray.remove(index)}
                      industries={industries}
                    />
                  ))}
                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={() => careerArray.append(emptyCareerRow)}>
                      <Plus />
                      Add career
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="partner" className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Age from">
                      <Input type="number" {...register('partner_preference.age_from')} />
                    </Field>
                    <Field label="Age to" error={errors.partner_preference?.age_to?.message}>
                      <Input type="number" {...register('partner_preference.age_to')} />
                    </Field>
                    <Field label="Height from">
                      <Controller
                        control={control}
                        name="partner_preference.height_from_cm"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={HEIGHT_OPTIONS} placeholder="Select height" />
                        )}
                      />
                    </Field>
                    <Field label="Height to">
                      <Controller
                        control={control}
                        name="partner_preference.height_to_cm"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={HEIGHT_OPTIONS} placeholder="Select height" />
                        )}
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Marital status">
                      <Controller
                        control={control}
                        name="partner_preference.marital_status"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.marital_statuses ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Children acceptable">
                      <Controller
                        control={control}
                        name="partner_preference.children_acceptable"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.children_acceptable ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Mother tongue">
                      <Controller
                        control={control}
                        name="partner_preference.mother_tongue"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.languages ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Religion">
                      <Controller
                        control={control}
                        name="partner_preference.religion_id"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={religionOptions} placeholder="Select religion" />
                        )}
                      />
                    </Field>
                    <Field label="Caste">
                      <Controller
                        control={control}
                        name="partner_preference.caste_id"
                        render={({ field }) => (
                          <FieldSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={ppCastes.map((c) => ({ value: String(c.id), label: c.name }))}
                            placeholder="Select caste"
                            disabled={!ppReligionId}
                          />
                        )}
                      />
                    </Field>
                    <Field label="Sub-caste">
                      <Input {...register('partner_preference.sub_caste')} />
                    </Field>
                    <Field label="Education level" required error={errors.partner_preference?.education_level_id?.message}>
                      <Controller
                        control={control}
                        name="partner_preference.education_level_id"
                        render={({ field }) => (
                          <FieldSelect
                            value={field.value}
                            onChange={field.onChange}
                            includeNone={false}
                            options={educationLevelOptions}
                            placeholder="Select level"
                            error={errors.partner_preference?.education_level_id?.message}
                          />
                        )}
                      />
                    </Field>
                    <Field label="Profession / industry">
                      <Controller
                        control={control}
                        name="partner_preference.industry_id"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={industryOptions} placeholder="Select industry" />
                        )}
                      />
                    </Field>
                    <Field label="Diet">
                      <Controller
                        control={control}
                        name="partner_preference.diet"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.diets ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Smoking acceptable">
                      <Controller
                        control={control}
                        name="partner_preference.smoking_acceptable"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.habit_levels ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Drinking acceptable">
                      <Controller
                        control={control}
                        name="partner_preference.drinking_acceptable"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.habit_levels ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Body type">
                      <Controller
                        control={control}
                        name="partner_preference.body_type"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.body_types ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Complexion">
                      <Controller
                        control={control}
                        name="partner_preference.complexion"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.complexions ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Chowa Dosham">
                      <Controller
                        control={control}
                        name="partner_preference.manglik"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.manglik ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Family value">
                      <Controller
                        control={control}
                        name="partner_preference.family_value"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={toOptions(lookups?.family_values ?? [])} />
                        )}
                      />
                    </Field>
                    <Field label="Preferred state">
                      <Controller
                        control={control}
                        name="partner_preference.preferred_state_id"
                        render={({ field }) => (
                          <FieldSelect value={field.value} onChange={field.onChange} options={stateOptions} placeholder="Select state" />
                        )}
                      />
                    </Field>
                  </div>
                  <Field label="Additional notes">
                    <Textarea {...register('partner_preference.general')} rows={3} placeholder="Anything else the family is looking for…" />
                  </Field>
                </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  )
}
