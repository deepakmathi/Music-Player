import { useState, useMemo } from 'react'
import { usePlayer } from '../context/PlayerContext'
import SearchBar from '../components/SearchBar'
import SongList from '../components/SongList'

const FEATURED_CATEGORIES = ['pop', 'chill', 'electronic', 'jazz']

export default function Home() {
  const { songs, play } = usePlayer()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return songs
    return songs.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    )
  }, [songs, query])

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero">
        <div className="hero-text">
          <h1>Your Music, Your Way</h1>
          <p>Stream your personal curated library — anytime, anywhere.</p>
          {songs.length > 0 && (
            <button className="hero-btn" onClick={() => play(0)}>
              ▶ Play All
            </button>
          )}
        </div>
        <div className="hero-art">🎧</div>
      </div>

      {/* Search */}
      <div className="page-section">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {/* Category quick-filter pills */}
      {!query && (
        <div className="page-section">
          <h2 className="section-title">Browse Categories</h2>
          <div className="category-pills">
            {FEATURED_CATEGORIES.map(cat => (
              <button
                key={cat}
                className="category-pill"
                onClick={() => setQuery(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Song list */}
      <div className="page-section">
        <SongList
          songs={filtered}
          title={query ? `Results for "${query}"` : 'All Songs'}
        />
      </div>
    </div>
  )
}
