import React, { useState, useEffect } from 'react';
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
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch('http://localhost:5000/api/preferences', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setPreferences(data);
        } else if (res.status === 401) {
          navigate('/login');
        }
      } catch (err) {
        console.error('Failed to fetch preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [navigate]);

  const likedSongs = [
    { id: 1, title: 'En Nuit', artist: 'Videoclub', duration: '3:41' },
    { id: 2, title: 'Black Swan', artist: 'BTS', duration: '3:18' },
    { id: 3, title: 'Parano (ft. DDB)', artist: 'Lomepal', duration: '3:22' },
    { id: 4, title: 'Kokoronashi', artist: 'Chouchou-P', duration: '4:36' },
  ];

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
      {/* Sidebar - Desktop Only */}
      <aside className="desktop-sidebar" style={{ 
        width: '280px', 
        background: '#000', 
        borderRight: '1px solid rgba(255,255,255,0.05)',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 100
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
          <NavItem icon={<LogOut size={20} />} label="Logout" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        marginLeft: 'var(--sidebar-width, 0px)', 
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}>
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          
          {/* Top Section: User Info & Progress */}
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', marginBottom: '48px' }}>
            
            {/* Language Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '4px solid #fff', overflow: 'hidden' }}>
                    <img src="https://flagcdn.com/w160/jp.png" alt="Lang" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              
              <button style={{ 
                width: '100%', 
                background: '#12d15e', 
                color: '#000', 
                border: 'none', 
                padding: '16px', 
                borderRadius: '16px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                Start Daily Lesson <ChevronRight size={18} />
              </button>
            </div>

            {/* Music Player Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1e1e1e 0%, #000 100%)', 
              borderRadius: '24px', 
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: '#333', overflow: 'hidden' }}>
                  <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop" alt="Album" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>STRUCT</h3>
                  <p style={{ opacity: 0.6, margin: '0 0 12px 0' }}>UdieNnx</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                     <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}>HQ AUDIO</div>
                     <div style={{ background: 'rgba(18, 209, 94, 0.2)', color: '#12d15e', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}>LYRICS</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '8px', position: 'relative' }}>
                  <div style={{ width: '42%', height: '100%', background: '#fff' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.5 }}>
                  <span>1:54</span>
                  <span>-2:31</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px' }}>
                <SkipBack size={24} style={{ cursor: 'pointer' }} />
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {isPlaying ? <Pause size={28} fill="#000" color="#000" /> : <Play size={28} fill="#000" color="#000" style={{ marginLeft: '4px' }} />}
                </button>
                <SkipForward size={24} style={{ cursor: 'pointer' }} />
              </div>
            </div>
          </div>

          {/* Bottom Grid: Playlists and Liked Songs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '48px' }} className="content-grid-desktop">
            
            {/* Playlists Section */}
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

            {/* Liked Songs Sidebar */}
            <section>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px' }}>Recently Played</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {likedSongs.map(song => (
                  <SongItem key={song.id} song={song} />
                ))}
              </div>
            </section>
          </div>

        </div>
      </main>

      {/* Mobile Nav Bar */}
      <div className="mobile-nav" style={{ 
        position: 'fixed', 
        bottom: '24px', 
        left: '24px', 
        right: '24px', 
        background: '#12d15e', 
        height: '64px', 
        borderRadius: '32px',
        display: 'none', // Hidden by default, shown via media query
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        boxShadow: '0 10px 30px rgba(18, 209, 94, 0.4)'
      }}>
        <Home size={24} color="#000" />
        <BookOpen size={24} color="#000" />
        <Search size={24} color="#000" />
        <Settings size={24} color="#000" />
      </div>

      <style>{`
        :root {
          --sidebar-width: 280px;
        }

        @media (max-width: 1024px) {
          :root {
            --sidebar-width: 0px;
          }
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-nav {
            display: flex !important;
          }
          main {
            padding: 24px !important;
            padding-bottom: 100px !important;
          }
          .content-grid-desktop {
            grid-template-columns: 1fr !important;
          }
        }

        .loader {
          font-size: 24px;
          font-weight: 800;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: any) => (
  <div 
    onClick={onClick}
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '16px', 
      padding: '12px 16px', 
      borderRadius: '12px', 
      background: active ? 'rgba(18, 209, 94, 0.1)' : 'transparent',
      color: active ? '#12d15e' : 'rgba(255,255,255,0.6)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontWeight: active ? '700' : '500'
    }}
    onMouseEnter={(e) => !active && (e.currentTarget.style.color = '#fff')}
    onMouseLeave={(e) => !active && (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
  >
    {icon}
    <span>{label}</span>
  </div>
);

const PlaylistCard = ({ title, color }: any) => (
  <div style={{ 
    height: '140px', 
    background: `linear-gradient(135deg, ${color}dd 0%, ${color} 100%)`,
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    alignItems: 'flex-end',
    fontWeight: 'bold',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    position: 'relative',
    overflow: 'hidden'
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
  >
    <span style={{ zIndex: 1 }}>{title}</span>
    <Globe size={80} style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.15 }} />
  </div>
);

const SongItem = ({ song }: any) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    padding: '12px', 
    borderRadius: '16px', 
    background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
  >
    <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#333', overflow: 'hidden' }}>
      <img src={`https://picsum.photos/seed/${song.id}/100`} alt="Song" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{song.title}</div>
      <div style={{ fontSize: '12px', opacity: 0.5 }}>{song.artist}</div>
    </div>
    <Play size={14} fill="#fff" />
  </div>
);

export default DashboardPage;
