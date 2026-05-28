import React, { useState } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListMusic, 
  Users, 
  Music, 
  LogOut,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [form, setForm] = useState({
    title: "",
    artist: "",
    language: "English",
    audioUrl: "",
    lyrics: ""
  });
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [savedSongId, setSavedSongId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<{ hindi: any[], spanish: any[] } | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  const [activeView, setActiveView] = useState<'add-song' | 'users'>('add-song');
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserAttempts, setSelectedUserAttempts] = useState<any[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const navigate = useNavigate();

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch users list');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserAttempts = async (userId: string) => {
    setAttemptsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/users/${userId}/attempts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedUserAttempts(response.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch user quiz history');
    } finally {
      setAttemptsLoading(false);
    }
  };

  const handleReviewAttempt = async (attemptId: string) => {
    setReviewLoading(true);
    setShowReviewModal(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/attempts/${attemptId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedAttempt(response.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch attempt details');
      setShowReviewModal(false);
    } finally {
      setReviewLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeView === 'users') {
      fetchUsers();
      setSelectedUser(null);
      setSelectedUserAttempts([]);
    }
  }, [activeView]);

  const handlePreview = () => {
    const lines = form.lyrics.split('\n').filter(line => line.trim() !== '');
    setPreviewLines(lines);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/admin/song', {
        title: form.title,
        artistName: form.artist,
        language: form.language,
        audioUrl: form.audioUrl,
        youtubeUrl: form.audioUrl, // send youtubeUrl so backend can fetch transcript
        lyrics: previewLines.length > 0 ? previewLines : form.lyrics.split('\n').filter(l => l.trim() !== '')
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 201) {
        setShowToast(true);
        setSavedSongId(response.data.song._id);
        setTimeout(() => setShowToast(false), 3000);
        
        // If we auto-fetched segments from YouTube, display them in the textarea and preview pane
        if (response.data.fetchedSegments > 0 && response.data.segments) {
           const lines = response.data.segments.map((s: any) => s.text);
           setPreviewLines(lines);
           setForm((prev) => ({ ...prev, lyrics: lines.join('\n') }));
           alert(`Successfully auto-fetched ${response.data.fetchedSegments} lyric segments from YouTube!`);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save song');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTranslate = async () => {
    if (!savedSongId) return;
    setIsTranslating(true);
    try {
      const token = localStorage.getItem('token');
      console.log("Requesting translation for:", savedSongId);
      
      const response = await axios.post(`http://localhost:5000/api/admin/translate/${savedSongId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log("Translation Response:", response.data);
      
      if (response.data.hindi && response.data.hindi.length > 0) {
        setTranslations(response.data);
        // Force refresh preview lines to ensure they match the translation indices
        const lines = form.lyrics.split('\n').filter(line => line.trim() !== '');
        setPreviewLines(lines);
        alert("✨ Translation complete! You can see them in the preview now.");
      } else {
        alert("Translation returned empty data. Please check the backend logs.");
      }
    } catch (err: any) {
      console.error("Translation Error:", err);
      alert('Translation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleReset = () => {
    setForm({
      title: "",
      artist: "",
      language: "English",
      audioUrl: "",
      lyrics: ""
    });
    setPreviewLines([]);
    setSavedSongId(null);
    setTranslations(null);
  };

  const renderUsersView = () => {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>User Management</h1>
            <p style={{ opacity: 0.5 }}>Manage registered users and inspect their quiz completions and performance metrics.</p>
          </div>
          <div style={{ background: '#27272a', padding: '6px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
            Total Users: {users.length}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '32px', alignItems: 'start' }} className="admin-grid-layout">
          {/* User List Panel */}
          <section style={{ background: '#121214', border: '1px solid #1e1e21', borderRadius: '20px', padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Registered Users</h3>
            {usersLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.5 }}>Loading users...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.5 }}>No registered users found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                {users.map((user) => {
                  const isSelected = selectedUser?._id === user._id;
                  return (
                    <div 
                      key={user._id}
                      onClick={() => {
                        setSelectedUser(user);
                        fetchUserAttempts(user._id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        borderRadius: '14px',
                        background: isSelected ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? '#a855f7' : 'rgba(255,255,255,0.04)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: isSelected ? '#a855f7' : '#fff' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '2px' }}>{user.email}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '11px', opacity: 0.4 }}>
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        <ChevronRight size={16} color={isSelected ? '#a855f7' : '#fff'} style={{ opacity: isSelected ? 1 : 0.4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* User History Panel */}
          <section style={{ position: 'sticky', top: '0', background: '#121214', border: '1px solid #1e1e21', borderRadius: '20px', padding: '32px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            {selectedUser ? (
              <>
                <div style={{ borderBottom: '1px solid #1e1e21', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#a855f7', fontWeight: 'bold', letterSpacing: '0.5px' }}>User Profile</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{selectedUser.name}</h3>
                  <p style={{ fontSize: '12px', opacity: 0.5, margin: '2px 0 0 0' }}>{selectedUser.email}</p>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Quiz & Lesson History</h4>

                {attemptsLoading ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>Loading quiz records...</div>
                ) : selectedUserAttempts.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4, padding: '40px 0' }}>
                    <PlusCircle size={28} style={{ marginBottom: '8px' }} />
                    <p style={{ fontSize: '13px' }}>No quiz completions found for this user.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '45vh', overflowY: 'auto', paddingRight: '8px' }}>
                    {selectedUserAttempts.map((attempt) => (
                      <div 
                        key={attempt._id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {attempt.level === 'dynamic' ? 'Song Practice' : 'Lesson'} • {attempt.language}
                          </div>
                          <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '2px' }}>
                            {new Date(attempt.completedAt).toLocaleString()}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#12d15e' }}>{attempt.score} Correct</div>
                            <div style={{ fontSize: '10px', color: '#eab308', fontWeight: 'bold' }}>+{attempt.xpEarned} XP</div>
                          </div>
                          <button
                            onClick={() => handleReviewAttempt(attempt._id)}
                            style={{
                              background: '#27272a',
                              border: 'none',
                              color: '#fff',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            className="btn-hover"
                          >
                            Audit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4, textAlign: 'center', padding: '60px 0' }}>
                <Users size={36} style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 4px 0' }}>No User Selected</h4>
                <p style={{ fontSize: '13px', maxWidth: '250px' }}>Select a registered user from the left list to review their quiz performance.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090b', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '260px', background: '#000', borderRight: '1px solid #18181b', padding: '32px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 12px' }}>
          <div style={{ background: '#12793d', padding: '8px', borderRadius: '10px' }}>
            <Music size={24} color="#fff" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Lingofy Admin</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <SidebarItem 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={false} 
          />
          <SidebarItem 
            icon={<PlusCircle size={18} />} 
            label="Add Song" 
            active={activeView === 'add-song'} 
            onClick={() => setActiveView('add-song')}
          />
          <SidebarItem 
            icon={<ListMusic size={18} />} 
            label="Manage Songs" 
            active={false} 
          />
          <SidebarItem 
            icon={<Users size={18} />} 
            label="Users" 
            active={activeView === 'users'} 
            onClick={() => setActiveView('users')}
          />
        </nav>

        <div style={{ borderTop: '1px solid #18181b', paddingTop: '20px' }}>
          <SidebarItem 
            icon={<LogOut size={18} />} 
            label="Logout" 
            onClick={() => { localStorage.clear(); navigate('/login'); }} 
          />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Navbar */}
        <header style={{ height: '70px', borderBottom: '1px solid #18181b', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 40px', background: '#000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Admin User</div>
              <div style={{ fontSize: '12px', opacity: 0.5 }}>System Administrator</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: '40px', overflowY: 'auto', flex: 1 }}>
          {activeView === 'users' ? renderUsersView() : (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Add New Song</h1>
              <p style={{ opacity: 0.5 }}>Expand your library by adding high-quality musical content.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px', alignItems: 'start' }}>
              
              {/* Form Section */}
              <section style={{ background: '#121214', border: '1px solid #1e1e21', borderRadius: '20px', padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div className="input-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', opacity: 0.7 }}>Song Title</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      placeholder="Song Title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', opacity: 0.7 }}>Artist Name</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      placeholder="Artist Name"
                      value={form.artist}
                      onChange={(e) => setForm({ ...form, artist: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', opacity: 0.7 }}>Language</label>
                  <select 
                    className="admin-input" 
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    style={{ appearance: 'none', background: '#09090b' }}
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>Japanese</option>
                    <option>Korean</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', opacity: 0.7 }}>YouTube URL</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    placeholder="YouTube URL"
                    value={form.audioUrl}
                    onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', opacity: 0.7 }}>Lyrics (Optional)</label>
                  <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '-4px', marginBottom: '12px', color: '#a855f7' }}>
                    ✨ Leave this empty to automatically extract lyrics and timestamps from YouTube!
                  </p>
                  <textarea 
                    className="admin-input" 
                    rows={12} 
                    placeholder="Paste English Lyrics (line by line) OR leave empty to auto-fetch"
                    value={form.lyrics}
                    onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <button 
                    onClick={handleTranslate}
                    disabled={!savedSongId || isTranslating}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      borderRadius: '12px', 
                      border: savedSongId ? '1px solid #a855f7' : '1px solid rgba(168, 85, 247, 0.4)', 
                      background: savedSongId 
                        ? 'linear-gradient(90deg, rgba(168, 85, 247, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)' 
                        : 'linear-gradient(90deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', 
                      color: savedSongId ? '#fff' : '#a855f7', 
                      fontWeight: '600', 
                      fontSize: '14px',
                      cursor: !savedSongId || isTranslating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: savedSongId ? '0 0 20px rgba(168, 85, 247, 0.2)' : 'none',
                      transition: 'all 0.3s'
                    }}
                  >
                    {isTranslating ? <Loader2 size={18} className="spin" /> : '✨'} 
                    {isTranslating ? 'Translating...' : savedSongId ? 'Auto Translate Now' : 'Auto Translate (Save first)'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button 
                    onClick={handleReset}
                    style={{ 
                      flex: 1, 
                      padding: '14px', 
                      borderRadius: '12px', 
                      border: '1px solid #27272a', 
                      background: 'transparent', 
                      color: '#fff', 
                      fontWeight: '600', 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    New Song
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || !!savedSongId}
                    style={{ 
                      flex: 1, 
                      padding: '14px', 
                      borderRadius: '12px', 
                      border: 'none', 
                      background: !!savedSongId ? '#12793d' : '#fff', 
                      color: !!savedSongId ? '#fff' : '#000', 
                      fontWeight: '700', 
                      cursor: (isSaving || !!savedSongId) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    {isSaving ? <Loader2 size={20} className="spin" /> : (!!savedSongId ? <CheckCircle2 size={18} /> : <Send size={18} />)}
                    {isSaving ? 'Saving...' : (!!savedSongId ? 'Saved' : 'Save Song')}
                  </button>
                </div>
              </section>

              {/* Preview Section */}
              <section style={{ position: 'sticky', top: '0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Preview Segments {previewLines.length > 0 && <span style={{ background: '#27272a', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{previewLines.length}</span>}
                </h3>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px', 
                  maxHeight: 'calc(100vh - 200px)', 
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {previewLines.length === 0 ? (
                    <div style={{ border: '2px dashed #27272a', borderRadius: '16px', padding: '40px', textAlign: 'center', opacity: 0.4 }}>
                      <PlusCircle size={32} style={{ marginBottom: '12px' }} />
                      <p style={{ fontSize: '13px' }}>Click preview to see segmented lyrics</p>
                    </div>
                  ) : (
                    previewLines.map((line, idx) => (
                      <div key={idx} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.4, fontWeight: '700', marginBottom: '6px' }}>Line {idx + 1}</div>
                        <div style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: translations ? '12px' : '0' }}>{line}</div>
                        
                        {translations && (
                          <div style={{ borderTop: '1px solid #27272a', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '12px' }}>
                              <span style={{ opacity: 0.5, fontSize: '10px', marginRight: '6px' }}>HI:</span> 
                              {translations.hindi[idx]?.text}
                            </div>
                            <div style={{ fontSize: '12px' }}>
                              <span style={{ opacity: 0.5, fontSize: '10px', marginRight: '6px' }}>ES:</span> 
                              {translations.spanish[idx]?.text}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
            </div>
          )}
        </div>
      </main>

      {/* Success Toast */}
      {showToast && (
        <div style={{ 
          position: 'fixed', 
          bottom: '40px', 
          right: '40px', 
          background: '#fff', 
          color: '#000', 
          padding: '16px 24px', 
          borderRadius: '12px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease'
        }}>
          <CheckCircle2 size={20} color="#12793d" />
          <span style={{ fontWeight: '600' }}>Song saved successfully!</span>
        </div>
      )}

      {/* Quiz Detail Audit Modal */}
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
              <div style={{ padding: '60px 0', textAlign: 'center', opacity: 0.6 }}>Loading quiz details...</div>
            ) : selectedAttempt ? (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a855f7', fontWeight: 'bold', letterSpacing: '1px' }}>
                    User Quiz Audit • {selectedAttempt.userId?.name || 'User'}
                  </span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', marginBottom: '8px' }}>
                    {selectedAttempt.level === 'dynamic' ? 'Song Practice Quiz' : 'Lesson Quiz'}
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', opacity: 0.6 }}>
                    <span>User: <strong>{selectedAttempt.userId?.name} ({selectedAttempt.userId?.email})</strong></span>
                    <span>•</span>
                    <span>Score: <strong>{selectedAttempt.score}/{selectedAttempt.questions?.length}</strong></span>
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
                                {isUserSelected && !isCorrect && <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '11px' }}>User Answer</span>}
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

      <style>{`
        .admin-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid #27272a;
          background: #09090b;
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .admin-input:focus {
          border-color: #3f3f46;
          background: #121214;
        }
        .spin {
          animation: rotate 1s linear infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const SidebarItem = ({ icon, label, active = false, onClick }: any) => (
  <div 
    onClick={onClick}
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '10px 12px', 
      borderRadius: '8px', 
      cursor: 'pointer',
      color: active ? '#fff' : '#a1a1aa',
      background: active ? '#27272a' : 'transparent',
      transition: 'all 0.2s',
      fontSize: '14px',
      fontWeight: active ? '600' : '400'
    }}
  >
    {icon}
    <span>{label}</span>
    {active && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
  </div>
);

export default AdminDashboard;
