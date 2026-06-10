import { useState, useMemo } from 'react'
import { usePlayer } from '../context/PlayerContext'
import SongList from '../components/SongList'

const CATEGORY_META = {
  pop:        { icon: '🎤', color: '#e91e63', desc: 'Catchy, upbeat, and chart-topping hits' },
  chill:      { icon: '🌊', color: '#03a9f4', desc: 'Relaxing vibes and mellow tunes' },
  electronic: { icon: '⚡', color: '#9c27b0', desc: 'Synthesizers, beats, and neon sounds' },
  jazz:       { icon: '🎷', color: '#ff9800', desc: 'Soulful improvisations and classic jazz' },
}

export default function Categories() {
  const { songs } = usePlayer()
  const [active, setActive] = useState(null)

  const categories = useMemo(() => {
    const map = {}
    songs.forEach(s => {
      if (!map[s.category]) map[s.category] = []
      map[s.category].push(s)
    })
    return map
  }, [songs])

  const catNames = Object.keys(categories)

  const filteredSongs = useMemo(() => {
    if (!active) return []
    return categories[active] || []
  }, [active, categories])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Categories</h1>
        <p>Browse music by genre</p>
      </div>

      <div className="category-grid">
        {catNames.map(cat => {
          const meta = CATEGORY_META[cat] || { icon: '🎵', color: '#1db954', desc: '' }
          return (
            <div
              key={cat}
              className={`category-card ${active === cat ? 'active' : ''}`}
              style={{ '--cat-color': meta.color }}
              onClick={() => setActive(active === cat ? null : cat)}
            >
              <div className="cat-icon">{meta.icon}</div>
              <div className="cat-info">
                <h3 className="cat-name">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
                <p className="cat-count">{categories[cat].length} songs</p>
                <p className="cat-desc">{meta.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {active && (
        <div className="page-section">
          <SongList
            songs={filteredSongs}
            title={`${active.charAt(0).toUpperCase() + active.slice(1)} — ${filteredSongs.length} songs`}
          />
        </div>
      )}
    </div>
  )
}
