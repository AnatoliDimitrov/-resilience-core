import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, Download, Printer, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Report() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [markdown, setMarkdown] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        fetch(`/api/incidents/${id}/report`)
            .then(async r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.text()
            })
            .then(setMarkdown)
            .catch(e => setError(String(e)))
    }, [id])

    const handlePrint = () => window.print()
    const handleDownload = () => {
        if (!id) return
        window.location.href = `/api/incidents/${id}/report?format=download`
    }

    if (error) return <div className="p-8 text-red-500">Грешка: {error}</div>
    if (!markdown) return (
        <div className="p-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />Генериране на доклад…
        </div>
    )

    return (
        <div className="bg-background min-h-screen">
            <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur print:hidden">
                <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/incident/${id}`)}>
                        <ArrowLeft className="size-4 mr-1.5" />Към сесията
                    </Button>
                    <div className="flex-1" />
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="size-4 mr-1.5" />Свали .md
                    </Button>
                    <Button size="sm" onClick={handlePrint}>
                        <Printer className="size-4 mr-1.5" />Принтирай / Запази като PDF
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 print:py-4 print:max-w-none">
                <article className="prose-report">
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                </article>
            </main>
        </div>
    )
}
