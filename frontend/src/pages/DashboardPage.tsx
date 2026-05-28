import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Search, 
  Home, 
  BookOpen, 
  MoreHorizontal, 
  Settings, 
  ChevronRight,
  Globe,
  Music,
  BarChart2,
  LogOut,
  Volume2,
  Menu,
  X,
  ChevronLeft,
  ListMusic,
  Plus,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SONGS_DATA = [
  { id: 1, title: 'STRUCT', artist: 'UdieNnx', duration: 234, image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop' },
  { id: 2, title: 'En Nuit', artist: 'Videoclub', duration: 221, image: 'https://picsum.photos/seed/1/200' },
  { id: 3, title: 'Black Swan', artist: 'BTS', duration: 198, image: 'https://picsum.photos/seed/2/200' },
  { id: 4, title: 'Parano (ft. DDB)', artist: 'Lomepal', duration: 202, image: 'https://picsum.photos/seed/3/200' },
  { id: 5, title: 'Kokoronashi', artist: 'Chouchou-P', duration: 276, image: 'https://picsum.photos/seed/4/200' },
];

const DashboardPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [songs, setSongs] = useState<any[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentLang, setCurrentLang] = useState('en');
  const [segments, setSegments] = useState<any[]>([]);
  const [ytReady, setYtReady] = useState(false);
  const [syncOffset, setSyncOffset] = useState(0); // Manual sync adjustment
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [modalMode, setModalMode] = useState<'completed' | 'practice'>('practice');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'statistics' | 'library'>('home');
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<any>(null);
  const [hideVideo, setHideVideo] = useState(false);

  // Playlists & Queue States
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedPlaylistLoading, setSelectedPlaylistLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
  const [currentQueue, setCurrentQueue] = useState<any[]>([]);
  const [queueName, setQueueName] = useState('Song Library');

  const navigate = useNavigate();

  const currentSong = currentQueue[currentSongIndex] || { title: 'No Songs', artist: 'Add some songs in admin', durationSeconds: 0, audioUrl: '', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop' };

  // Get YouTube ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = useMemo(() => getYouTubeId(currentSong.audioUrl), [currentSong.audioUrl]);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        
        // Fetch Preferences
        const prefRes = await fetch('http://localhost:5000/api/preferences', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (prefRes.ok) {
          const data = await prefRes.json();
          setPreferences(data);
        } else if (prefRes.status === 401) { navigate('/login'); }

        // Fetch Songs
        const songRes = await fetch('http://localhost:5000/api/admin', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (songRes.ok) {
          const data = await songRes.json();
          setSongs(data);
          setCurrentQueue(data);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [navigate]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/lessons/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleReviewAttempt = async (attemptId: string) => {
    setReviewLoading(true);
    setShowReviewModal(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/lessons/attempt/${attemptId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAttempt(data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load attempt details.");
      setShowReviewModal(false);
    } finally {
      setReviewLoading(false);
    }
  };

  // Chart data calculations
  const chartData = useMemo(() => {
    const last7 = [...history].slice(0, 7).reverse();
    return last7.map((attempt, index) => ({
      index,
      label: new Date(attempt.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: attempt.score,
      xp: attempt.xpEarned,
    }));
  }, [history]);

  const width = 500;
  const height = 250;
  const xPadding = 50;
  const yPadding = 40;
  const plotWidth = width - 2 * xPadding;
  const plotHeight = height - 2 * yPadding;

  const points = chartData.map((d, i) => {
    const x = xPadding + (chartData.length > 1 ? (i * plotWidth / (chartData.length - 1)) : plotWidth / 2);
    const y = height - yPadding - (d.score * plotHeight / 12); // score out of 12 max
    return { x, y, score: d.score, label: d.label, xp: d.xp };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `M ${points[0].x} ${height - yPadding} ` + points.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${points[points.length - 1].x} ${height - yPadding} Z`
    : '';

  useEffect(() => {
    if (currentSong?._id) {
      setSyncOffset(0); // Reset sync for new song
      const fetchSegments = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://localhost:5000/api/admin/segments/${currentSong._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setSegments(data);
          }
        } catch (err) { console.error(err); }
      };
      fetchSegments();
    }
  }, [currentSong]);

  // Adjusted timing calculation
  const activeIndex = segments.findIndex(
    seg => (currentTime + syncOffset) >= seg.startTime && (currentTime + syncOffset) < seg.endTime
  );

  useEffect(() => {
    if (activeIndex !== -1) {
      const el = document.getElementById(`line-${activeIndex}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);



  // Load YouTube API
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else {
      setYtReady(true);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log("YT API Ready");
      setYtReady(true);
    };
  }, []);

  // Initialize/Update Player
  useEffect(() => {
    if (videoId && ytReady && (window as any).YT && (window as any).YT.Player) {
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(videoId);
      } else {
        playerRef.current = new (window as any).YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: { 'autoplay': 1, 'controls': 0, 'mute': 0, 'enablejsapi': 1 },
          events: {
            'onStateChange': (event: any) => {
              if (event.data === (window as any).YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === (window as any).YT.PlayerState.ENDED || event.data === 0) {
                setIsPlaying(false);
                setModalMode('completed');
                setShowQuizModal(true);
              }
            },
            'onReady': () => {
              console.log("Player Ready");
            }
          }
        });
      }
    }
  }, [videoId, ytReady]);

  // Sync currentTime with actual YouTube player
  useEffect(() => {
    let interval: any;
    if (isPlaying && playerRef.current && playerRef.current.getCurrentTime) {
      interval = setInterval(() => {
        try {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);
        } catch (e) { console.error("Sync error", e); }
      }, 300); // 300ms for ultra-smooth sync
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') {
      console.log("Player not ready yet...");
      return;
    }
    
    const state = playerRef.current.getPlayerState();
    if (state === (window as any).YT.PlayerState.PLAYING) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };
  
  const handleNext = () => {
    setCurrentSongIndex((prev) => (prev + 1) % (currentQueue.length || 1));
    setCurrentTime(0);
    setHideVideo(false);
    if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
  };

  const handlePrev = () => {
    setCurrentSongIndex((prev) => (prev - 1 + (currentQueue.length || 1)) % (currentQueue.length || 1));
    setCurrentTime(0);
    setHideVideo(false);
    if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };



  const renderStatistics = () => {
    // Calculate overview stats
    const totalQuizzes = history.length;
    const totalXp = history.reduce((acc, curr) => acc + (curr.xpEarned || 0), 0);
    const avgScore = totalQuizzes > 0 
      ? (history.reduce((acc, curr) => acc + curr.score, 0) / totalQuizzes).toFixed(1) 
      : '0.0';

    return (
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Your Learning Analytics</h1>
          <p style={{ opacity: 0.6, margin: 0 }}>Review your performance, track your score trends, and inspect your past quiz attempts.</p>
        </div>

        {/* Overview Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
            <div style={{ opacity: 0.5, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Quizzes Attempted</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#12d15e' }}>{totalQuizzes}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
            <div style={{ opacity: 0.5, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Average Score</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#a855f7' }}>{avgScore}<span style={{ fontSize: '16px', opacity: 0.5 }}>/12</span></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
            <div style={{ opacity: 0.5, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Total XP Earned</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#eab308' }}>{totalXp} XP</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '48px' }} className="content-grid-desktop">
          {/* Performance Chart Card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', position: 'relative' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>Score Trends (Last 7 Quizzes)</h3>
            
            {points.length === 0 ? (
              <div style={{ height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                <BarChart2 size={40} style={{ marginBottom: '12px' }} />
                <p>Complete a lesson or quiz to see your progress chart!</p>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
                <svg width="100%" height="250" viewBox="0 0 500 250" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#12d15e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#12d15e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 3, 6, 9, 12].map(scoreVal => {
                    const yVal = height - yPadding - (scoreVal * plotHeight / 12);
                    return (
                      <g key={scoreVal}>
                        <line x1={xPadding} y1={yVal} x2={width - xPadding} y2={yVal} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                        <text x={xPadding - 10} y={yVal + 4} fill="rgba(255,255,255,0.4)" fontSize="11" textAnchor="end">{scoreVal}</text>
                      </g>
                    );
                  })}

                  {/* X Axis Date Labels */}
                  {points.map((p, i) => (
                    <text key={i} x={p.x} y={height - yPadding + 20} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">{p.label}</text>
                  ))}

                  {/* Shaded Area Below Line */}
                  <path d={areaPath} fill="url(#chart-glow)" />

                  {/* Line Chart */}
                  <polyline points={polylinePoints} fill="none" stroke="#12d15e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(18, 209, 94, 0.4))' }} />

                  {/* Circular Markers */}
                  {points.map((p, i) => (
                    <circle 
                      key={i} 
                      cx={p.x} 
                      cy={p.y} 
                      r="6" 
                      fill="#000" 
                      stroke="#12d15e" 
                      strokeWidth="3" 
                      cursor="pointer"
                      style={{ transition: 'r 0.2s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.setAttribute('r', '8');
                        setActiveTooltip(p);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.setAttribute('r', '6');
                        setActiveTooltip(null);
                      }}
                    />
                  ))}
                </svg>

                {/* Floating Tooltip */}
                {activeTooltip && (
                  <div style={{
                    position: 'absolute',
                    left: `${(activeTooltip.x / 500) * 100}%`,
                    top: `${(activeTooltip.y / 250) * 100 - 25}%`,
                    transform: 'translate(-50%, -100%)',
                    background: '#12d15e',
                    color: '#000',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                    zIndex: 100
                  }}>
                    Score: {activeTooltip.score} | {activeTooltip.xp} XP
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History List Card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>Quiz History</h3>
            
            {historyLoading ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div>Loading history...</div>
              </div>
            ) : history.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                <BookOpen size={40} style={{ marginBottom: '12px' }} />
                <p>No quiz history found yet.</p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', paddingRight: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {history.map((attempt) => (
                    <div key={attempt._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px', padding: '12px 16px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                          {attempt.level === 'dynamic' ? 'Song Practice' : 'Lesson'} • {attempt.language}
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>
                          {new Date(attempt.completedAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#12d15e' }}>{attempt.score} Correct</div>
                          <div style={{ fontSize: '11px', color: '#eab308', fontWeight: 'bold' }}>+{attempt.xpEarned} XP</div>
                        </div>
                        <button 
                          onClick={() => handleReviewAttempt(attempt._id)}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          className="btn-hover"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const fetchPlaylists = async () => {
    setPlaylistsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/playlists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlaylistsLoading(false);
    }
  };

  const fetchPlaylistDetails = async (playlistId: string) => {
    setSelectedPlaylistLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/playlists/${playlistId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPlaylist(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSelectedPlaylistLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/playlists', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newPlaylistTitle })
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(prev => [data, ...prev]);
        setNewPlaylistTitle('');
        setShowCreateModal(false);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to create playlist');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPlaylists(prev => prev.filter(p => p._id !== playlistId));
        setSelectedPlaylist(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSongToPlaylist = async (songId: string) => {
    if (!selectedPlaylist) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/playlists/${selectedPlaylist.playlist._id}/songs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ songId })
      });
      if (res.ok) {
        fetchPlaylistDetails(selectedPlaylist.playlist._id);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to add song to playlist');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSongFromPlaylist = async (songId: string) => {
    if (!selectedPlaylist) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/playlists/${selectedPlaylist.playlist._id}/songs/${songId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPlaylistDetails(selectedPlaylist.playlist._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayPlaylist = (playlistSongs: any[], playlistTitle: string) => {
    if (playlistSongs.length === 0) {
      alert("This playlist has no songs yet. Add some songs first!");
      return;
    }
    setCurrentQueue(playlistSongs);
    setQueueName(playlistTitle);
    setCurrentSongIndex(0);
    setCurrentTime(0);
    setIsPlaying(true);
    setHideVideo(false);
  };

  const handlePlaySongFromPlaylist = (playlistSongs: any[], playlistTitle: string, index: number) => {
    setCurrentQueue(playlistSongs);
    setQueueName(playlistTitle);
    setCurrentSongIndex(index);
    setCurrentTime(0);
    setIsPlaying(true);
    setHideVideo(false);
  };

  useEffect(() => {
    if (activeTab === 'library') {
      fetchPlaylists();
      setSelectedPlaylist(null);
    }
  }, [activeTab]);

  const renderLibrary = () => {
    const filteredSongs = playlistSearchQuery.trim() === "" 
      ? songs 
      : songs.filter(s => 
          s.title.toLowerCase().includes(playlistSearchQuery.toLowerCase()) || 
          s.artistName.toLowerCase().includes(playlistSearchQuery.toLowerCase())
        );

    return (
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Your Library</h1>
            <p style={{ opacity: 0.6, margin: 0 }}>Create, manage, and listen to your custom playlists.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-hover"
            style={{
              background: 'linear-gradient(135deg, #12d15e 0%, #0bb04c 100%)',
              color: '#000',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 20px rgba(18, 209, 94, 0.15)'
            }}
          >
            <Plus size={16} /> Create Playlist
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px', alignItems: 'start' }} className="content-grid-desktop">
          
          {/* Playlists Sidebar */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ListMusic size={18} color="#12d15e" /> My Playlists
            </h3>

            {playlistsLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.5 }}>Loading playlists...</div>
            ) : playlists.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.4 }}>
                <p style={{ fontSize: '14px', marginBottom: '16px' }}>No playlists created yet.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Create Your First
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                {playlists.map((playlist) => {
                  const isSelected = selectedPlaylist?.playlist?._id === playlist._id;
                  const isCurrentlyPlaying = queueName === playlist.title;

                  return (
                    <div 
                      key={playlist._id}
                      onClick={() => fetchPlaylistDetails(playlist._id)}
                      className="btn-hover"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        borderRadius: '16px',
                        background: isSelected ? 'rgba(18, 209, 94, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? '#12d15e' : 'rgba(255,255,255,0.04)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '10px', 
                          background: isSelected ? 'rgba(18, 209, 94, 0.15)' : 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? '#12d15e' : '#fff'
                        }}>
                          <Music size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: isSelected ? '#12d15e' : '#fff' }}>
                            {playlist.title}
                          </div>
                          <div style={{ fontSize: '11px', opacity: 0.4, marginTop: '2px' }}>
                            {isCurrentlyPlaying ? 'Currently Playing' : 'Playlist'}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} opacity={isSelected ? 1 : 0.4} color={isSelected ? '#12d15e' : '#fff'} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Playlist Detail Panel */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', minHeight: '400px' }}>
            {selectedPlaylistLoading ? (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                Loading playlist details...
              </div>
            ) : selectedPlaylist ? (
              <div>
                {/* Playlist Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedPlaylist.playlist.title}</h2>
                    <p style={{ opacity: 0.5, fontSize: '13px', margin: '4px 0 0 0' }}>
                      {selectedPlaylist.songs.length} {selectedPlaylist.songs.length === 1 ? 'song' : 'songs'} in playlist
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => handlePlayPlaylist(selectedPlaylist.songs, selectedPlaylist.playlist.title)}
                      className="btn-hover"
                      style={{
                        background: '#12d15e',
                        color: '#000',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Play size={14} fill="#000" /> Play Playlist
                    </button>
                    <button 
                      onClick={() => handleDeletePlaylist(selectedPlaylist.playlist._id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '10px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      className="btn-hover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Playlist Songs list */}
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Songs List</h3>
                  {selectedPlaylist.songs.length === 0 ? (
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', textAlign: 'center', opacity: 0.5 }}>
                      No songs in this playlist. Search and add some below!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedPlaylist.songs.map((song: any, index: number) => {
                        const isCurrentPlayingSong = currentSong._id === song._id && queueName === selectedPlaylist.playlist.title;
                        return (
                          <div 
                            key={song._id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(255,255,255,0.01)',
                              border: '1px solid rgba(255,255,255,0.03)',
                              borderRadius: '14px',
                              padding: '12px 16px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#333', overflow: 'hidden' }}>
                                <img src={song.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop'} alt="Song" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: isCurrentPlayingSong ? '#12d15e' : '#fff' }}>
                                  {song.title}
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.5 }}>{song.artistName}</div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <button 
                                onClick={() => handlePlaySongFromPlaylist(selectedPlaylist.songs, selectedPlaylist.playlist.title, index)}
                                style={{
                                  background: isCurrentPlayingSong ? 'rgba(18, 209, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                  border: 'none',
                                  color: isCurrentPlayingSong ? '#12d15e' : '#fff',
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                                className="btn-hover"
                              >
                                {isCurrentPlayingSong && isPlaying ? 'Playing' : 'Play'}
                              </button>
                              <button 
                                onClick={() => handleRemoveSongFromPlaylist(song._id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'rgba(255,255,255,0.4)',
                                  cursor: 'pointer',
                                  padding: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add Songs Search */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Add Songs to Playlist</h3>
                  
                  <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '16px', top: '16px', opacity: 0.4 }} />
                    <input 
                      type="text" 
                      placeholder="Search songs by title or artist..." 
                      value={playlistSearchQuery}
                      onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 16px 14px 44px',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                    {filteredSongs.slice(0, 5).map((song) => {
                      const isAlreadyIn = selectedPlaylist.songs.some((s: any) => s._id === song._id);
                      return (
                        <div 
                          key={song._id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            background: 'rgba(255,255,255,0.01)', 
                            border: '1px solid rgba(255,255,255,0.03)', 
                            borderRadius: '12px', 
                            padding: '10px 14px' 
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#333', overflow: 'hidden' }}>
                              <img src={song.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop'} alt="Song" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{song.title}</div>
                              <div style={{ fontSize: '11px', opacity: 0.5 }}>{song.artistName}</div>
                            </div>
                          </div>

                          <button 
                            disabled={isAlreadyIn}
                            onClick={() => handleAddSongToPlaylist(song._id)}
                            style={{
                              background: isAlreadyIn ? 'rgba(255,255,255,0.05)' : 'rgba(18, 209, 94, 0.1)',
                              border: 'none',
                              color: isAlreadyIn ? 'rgba(255,255,255,0.3)' : '#12d15e',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: isAlreadyIn ? 'not-allowed' : 'pointer'
                            }}
                            className="btn-hover"
                          >
                            {isAlreadyIn ? 'Added' : 'Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4, textAlign: 'center' }}>
                <ListMusic size={40} style={{ marginBottom: '16px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0' }}>No Playlist Selected</h4>
                <p style={{ fontSize: '13px', maxWidth: '280px' }}>Select a playlist from the left panel to manage its songs and play them, or create a new playlist.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f0f0f', color: '#fff' }}>
        <div className="loader">Tuning in...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#0f0f0f', 
      minHeight: '100vh', 
      color: '#fff', 
      fontFamily: 'Inter, sans-serif',
      display: 'flex'
    }}>
      {/* Mini YouTube Player Container */}
      <div 
        className="mini-video-player"
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          width: '280px', 
          height: '158px', 
          borderRadius: '20px',
          overflow: 'hidden', 
          zIndex: 1000,
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(18, 209, 94, 0.15)',
          border: '1px solid rgba(255,255,255,0.12)',
          background: '#000',
          display: isPlaying && !hideVideo ? 'block' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Close Button overlay */}
        <button 
          onClick={(e) => { e.stopPropagation(); setHideVideo(true); }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 1010,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
          className="video-close-btn"
        >
          <X size={14} />
        </button>

        <div id="youtube-player" style={{ width: '100%', height: '100%' }}></div>
      </div>
      {/* Mobile Sidebar Hamburger Toggle */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="mobile-toggle"
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 90,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '10px',
          cursor: 'pointer',
          display: 'none',
          color: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
        }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 95
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`desktop-sidebar ${isMobileOpen ? 'sidebar-open' : ''}`} style={{ 
        width: isSidebarCollapsed ? '88px' : '280px', background: '#000', borderRight: '1px solid rgba(255,255,255,0.05)',
        padding: isSidebarCollapsed ? '40px 12px' : '40px 24px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', marginBottom: '48px', position: 'relative' }}>
          {!isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/Logo-1.png" alt="Logo" style={{ width: '40px' }} />
              <span style={{ fontSize: '24px', fontWeight: '800' }}>Lingofy</span>
            </div>
          )}
          {isSidebarCollapsed && (
            <img src="/Logo-1.png" alt="Logo" style={{ width: '40px' }} />
          )}
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="desktop-toggle-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px',
              transition: 'all 0.2s',
            }}
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="mobile-close-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <NavItem icon={<Home size={20} />} label="Home" active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setIsMobileOpen(false); }} collapsed={isSidebarCollapsed} />
          <NavItem icon={<BookOpen size={20} />} label="Lessons" onClick={() => navigate('/lessons')} collapsed={isSidebarCollapsed} />
          <NavItem icon={<Music size={20} />} label="Library" active={activeTab === 'library'} onClick={() => { setActiveTab('library'); setIsMobileOpen(false); }} collapsed={isSidebarCollapsed} />
          <NavItem icon={<BarChart2 size={20} />} label="Statistics" active={activeTab === 'statistics'} onClick={() => { setActiveTab('statistics'); setIsMobileOpen(false); }} collapsed={isSidebarCollapsed} />
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
          <NavItem icon={<Settings size={20} />} label="Settings" collapsed={isSidebarCollapsed} />
          <NavItem icon={<LogOut size={20} />} label="Logout" onClick={() => { localStorage.clear(); navigate('/login'); }} collapsed={isSidebarCollapsed} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, marginLeft: 'var(--sidebar-width, 0px)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {activeTab === 'statistics' ? renderStatistics() : activeTab === 'library' ? renderLibrary() : (
          <div style={{ width: '100%', maxWidth: '1200px' }}>
          
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', marginBottom: '48px' }}>
            
            {/* Language Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '4px solid #fff', overflow: 'hidden' }}>
                    <img src={`https://flagcdn.com/w160/${preferences?.languagesToLearn?.[0]?.toLowerCase() === 'korean' ? 'kr' : 'jp'}.png`} alt="Lang" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{preferences?.languagesToLearn?.[0] || 'Learning'}</h2>
                    <p style={{ opacity: 0.6, margin: '4px 0 0 0' }}>{preferences?.vocabularyLevel || 'Beginner'} • Level 12</p>
                  </div>
                </div>
                <div style={{ background: '#12d15e', color: '#000', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 'bold' }}>N3</div>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Today's Lesson Progress</span>
                  <span>65%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '65%', height: '100%', background: '#12d15e' }}></div>
                </div>
              </div>
              
              <button className="btn-hover" style={{ 
                width: '100%', background: '#12d15e', color: '#000', border: 'none', padding: '16px', borderRadius: '16px', 
                fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
              }}>
                Start Daily Lesson <ChevronRight size={18} />
              </button>
            </div>

            {/* Dynamic Music Player Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1e1e1e 0%, #000 100%)', borderRadius: '24px', padding: '32px',
              border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: '#333', overflow: 'hidden', boxShadow: isPlaying ? '0 0 20px rgba(18, 209, 94, 0.3)' : 'none', transition: 'all 0.5s' }}>
                  <img src={currentSong.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop'} alt="Album" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isPlaying ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.5s' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{currentSong.title}</h3>
                  <p style={{ opacity: 0.6, margin: '0 0 12px 0' }}>{currentSong.artistName || currentSong.artist}</p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                     <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}>HQ AUDIO</div>
                     <div style={{ background: 'rgba(18, 209, 94, 0.2)', color: '#12d15e', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}>LYRICS</div>
                     {currentSong?._id && (
                       <button 
                         onClick={() => {
                           setModalMode('practice');
                           setShowQuizModal(true);
                         }}
                         className="btn-hover"
                         style={{ 
                           background: 'rgba(18, 209, 94, 0.1)', 
                           color: '#12d15e', 
                           border: '1px solid rgba(18, 209, 94, 0.3)', 
                           padding: '4px 10px', 
                           borderRadius: '6px', 
                           fontSize: '11px', 
                           fontWeight: 'bold', 
                           cursor: 'pointer', 
                           display: 'flex', 
                           alignItems: 'center', 
                           gap: '4px',
                           transition: 'all 0.2s',
                           marginLeft: 'auto'
                         }}
                       >
                         <BookOpen size={12} /> Practice Song
                       </button>
                     )}
                  </div>
                </div>
              </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '8px', position: 'relative' }}>
                    <div style={{ width: `${(currentTime / (currentSong.durationSeconds || 180)) * 100}%`, height: '100%', background: '#12d15e', transition: 'width 0.2s linear' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.5 }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime((currentSong.durationSeconds || 180) - currentTime)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginBottom: '16px' }}>
                  <SkipBack size={24} onClick={handlePrev} style={{ cursor: 'pointer' }} className="control-icon" />
                  <button 
                    onClick={handlePlayPause}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {isPlaying ? <Pause size={28} fill="#000" color="#000" /> : <Play size={28} fill="#000" color="#000" style={{ marginLeft: '4px' }} />}
                  </button>
                  <SkipForward size={24} onClick={handleNext} style={{ cursor: 'pointer' }} className="control-icon" />
                </div>

                {/* Manual Sync Adjustment */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '32px', opacity: 0.8 }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.5 }}>SYNC:</span>
                  <button onClick={() => setSyncOffset(prev => prev - 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}>-1s</button>
                  <span style={{ color: '#12d15e', fontWeight: 'bold', fontSize: '11px', minWidth: '25px', textAlign: 'center' }}>{syncOffset > 0 ? `+${syncOffset}` : syncOffset}s</span>
                  <button onClick={() => setSyncOffset(prev => prev + 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}>+1s</button>
                </div>

                {/* Lyrics Language Toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '14px', gap: '4px' }}>
                  <button 
                    onClick={() => setCurrentLang('en')}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: currentLang === 'en' ? '#fff' : 'transparent', color: currentLang === 'en' ? '#000' : '#fff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: '0.2s' }}
                  >English</button>
                  <button 
                    onClick={() => setCurrentLang('hi')}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: currentLang === 'hi' ? '#fff' : 'transparent', color: currentLang === 'hi' ? '#000' : '#fff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: '0.2s' }}
                  >Hindi</button>
                  <button 
                    onClick={() => setCurrentLang('es')}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: currentLang === 'es' ? '#fff' : 'transparent', color: currentLang === 'es' ? '#000' : '#fff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: '0.2s' }}
                  >Spanish</button>
                </div>
              </div>
            </div>

            {/* Lyrics Section */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <Globe size={20} color="#12d15e" />
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Interactive Lyrics</h3>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '400px', paddingRight: '10px' }}>
                {currentLang === 'en' ? (
                  segments.length > 0 ? (
                    segments.map((line: any, idx: number) => (
                      <p 
                        id={`line-${idx}`}
                        key={idx} 
                        style={{ 
                          fontSize: '22px', 
                          fontWeight: '600', 
                          opacity: idx === activeIndex ? 1 : 0.3, 
                          lineHeight: '1.6',
                          color: idx === activeIndex ? '#12d15e' : '#fff',
                          transition: 'all 0.3s',
                          transform: idx === activeIndex ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: 'left'
                        }}
                      >
                        {line.text}
                      </p>
                    ))
                  ) : (
                    <div style={{ opacity: 0.4, textAlign: 'center', marginTop: '40px' }}>
                      <Music size={40} style={{ marginBottom: '16px' }} />
                      <p>English Lyrics will appear here when synced.</p>
                    </div>
                  )
                ) : (
                  // Fallback: If no translation exists, show English but faded
                  currentSong?.translations?.[currentLang === 'hi' ? 'hindi' : 'spanish']?.length > 0 ? (
                    currentSong.translations[currentLang === 'hi' ? 'hindi' : 'spanish'].map((line: any, idx: number) => (
                      <p 
                        id={`line-${idx}`}
                        key={idx} 
                        style={{ 
                          fontSize: '22px', 
                          fontWeight: '600', 
                          opacity: idx === activeIndex ? 1 : 0.3, 
                          lineHeight: '1.6', 
                          color: idx === activeIndex ? '#12d15e' : '#fff',
                          transition: 'all 0.3s',
                          transform: idx === activeIndex ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: 'left'
                        }}
                      >
                        {line.text}
                      </p>
                    ))
                  ) : (
                    <div style={{ opacity: 0.4, textAlign: 'center', marginTop: '40px' }}>
                      <Globe size={40} style={{ marginBottom: '16px' }} />
                      <p>No {currentLang === 'hi' ? 'Hindi' : 'Spanish'} translations found for this song.</p>
                      <button 
                        onClick={() => setCurrentLang('en')}
                        style={{ background: '#12d15e', border: 'none', padding: '8px 16px', borderRadius: '20px', marginTop: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Read in English
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Bottom Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '48px' }} className="content-grid-desktop">
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold' }}>Suggested for You</h3>
                <span style={{ fontSize: '14px', color: '#12d15e', cursor: 'pointer' }}>View All</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
                {preferences?.favoriteGenres?.map((genre: string, i: number) => (
                  <PlaylistCard key={genre} title={`${genre} Mix`} color={i % 2 === 0 ? '#ff4b82' : '#8a2be2'} />
                ))}
                {!preferences?.favoriteGenres?.length && [1,2,3].map(i => (
                   <PlaylistCard key={i} title={`Discovery Mix ${i}`} color={i === 1 ? '#ff4b82' : i === 2 ? '#12d15e' : '#8a2be2'} />
                ))}
              </div>
            </section>

            <section>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px' }}>Song Library</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {songs.map((song, idx) => (
                  <SongItem 
                    key={song._id} 
                    song={song} 
                    active={currentSongIndex === idx} 
                    onClick={() => { setCurrentSongIndex(idx); setCurrentTime(0); setIsPlaying(true); setHideVideo(false); }} 
                  />
                ))}
                {songs.length === 0 && <p style={{ opacity: 0.4 }}>No songs in the library yet.</p>}
              </div>
            </section>
          </div>
          </div>
        )}
      </main>

      {showQuizModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e1e30 0%, #0c0c14 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '28px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(18, 209, 94, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(18, 209, 94, 0.15)', filter: 'blur(50px)', borderRadius: '50%' }}></div>
            
            <div style={{ display: 'inline-flex', background: 'rgba(18, 209, 94, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '24px', color: '#12d15e' }}>
              <Music size={40} className="pulse-icon" />
            </div>
            
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', background: 'linear-gradient(135deg, #fff 0%, #12d15e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {modalMode === 'completed' ? 'Song Completed! 🎉' : 'Practice Song 🎵'}
            </h2>
            <p style={{ opacity: 0.8, fontSize: '16px', lineHeight: '1.5', marginBottom: '32px' }}>
              {modalMode === 'completed' 
                ? `Great job listening to ${currentSong.title}. Choose a language to start practicing vocabulary:`
                : `Select a language to practice vocabulary from ${currentSong.title}:`
              }
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button 
                  onClick={() => {
                    setShowQuizModal(false);
                    navigate(`/lessons?songId=${currentSong._id}&language=hindi`);
                  }}
                  className="btn-hover"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '16px',
                    fontWeight: '800',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 10px 20px rgba(124, 58, 237, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '28px' }}>🇮🇳</span>
                  <span>Hindi</span>
                </button>

                <button 
                  onClick={() => {
                    setShowQuizModal(false);
                    navigate(`/lessons?songId=${currentSong._id}&language=spanish`);
                  }}
                  className="btn-hover"
                  style={{
                    background: 'linear-gradient(135deg, #12d15e 0%, #0bb04c 100%)',
                    color: '#000',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '16px',
                    fontWeight: '800',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 10px 20px rgba(18, 209, 94, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '28px' }}>🇪🇸</span>
                  <span>Spanish</span>
                </button>
              </div>
              
              <button 
                onClick={() => setShowQuizModal(false)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '14px',
                  borderRadius: '16px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '12px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                {modalMode === 'completed' ? 'Maybe Later' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #121214 0%, #09090b 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '28px',
            padding: '32px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            position: 'relative'
          }}>
            <button 
              onClick={() => { setShowReviewModal(false); setSelectedAttempt(null); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            {reviewLoading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', opacity: 0.6 }}>Loading quiz review details...</div>
            ) : selectedAttempt ? (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#12d15e', fontWeight: 'bold', letterSpacing: '1px' }}>
                    Quiz Review • {selectedAttempt.language}
                  </span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', marginBottom: '8px' }}>
                    {selectedAttempt.level === 'dynamic' ? 'Song Practice Quiz' : 'Lesson Quiz Completion'}
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', opacity: 0.6 }}>
                    <span>Score: <strong>{selectedAttempt.score}/{selectedAttempt.questions?.length}</strong></span>
                    <span>•</span>
                    <span>XP Earned: <strong style={{ color: '#eab308' }}>+{selectedAttempt.xpEarned} XP</strong></span>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {selectedAttempt.questions?.map((question: any, idx: number) => {
                    const userAnswerObj = selectedAttempt.userAnswers?.find((ua: any) => ua.questionId === question.id);
                    const isCorrect = userAnswerObj?.isCorrect || false;
                    const userAnswerText = userAnswerObj?.answer || '';

                    return (
                      <div 
                        key={question.id} 
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isCorrect ? 'rgba(18, 209, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                          borderRadius: '16px',
                          padding: '20px',
                          borderLeftWidth: '5px',
                          borderLeftColor: isCorrect ? '#12d15e' : '#ef4444'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)' }}>Question {idx + 1}</span>
                          <span style={{
                            background: isCorrect ? 'rgba(18, 209, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isCorrect ? '#12d15e' : '#ef4444',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>

                        <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>{question.questionText}</p>

                        {question.targetWord && (
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px' }}>
                            {question.targetWord}
                          </div>
                        )}

                        {question.sentence && (
                          <div style={{ fontSize: '16px', textAlign: 'center', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px' }}>
                            {question.sentence}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                          {question.options?.map((opt: string, oIdx: number) => {
                            const isUserSelected = opt === userAnswerText;
                            const isCorrectOpt = opt === question.correctAnswer;
                            
                            let bg = 'rgba(255,255,255,0.02)';
                            let border = '1px solid rgba(255,255,255,0.05)';
                            let color = '#fff';
                            
                            if (isCorrectOpt) {
                              bg = 'rgba(18, 209, 94, 0.1)';
                              border = '1px solid #12d15e';
                            } else if (isUserSelected && !isCorrect) {
                              bg = 'rgba(239, 68, 68, 0.1)';
                              border = '1px solid #ef4444';
                            }

                            return (
                              <div key={oIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: '10px', background: bg, border: border, color: color, fontSize: '13px' }}>
                                <span>{opt}</span>
                                {isCorrectOpt && <span style={{ color: '#12d15e', fontWeight: 'bold', fontSize: '11px' }}>Correct Answer</span>}
                                {isUserSelected && !isCorrect && <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '11px' }}>Your Answer</span>}
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid rgba(255,255,255,0.2)' }}>
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.6 }}>No details found.</div>
            )}
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e1e30 0%, #0c0c14 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '28px',
            padding: '40px',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => { setShowCreateModal(false); setNewPlaylistTitle(''); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'inline-flex', background: 'rgba(18, 209, 94, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '24px', color: '#12d15e' }}>
              <ListMusic size={32} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Create Playlist</h2>
            <p style={{ opacity: 0.6, fontSize: '14px', marginBottom: '24px' }}>Give your custom playlist a name to get started.</p>

            <div style={{ marginBottom: '24px' }}>
              <input 
                type="text" 
                placeholder="Playlist Title" 
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255,255,255,0.02)',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  textAlign: 'center'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreatePlaylist();
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <button 
                onClick={() => { setShowCreateModal(false); setNewPlaylistTitle(''); }}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '14px',
                  borderRadius: '16px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePlaylist}
                className="btn-hover"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #12d15e 0%, #0bb04c 100%)',
                  color: '#000',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '16px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 10px 20px rgba(18, 209, 94, 0.15)'
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        :root { --sidebar-width: ${isSidebarCollapsed ? '88px' : '280px'}; }
        .desktop-sidebar {
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease, transform 0.3s ease;
        }
        .main-content {
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 1024px) {
          :root { --sidebar-width: 0px; }
          .desktop-sidebar { 
            transform: translateX(${isMobileOpen ? '0' : '-100%'});
            display: flex !important;
            width: 280px !important;
            padding: 40px 24px !important;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
          .desktop-toggle-btn {
            display: none !important;
          }
          .mobile-close-btn {
            display: flex !important;
          }
          main { padding: 24px !important; padding-bottom: 100px !important; padding-top: 80px !important; }
          .content-grid-desktop { grid-template-columns: 1fr !important; }
        }
        .btn-hover:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .control-icon:hover { color: #12d15e; transform: scale(1.1); }
        .control-icon { transition: all 0.2s; }
        .loader { font-size: 24px; font-weight: 800; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        .mini-video-player:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 25px rgba(18, 209, 94, 0.25) !important;
        }
        .video-close-btn:hover {
          background: #ef4444 !important;
          border-color: #ef4444 !important;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick, collapsed = false }: any) => (
  <div onClick={onClick} style={{ 
    display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '16px', padding: '12px 16px', borderRadius: '12px', 
    background: active ? 'rgba(18, 209, 94, 0.1)' : 'transparent',
    color: active ? '#12d15e' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: active ? '700' : '500',
    justifyContent: collapsed ? 'center' : 'flex-start'
  }}>
    {icon} {!collapsed && <span>{label}</span>}
  </div>
);

const PlaylistCard = ({ title, color }: any) => (
  <div style={{ 
    height: '140px', background: `linear-gradient(135deg, ${color}dd 0%, ${color} 100%)`,
    borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'flex-end', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative', overflow: 'hidden'
  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
    <span style={{ zIndex: 1 }}>{title}</span>
    <Globe size={80} style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.15 }} />
  </div>
);

const SongItem = ({ song, active, onClick }: any) => (
  <div onClick={onClick} style={{ 
    display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '16px', 
    background: active ? 'rgba(18, 209, 94, 0.1)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s',
    border: active ? '1px solid rgba(18, 209, 94, 0.3)' : '1px solid transparent'
  }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#333', overflow: 'hidden' }}>
      <img src={song.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop'} alt="Song" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: active ? '#12d15e' : '#fff' }}>{song.title}</div>
      <div style={{ fontSize: '12px', opacity: 0.5 }}>{song.artistName}</div>
    </div>
    {active ? <Volume2 size={16} color="#12d15e" /> : <Play size={14} fill="#fff" />}
  </div>
);

export default DashboardPage;
