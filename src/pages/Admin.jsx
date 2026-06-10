const steps = [
  {
    step: '1',
    title: 'Add your MP3 file',
    icon: '📁',
    content: 'Drop your .mp3 file into the /public/music/ folder of the project.',
    code: 'public/\n  music/\n    your-new-song.mp3   ← add here',
  },
  {
    step: '2',
    title: 'Add a cover image (optional)',
    icon: '🖼️',
    content: 'Add a .jpg or .png cover image to /public/covers/.',
    code: 'public/\n  covers/\n    your-cover.jpg   ← add here',
  },
  {
    step: '3',
    title: 'Edit songs.json',
    icon: '📝',
    content: 'Open public/songs.json and add a new entry at the end of the array.',
    code: `{
  "id": 9,
  "title": "Your Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "duration": "3:30",
  "file": "/music/your-new-song.mp3",
  "cover": "/covers/your-cover.jpg",
  "category": "pop",
  "year": 2024
}`,
  },
  {
    step: '4',
    title: 'Commit & push to GitHub',
    icon: '📤',
    content: 'Commit all changes and push to your GitHub repository.',
    code: 'git add .\ngit commit -m "Add new song: Your Song Title"\ngit push origin main',
  },
  {
    step: '5',
    title: 'Netlify auto-deploys',
    icon: '🚀',
    content: 'Netlify detects the push and automatically rebuilds and deploys. Your song appears within ~60 seconds.',
    code: null,
  },
]

const categories = ['pop', 'chill', 'electronic', 'jazz', 'rock', 'classical', 'hiphop', 'rnb']

export default function Admin() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙️ Admin Guide</h1>
        <p>How to add new songs to your music player</p>
      </div>

      <div className="admin-notice">
        <span>ℹ️</span>
        <div>
          <strong>Static Site Limitation</strong>
          <p>This is a Netlify static site. Songs cannot be uploaded from the browser — they must be added via the codebase and a new deployment.</p>
        </div>
      </div>

      <div className="page-section">
        <h2 className="section-title">How to Add a Song</h2>
        <div className="admin-steps">
          {steps.map(({ step, title, icon, content, code }) => (
            <div key={step} className="admin-step">
              <div className="step-number">{step}</div>
              <div className="step-body">
                <h3 className="step-title">{icon} {title}</h3>
                <p className="step-desc">{content}</p>
                {code && (
                  <pre className="step-code"><code>{code}</code></pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-section">
        <h2 className="section-title">Available Categories</h2>
        <div className="category-pills">
          {categories.map(c => (
            <span key={c} className="category-pill static">{c}</span>
          ))}
        </div>
      </div>

      <div className="page-section">
        <h2 className="section-title">songs.json Full Schema</h2>
        <pre className="step-code"><code>{`{
  "id":       number      // unique integer ID
  "title":    string      // song title
  "artist":   string      // artist name
  "album":    string      // album name
  "duration": string      // e.g. "3:42"
  "file":     string      // path from /public, e.g. "/music/song.mp3"
  "cover":    string      // path from /public, e.g. "/covers/img.jpg"
  "category": string      // one of the categories above
  "year":     number      // release year
}`}</code></pre>
      </div>
    </div>
  )
}
