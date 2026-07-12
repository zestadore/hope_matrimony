import axios from 'axios'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthContext'
import {
  createIndustry,
  deleteIndustry,
  listIndustries,
  updateIndustry,
  type Industry,
} from '@/api/industries'
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

interface IndustryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  industry: Industry | null
  onSaved: (industry: Industry) => void
}

function IndustryFormDialog({ open, onOpenChange, industry, onSaved }: IndustryFormDialogProps) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(industry?.name ?? '')
      setError(null)
    }
  }, [open, industry])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const payload = { name: name.trim() }
      const saved = industry ? await updateIndustry(industry.id, payload) : await createIndustry(payload)
      onSaved(saved)
      toast.success(industry ? 'Industry updated.' : 'Industry created.')
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
          <DialogTitle>{industry ? 'Edit industry' : 'New industry'}</DialogTitle>
          <DialogDescription>
            {industry ? 'Update the industry name.' : 'Add a new industry.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="industry-name">Industry name</Label>
            <Input
              id="industry-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Information Technology / Software"
              disabled={submitting}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || !name.trim()}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Industries() {
  const { user: currentUser } = useAuth()

  const [industries, setIndustries] = useState<Industry[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null)
  const [deletingIndustry, setDeletingIndustry] = useState<Industry | null>(null)

  const canCreate = currentUser?.permissions.includes('industries.create') ?? false
  const canUpdate = currentUser?.permissions.includes('industries.update') ?? false
  const canDelete = currentUser?.permissions.includes('industries.delete') ?? false

  const loadIndustries = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const { industries } = await listIndustries({ search: query })
      setIndustries(industries)
    } catch {
      toast.error('Failed to load industries.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => void loadIndustries(search), 300)
    return () => clearTimeout(timeout)
  }, [search, loadIndustries])

  const openCreate = () => {
    setEditingIndustry(null)
    setFormOpen(true)
  }

  const openEdit = (industry: Industry) => {
    setEditingIndustry(industry)
    setFormOpen(true)
  }

  const handleSaved = (saved: Industry) => {
    setIndustries((prev) => {
      const exists = prev.some((industry) => industry.id === saved.id)
      const next = exists
        ? prev.map((industry) => (industry.id === saved.id ? saved : industry))
        : [...prev, saved]
      return [...next].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const handleDelete = async () => {
    if (!deletingIndustry) return
    try {
      await deleteIndustry(deletingIndustry.id)
      setIndustries((prev) => prev.filter((industry) => industry.id !== deletingIndustry.id))
      toast.success('Industry deleted.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeletingIndustry(null)
    }
  }

  return (
    <AdminLayout title="Industries" description="Manage the industries list">
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Industries</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search industries"
                  className="pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              {canCreate && (
                <Button size="sm" onClick={openCreate}>
                  New industry
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
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {industries.map((industry) => (
                  <TableRow key={industry.id}>
                    <TableCell className="font-medium">{industry.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit"
                            title="Edit"
                            onClick={() => openEdit(industry)}
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
                            onClick={() => setDeletingIndustry(industry)}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && industries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                      No industries yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <IndustryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        industry={editingIndustry}
        onSaved={handleSaved}
      />

      <AlertDialog
        open={deletingIndustry !== null}
        onOpenChange={(open) => !open && setDeletingIndustry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete industry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingIndustry &&
                `"${deletingIndustry.name}" will be permanently removed. This can't be undone.`}
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
