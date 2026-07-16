import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Check,
  Droplet,
  FileText,
  GraduationCap,
  Heart,
  HeartHandshake,
  Images,
  Languages,
  MapPin,
  Pencil,
  Phone,
  Ruler,
  Share2,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthContext'
import { listCastes, listReligions, type Caste, type Religion } from '@/api/castes'
import { listDistricts, listStates, type District, type State } from '@/api/lookups'
import { listEducationLevels, type EducationLevel } from '@/api/qualifications'
import { listIndustries, type Industry } from '@/api/industries'
import { getUser, type UserDetail } from '@/api/users'
import AdminLayout from '@/components/layout/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// The education/career detail rows arrive with their lookup relations eager
// loaded by the API (see UserController::RELATIONS), but the shared API types
// only model the raw ids — describe the nested shape locally.
interface NamedRef {
  name: string
}
interface EducationWithNames {
  institution: string | null
  start_year: number | null
  end_year: number | null
  is_current: boolean
  education_level?: NamedRef | null
  qualification?: NamedRef | null
}
interface CareerWithNames {
  designation: string | null
  company: string | null
  start_year: number | null
  end_year: number | null
  is_current: boolean
  industry?: NamedRef | null
}

function cmToFeetInches(cm: number): string {
  const totalInches = Math.round(cm / 2.54)
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${feet}'${inches}"`
}

function height(cm: number | null | undefined): string | null {
  return cm ? `${cm} cm (${cmToFeetInches(cm)})` : null
}

function yearRange(start: number | null, end: number | null, isCurrent: boolean): string | null {
  if (isCurrent) return `${start ?? '—'} – Present`
  if (start && end) return `${start} – ${end}`
  return start ? String(start) : end ? String(end) : null
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'active') return 'default'
  if (status === 'suspended') return 'destructive'
  return 'secondary'
}

/** A labelled value; renders nothing when the value is empty. */
function Detail({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return null
  }
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

/** Chip shown in the hero summary strip. */
function Fact({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  if (!children) return null
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur">
      <Icon className="size-3.5 text-primary" />
      {children}
    </div>
  )
}

function cap(value: string | null | undefined): string | null {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : null
}

export default function UserView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const canUpdate = currentUser?.permissions.includes('users.update') ?? false

  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [religions, setReligions] = useState<Religion[]>([])
  const [states, setStates] = useState<State[]>([])
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])
  const [castes, setCastes] = useState<Caste[]>([])
  const [districts, setDistricts] = useState<District[]>([])

  useEffect(() => {
    if (!id) return
    let cancelled = false

    void (async () => {
      setLoading(true)
      try {
        const [user, religionData, stateData, educationLevelData, industryData] = await Promise.all([
          getUser(Number(id)),
          listReligions(),
          listStates(),
          listEducationLevels(),
          listIndustries({}).then((r) => r.industries),
        ])
        if (cancelled) return
        setDetail(user)
        setReligions(religionData)
        setStates(stateData)
        setEducationLevels(educationLevelData)
        setIndustries(industryData)

        // Castes and districts are scoped to a parent (religion / state), so
        // resolve only the ones this profile actually references.
        const religionIds = [user.family?.religion_id, user.partner_preference?.religion_id].filter(
          (v): v is number => typeof v === 'number',
        )
        const stateIds = [
          user.residency?.native_state_id,
          user.residency?.current_state_id,
        ].filter((v): v is number => typeof v === 'number')

        const [casteLists, districtLists] = await Promise.all([
          Promise.all([...new Set(religionIds)].map((rid) => listCastes({ religionId: rid }).then((r) => r.castes))),
          Promise.all([...new Set(stateIds)].map((sid) => listDistricts(sid))),
        ])
        if (cancelled) return
        setCastes(casteLists.flat())
        setDistricts(districtLists.flat())
      } catch {
        if (!cancelled) toast.error('Failed to load member profile.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  const maps = useMemo(
    () => ({
      religion: new Map(religions.map((r) => [r.id, r.name])),
      state: new Map(states.map((s) => [s.id, s.name])),
      educationLevel: new Map(educationLevels.map((e) => [e.id, e.name])),
      industry: new Map(industries.map((i) => [i.id, i.name])),
      caste: new Map(castes.map((c) => [c.id, c.name])),
      district: new Map(districts.map((d) => [d.id, d.name])),
    }),
    [religions, states, educationLevels, industries, castes, districts],
  )

  const handleShare = async () => {
    const url = window.location.href
    const shareData = {
      title: detail ? `${detail.name}${detail.profile_id ? ` · ${detail.profile_id}` : ''}` : 'Member profile',
      text: detail ? `Member profile of ${detail.name}` : undefined,
      url,
    }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData)
      } catch {
        // User dismissed the share sheet — nothing to do.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Profile link copied to clipboard.')
    } catch {
      toast.error('Could not copy the link.')
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Member profile">
        <div className="mx-auto max-w-5xl py-12 text-center text-sm text-muted-foreground">Loading…</div>
      </AdminLayout>
    )
  }

  if (!detail) {
    return (
      <AdminLayout title="Member profile">
        <div className="mx-auto max-w-5xl py-12 text-center text-sm text-muted-foreground">
          Member not found.
        </div>
      </AdminLayout>
    )
  }

  const p = detail.profile
  const f = detail.family
  const r = detail.residency
  const pp = detail.partner_preference
  const photos = detail.photos ?? []
  const defaultPhoto = photos.find((photo) => photo.is_default) ?? photos[0] ?? null
  const otherPhotos = photos.filter((photo) => photo !== defaultPhoto)
  const educations = detail.educations as unknown as EducationWithNames[]
  const careers = detail.careers as unknown as CareerWithNames[]

  const currentLocation = [
    r?.current_district_id ? maps.district.get(r.current_district_id) : null,
    r?.current_state_id ? maps.state.get(r.current_state_id) : null,
  ]
    .filter(Boolean)
    .join(', ')

  const religionCaste = [
    f?.religion_id ? maps.religion.get(f.religion_id) : null,
    f?.caste_id ? maps.caste.get(f.caste_id) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <AdminLayout
      title="Member profile"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
            <ArrowLeft />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleShare()}>
            <Share2 />
            Share
          </Button>
          {canUpdate && (
            <Button size="sm" onClick={() => navigate(`/admin/users/${detail.id}/edit`)}>
              <Pencil />
              Edit
            </Button>
          )}
        </div>
      }
    >
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Hero */}
        <Card className="overflow-hidden py-0">
          <div className="h-24 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent" />
          <CardContent className="p-5 pt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="-mt-12 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-primary/15 text-2xl font-semibold text-primary shadow-sm">
                {defaultPhoto ? (
                  <img src={defaultPhoto.url} alt={detail.name} className="size-full object-cover" />
                ) : (
                  initials(detail.name)
                )}
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold">{detail.name}</h1>
                    <Badge variant={statusVariant(detail.status)} className="capitalize">
                      {detail.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {detail.profile_id && (
                      <span className="font-mono text-xs">{detail.profile_id}</span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3.5" />
                      {detail.mobile_number}
                    </span>
                    {detail.email && <span>{detail.email}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {detail.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Fact icon={CalendarDays}>
                {p?.gender || detail.age !== null
                  ? `${cap(p?.gender) ?? ''}${p?.gender && detail.age !== null ? ', ' : ''}${detail.age !== null ? `${detail.age} yrs` : ''}`.trim()
                  : null}
              </Fact>
              <Fact icon={Ruler}>{height(p?.height_cm)}</Fact>
              <Fact icon={Heart}>{p?.marital_status}</Fact>
              <Fact icon={HeartHandshake}>{religionCaste || null}</Fact>
              <Fact icon={GraduationCap}>{detail.education_level_name}</Fact>
              <Fact icon={MapPin}>{currentLocation || null}</Fact>
            </div>
          </CardContent>
        </Card>

        {p?.introduction && (
          <InfoCard icon={FileText} title="About">
            <p className="text-sm leading-relaxed text-muted-foreground">{p.introduction}</p>
          </InfoCard>
        )}

        {photos.length > 0 && (
          <InfoCard icon={Images} title="Photos">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {defaultPhoto && (
                <a
                  href={defaultPhoto.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
                >
                  <img
                    src={defaultPhoto.url}
                    alt={detail.name}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground shadow">
                    Profile
                  </span>
                </a>
              )}
              {(showAllPhotos ? otherPhotos : []).map((photo) => (
                <a
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
                >
                  <img
                    src={photo.url}
                    alt={detail.name}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
            {otherPhotos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAllPhotos((value) => !value)}
              >
                {showAllPhotos ? 'Show less' : `Show ${otherPhotos.length} more photo${otherPhotos.length > 1 ? 's' : ''}`}
              </Button>
            )}
          </InfoCard>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Personal */}
          <InfoCard icon={BadgeCheck} title="Personal details">
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="Date of birth" value={p?.date_of_birth ? p.date_of_birth.slice(0, 10) : null} />
              <Detail label="Marital status" value={p?.marital_status} />
              <Detail label="Children" value={p?.children != null ? String(p.children) : null} />
              <Detail label="Profile created by" value={p?.on_behalf} />
              <Detail label="Mother tongue" value={p?.mother_tongue} />
              <Detail label="Living with" value={p?.living_with} />
            </dl>
            {p?.known_languages && p.known_languages.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Known languages
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {p.known_languages.map((lang) => (
                    <Badge key={lang} variant="secondary" className="gap-1 font-normal">
                      <Languages className="size-3" />
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </InfoCard>

          {/* Physical & lifestyle */}
          <InfoCard icon={Ruler} title="Physical & lifestyle">
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="Height" value={height(p?.height_cm)} />
              <Detail label="Weight" value={p?.weight_kg ? `${p.weight_kg} kg` : null} />
              <Detail label="Complexion" value={p?.complexion} />
              <Detail label="Body type" value={p?.body_type} />
              <Detail
                label="Blood group"
                value={
                  p?.blood_group ? (
                    <span className="inline-flex items-center gap-1">
                      <Droplet className="size-3.5 text-destructive" />
                      {p.blood_group}
                    </span>
                  ) : null
                }
              />
              <Detail label="Diet" value={p?.diet} />
              <Detail label="Drink" value={p?.drink} />
              <Detail label="Smoke" value={p?.smoke} />
              <Detail label="Disability" value={p?.disability} />
            </dl>
          </InfoCard>

          {/* Astrology */}
          <InfoCard icon={Sparkles} title="Astrology">
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="Malayalam star" value={p?.malayalam_star} />
              <Detail label="Time of birth" value={p?.time_of_birth} />
              <Detail label="Birth city" value={p?.birth_city} />
              <Detail label="Chowa Dosham" value={p?.manglik} />
              <Detail label="Sudha Jathakam" value={p?.sudha_jathakam} />
            </dl>
            {p?.jathakam_path && (
              <a
                href={p.jathakam_path}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted"
              >
                <FileText className="size-4" />
                {p.jathakam_original_name || 'View horoscope document'}
              </a>
            )}
          </InfoCard>

          {/* Family & religion */}
          <InfoCard icon={Users} title="Family & religion">
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="Religion" value={f?.religion_id ? maps.religion.get(f.religion_id) : null} />
              <Detail label="Caste" value={f?.caste_id ? maps.caste.get(f.caste_id) : null} />
              <Detail label="Sub-caste" value={f?.sub_caste} />
              <Detail label="Community" value={f?.community_value} />
              <Detail label="Family status" value={f?.family_status} />
              <Detail label="Family value" value={f?.family_value} />
              <Detail label="Father's name" value={f?.father_name} />
              <Detail label="Mother's name" value={f?.mother_name} />
              <Detail label="Siblings" value={f?.siblings} className="col-span-2" />
            </dl>
          </InfoCard>

          {/* Location */}
          <InfoCard icon={MapPin} title="Location">
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="Native state" value={r?.native_state_id ? maps.state.get(r.native_state_id) : null} />
              <Detail
                label="Native district"
                value={r?.native_district_id ? maps.district.get(r.native_district_id) : null}
              />
              <Detail label="Current state" value={r?.current_state_id ? maps.state.get(r.current_state_id) : null} />
              <Detail
                label="Current district"
                value={r?.current_district_id ? maps.district.get(r.current_district_id) : null}
              />
              <Detail label="Postal code" value={r?.postal_code} />
              <Detail label="Immigration status" value={r?.immigration_status} />
              <Detail label="Address" value={r?.current_address} className="col-span-2" />
            </dl>
          </InfoCard>

          {/* Hobbies */}
          {(p?.hobbies || p?.interests || p?.music || p?.movies || p?.sports || p?.cuisines) && (
            <InfoCard icon={Heart} title="Hobbies & interests">
              <dl className="grid grid-cols-2 gap-4">
                <Detail label="Hobbies" value={p?.hobbies} />
                <Detail label="Interests" value={p?.interests} />
                <Detail label="Music" value={p?.music} />
                <Detail label="Movies" value={p?.movies} />
                <Detail label="Sports" value={p?.sports} />
                <Detail label="Cuisines" value={p?.cuisines} />
              </dl>
            </InfoCard>
          )}
        </div>

        {/* Education */}
        <InfoCard icon={GraduationCap} title="Education">
          {educations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No education details.</p>
          ) : (
            <div className="space-y-3">
              {educations.map((e, i) => (
                <div key={i} className="flex gap-3 rounded-lg border bg-muted/20 p-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <GraduationCap className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{e.education_level?.name ?? 'Education'}</p>
                      {e.qualification?.name && (
                        <span className="text-sm text-muted-foreground">· {e.qualification.name}</span>
                      )}
                      {e.is_current && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Check className="size-3" />
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {e.institution && <span>{e.institution}</span>}
                      {yearRange(e.start_year, e.end_year, e.is_current) && (
                        <span>{yearRange(e.start_year, e.end_year, e.is_current)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InfoCard>

        {/* Career */}
        {careers.length > 0 && (
          <InfoCard icon={Briefcase} title="Career">
            <div className="space-y-3">
              {careers.map((c, i) => (
                <div key={i} className="flex gap-3 rounded-lg border bg-muted/20 p-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Briefcase className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{c.designation || 'Role'}</p>
                      {c.company && <span className="text-sm text-muted-foreground">· {c.company}</span>}
                      {c.is_current && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Check className="size-3" />
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {c.industry?.name && <span>{c.industry.name}</span>}
                      {yearRange(c.start_year, c.end_year, c.is_current) && (
                        <span>{yearRange(c.start_year, c.end_year, c.is_current)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>
        )}

        {/* Partner preferences */}
        <InfoCard icon={HeartHandshake} title="Partner preferences">
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Detail
              label="Age"
              value={pp?.age_from || pp?.age_to ? `${pp?.age_from ?? '—'} – ${pp?.age_to ?? '—'} yrs` : null}
            />
            <Detail
              label="Height"
              value={
                pp?.height_from_cm || pp?.height_to_cm
                  ? `${height(pp?.height_from_cm) ?? '—'} – ${height(pp?.height_to_cm) ?? '—'}`
                  : null
              }
            />
            <Detail label="Marital status" value={pp?.marital_status} />
            <Detail label="Children acceptable" value={pp?.children_acceptable} />
            <Detail label="Religion" value={pp?.religion_id ? maps.religion.get(pp.religion_id) : null} />
            <Detail label="Caste" value={pp?.caste_id ? maps.caste.get(pp.caste_id) : null} />
            <Detail label="Sub-caste" value={pp?.sub_caste} />
            <Detail
              label="Education"
              value={pp?.education_level_id ? maps.educationLevel.get(pp.education_level_id) : null}
            />
            <Detail label="Profession" value={pp?.industry_id ? maps.industry.get(pp.industry_id) : null} />
            <Detail label="Mother tongue" value={pp?.mother_tongue} />
            <Detail label="Diet" value={pp?.diet} />
            <Detail label="Body type" value={pp?.body_type} />
            <Detail label="Complexion" value={pp?.complexion} />
            <Detail label="Chowa Dosham" value={pp?.manglik} />
            <Detail label="Smoking" value={pp?.smoking_acceptable} />
            <Detail label="Drinking" value={pp?.drinking_acceptable} />
            <Detail label="Family value" value={pp?.family_value} />
            <Detail label="Preferred state" value={pp?.preferred_state_id ? maps.state.get(pp.preferred_state_id) : null} />
          </dl>
          {pp?.general && (
            <>
              <Separator />
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Additional notes
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{pp.general}</p>
              </div>
            </>
          )}
        </InfoCard>
      </div>
    </AdminLayout>
  )
}
