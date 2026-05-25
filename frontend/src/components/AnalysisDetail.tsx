import { AlertTriangle, ListChecks, ClipboardList, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Analysis, Urgency } from '@/lib/api'

const urgencyStyles: Record<Urgency, string> = {
    critical: 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400',
    high: 'bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400',
    medium: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400',
    low: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
}
const urgencyLabels: Record<Urgency, string> = {
    critical: 'Критичен', high: 'Висок', medium: 'Среден', low: 'Нисък',
}

export function AnalysisDetail({ analysis }: { analysis: Analysis }) {
    return (
        <div className="space-y-5 mt-4 pt-4 border-t border-border/40">
            <div>
                <h4 className="flex items-center gap-2 font-semibold mb-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Приоритети
                </h4>
                <div className="space-y-2">
                    {analysis.priorities.map((p, i) => (
                        <div key={i} className="rounded-md border border-border/40 bg-background/50 p-3">
                            <div className="flex items-start justify-between gap-3 mb-1">
                                <h5 className="font-medium text-sm">{p.label}</h5>
                                <Badge className={urgencyStyles[p.urgency]} variant="outline">
                                    {urgencyLabels[p.urgency] ?? p.urgency}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{p.rationale}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="flex items-center gap-2 font-semibold mb-2 text-sm">
                    <ListChecks className="h-4 w-4 text-emerald-500" /> Препоръки
                </h4>
                <div className="space-y-2">
                    {analysis.recommendations.map((r, i) => (
                        <div key={i} className="rounded-md border border-border/40 bg-background/50 p-3">
                            <h5 className="font-medium text-sm mb-1">{r.action}</h5>
                            <p className="text-xs text-muted-foreground mb-1">{r.rationale}</p>
                            {r.responsible && <Badge variant="secondary" className="text-xs">{r.responsible}</Badge>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-md border border-border/40 bg-background/50 p-3">
                    <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
                        <ClipboardList className="h-4 w-4 text-emerald-500" /> Известни факти
                    </h4>
                    <ul className="space-y-1 text-xs">
                        {analysis.knownFacts.map((f, i) => (
                            <li key={i} className="flex gap-2"><span className="text-emerald-500">✓</span>{f}</li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-md border border-border/40 bg-background/50 p-3">
                    <h4 className="flex items-center gap-2 font-semibold text-sm mb-2">
                        <Eye className="h-4 w-4 text-amber-500" /> Неизвестни
                    </h4>
                    <ul className="space-y-1 text-xs">
                        {analysis.unknowns.map((u, i) => (
                            <li key={i} className="flex gap-2"><span className="text-amber-500">?</span>{u}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}