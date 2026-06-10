import { usePlayer } from '../context/PlayerContext'

export default function SongCard({ song, index }) {
  const { currentIndex, isPlaying, play } = usePlayer()
  const isActive = currentIndex === index

  return (
    <div
      className={`song-card ${isActive ? 'active' : ''}`}
      onClick={() => play(index)}
    >
      <div className="song-card-index">
        {isActive && isPlaying ? (
          <span className="playing-bars">
            <span /><span /><span />
          </span>
        ) : (
          <span className="song-number">{index + 1}</span>
        )}
      </div>

      <div className="song-card-cover">
        {song.cover ? (
          <img src={song.cover} alt={song.title} onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div className="cover-placeholder">🎵</div>
        )}
        <button
          className="play-overlay"
          onClick={e => { e.stopPropagation(); play(index) }}
          aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
        >
          {isActive && isPlaying ? '⏸' : '▶'}
        </button>
      </div>

      <div className="song-card-info">
        <p className="song-title">{song.title}</p>
        <p className="song-artist">{song.artist}</p>
      </div>

      <div className="song-card-album">{song.album}</div>
      <div className="song-card-duration">{song.duration}</div>
    </div>
  )
}
