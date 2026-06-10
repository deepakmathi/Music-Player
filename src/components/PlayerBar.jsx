import { usePlayer } from '../context/PlayerContext'

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function PlayerBar() {
  const {
    currentSong, isPlaying, volume, currentTime, duration,
    shuffle, repeat,
    togglePlay, next, prev, seek, setVolume, setShuffle, toggleRepeat
  } = usePlayer()

  const progress = duration ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    seek(ratio * duration)
  }

  const repeatIcon = repeat === 'one' ? '🔂' : repeat === 'all' ? '🔁' : '🔁'
  const repeatActive = repeat !== false

  return (
    <div className="player-bar">
      {/* Now Playing */}
      <div className="player-now-playing">
        {currentSong ? (
          <>
            <div className="player-cover">
              {currentSong.cover
                ? <img src={currentSong.cover} alt={currentSong.title} onError={e => { e.target.style.display = 'none' }} />
                : <div className="cover-placeholder small">🎵</div>
              }
            </div>
            <div className="player-song-info">
              <p className="player-song-title">{currentSong.title}</p>
              <p className="player-song-artist">{currentSong.artist}</p>
            </div>
          </>
        ) : (
          <div className="player-idle">No song selected</div>
        )}
      </div>

      {/* Controls */}
      <div className="player-controls">
        <div className="control-buttons">
          <button
            className={`ctrl-btn ${shuffle ? 'active' : ''}`}
            onClick={() => setShuffle(s => !s)}
            title="Shuffle"
          >🔀</button>
          <button className="ctrl-btn" onClick={prev} title="Previous">⏮</button>
          <button className="ctrl-btn play-btn" onClick={togglePlay} disabled={!currentSong} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="ctrl-btn" onClick={next} title="Next">⏭</button>
          <button
            className={`ctrl-btn ${repeatActive ? 'active' : ''}`}
            onClick={toggleRepeat}
            title={repeat === false ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}
          >{repeatIcon}</button>
        </div>

        <div className="progress-row">
          <span className="time-label">{formatTime(currentTime)}</span>
          <div className="progress-bar" onClick={handleProgressClick}>
            <div className="progress-fill" style={{ width: `${progress}%` }}>
              <div className="progress-thumb" />
            </div>
          </div>
          <span className="time-label">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="player-volume">
        <span className="vol-icon">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          className="volume-slider"
          aria-label="Volume"
        />
      </div>
    </div>
  )
}
