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
  Volume2
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
  const navigate = useNavigate();

  const currentSong = songs[currentSongIndex] || { title: 'No Songs', artist: 'Add some songs in admin', durationSeconds: 0, audioUrl: '', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop' };

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
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [navigate]);

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
    setCurrentSongIndex((prev) => (prev + 1) % (songs.length || 1));
    setCurrentTime(0);
    if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
  };

  const handlePrev = () => {
    setCurrentSongIndex((prev) => (prev - 1 + (songs.length || 1)) % (songs.length || 1));
    setCurrentTime(0);
    if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        width: '180px', 
        height: '100px', 
        borderRadius: '12px',
        overflow: 'hidden', 
        zIndex: 1000,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        background: '#000',
        display: isPlaying ? 'block' : 'none'
      }}>
        <div id="youtube-player"></div>
      </div>
      {/* Sidebar */}
      <aside className="desktop-sidebar" style={{ 
        width: '280px', background: '#000', borderRight: '1px solid rgba(255,255,255,0.05)',
        padding: '40px 24px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
          <img src="/Logo-1.png" alt="Logo" style={{ width: '40px' }} />
          <span style={{ fontSize: '24px', fontWeight: '800' }}>Lingofy</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <NavItem icon={<Home size={20} />} label="Home" active />
          <NavItem icon={<BookOpen size={20} />} label="Lessons" />
          <NavItem icon={<Music size={20} />} label="Library" />
          <NavItem icon={<BarChart2 size={20} />} label="Statistics" />
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
          <NavItem icon={<Settings size={20} />} label="Settings" />
          <NavItem icon={<LogOut size={20} />} label="Logout" onClick={() => { localStorage.clear(); navigate('/login'); }} />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width, 0px)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
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
                  <div style={{ display: 'flex', gap: '12px' }}>
                     <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}>HQ AUDIO</div>
                     <div style={{ background: 'rgba(18, 209, 94, 0.2)', color: '#12d15e', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}>LYRICS</div>
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
                    onClick={() => { setCurrentSongIndex(idx); setCurrentTime(0); setIsPlaying(true); }} 
                  />
                ))}
                {songs.length === 0 && <p style={{ opacity: 0.4 }}>No songs in the library yet.</p>}
              </div>
            </section>
          </div>
        </div>
      </main>

      <style>{`
        :root { --sidebar-width: 280px; }
        @media (max-width: 1024px) {
          :root { --sidebar-width: 0px; }
          .desktop-sidebar { display: none !important; }
          main { padding: 24px !important; padding-bottom: 100px !important; }
          .content-grid-desktop { grid-template-columns: 1fr !important; }
        }
        .btn-hover:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .control-icon:hover { color: #12d15e; transform: scale(1.1); }
        .control-icon { transition: all 0.2s; }
        .loader { font-size: 24px; font-weight: 800; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: any) => (
  <div onClick={onClick} style={{ 
    display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', borderRadius: '12px', 
    background: active ? 'rgba(18, 209, 94, 0.1)' : 'transparent',
    color: active ? '#12d15e' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: active ? '700' : '500'
  }}>
    {icon} <span>{label}</span>
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
