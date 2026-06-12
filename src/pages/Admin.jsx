import { useState, useRef, useCallback } from 'react'
import * as mm from 'music-metadata-browser'
import { supabase, MUSIC_BUCKET, COVERS_BUCKET } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
const CATEGORIES = ['pop', 'chill', 'electronic', 'jazz', 'rock', 'classical', 'hiphop', 'rnb']

// ── Helpers ───────────────────────────────────────────────────
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return ''
  const m = Math.floor(seconds / 60)
  const s = String(Math.floor(seconds % 60)).padStart(2, '0')
  return `${m}:${s}`
}

function nameFromFile(filename) {
  return filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim()
}

function matchCategory(genre) {
  if (!genre) return 'pop'
  const g = genre.toLowerCase()
  const map = {
    pop: 'pop', rock: 'rock', jazz: 'jazz', classical: 'classical',
    electronic: 'electronic', electronica: 'electronic', edm: 'electronic',
    'hip-hop': 'hiphop', hiphop: 'hiphop', 'hip hop': 'hiphop',
    'r&b': 'rnb', rnb: 'rnb', soul: 'rnb',
    chill: 'chill', ambient: 'chill', lofi: 'chill',
  }
  for (const [key, val] of Object.entries(map)) {
    if (g.includes(key)) return val
  }
  return 'pop'
}

async function extractMetadata(file) {
  try {
    const meta = await mm.parseBlob(file)
    const { common, format } = meta
    const pic = common.picture?.[0]
    let coverFile = null
    if (pic) {
      const blob = new Blob([pic.data], { type: pic.format })
      coverFile = new File([blob], 'cover.jpg', { type: pic.format })
    }
    return {
      title: common.title || nameFromFile(file.name),
      artist: common.artist || common.albumartist || '',
      album: common.album || '',
      duration: formatDuration(format.duration),
      category: matchCategory(common.genre?.[0]),
      year: common.year || new Date().getFullYear(),
      coverFile,
      coverPreview: coverFile ? URL.createObjectURL(coverFile) : null,
    }
  } catch {
    return {
      title: nameFromFile(file.name),
      artist: '', album: '', duration: '',
      category: 'pop', year: new Date().getFullYear(),
      coverFile: null, coverPreview: null,
    }
  }
}

// ── Login Gate ────────────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const handleSubmit = (e) => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) onLogin()
    else { setError('Incorrect password'); setPw('') }
  }
  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-icon">🔐</div>
        <h2>Admin Access</h2>
        <p>Enter your admin password to manage songs</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <input type="password" value={pw} onChange={e => { setPw(e.target.value); setError('') }}
            placeholder="Password" className="admin-input" autoFocus />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="admin-btn primary">Login</button>
        </form>
      </div>
    </div>
  )
}

// ── Song Queue Row ─────────────────────────────────────────────
function QueueRow({ item, index, onChange, onRemove }) {
  const set = (k) => (e) => onChange(index, { [k]: e.target.value })
  return (
    <div className={`queue-row ${item.status}`}>
      {/* Cover preview */}
      <div className="queue-cover">
        {item.coverPreview
          ? <img src={item.coverPreview} alt="" />
          : <div className="cover-placeholder small">🎵</div>
        }
      </div>

      {/* Fields */}
      <div className="queue-fields">
        <div className="queue-row-top">
          <input className="admin-input queue-input" value={item.title}
            onChange={set('title')} placeholder="Title" />
          <input className="admin-input queue-input" value={item.artist}
            onChange={set('artist')} placeholder="Artist" />
          <input className="admin-input queue-input" value={item.album}
            onChange={set('album')} placeholder="Album" />
          <input className="admin-input queue-input sm" value={item.duration}
            onChange={set('duration')} placeholder="3:42" />
          <select className="admin-input queue-input sm" value={item.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="admin-input queue-input sm" type="number"
            value={item.year} onChange={set('year')} placeholder="Year" min="1900" max="2099" />
        </div>
        <div className="queue-filename">📁 {item.file.name}</div>
      </div>

      {/* Status / Remove */}
      <div className="queue-status-col">
        {item.status === 'idle' && (
          <button className="queue-remove" onClick={() => onRemove(index)} title="Remove">✕</button>
        )}
        {item.status === 'uploading' && (
          <div className="queue-status-badge uploading">
            <div className="progress-spinner" /> Uploading
          </div>
        )}
        {item.status === 'done' && (
          <div className="queue-status-badge done">✓ Done</div>
        )}
        {item.status === 'error' && (
          <div className="queue-status-badge error" title={item.errorMsg}>✗ Failed</div>
        )}
      </div>
    </div>
  )
}

// ── Bulk Upload Panel ──────────────────────────────────────────
function BulkUpload({ onSuccess }) {
  const [queue, setQueue] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const addFiles = useCallback(async (files) => {
    const mp3s = Array.from(files).filter(f => f.type === 'audio/mpeg' || f.name.endsWith('.mp3'))
    if (!mp3s.length) return
    const parsed = await Promise.all(mp3s.map(async (file) => {
      const meta = await extractMetadata(file)
      return { ...meta, file, status: 'idle', errorMsg: '' }
    }))
    setQueue(q => [...q, ...parsed])
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const handleChange = (index, patch) => {
    setQueue(q => q.map((item, i) => i === index ? { ...item, ...patch } : item))
  }

  const handleRemove = (index) => {
    setQueue(q => q.filter((_, i) => i !== index))
  }

  const handleUploadAll = async () => {
    const pending = queue.filter(i => i.status === 'idle')
    if (!pending.length) return
    setUploading(true)

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      if (item.status !== 'idle') continue

      setQueue(q => q.map((x, idx) => idx === i ? { ...x, status: 'uploading' } : x))

      try {
        // Upload MP3
        const ext = item.file.name.split('.').pop()
        const mp3Path = `${Date.now()}-${item.title.replace(/\s+/g, '-').toLowerCase()}.${ext}`
        const { error: mp3Err } = await supabase.storage
          .from(MUSIC_BUCKET)
          .upload(mp3Path, item.file, { contentType: 'audio/mpeg', upsert: false })
        if (mp3Err) throw mp3Err
        const { data: mp3Data } = supabase.storage.from(MUSIC_BUCKET).getPublicUrl(mp3Path)

        // Upload cover (from embedded art or skip)
        let cover_url = null
        if (item.coverFile) {
          const covPath = `${Date.now()}-cover.jpg`
          const { error: covErr } = await supabase.storage
            .from(COVERS_BUCKET)
            .upload(covPath, item.coverFile, { contentType: item.coverFile.type, upsert: false })
          if (!covErr) {
            const { data: covData } = supabase.storage.from(COVERS_BUCKET).getPublicUrl(covPath)
            cover_url = covData.publicUrl
          }
        }

        // Insert DB record
        const { error: dbErr } = await supabase.from('songs').insert([{
          title: item.title,
          artist: item.artist,
          album: item.album,
          duration: item.duration,
          category: item.category,
          year: parseInt(item.year),
          file_url: mp3Data.publicUrl,
          cover_url,
        }])
        if (dbErr) throw dbErr

        setQueue(q => q.map((x, idx) => idx === i ? { ...x, status: 'done' } : x))
      } catch (err) {
        setQueue(q => q.map((x, idx) => idx === i ? { ...x, status: 'error', errorMsg: err.message } : x))
      }
    }

    setUploading(false)
    onSuccess()
  }

  const idleCount = queue.filter(i => i.status === 'idle').length
  const doneCount = queue.filter(i => i.status === 'done').length
  const errorCount = queue.filter(i => i.status === 'error').length

  return (
    <div className="upload-form-card">
      <h2 className="upload-form-title">📤 Bulk Upload Songs</h2>
      <p className="upload-subtitle">Drop MP3 files — title, artist, album, duration and cover art are read automatically from each file's tags.</p>

      {/* Drop Zone */}
      <div
        className={`bulk-drop-zone ${dragOver ? 'drag-over' : ''} ${queue.length ? 'compact' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,audio/mpeg"
          multiple
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
        {queue.length === 0 ? (
          <>
            <div className="drop-icon">🎵</div>
            <p className="drop-label">Drag & drop MP3 files here</p>
            <p className="drop-sub">or click to browse — multiple files supported</p>
          </>
        ) : (
          <>
            <div className="drop-icon small">➕</div>
            <p className="drop-label small">Add more MP3 files</p>
          </>
        )}
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <>
          <div className="queue-header">
            <div className="queue-stats">
              <span>{queue.length} song{queue.length !== 1 ? 's' : ''}</span>
              {doneCount > 0 && <span className="stat done">✓ {doneCount} uploaded</span>}
              {errorCount > 0 && <span className="stat error">✗ {errorCount} failed</span>}
            </div>
            <div className="queue-header-actions">
              {!uploading && idleCount > 0 && (
                <button className="admin-btn secondary small"
                  onClick={() => setQueue(q => q.filter(i => i.status !== 'done'))}>
                  Clear done
                </button>
              )}
              {!uploading && (
                <button className="admin-btn secondary small"
                  onClick={() => setQueue([])}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="queue-table-header">
            <span></span>
            <span>Title / Artist / Album / Duration / Category / Year</span>
            <span></span>
          </div>

          <div className="queue-list">
            {queue.map((item, i) => (
              <QueueRow
                key={`${item.file.name}-${i}`}
                item={item}
                index={i}
                onChange={handleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {idleCount > 0 && (
            <div className="upload-all-row">
              <button
                className="admin-btn primary upload-all-btn"
                onClick={handleUploadAll}
                disabled={uploading}
              >
                {uploading ? (
                  <><div className="progress-spinner white" /> Uploading...</>
                ) : (
                  <>⬆ Upload All {idleCount} Song{idleCount !== 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Song Management Table ─────────────────────────────────────
function SongTable({ songs, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (song) => {
    if (!window.confirm(`Delete "${song.title}"? This cannot be undone.`)) return
    setDeleting(song.id)
    await supabase.from('songs').delete().eq('id', song.id)
    setDeleting(null)
    onDelete()
  }

  if (!songs.length) {
    return (
      <div className="empty-state">
        <span>🎵</span>
        <p>No songs uploaded yet. Drop some MP3s above to get started.</p>
      </div>
    )
  }

  return (
    <div className="admin-song-table">
      <div className="admin-table-header">
        <span>Cover</span>
        <span>Title</span>
        <span>Artist</span>
        <span>Category</span>
        <span>Duration</span>
        <span>Actions</span>
      </div>
      {songs.map(song => (
        <div key={song.id} className="admin-table-row">
          <div className="admin-cover">
            {song.cover_url
              ? <img src={song.cover_url} alt={song.title} />
              : <div className="cover-placeholder small">🎵</div>
            }
          </div>
          <div className="admin-cell">
            <p className="song-title">{song.title}</p>
            <p className="song-artist">{song.album}</p>
          </div>
          <div className="admin-cell">{song.artist}</div>
          <div className="admin-cell">
            <span className="category-pill static">{song.category}</span>
          </div>
          <div className="admin-cell">{song.duration || '—'}</div>
          <div className="admin-actions">
            <button className="action-btn edit" onClick={() => onEdit(song)} title="Edit">✏️</button>
            <button className="action-btn delete" onClick={() => handleDelete(song)}
              disabled={deleting === song.id} title="Delete">
              {deleting === song.id ? '⏳' : '🗑️'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────
function EditModal({ song, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: song.title, artist: song.artist, album: song.album || '',
    duration: song.duration || '', category: song.category || 'pop', year: song.year || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error: err } = await supabase.from('songs')
      .update({ ...form, year: parseInt(form.year) })
      .eq('id', song.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Edit Song</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave} className="upload-form">
          <div className="form-row two-col">
            <div className="form-group">
              <label>Title *</label>
              <input className="admin-input" value={form.title} onChange={set('title')} required />
            </div>
            <div className="form-group">
              <label>Artist *</label>
              <input className="admin-input" value={form.artist} onChange={set('artist')} required />
            </div>
          </div>
          <div className="form-row two-col">
            <div className="form-group">
              <label>Album</label>
              <input className="admin-input" value={form.album} onChange={set('album')} />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input className="admin-input" value={form.duration} onChange={set('duration')} placeholder="3:42" />
            </div>
          </div>
          <div className="form-row two-col">
            <div className="form-group">
              <label>Category</label>
              <select className="admin-input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <input className="admin-input" type="number" value={form.year} onChange={set('year')} />
            </div>
          </div>
          {error && <p className="admin-error">{error}</p>}
          <div className="form-actions">
            <button type="button" className="admin-btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Admin Page ───────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [editSong, setEditSong] = useState(null)
  const { songs, refreshSongs } = usePlayer()

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />

  return (
    <div className="page">
      <div className="page-header admin-page-header">
        <div>
          <h1>⚙️ Admin Panel</h1>
          <p>Upload and manage your music library</p>
        </div>
        <button className="admin-btn secondary small" onClick={() => setAuthed(false)}>
          🔒 Logout
        </button>
      </div>

      <BulkUpload onSuccess={refreshSongs} />

      <div className="page-section">
        <div className="section-header-row">
          <h2 className="section-title" style={{ margin: 0 }}>
            Song Library
            <span className="song-count-badge">{songs.length}</span>
          </h2>
          <button className="admin-btn secondary small" onClick={refreshSongs}>↻ Refresh</button>
        </div>
        <SongTable
          songs={songs}
          onEdit={setEditSong}
          onDelete={refreshSongs}
        />
      </div>

      {editSong && (
        <EditModal
          song={editSong}
          onClose={() => setEditSong(null)}
          onSaved={refreshSongs}
        />
      )}
    </div>
  )
}
