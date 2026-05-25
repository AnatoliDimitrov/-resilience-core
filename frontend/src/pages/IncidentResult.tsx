import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
    Bot, User, Plus, X, MessageSquarePlus, Send, Loader2,
    AlertTriangle, ListChecks, ClipboardList, Eye, ChevronDown, ChevronRight,
    Home, ScrollText, BellRing, BellOff, Clock, FileText, AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    type Analysis, type Incident, type Priority, type Urgency,
    getIncident, appendUpdate, latestAnalysis, setAutoReassessment,
} from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'

const URGENCY_STYLES: Record<Urgency, string> = {
    critical: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
    medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
}
const URGENCY_DOT: Record<Urgency, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-400',
    low: 'bg-emerald-500',
}
const URGENCY_LABELS: Record<Urgency, string> = {
    critical: 'Критичен', high: 'Висок', medium: 'Среден', low: 'Нисък',
}
const URGENCY_RANK: Record<Urgency, number> = { critical: 0, high: 1, medium: 2, low: 3 }

interface QueuedAnswer { question: string; answer: string }
interface Round { operatorText: string | null; analysis?: Analysis }

function CollapsibleSection({
    title, icon, defaultOpen = true, children,
}: {
    title: string
    icon: ReactNode
    defaultOpen?: boolean
    children: ReactNode
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <Card className="overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
            >
                {icon}
                <span className="font-semibold text-base flex-1">{title}</span>
                {open
                    ? <ChevronDown className="size-4 text-muted-foreground" />
                    : <ChevronRight className="size-4 text-muted-foreground" />}
            </button>
            {open && <div className="px-4 pb-4">{children}</div>}
        </Card>
    )
}

function HeaderPriorityChips({ priorities }: { priorities: Priority[] }) {
    const top = [...priorities].sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]).slice(0, 3)
    if (top.length === 0) return null
    return (
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {top.map((p, i) => (
                <Badge key={i} variant="outline" className={`${URGENCY_STYLES[p.urgency]} gap-1.5 max-w-[220px]`}>
                    <span className={`size-2 rounded-full shrink-0 ${URGENCY_DOT[p.urgency]}`} />
                    <span className="truncate">{p.label}</span>
                </Badge>
            ))}
        </div>
    )
}

function AutoReassessmentToggle({
    enabled, busy, onToggle,
}: {
    enabled: boolean
    busy: boolean
    onToggle: () => void
}) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            disabled={busy}
            title={enabled ? 'Изключи авто-преоценка' : 'Включи авто-преоценка'}
            className="gap-2 h-8"
        >
            <span className="relative flex items-center">
                <span className={`size-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {enabled && (
                    <span className="absolute inset-0 size-2 rounded-full bg-emerald-500 animate-ping opacity-60" />
                )}
            </span>
            {enabled
                ? <BellRing className="size-3.5" />
                : <BellOff className="size-3.5 text-muted-foreground" />}
            <span className="hidden sm:inline text-xs">Авто-преоценка</span>
        </Button>
    )
}

function LiveDashboard({ analysis }: { analysis: Analysis }) {
    return (
        <aside className="hidden lg:block space-y-3">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Текущо състояние</CardTitle>
                </CardHeader>
                <CardContent className="text-base whitespace-pre-wrap leading-relaxed">{analysis.summary}</CardContent>
            </Card>

            {analysis.priorities.length > 0 && (
                <CollapsibleSection
                    title="Приоритети"
                    icon={<AlertTriangle className="size-4 text-orange-500" />}
                >
                    <div className="space-y-2">
                        {analysis.priorities.map((p, i) => (
                            <div key={i} className="rounded-md border border-border/40 bg-background/50 p-3">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="font-medium text-base leading-tight">{p.label}</span>
                                    <Badge className={URGENCY_STYLES[p.urgency]} variant="outline">{URGENCY_LABELS[p.urgency] ?? p.urgency}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{p.rationale}</p>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {analysis.recommendations.length > 0 && (
                <CollapsibleSection
                    title="Препоръки"
                    icon={<ListChecks className="size-4 text-emerald-500" />}
                >
                    <div className="space-y-2">
                        {analysis.recommendations.map((r, i) => (
                            <div key={i} className="rounded-md border border-border/40 bg-background/50 p-3">
                                <div className="font-medium text-base mb-1 leading-tight">{r.action}</div>
                                <p className="text-sm text-muted-foreground mb-2">{r.rationale}</p>
                                {r.responsible && <Badge variant="secondary" className="text-xs">{r.responsible}</Badge>}
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {analysis.knownFacts.length > 0 && (
                <CollapsibleSection
                    title="Известни факти"
                    icon={<ClipboardList className="size-4 text-emerald-500" />}
                >
                    <ul className="space-y-1.5 text-sm">
                        {analysis.knownFacts.map((f, i) => (
                            <li key={i} className="flex gap-2"><span className="text-emerald-500 shrink-0">✓</span><span>{f}</span></li>
                        ))}
                    </ul>
                </CollapsibleSection>
            )}

            {analysis.unknowns.length > 0 && (
                <CollapsibleSection
                    title="Неизвестни"
                    icon={<Eye className="size-4 text-amber-500" />}
                >
                    <ul className="space-y-1.5 text-sm">
                        {analysis.unknowns.map((u, i) => (
                            <li key={i} className="flex gap-2"><span className="text-amber-500 shrink-0">?</span><span>{u}</span></li>
                        ))}
                    </ul>
                </CollapsibleSection>
            )}
        </aside>
    )
}

function OperatorCard({ text }: { text: string }) {
    return (
        <div className="flex gap-3 justify-end">
            <div className="max-w-[85%] bg-cyan-500/10 border border-cyan-500/20 rounded-2xl rounded-tr-sm px-4 py-3">
                <div className="whitespace-pre-wrap text-sm">{text}</div>
            </div>
            <div className="size-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <User className="size-4" />
            </div>
        </div>
    )
}

function AICard({ analysis }: { analysis: Analysis }) {
    const isAuto = analysis.triggeredBy === 'auto'
    return (
        <div className="flex gap-3">
            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${isAuto ? 'bg-violet-500/20' : 'bg-blue-500/20'}`}>
                {isAuto ? <Clock className="size-4 text-violet-600 dark:text-violet-400" /> : <Bot className="size-4" />}
            </div>
            <div className="max-w-[85%] flex-1">
                {isAuto && (
                    <div className="flex items-center gap-1.5 text-[11px] text-violet-700 dark:text-violet-300 mb-1 ml-1">
                        <Clock className="size-3" />
                        <span className="font-medium">Автоматична преоценка</span>
                        <span className="text-muted-foreground">· {new Date(analysis.createdAt).toLocaleTimeString('bg-BG')}</span>
                    </div>
                )}
                <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${isAuto
                    ? 'bg-violet-500/5 border border-dashed border-violet-500/40'
                    : 'bg-blue-500/5 border border-blue-500/20'}`}>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{analysis.summary}</div>
                </div>
            </div>
        </div>
    )
}

function OpenQuestionsPanel({
    questions, queued, dismissed, onQueue, onDismiss, onQueueAll,
}: {
    questions: string[]
    queued: QueuedAnswer[]
    dismissed: Set<string>
    onQueue: (q: string) => void
    onDismiss: (q: string) => void
    onQueueAll: () => void
}) {
    const visible = questions.filter(q => !dismissed.has(q) && !queued.some(qa => qa.question === q))
    if (visible.length === 0) return null
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">Отворени въпроси от ИИ</CardTitle>
                <Button variant="outline" size="sm" onClick={onQueueAll}>
                    <MessageSquarePlus className="size-3.5 mr-1.5" />Добави всички
                </Button>
            </CardHeader>
            <CardContent className="space-y-1">
                {visible.map((q, i) => (
                    <div key={i} className="flex items-start gap-2 py-1">
                        <div className="flex-1 leading-relaxed text-base">{q}</div>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0" title="Добави към отговора" onClick={() => onQueue(q)}>
                            <Plus className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground" title="Отхвърли" onClick={() => onDismiss(q)}>
                            <X className="size-4" />
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function ReplyComposer({
    queued, freeText, submitting, canSubmit, error,
    onAnswerChange, onAnswerRemove, onFreeTextChange, onSubmit, onDismissError,
}: {
    queued: QueuedAnswer[]
    freeText: string
    submitting: boolean
    canSubmit: boolean
    error: string | null
    onAnswerChange: (i: number, answer: string) => void
    onAnswerRemove: (i: number) => void
    onFreeTextChange: (v: string) => void
    onSubmit: () => void
    onDismissError: () => void
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Отговор към ИИ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {queued.length > 0 && (
                    <div className="space-y-3 p-3 rounded-md border border-blue-500/30 bg-blue-500/5">
                        <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            В отговор на въпросите ({queued.length})
                        </div>
                        {queued.map((qa, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex items-start gap-2 text-base font-medium">
                                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">?</span>
                                    <span className="flex-1">{qa.question}</span>
                                    <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => onAnswerRemove(i)}>
                                        <X className="size-3.5" />
                                    </Button>
                                </div>
                                <Input
                                    value={qa.answer}
                                    onChange={e => onAnswerChange(i, e.target.value)}
                                    placeholder="Вашият отговор…"
                                    autoFocus={i === queued.length - 1}
                                    className="text-base"
                                />
                            </div>
                        ))}
                    </div>
                )}
                <div className="space-y-1.5">
                    <div className="text-sm font-semibold text-muted-foreground">Допълнителна информация</div>
                    <Textarea
                        value={freeText}
                        onChange={e => onFreeTextChange(e.target.value)}
                        placeholder="Нови наблюдения, ресурси, развитие на ситуацията…"
                        rows={3}
                        className="text-base"
                    />
                </div>
                {error && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <div className="flex-1 leading-relaxed">{error}</div>
                        <Button variant="ghost" size="icon" className="size-6 shrink-0 text-destructive hover:text-destructive" onClick={onDismissError}>
                            <X className="size-3.5" />
                        </Button>
                    </div>
                )}
                <Button onClick={onSubmit} disabled={!canSubmit} className="w-full text-base h-11">
                    {submitting
                        ? <><Loader2 className="size-4 mr-2 animate-spin" />Изпращане…</>
                        : <><Send className="size-4 mr-2" />Изпрати към ИИ</>}
                </Button>
            </CardContent>
        </Card>
    )
}

function buildRounds(incident: Incident): Round[] {
    const rounds: Round[] = []
    const analyses = incident.analyses
    let analysisIdx = 0

    rounds.push({ operatorText: incident.initialReport, analysis: analyses[analysisIdx++] })
    while (analysisIdx < analyses.length && analyses[analysisIdx]?.triggeredBy === 'auto') {
        rounds.push({ operatorText: null, analysis: analyses[analysisIdx++] })
    }

    for (let i = 0; i < incident.updates.length; i++) {
        rounds.push({ operatorText: incident.updates[i].text, analysis: analyses[analysisIdx++] })
        while (analysisIdx < analyses.length && analyses[analysisIdx]?.triggeredBy === 'auto') {
            rounds.push({ operatorText: null, analysis: analyses[analysisIdx++] })
        }
    }
    return rounds
}

export default function IncidentResult() {
    const { id } = useParams<{ id: string }>()
    const [incident, setIncident] = useState<Incident | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [freeText, setFreeText] = useState('')
    const [queued, setQueued] = useState<QueuedAnswer[]>([])
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())
    const [autoBusy, setAutoBusy] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const submittingRef = useRef(false)

    useEffect(() => { submittingRef.current = submitting }, [submitting])

    useEffect(() => {
        if (!id) return
        localStorage.setItem('lastIncidentId', id)
        getIncident(id).then(inc => { setIncident(inc); setLoading(false) }).catch(() => setLoading(false))
    }, [id])

    useEffect(() => {
        if (!id) return
        const tick = async () => {
            if (submittingRef.current) return
            try {
                const inc = await getIncident(id)
                setIncident(prev => {
                    if (!prev) return inc
                    if (inc.analyses.length === prev.analyses.length) return prev
                    return inc
                })
            } catch {/* ignore transient */}
        }
        const handle = window.setInterval(tick, 10_000)
        return () => window.clearInterval(handle)
    }, [id])

    if (loading) return (
        <div className="p-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />Зареждане…
        </div>
    )
    if (!incident) return <div className="p-8">Сигналът не е намерен.</div>

    const latest = latestAnalysis(incident)
    const openQuestions = latest?.clarifyingQuestions ?? []

    const queueQuestion = (q: string) =>
        setQueued(prev => prev.some(x => x.question === q) ? prev : [...prev, { question: q, answer: '' }])
    const dismissQuestion = (q: string) =>
        setDismissed(prev => { const next = new Set(prev); next.add(q); return next })
    const queueAll = () => setQueued(prev => {
        const have = new Set(prev.map(p => p.question))
        return [...prev, ...openQuestions
            .filter(q => !have.has(q) && !dismissed.has(q))
            .map(q => ({ question: q, answer: '' }))]
    })
    const updateAnswer = (i: number, answer: string) =>
        setQueued(prev => prev.map((qa, idx) => idx === i ? { ...qa, answer } : qa))
    const removeQueued = (i: number) =>
        setQueued(prev => prev.filter((_, idx) => idx !== i))

    const composeText = () => {
        const parts: string[] = []
        const answered = queued.filter(qa => qa.answer.trim().length > 0)
        if (answered.length > 0) {
            parts.push('Отговори на въпросите:')
            for (const qa of answered) parts.push(`— ${qa.question}\n  ${qa.answer.trim()}`)
        }
        if (freeText.trim()) parts.push(freeText.trim())
        return parts.join('\n\n')
    }

    const canSubmit = !submitting && (queued.some(qa => qa.answer.trim()) || freeText.trim().length > 0)

    const handleSubmit = async () => {
        if (!id || !canSubmit) return
        const text = composeText()
        setSubmitError(null)
        setSubmitting(true)
        try {
            const res = await appendUpdate(id, text)
            setIncident(res.incident)
            setQueued([])
            setFreeText('')
            setDismissed(new Set())
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Възникна грешка при изпращане.')
        } finally {
            setSubmitting(false)
        }
    }

    const toggleAuto = async () => {
        if (!id || autoBusy) return
        const next = !incident.autoReassessmentEnabled
        setAutoBusy(true)
        try {
            await setAutoReassessment(id, next)
            setIncident(prev => prev ? { ...prev, autoReassessmentEnabled: next } : prev)
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Грешка при превключване на авто-преоценката.')
        } finally {
            setAutoBusy(false)
        }
    }

    const rounds = buildRounds(incident)

    return (
        <div className="bg-background min-h-screen">
            <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
                    <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" asChild title="Начало">
                            <Link to="/"><Home className="size-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Архив">
                            <Link to="/archive"><ScrollText className="size-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Доклад">
                            <Link to={`/incident/${incident.id}/report`}><FileText className="size-4" /></Link>
                        </Button>
                    </div>
                    <div className="h-6 w-px bg-border shrink-0" />
                    <div className="min-w-0 shrink-0">
                        <div className="text-sm font-medium truncate">{incident.location}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(incident.createdAt).toLocaleString('bg-BG')}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                        {latest && <HeaderPriorityChips priorities={latest.priorities} />}
                    </div>
                    <AutoReassessmentToggle
                        enabled={incident.autoReassessmentEnabled}
                        busy={autoBusy}
                        onToggle={toggleAuto}
                    />
                    <ThemeToggle />
                </div>
            </header>
            <div className="max-w-7xl mx-auto px-4 pt-4 grid lg:grid-cols-[minmax(0,1fr)_400px] gap-6">
                <main className="space-y-4 min-w-0">
                    <div className="space-y-4">
                        {rounds.map((round, i) => (
                            <div key={i} className="space-y-3">
                                {round.operatorText !== null && <OperatorCard text={round.operatorText} />}
                                {round.analysis && <AICard analysis={round.analysis} />}
                            </div>
                        ))}
                        {submitting && (
                            <div className="flex gap-3">
                                <div className="size-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                    <Bot className="size-4" />
                                </div>
                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin" />Анализирам…
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-2">
                        <OpenQuestionsPanel
                            questions={openQuestions}
                            queued={queued}
                            dismissed={dismissed}
                            onQueue={queueQuestion}
                            onDismiss={dismissQuestion}
                            onQueueAll={queueAll}
                        />
                        <ReplyComposer
                            queued={queued}
                            freeText={freeText}
                            submitting={submitting}
                            canSubmit={canSubmit}
                            error={submitError}
                            onAnswerChange={updateAnswer}
                            onAnswerRemove={removeQueued}
                            onFreeTextChange={setFreeText}
                            onSubmit={handleSubmit}
                            onDismissError={() => setSubmitError(null)}
                        />
                    </div>
                </main>

                {latest && <LiveDashboard analysis={latest} />}
            </div>
        </div>
    )
}
