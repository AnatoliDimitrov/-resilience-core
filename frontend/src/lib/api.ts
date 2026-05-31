export type Urgency = 'critical' | 'high' | 'medium' | 'low'

export interface Priority { label: string; rationale: string; urgency: Urgency }
export interface Recommendation { action: string; rationale: string; responsible: string | null }
export interface Update { id: string; text: string; timestamp: string }
export interface Analysis {
    id: string; createdAt: string; summary: string
    triggeredBy: 'operator' | 'auto'
    priorities: Priority[]; recommendations: Recommendation[]
    clarifyingQuestions: string[]; knownFacts: string[]; unknowns: string[]
}
export interface Incident {
    id: string; type: string; location: string; initialReport: string
    createdAt: string; updates: Update[]; analyses: Analysis[]
    lastOperatorActivityAt: string
    lastAutoReassessmentAt: string | null
    autoReassessmentCount: number
    autoReassessmentEnabled: boolean
}
export interface CreateIncidentRequest {
    type: string
    location: string
    initialReport: string
    casualties?: string
    blockedRoutes?: string
    availableResources?: string
    missingResources?: string
    urgency?: string
    notes?: string
}
export interface CreateIncidentResponse { incident: Incident; analysis: Analysis }

async function readError(res: Response): Promise<string> {
    const ctype = res.headers.get('content-type') ?? ''
    if (ctype.includes('application/json')) {
        try {
            const body = await res.json()
            if (body && typeof body.error === 'string') return body.error
        } catch { /* fall through */ }
    }
    const text = await res.text().catch(() => '')
    return text || `HTTP ${res.status}`
}

export async function createIncident(req: CreateIncidentRequest): Promise<CreateIncidentResponse> {
    const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
    })
    if (!res.ok) throw new Error(await readError(res))
    return res.json()
}

export async function getIncident(id: string): Promise<Incident> {
    const res = await fetch(`/api/incidents/${id}`)
    if (!res.ok) throw new Error(await readError(res))
    return res.json()
}

export const latestAnalysis = (i: Incident) => i.analyses[i.analyses.length - 1]

export async function appendUpdate(id: string, text: string): Promise<CreateIncidentResponse> {
    const res = await fetch(`/api/incidents/${id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    })
    if (!res.ok) throw new Error(await readError(res))
    return res.json()
}

export async function setAutoReassessment(id: string, enabled: boolean): Promise<{ enabled: boolean }> {
    const res = await fetch(`/api/incidents/${id}/auto-reassessment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
    })
    if (!res.ok) throw new Error(await readError(res))
    return res.json()
}

export interface IncidentSummary {
    id: string
    type: string
    location: string
    createdAt: string
}

export async function listIncidents(): Promise<IncidentSummary[]> {
    const res = await fetch('/api/incidents')
    if (!res.ok) throw new Error(await readError(res))
    return res.json()
}
