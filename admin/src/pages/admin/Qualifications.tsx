import axios from 'axios'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthContext'
import {
  createQualification,
  deleteQualification,
  listEducationLevels,
  listQualifications,
  updateQualification,
  type EducationLevel,
  type Qualification,
} from '@/api/qualifications'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AdminLayout from '@/components/layout/AdminLayout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

interface QualificationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  qualification: Qualification | null
  educationLevels: EducationLevel[]
  defaultEducationLevelId: number | null
  onSaved: (qualification: Qualification) => void
}

function QualificationFormDialog({
  open,
  onOpenChange,
  qualification,
  educationLevels,
  defaultEducationLevelId,
  onSaved,
}: QualificationFormDialogProps) {
  const [educationLevelId, setEducationLevelId] = useState<string>('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setEducationLevelId(
        qualification
          ? String(qualification.education_level_id)
          : defaultEducationLevelId
            ? String(defaultEducationLevelId)
            : '',
      )
      setName(qualification?.name ?? '')
      setError(null)
    }
  }, [open, qualification, defaultEducationLevelId])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const payload = { education_level_id: Number(educationLevelId), name: name.trim() }
      const saved = qualification
        ? await updateQualification(qualification.id, payload)
        : await createQualification(payload)
      onSaved(saved)
      toast.success(qualification ? 'Qualification updated.' : 'Qualification created.')
      onOpenChange(false)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{qualification ? 'Edit qualification' : 'New qualification'}</DialogTitle>
          <DialogDescription>
            {qualification
              ? 'Update the qualification name or education level.'
              : 'Add a qualification under an education level.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="qualification-level">Education level</Label>
            <Select value={educationLevelId} onValueChange={setEducationLevelId} disabled={submitting}>
              <SelectTrigger id="qualification-level">
                <SelectValue placeholder="Select an education level" />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map((level) => (
                  <SelectItem key={level.id} value={String(level.id)}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="qualification-name">Qualification name</Label>
            <Input
              id="qualification-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. B.Tech / B.E"
              disabled={submitting}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting || !name.trim() || !educationLevelId}
          >
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Qualifications() {
  const { user: currentUser } = useAuth()

  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([])
  const [qualifications, setQualifications] = useState<Qualification[]>([])
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingQualification, setEditingQualification] = useState<Qualification | null>(null)
  const [deletingQualification, setDeletingQualification] = useState<Qualification | null>(null)

  const canCreate = currentUser?.permissions.includes('qualifications.create') ?? false
  const canUpdate = currentUser?.permissions.includes('qualifications.update') ?? false
  const canDelete = currentUser?.permissions.includes('qualifications.delete') ?? false

  useEffect(() => {
    void listEducationLevels()
      .then(setEducationLevels)
      .catch(() => toast.error('Failed to load education levels.'))
  }, [])

  const loadQualifications = useCallback(async (query: string, educationLevelId: string) => {
    setLoading(true)
    try {
      const { qualifications } = await listQualifications({
        search: query,
        educationLevelId: educationLevelId === 'all' ? undefined : Number(educationLevelId),
      })
      setQualifications(qualifications)
    } catch {
      toast.error('Failed to load qualifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => void loadQualifications(search, levelFilter), 300)
    return () => clearTimeout(timeout)
  }, [search, levelFilter, loadQualifications])

  const openCreate = () => {
    setEditingQualification(null)
    setFormOpen(true)
  }

  const openEdit = (qualification: Qualification) => {
    setEditingQualification(qualification)
    setFormOpen(true)
  }

  const handleSaved = (saved: Qualification) => {
    setQualifications((prev) => {
      const exists = prev.some((qualification) => qualification.id === saved.id)
      const next = exists
        ? prev.map((qualification) => (qualification.id === saved.id ? saved : qualification))
        : [...prev, saved]
      return [...next].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const handleDelete = async () => {
    if (!deletingQualification) return
    try {
      await deleteQualification(deletingQualification.id)
      setQualifications((prev) =>
        prev.filter((qualification) => qualification.id !== deletingQualification.id),
      )
      toast.success('Qualification deleted.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeletingQualification(null)
    }
  }

  return (
    <AdminLayout title="Qualifications" description="Manage qualifications by education level">
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Qualifications</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="All education levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All education levels</SelectItem>
                  {educationLevels.map((level) => (
                    <SelectItem key={level.id} value={String(level.id)}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-56">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search qualifications"
                  className="pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  New qualification
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Education level</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualifications.map((qualification) => (
                  <TableRow key={qualification.id}>
                    <TableCell className="font-medium">{qualification.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{qualification.education_level_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit"
                            title="Edit"
                            onClick={() => openEdit(qualification)}
                          >
                            <Pencil />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete"
                            title="Delete"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeletingQualification(qualification)}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && qualifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      No qualifications yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <QualificationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        qualification={editingQualification}
        educationLevels={educationLevels}
        defaultEducationLevelId={levelFilter === 'all' ? null : Number(levelFilter)}
        onSaved={handleSaved}
      />

      <AlertDialog
        open={deletingQualification !== null}
        onOpenChange={(open) => !open && setDeletingQualification(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete qualification?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingQualification &&
                `"${deletingQualification.name}" will be permanently removed. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
