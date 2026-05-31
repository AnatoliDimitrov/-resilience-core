import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { createIncident } from '@/lib/api'

const URGENCY_OPTIONS = [
    { value: 'critical', label: 'Критично' },
    { value: 'high', label: 'Високо' },
    { value: 'medium', label: 'Средно' },
    { value: 'low', label: 'Ниско' },
]

const INCIDENT_TYPES = [
    { value: 'earthquake', label: 'Земетресение' },
    { value: 'fire', label: 'Пожар' },
    { value: 'flood', label: 'Наводнение' },
    { value: 'industrial', label: 'Индустриална авария' },
]

export function NewSignal() {
    const navigate = useNavigate()
    const [type, setType] = useState('earthquake')
    const [location, setLocation] = useState('')
    const [report, setReport] = useState('')
    const [casualties, setCasualties] = useState('')
    const [blockedRoutes, setBlockedRoutes] = useState('')
    const [availableResources, setAvailableResources] = useState('')
    const [missingResources, setMissingResources] = useState('')
    const [urgency, setUrgency] = useState('high')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null); setSubmitting(true)
        try {
            const res = await createIncident({
                type,
                location,
                initialReport: report,
                casualties: casualties || undefined,
                blockedRoutes: blockedRoutes || undefined,
                availableResources: availableResources || undefined,
                missingResources: missingResources || undefined,
                urgency: urgency || undefined,
                notes: notes || undefined,
            })
            navigate(`/incident/${res.incident.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Възникна грешка')
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-3xl mx-auto px-6 py-12">
                <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Назад
                </Link>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Нов сигнал</h1>
                <p className="text-muted-foreground mb-8">
                    Опишете ситуацията — двата агента ще извлекат фактите и ще предложат приоритети.
                </p>

                <Card className="p-6 backdrop-blur-sm bg-card/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Тип инцидент</Label>
                                <select id="type" value={type} onChange={(e) => setType(e.target.value)}
                                    disabled={submitting}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                    {INCIDENT_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="urgency">Ниво на спешност</Label>
                                <select id="urgency" value={urgency} onChange={(e) => setUrgency(e.target.value)}
                                    disabled={submitting}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                    {URGENCY_OPTIONS.map(u => (
                                        <option key={u.value} value={u.value}>{u.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Локация</Label>
                            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)}
                                placeholder="напр. София, район Люлин" required disabled={submitting} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="report">Първоначален доклад</Label>
                            <Textarea id="report" value={report} onChange={(e) => setReport(e.target.value)}
                                placeholder="В 14:32 силно земетресение. Срутена жилищна сграда. Чуват се викове изпод развалините..."
                                rows={5} required disabled={submitting} className="resize-none" />
                            <p className="text-xs text-muted-foreground">
                                Свободен текст — времена, локация, видими щети, признаци на живот, опасности.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="casualties">Пострадали</Label>
                                <Input id="casualties" value={casualties} onChange={(e) => setCasualties(e.target.value)}
                                    placeholder="напр. 3 пострадали, 1 в неизвестност" disabled={submitting} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="blockedRoutes">Блокирани маршрути</Label>
                                <Input id="blockedRoutes" value={blockedRoutes} onChange={(e) => setBlockedRoutes(e.target.value)}
                                    placeholder="напр. бул. Европа блокиран" disabled={submitting} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="availableResources">Налични ресурси</Label>
                                <Input id="availableResources" value={availableResources} onChange={(e) => setAvailableResources(e.target.value)}
                                    placeholder="напр. 1 пожарен екип, 1 линейка" disabled={submitting} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="missingResources">Липсващи ресурси</Label>
                                <Input id="missingResources" value={missingResources} onChange={(e) => setMissingResources(e.target.value)}
                                    placeholder="напр. техника за разчистване, генератор" disabled={submitting} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Допълнителни бележки</Label>
                            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                                placeholder="напр. риск от вторично срутване" disabled={submitting} />
                        </div>

                        {error && (
                            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                            {submitting
                                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Анализирам ситуацията…</>
                                : <><Send className="h-4 w-4 mr-2" /> Подай сигнал</>}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    )
}
