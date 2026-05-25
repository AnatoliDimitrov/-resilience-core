import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ScrollText, Loader2, Inbox, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { listIncidents, type IncidentSummary } from '@/lib/api'

export default function Archive() {
    const navigate = useNavigate()
    const [items, setItems] = useState<IncidentSummary[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const lastId = typeof window !== 'undefined' ? localStorage.getItem('lastIncidentId') : null
    const backTo = lastId ? `/incident/${lastId}` : '/'
    const backLabel = lastId ? 'Към сесията' : 'Начало' 

    useEffect(() => {
        listIncidents()
            .then(setItems)
            .catch(e => setError(e instanceof Error ? e.message : 'Грешка при зареждане'))
    }, [])

    return (
        <div className="bg-background min-h-screen">
            <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
                    <Button variant="ghost" size="sm" asChild>
                        <Link to={backTo}><ArrowLeft className="size-4 mr-1.5" />{backLabel}</Link>
                    </Button>
                    <div className="flex-1 flex items-center gap-2">
                        <ScrollText className="size-4 text-blue-400" />
                        <span className="font-medium">Архив на сесиите</span>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-3">
                {items === null && !error && (
                    <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
                        <Loader2 className="size-4 animate-spin" />Зареждане…
                    </div>
                )}

                {error && (
                    <Card>
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            Не успях да заредя архива: {error}
                        </CardContent>
                    </Card>
                )}

                {items?.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center space-y-3">
                            <Inbox className="size-8 text-muted-foreground mx-auto" />
                            <div className="text-sm text-muted-foreground">Все още няма регистрирани сесии.</div>
                            <Button onClick={() => navigate('/signal/new')}>Започни първата сесия</Button>
                        </CardContent>
                    </Card>
                )}

                {items && items.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{items.length} {items.length === 1 ? 'сесия' : 'сесии'}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-border/50">
                                {items.map(i => (
                                    <li key={i.id}>
                                        <button
                                            onClick={() => navigate(`/incident/${i.id}`)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{i.location}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(i.createdAt).toLocaleString('bg-BG')}
                                                </div>
                                            </div>
                                            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
