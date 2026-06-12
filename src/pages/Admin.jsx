import { useState, useRef } from 'react'
import { supabase, MUSIC_BUCKET, COVERS_BUCKET } from '../lib/supabase'
import { usePlayer } from '../context/PlayerContext'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
const CATEGORIES = ['pop', 'chill', 'electronic', 'jazz', 'rock', 'classical', 'hiphop', 'rnb']

// ── Login Gate ────────────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) { onLogin() }
    else { setError('Incorrect password'); setPw('') }
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-icon">🔐</div>
        <h2>Admin Access</h2>
        <p>Enter your admin password to continue</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError('') }}
            placeholder="Password"
            className="admin-input"
            autoFocus
          />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="admin-btn primary">Login</button>
        </form>
      </div>
    </div>
  )
}

// ── Upload Form ───────────────────────────────────────────────
function UploadForm({ onSuccess, editSong, onCancelEdit }) {
  const isEdit = !!editSong
  const [form, setForm] = useState({
    title: editSong?.title || '',
    artist: editSong?.artist || '',
    album: editSong?.album || '',
    duration: editSong?.duration || '',
    category: editSong?.category || 'pop',
    year: editSong?.year || new Date().getFullYear(),
  })
  const [mp3File, setMp3File] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const mp3Ref = useRef()
  const coverRef = useRef()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.artist) return setError('Title and Artist are required.')
    if (!isEdit && !mp3File) return setError('Please select an MP3 file.')

    setUploading(true)
    try {
      let file_url = editSong?.file_url || ''
      let cover_url = editSong?.cover_url || null

      // Upload MP3
      if (mp3File) {
        setProgress('Uploading MP3...')
        const ext = mp3File.name.split('.').pop()
        const path = `${Date.now()}-${form.title.replace(/\s+/g, '-').toLowerCase()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from(MUSIC_BUCKET)
          .upload(path, mp3File, { contentType: 'audio/mpeg', upsert: false })
        if (uploadErr) throw uploadErr
        const { data } = supabase.storage.from(MUSIC_BUCKET).getPublicUrl(path)
        file_url = data.publicUrl
      }

      // Upload Cover
      if (coverFile) {
        setProgress('Uploading cover...')
        const ext = coverFile.name.split('.').pop()
        const path = `${Date.now()}-cover.${ext}`
        const { error: covErr } = await supabase.storage
          .from(COVERS_BUCKET)
          .upload(path, coverFile, { contentType: coverFile.type, upsert: false })
        if (covErr) throw covErr
        const { data } = supabase.storage.from(COVERS_BUCKET).getPublicUrl(path)
        cover_url = data.publicUrl
      }

      setProgress(isEdit ? 'Saving changes...' : 'Saving to database...')
      const record = { ...form, year: parseInt(form.year), file_url, cover_url }

      if (isEdit) {
        const { error: dbErr } = await supabase.from('songs').update(record).eq('id', editSong.id)
        if (dbErr) throw dbErr
      } else {
        const { error: dbErr } = await supabase.from('songs').insert([record])
        if (dbErr) throw dbErr
      }

      setProgress('')
      setUploading(false)
      onSuccess()
      if (!isEdit) {
        setForm({ title: '', artist: '', album: '', duration: '', category: 'pop', year: new Date().getFullYear() })
        setMp3File(null)
        setCoverFile(null)
        if (mp3Ref.current) mp3Ref.current.value = ''
        if (coverRef.current) coverRef.current.value = ''
      }
    } catch (err) {
      setError(err.message || 'Upload failed')
      setProgress('')
      setUploading(false)
    }
  }

  return (
    <div className="upload-form-card">
      <h2 className="upload-form-title">
        {isEdit ? '✏️ Edit Song' : '📤 Upload New Song'}
      </h2>
      <form onSubmit={handleSubmit} className="upload-form">
        {/* File inputs */}
        {!isEdit && (
          <div className="form-row two-col">
            <div className="form-group">
              <label>MP3 File *</label>
              <div
                className={`file-drop ${mp3File ? 'has-file' : ''}`}
                onClick={() => mp3Ref.current?.click()}
              >
                {mp3File ? (
                  <><span>🎵</span><span className="file-name">{mp3File.name}</span></>
                ) : (
                  <><span>🎵</span><span>Click to select MP3</span></>
                )}
              </div>
              <input ref={mp3Ref} type="file" accept="audio/mp3,audio/mpeg,.mp3"
                style={{ display: 'none' }} onChange={e => setMp3File(e.target.files[0])} />
            </div>
            <div className="form-group">
              <label>Cover Image <span className="optional">(optional)</span></label>
              <div
                className={`file-drop ${coverFile ? 'has-file' : ''}`}
                onClick={() => coverRef.current?.click()}
              >
                {coverFile ? (
                  <><span>🖼️</span><span className="file-name">{coverFile.name}</span></>
                ) : (
                  <><span>🖼️</span><span>Click to select image</span></>
                )}
              </div>
              <input ref={coverRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={e => setCoverFile(e.target.files[0])} />
            </div>
          </div>
        )}

        {isEdit && (
          <div className="form-row two-col">
            <div className="form-group">
              <label>Replace MP3 <span className="optional">(optional)</span></label>
              <div className={`file-drop ${mp3File ? 'has-file' : ''}`} onClick={() => mp3Ref.current?.click()}>
                {mp3File ? <><span>🎵</span><span className="file-name">{mp3File.name}</span></> : <><span>🎵</span><span>Click to replace MP3</span></>}
              </div>
              <input ref={mp3Ref} type="file" accept="audio/mp3,audio/mpeg,.mp3"
                style={{ display: 'none' }} onChange={e => setMp3File(e.target.files[0])} />
            </div>
            <div className="form-group">
              <label>Replace Cover <span className="optional">(optional)</span></label>
              <div className={`file-drop ${coverFile ? 'has-file' : ''}`} onClick={() => coverRef.current?.click()}>
                {coverFile ? <><span>🖼️</span><span className="file-name">{coverFile.name}</span></> : <><span>🖼️</span><span>Click to replace cover</span></>}
              </div>
              <input ref={coverRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={e => setCoverFile(e.target.files[0])} />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="form-row two-col">
          <div className="form-group">
            <label>Song Title *</label>
            <input className="admin-input" value={form.title} onChange={set('title')} placeholder="e.g. Midnight Dreams" required />
          </div>
          <div className="form-group">
            <label>Artist *</label>
            <input className="admin-input" value={form.artist} onChange={set('artist')} placeholder="e.g. Luna Wave" required />
          </div>
        </div>
        <div className="form-row two-col">
          <div className="form-group">
            <label>Album</label>
            <input className="admin-input" value={form.album} onChange={set('album')} placeholder="e.g. Neon Nights" />
          </div>
          <div className="form-group">
            <label>Duration</label>
            <input className="admin-input" value={form.duration} onChange={set('duration')} placeholder="e.g. 3:42" />
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
            <input className="admin-input" type="number" value={form.year} onChange={set('year')} min="1900" max="2099" />
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}
        {progress && (
          <div className="upload-progress">
            <div className="progress-spinner" />
            <span>{progress}</span>
          </div>
        )}

        <div className="form-actions">
          {isEdit && (
            <button type="button" className="admin-btn secondary" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
          <button type="submit" className="admin-btn primary" disabled={uploading}>
            {uploading ? 'Uploading...' : isEdit ? 'Save Changes' : '⬆ Upload Song'}
          </button>
        </div>
      </form>
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
        <p>No songs uploaded yet. Use the form above to add your first song.</p>
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
            <button
              className="action-btn delete"
              onClick={() => handleDelete(song)}
              disabled={deleting === song.id}
              title="Delete"
            >
              {deleting === song.id ? '⏳' : '🗑️'}
            </button>
          </div>
        </div>
      ))}
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
      <div className="page-header">
        <h1>⚙️ Admin Panel</h1>
        <p>Upload, edit and manage your music library</p>
        <button className="admin-btn secondary small" onClick={() => setAuthed(false)} style={{ marginTop: 8 }}>
          🔒 Logout
        </button>
      </div>

      <UploadForm
        onSuccess={refreshSongs}
        editSong={editSong}
        onCancelEdit={() => setEditSong(null)}
      />

      <div className="page-section" style={{ marginTop: 40 }}>
        <div className="section-header-row">
          <h2 className="section-title" style={{ margin: 0 }}>
            Song Library
            <span className="song-count-badge">{songs.length}</span>
          </h2>
          <button className="admin-btn secondary small" onClick={refreshSongs}>↻ Refresh</button>
        </div>
        <SongTable
          songs={songs}
          onEdit={(song) => { setEditSong(song); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          onDelete={refreshSongs}
        />
      </div>
    </div>
  )
}
