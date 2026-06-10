import { Routes, Route } from 'react-router-dom'
import { PlayerProvider } from './context/PlayerContext'
import Sidebar from './components/Sidebar'
import PlayerBar from './components/PlayerBar'
import Home from './pages/Home'
import Categories from './pages/Categories'
import Admin from './pages/Admin'

export default function App() {
  return (
    <PlayerProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <PlayerBar />
      </div>
    </PlayerProvider>
  )
}
