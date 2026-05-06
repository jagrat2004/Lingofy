import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Check, Languages, User, ChevronRight } from 'lucide-react';

const genres = ['Pop', 'Latin', 'Folk', 'Rock', 'Bollywood', 'Lo-fi', 'Jazz', 'EDM', 'Classical', 'Rap', 'Indie', 'K-Pop', 'Soul'];
const artists = ['Badshah', 'Lady Gaga', 'RADWIMPS', 'Drake', 'Shakira', 'Shreya Ghoshal', 'Arijit Singh', 'Neha Kakkar', 'ColdPlay', 'Prateek Kuhad', 'Dua Lipa', 'BTS', 'EXO', 'BlackPink', 'Shawn Mendes'];

const PreferencesPage = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [languages, setLanguages] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleArtist = (artist: string) => {
    setSelectedArtists(prev => 
      prev.includes(artist) ? prev.filter(a => a !== artist) : [...prev, artist]
    );
  };

  const handleSavePreferences = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/preferences', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          languagesToLearn: languages.split(',').map(l => l.trim()).filter(l => l !== ''),
          favoriteGenres: selectedGenres,
          favoriteArtists: selectedArtists,
          vocabularyLevel: 'beginner',
          sessionGoalMinutes: 15
        })
      });

      const data = await res.json();
      if (res.ok) {
        navigate('/dashboard');
      } else {
        alert(data.message || 'Error saving preferences');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at 50% 0%, #1a1a2e 0%, #0f0f13 100%)', 
      padding: '60px 5%', 
      width: '100%',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Background Orbs for Premium Feel */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(138, 43, 226, 0.1)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(18, 121, 61, 0.1)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }}></div>

      <div style={{ width: '100%', maxWidth: '900px', position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
            <img src="/Logo-1.png" alt="Lingofy Logo" style={{ width: '64px', height: '64px', filter: 'drop-shadow(0 0 15px rgba(18, 121, 61, 0.4))' }} />
            <div className="logo-text" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', background: 'linear-gradient(135deg, #fff 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Lingofy</div>
          </div>
          <p style={{ opacity: 0.6, fontSize: '18px' }}>Personalize your musical language journey</p>
        </div>

        {/* Section 1: Languages */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(10px)', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '24px', 
          padding: '32px',
          marginBottom: '32px',
          transition: 'transform 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(138, 43, 226, 0.2)', padding: '10px', borderRadius: '12px' }}>
              <Languages size={20} color="#a855f7" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Which languages are we learning today?</h3>
          </div>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g. Spanish, Korean, French..." 
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            style={{ 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              width: '100%',
              padding: '16px 20px',
              borderRadius: '14px',
              fontSize: '16px',
              color: '#fff',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
          />
        </div>

        {/* Section 2: Genres */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(10px)', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '24px', 
          padding: '32px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(18, 121, 61, 0.2)', padding: '10px', borderRadius: '12px' }}>
              <Music size={20} color="#12793d" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Pick your favorite vibes</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {genres.map(genre => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <div 
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '100px',
                    background: isSelected ? 'linear-gradient(135deg, #8a2be2 0%, #4c1d95 100%)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid',
                    borderColor: isSelected ? '#8a2be2' : 'rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isSelected ? '0 10px 15px -3px rgba(138, 43, 226, 0.3)' : 'none'
                  }}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                  <span style={{ fontSize: '14px', fontWeight: isSelected ? '600' : '400' }}>{genre}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Artists */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(10px)', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '24px', 
          padding: '32px',
          marginBottom: '50px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <User size={20} color="#fff" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Who's on your playlist?</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {artists.map(artist => {
              const isSelected = selectedArtists.includes(artist);
              return (
                <button 
                  key={artist}
                  onClick={() => toggleArtist(artist)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '16px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: isSelected ? '700' : '400',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s',
                    transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSelected ? '#12793d' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s' }}></div>
                  {artist}
                </button>
              );
            })}
          </div>
        </div>

        {/* Final Button */}
        <div style={{ position: 'sticky', bottom: '30px' }}>
          <button 
            className="btn" 
            onClick={handleSavePreferences}
            disabled={isSaving}
            style={{ 
              background: '#fff', 
              color: '#000', 
              fontSize: '18px', 
              fontWeight: '800', 
              padding: '20px',
              borderRadius: '20px',
              border: 'none',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.2)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: isSaving ? 0.7 : 1,
              transform: isSaving ? 'scale(0.98)' : 'scale(1)'
            }}
          >
            {isSaving ? 'Synchronizing...' : (
              <>
                Let's tune in! <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .input-field:focus {
          border-color: #8a2be2 !important;
          box-shadow: 0 0 15px rgba(138, 43, 226, 0.2);
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

export default PreferencesPage;
