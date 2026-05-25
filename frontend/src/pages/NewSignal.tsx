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

export function NewSignal() {
    const navigate = useNavigate()
    const [location, setLocation] = useState('')
    const [report, setReport] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null); setSubmitting(true)
        try {
            const res = await createIncident({ type: 'earthquake', location, initialReport: report })
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
                        <div className="space-y-2">
                            <Label htmlFor="location">Локация</Label>
                            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)}
                                placeholder="напр. София, район Лозенец" required disabled={submitting} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="report">Първоначален доклад</Label>
                            <Textarea id="report" value={report} onChange={(e) => setReport(e.target.value)}
                                placeholder="В 14:32 силно земетресение. Срутена жилищна сграда. Чуват се викове изпод развалините..."
                                rows={8} required disabled={submitting} className="resize-none" />
                            <p className="text-xs text-muted-foreground">
                                Пишете на свободен език — времена, локация, видими щети, признаци на живот, опасности.
                            </p>
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