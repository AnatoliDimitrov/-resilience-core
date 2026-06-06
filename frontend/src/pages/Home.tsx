import { useEffect, useState } from 'react'
import { Siren, ScrollText, Sparkles, Activity, Database, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { useNavigate } from 'react-router-dom'

interface HealthStatus {
    status: string
    knowledgeBase: boolean
    geminiReachable: boolean
}

function Home() {
    const navigate = useNavigate()
    const [health, setHealth] = useState<HealthStatus | null>(null)

    useEffect(() => {
        fetch('/api/health')
            .then(r => r.ok ? r.json() : null)
            .then(setHealth)
            .catch(() => setHealth(null))
    }, [])

    return (
        <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute top-1/3 right-0 h-[400px] w-[600px] rounded-full bg-blue-600/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-[400px] w-[600px] rounded-full bg-indigo-500/10 blur-3xl" />
            </div>
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle />
            </div>
            <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
                <div className="flex justify-center mb-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                        Дипломна работа · УниБИТ · 2026
                    </div>
                </div>

                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                        ОПОРА
                    </h1>
                    <p className="mt-3 text-base lg:text-lg font-medium text-muted-foreground/80 tracking-wide">
                        Оперативна платформа за обобщаване, реакция и анализ
                    </p>
                    <p className="mt-6 text-lg lg:text-xl text-muted-foreground leading-relaxed">
                        Локален ИИ хъб за координация при кризи. Двуслойна памет,
                        ситуационна осведоменост и непрекъснат анализ — в реално време,
                        на терен.
                    </p>
                </div>

                {/* System status bar */}
                <div className="mt-10 flex justify-center">
                    <div className="inline-flex items-center gap-4 rounded-lg border border-border/60 bg-card/40 px-5 py-2.5 backdrop-blur text-sm">
                        <div className="flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Статус:</span>
                            {health === null ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                    <span className="text-yellow-500">Проверка…</span>
                                </span>
                            ) : health.status === 'ok' ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-emerald-500">Готова</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    <span className="text-amber-500">Частична</span>
                                </span>
                            )}
                        </div>
                        <span className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-1.5">
                            <Database className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className={health?.knowledgeBase ? 'text-emerald-500' : 'text-red-500'}>
                                База знания
                            </span>
                        </div>
                        <span className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-1.5">
                            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className={health?.geminiReachable ? 'text-emerald-500' : 'text-red-500'}>
                                ИИ модел
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-16 grid gap-6 md:grid-cols-2">
                    <Card className="group relative overflow-hidden border-border/60 bg-card/50 backdrop-blur transition-all hover:border-cyan-500/40 hover:bg-card/80">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                                    <Siren className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-xl">Нов сигнал</CardTitle>
                            </div>
                            <CardDescription className="mt-3">
                                Започнете нова кризисна сесия. ИИ извлича факти, генерира
                                въпроси и подрежда приоритети.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-cyan-400" />
                                    Структуриран входен формуляр
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-cyan-400" />
                                    Чат-стил актуализации в реално време
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-cyan-400" />
                                    Експорт на отчет в Markdown
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => navigate('/signal/new')} className="w-full">
                                Започни сесия
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="group relative overflow-hidden border-border/60 bg-card/50 backdrop-blur transition-all hover:border-blue-500/40 hover:bg-card/80">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                                    <ScrollText className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-xl">История</CardTitle>
                            </div>
                            <CardDescription className="mt-3">
                                Преглед на минали инциденти, генерирани отчети и ходове на
                                ситуационната памет.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-blue-400" />
                                    Хронология на актуализациите
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-blue-400" />
                                    Разпределение на приоритетите
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-blue-400" />
                                    Сравнение между сценарии
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => navigate("/archive")} variant="outline" className="w-full" size="lg">
                                Архив
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default Home
