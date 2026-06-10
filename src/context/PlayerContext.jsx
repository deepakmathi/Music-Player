import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [songs, setSongs] = useState([])
  const [currentIndex, setCurrentIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false) // false | 'one' | 'all'
  const audioRef = useRef(new Audio())

  // Load songs from JSON
  useEffect(() => {
    fetch('/songs.json')
      .then(r => r.json())
      .then(setSongs)
      .catch(console.error)
  }, [])

  const currentSong = currentIndex !== null ? songs[currentIndex] : null

  // Sync audio src when song changes
  useEffect(() => {
    const audio = audioRef.current
    if (!currentSong) return
    audio.src = currentSong.file
    audio.volume = volume
    if (isPlaying) audio.play().catch(console.error)
  }, [currentIndex, songs])

  // Sync volume
  useEffect(() => {
    audioRef.current.volume = volume
  }, [volume])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0
        audio.play().catch(console.error)
      } else {
        next()
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
    }
  }, [repeat, shuffle, currentIndex, songs])

  const play = useCallback((index) => {
    const audio = audioRef.current
    if (index === currentIndex) {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        audio.play().catch(console.error)
        setIsPlaying(true)
      }
      return
    }
    setCurrentIndex(index)
    setIsPlaying(true)
    audio.src = songs[index].file
    audio.volume = volume
    audio.play().catch(console.error)
  }, [currentIndex, isPlaying, songs, volume])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(console.error)
      setIsPlaying(true)
    }
  }, [isPlaying])

  const next = useCallback(() => {
    if (!songs.length) return
    let nextIndex
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * songs.length)
    } else {
      nextIndex = currentIndex === null ? 0 : (currentIndex + 1) % songs.length
    }
    play(nextIndex)
  }, [songs, currentIndex, shuffle, play])

  const prev = useCallback(() => {
    if (!songs.length) return
    const audio = audioRef.current
    if (audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    const prevIndex = currentIndex === null ? 0 : (currentIndex - 1 + songs.length) % songs.length
    play(prevIndex)
  }, [songs, currentIndex, play])

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }, [])

  const toggleRepeat = useCallback(() => {
    setRepeat(r => r === false ? 'all' : r === 'all' ? 'one' : false)
  }, [])

  return (
    <PlayerContext.Provider value={{
      songs, currentSong, currentIndex,
      isPlaying, volume, currentTime, duration,
      shuffle, repeat,
      play, togglePlay, next, prev, seek,
      setVolume, setShuffle, toggleRepeat
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
