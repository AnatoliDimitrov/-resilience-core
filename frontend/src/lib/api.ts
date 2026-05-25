export type Urgency = 'critical' | 'high' | 'medium' | 'low'

export interface Priority { label: string; rationale: string; urgency: Urgency }
export interface Recommendation { action: string; rationale: string; responsible: string | null }
export interface Update { id: string; text: string; timestamp: string }
export interface Analysis {
    id: string; createdAt: string; summary: string
    priorities: Priority[]; recommendations: Recommendation[]
    clarifyingQuestions: string[]; knownFacts: string[]; unknowns: string[]
}
export interface Incident {
    id: string; type: string; location: string; initialReport: string
    createdAt: string; updates: Update[]; analyses: Analysis[]
}
export interface CreateIncidentRequest { type: string; location: string; initialReport: string }
export interface CreateIncidentResponse { incident: Incident; analysis: Analysis }

export async function createIncident(req: CreateIncidentRequest): Promise<CreateIncidentResponse> {
    const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
    })
    if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`)
    return res.json()
}

export async function getIncident(id: string): Promise<Incident> {
    const res = await fetch(`/api/incidents/${id}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

export const latestAnalysis = (i: Incident) => i.analyses[i.analyses.length - 1]

export async function appendUpdate(id: string, text: string): Promise<CreateIncidentResponse> {
    const res = await fetch(`/api/incidents/${id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    })
    if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`)
    return res.json()
}