import { Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import { NewSignal } from '@/pages/NewSignal'
import { IncidentResult } from '@/pages/IncidentResult'

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signal/new" element={<NewSignal />} />
            <Route path="/incident/:id" element={<IncidentResult />} />
        </Routes>
    )
}