import SongCard from './SongCard'

export default function SongList({ songs, title }) {
  if (!songs.length) {
    return (
      <div className="empty-state">
        <span>🎵</span>
        <p>No songs found</p>
      </div>
    )
  }

  return (
    <div className="song-list">
      {title && <h2 className="section-title">{title}</h2>}
      <div className="song-list-header">
        <span>#</span>
        <span></span>
        <span>TITLE</span>
        <span>ALBUM</span>
        <span>⏱</span>
      </div>
      <div className="song-list-body">
        {songs.map((song, i) => (
          <SongCard key={song.id} song={song} index={i} />
        ))}
      </div>
    </div>
  )
}
