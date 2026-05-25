import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Bot, User, Plus, X, MessageSquarePlus, Send, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    type Analysis, type Incident, type Priority, type Urgency,
    getIncident, appendUpdate, latestAnalysis,
} from '@/lib/api'
import { diffAnalyses, type AnalysisDelta } from '@/lib/analysis-diff'
import { AnalysisDetail } from '@/components/AnalysisDetail'
import { ThemeToggle } from '@/components/ThemeToggle'

const URGENCY_STYLES: Record<Urgency, string> = {
    critical: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
    medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
}
const URGENCY_RANK: Record<Urgency, number> = { critical: 0, high: 1, medium: 2, low: 3 }

interface QueuedAnswer { question: string; answer: string }
interface Round { operatorText: string; analysis?: Analysis }

function PriorityDashboard({ priorities }: { priorities: Priority[] }) {
    const sorted = [...priorities].sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]).slice(0, 3)
    if (sorted.length === 0) return null
    return (
        <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/80 backdrop-blur border-b">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Текущи приоритети</div>
            <div className="flex gap-2 flex-wrap">
                {sorted.map((p, i) => (
                    <Badge key={i} variant="outline" className={URGENCY_STYLES[p.urgency]}>{p.label}</Badge>
                ))}
            </div>
        </div>
    )
}

function OperatorCard({ text }: { text: string }) {
    return (
        <div className="flex gap-3 justify-end">
            <div className="max-w-[80%] bg-cyan-500/10 border border-cyan-500/20 rounded-2xl rounded-tr-sm px-4 py-3">
                <div className="whitespace-pre-wrap text-sm">{text}</div>
            </div>
            <div className="size-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <User className="size-4" />
            </div>
        </div>
    )
}

function AICard({ analysis, delta }: { analysis: Analysis; delta: AnalysisDelta }) {
    const [expanded, setExpanded] = useState(false)
    return (
        <div className="flex gap-3">
            <div className="size-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Bot className="size-4" />
            </div>
            <div className="max-w-[80%] flex-1 space-y-2">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{analysis.summary}</div>
                    {!delta.isInitial && delta.hasChanges && (
                        <ul className="mt-3 space-y-1 text-xs text-muted-foreground border-t border-blue-500/15 pt-2">
                            {delta.promotedPriorities.map((p, i) => (
                                <li key={`pp${i}`}>↑ <span className="font-medium">{p.label}</span>: {p.from} → {p.to}</li>
                            ))}
                            {delta.newPriorities.map((p, i) => (
                                <li key={`np${i}`}>＋ Нов приоритет: <span className="font-medium">{p.label}</span> ({p.urgency})</li>
                            ))}
                            {delta.resolvedQuestions.slice(0, 3).map((q, i) => (
                                <li key={`rq${i}`}>✓ Изяснено: {q}</li>
                            ))}
                            {delta.newQuestions.slice(0, 3).map((q, i) => (
                                <li key={`nq${i}`}>? Нов въпрос: {q}</li>
                            ))}
                        </ul>
                    )}
                    <Button variant="ghost" size="sm" className="mt-2 -ml-2 text-xs" onClick={() => setExpanded(e => !e)}>
                        {expanded ? 'Скрий детайли' : 'Покажи детайли'}
                    </Button>
                </div>
                {expanded && <AnalysisDetail analysis={analysis} />}
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
                <CardTitle className="text-sm">Отворени въпроси от ИИ</CardTitle>
                <Button variant="outline" size="sm" onClick={onQueueAll}>
                    <MessageSquarePlus className="size-3.5 mr-1.5" />Добави всички
                </Button>
            </CardHeader>
            <CardContent className="space-y-2">
                {visible.map((q, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm py-1">
                        <div className="flex-1 leading-relaxed">{q}</div>
                        <Button variant="ghost" size="icon" className="size-7 shrink-0" title="Добави към отговора" onClick={() => onQueue(q)}>
                            <Plus className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground" title="Отхвърли" onClick={() => onDismiss(q)}>
                            <X className="size-4" />
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function QueuedAnswers({
    queued, onChange, onRemove,
}: {
    queued: QueuedAnswer[]
    onChange: (i: number, answer: string) => void
    onRemove: (i: number) => void
}) {
    if (queued.length === 0) return null
    return (
        <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">В отговор на въпросите ({queued.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {queued.map((qa, i) => (
                    <div key={i} className="space-y-1.5">
                        <div className="flex items-start gap-2 text-sm font-medium">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">?</span>
                            <span className="flex-1">{qa.question}</span>
                            <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => onRemove(i)}>
                                <X className="size-3.5" />
                            </Button>
                        </div>
                        <Input
                            value={qa.answer}
                            onChange={e => onChange(i, e.target.value)}
                            placeholder="Вашият отговор…"
                            autoFocus={i === queued.length - 1}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function buildRounds(incident: Incident): Round[] {
    const rounds: Round[] = [{ operatorText: incident.initialReport, analysis: incident.analyses[0] }]
    for (let i = 0; i < incident.updates.length; i++) {
        rounds.push({ operatorText: incident.updates[i].text, analysis: incident.analyses[i + 1] })
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

    useEffect(() => {
        if (!id) return
        getIncident(id).then(inc => { setIncident(inc); setLoading(false) }).catch(() => setLoading(false))
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
        setSubmitting(true)
        try {
            const res = await appendUpdate(id, text)
            setIncident(res.incident)
            setQueued([])
            setFreeText('')
            setDismissed(new Set())
        } finally {
            setSubmitting(false)
        }
    }

    const rounds = buildRounds(incident)

    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center justify-between p-4 border-b">
                <div>
                    <div className="text-sm text-muted-foreground">{incident.location}</div>
                    <div className="text-xs text-muted-foreground">{new Date(incident.createdAt).toLocaleString('bg-BG')}</div>
                </div>
                <ThemeToggle />
            </header>
            <div className="max-w-3xl mx-auto px-4 pb-32 space-y-4">
                {latest && <PriorityDashboard priorities={latest.priorities} />}

                <div className="space-y-4 pt-4">
                    {rounds.map((round, i) => (
                        <div key={i} className="space-y-3">
                            <OperatorCard text={round.operatorText} />
                            {round.analysis && (
                                <AICard
                                    analysis={round.analysis}
                                    delta={diffAnalyses(rounds[i - 1]?.analysis, round.analysis)}
                                />
                            )}
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

                <div className="space-y-3 pt-4">
                    <OpenQuestionsPanel
                        questions={openQuestions}
                        queued={queued}
                        dismissed={dismissed}
                        onQueue={queueQuestion}
                        onDismiss={dismissQuestion}
                        onQueueAll={queueAll}
                    />
                    <QueuedAnswers queued={queued} onChange={updateAnswer} onRemove={removeQueued} />
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Допълнителна информация</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea
                                value={freeText}
                                onChange={e => setFreeText(e.target.value)}
                                placeholder="Нови наблюдения, ресурси, развитие на ситуацията…"
                                rows={3}
                            />
                            <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
                                {submitting
                                    ? <><Loader2 className="size-4 mr-2 animate-spin" />Изпращане…</>
                                    : <><Send className="size-4 mr-2" />Изпрати</>}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}