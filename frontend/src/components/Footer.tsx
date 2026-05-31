import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'

export function Footer() {
    const [model, setModel] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/health')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.activeModel) setModel(data.activeModel) })
            .catch(() => {})
    }, [])

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur print:hidden">
            <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] leading-tight text-muted-foreground">
                <span className="flex items-center gap-1 text-foreground font-medium">
                    <GraduationCap className="size-3.5" />
                    ResilienceCore Field
                </span>
                <span className="opacity-50">·</span>
                <span>дипломна работа на <span className="text-foreground">Анатоли Димитров</span>, 136кнз</span>
                <span className="opacity-50">·</span>
                <span>ръководител <span className="text-foreground">доц. д-р Боян Жеков</span></span>
                <span className="opacity-50">·</span>
                <span>УниБИТ 2026</span>
                {model && (
                    <>
                        <span className="opacity-50">·</span>
                        <span className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground/70">{model}</span>
                        </span>
                    </>
                )}
            </div>
        </footer>
    )
}
