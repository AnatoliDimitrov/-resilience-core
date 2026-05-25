import type { Analysis, Priority, Recommendation, Urgency } from './api'

export interface AnalysisDelta {
    isInitial: boolean
    promotedPriorities: { label: string; from: Urgency; to: Urgency }[]
    newPriorities: Priority[]
    newFacts: string[]
    resolvedQuestions: string[]
    newQuestions: string[]
    newRecommendations: Recommendation[]
    hasChanges: boolean
}

export function diffAnalyses(prev: Analysis | undefined, curr: Analysis): AnalysisDelta {
    if (!prev) {
        return {
            isInitial: true,
            promotedPriorities: [],
            newPriorities: curr.priorities,
            newFacts: curr.knownFacts,
            resolvedQuestions: [],
            newQuestions: curr.clarifyingQuestions,
            newRecommendations: curr.recommendations,
            hasChanges: true,
        }
    }
    const prevPri = new Map(prev.priorities.map(p => [p.label, p]))
    const promotedPriorities = curr.priorities
        .filter(p => prevPri.has(p.label) && prevPri.get(p.label)!.urgency !== p.urgency)
        .map(p => ({ label: p.label, from: prevPri.get(p.label)!.urgency, to: p.urgency }))
    const newPriorities = curr.priorities.filter(p => !prevPri.has(p.label))

    const prevFacts = new Set(prev.knownFacts)
    const newFacts = curr.knownFacts.filter(f => !prevFacts.has(f))

    const currQs = new Set(curr.clarifyingQuestions)
    const resolvedQuestions = prev.clarifyingQuestions.filter(q => !currQs.has(q))
    const prevQs = new Set(prev.clarifyingQuestions)
    const newQuestions = curr.clarifyingQuestions.filter(q => !prevQs.has(q))

    const prevRecs = new Set(prev.recommendations.map(r => r.action))
    const newRecommendations = curr.recommendations.filter(r => !prevRecs.has(r.action))

    const hasChanges = promotedPriorities.length > 0 || newPriorities.length > 0
        || newFacts.length > 0 || resolvedQuestions.length > 0
        || newQuestions.length > 0 || newRecommendations.length > 0

    return { isInitial: false, promotedPriorities, newPriorities, newFacts, resolvedQuestions, newQuestions, newRecommendations, hasChanges }
}