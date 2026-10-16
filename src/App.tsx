import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Gallery } from './pages/Gallery'
import { FighterSelect } from './pages/FighterSelect'
import { Arena } from './pages/Arena'
import { TournamentPage } from './pages/TournamentPage'
import { VideoStudio } from './pages/VideoStudio'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="gallery/:id" element={<Gallery />} />
          <Route path="select" element={<FighterSelect />} />
          <Route path="arena" element={<Arena />} />
          <Route path="tournament" element={<TournamentPage />} />
          <Route path="video" element={<VideoStudio />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
