import { Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import { NewSignal } from '@/pages/NewSignal'
import IncidentResult from './pages/IncidentResult'
import Archive from '@/pages/Archive'
import Report from '@/pages/Report'
import { Footer } from '@/components/Footer'

export default function App() {
    return (
        <>
            <div className="pb-10">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/signal/new" element={<NewSignal />} />
                    <Route path="/incident/:id" element={<IncidentResult />} />
                    <Route path="/incident/:id/report" element={<Report />} />
                    <Route path="/archive" element={<Archive />} />
                </Routes>
            </div>
            <Footer />
        </>
    )
}
