import axios from 'axios'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthContext'
import {
  createCaste,
  deleteCaste,
  listCastes,
  listReligions,
  updateCaste,
  type Caste,
  type Religion,
} from '@/api/castes'
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

interface CasteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caste: Caste | null
  religions: Religion[]
  defaultReligionId: number | null
  onSaved: (caste: Caste) => void
}

function CasteFormDialog({
  open,
  onOpenChange,
  caste,
  religions,
  defaultReligionId,
  onSaved,
}: CasteFormDialogProps) {
  const [religionId, setReligionId] = useState<string>('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setReligionId(
        caste ? String(caste.religion_id) : defaultReligionId ? String(defaultReligionId) : '',
      )
      setName(caste?.name ?? '')
      setError(null)
    }
  }, [open, caste, defaultReligionId])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const payload = { religion_id: Number(religionId), name: name.trim() }
      const saved = caste ? await updateCaste(caste.id, payload) : await createCaste(payload)
      onSaved(saved)
      toast.success(caste ? 'Caste updated.' : 'Caste created.')
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
          <DialogTitle>{caste ? 'Edit caste' : 'New caste'}</DialogTitle>
          <DialogDescription>
            {caste ? 'Update the caste name or religion.' : 'Add a caste under a religion.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="caste-religion">Religion</Label>
            <Select value={religionId} onValueChange={setReligionId} disabled={submitting}>
              <SelectTrigger id="caste-religion">
                <SelectValue placeholder="Select a religion" />
              </SelectTrigger>
              <SelectContent>
                {religions.map((religion) => (
                  <SelectItem key={religion.id} value={String(religion.id)}>
                    {religion.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="caste-name">Caste name</Label>
            <Input
              id="caste-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Reddy"
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
            disabled={submitting || !name.trim() || !religionId}
          >
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Castes() {
  const { user: currentUser } = useAuth()

  const [religions, setReligions] = useState<Religion[]>([])
  const [castes, setCastes] = useState<Caste[]>([])
  const [search, setSearch] = useState('')
  const [religionFilter, setReligionFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingCaste, setEditingCaste] = useState<Caste | null>(null)
  const [deletingCaste, setDeletingCaste] = useState<Caste | null>(null)

  const canCreate = currentUser?.permissions.includes('castes.create') ?? false
  const canUpdate = currentUser?.permissions.includes('castes.update') ?? false
  const canDelete = currentUser?.permissions.includes('castes.delete') ?? false

  useEffect(() => {
    void listReligions()
      .then(setReligions)
      .catch(() => toast.error('Failed to load religions.'))
  }, [])

  const loadCastes = useCallback(async (query: string, religionId: string) => {
    setLoading(true)
    try {
      const { castes } = await listCastes({
        search: query,
        religionId: religionId === 'all' ? undefined : Number(religionId),
      })
      setCastes(castes)
    } catch {
      toast.error('Failed to load castes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => void loadCastes(search, religionFilter), 300)
    return () => clearTimeout(timeout)
  }, [search, religionFilter, loadCastes])

  const openCreate = () => {
    setEditingCaste(null)
    setFormOpen(true)
  }

  const openEdit = (caste: Caste) => {
    setEditingCaste(caste)
    setFormOpen(true)
  }

  const handleSaved = (saved: Caste) => {
    setCastes((prev) => {
      const exists = prev.some((caste) => caste.id === saved.id)
      const next = exists
        ? prev.map((caste) => (caste.id === saved.id ? saved : caste))
        : [...prev, saved]
      return [...next].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const handleDelete = async () => {
    if (!deletingCaste) return
    try {
      await deleteCaste(deletingCaste.id)
      setCastes((prev) => prev.filter((caste) => caste.id !== deletingCaste.id))
      toast.success('Caste deleted.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeletingCaste(null)
    }
  }

  return (
    <AdminLayout title="Castes" description="Manage castes by religion">
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Castes</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={religionFilter} onValueChange={setReligionFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All religions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All religions</SelectItem>
                  {religions.map((religion) => (
                    <SelectItem key={religion.id} value={String(religion.id)}>
                      {religion.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-56">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search castes"
                  className="pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  New caste
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
                  <TableHead>Religion</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {castes.map((caste) => (
                  <TableRow key={caste.id}>
                    <TableCell className="font-medium">{caste.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{caste.religion_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit"
                            title="Edit"
                            onClick={() => openEdit(caste)}
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
                            onClick={() => setDeletingCaste(caste)}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && castes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      No castes yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CasteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        caste={editingCaste}
        religions={religions}
        defaultReligionId={religionFilter === 'all' ? null : Number(religionFilter)}
        onSaved={handleSaved}
      />

      <AlertDialog open={deletingCaste !== null} onOpenChange={(open) => !open && setDeletingCaste(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete caste?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCaste && `"${deletingCaste.name}" will be permanently removed. This can't be undone.`}
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
