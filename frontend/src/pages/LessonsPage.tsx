import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, Music, BarChart2, Settings, LogOut, ChevronRight, X, Check, XCircle, Menu, ChevronLeft
} from 'lucide-react';

type ViewState = 'setup' | 'loading' | 'quiz' | 'results';
type Language = 'hindi' | 'spanish';
type Level = 'beginner' | 'intermediate';

interface Question {
  id: number;
  type: 'multiple_choice' | 'fill_blank' | 'translate_word' | 'match_meaning';
  questionText: string;
  targetWord: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  sentence?: string;
}

const LessonsPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('setup');
  const [language, setLanguage] = useState<Language | null>(null);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const songIdParam = params.get('songId');
    const langParam = params.get('language') as Language;

    if (songIdParam && langParam) {
      setLanguage(langParam);
      startLesson(langParam, songIdParam);
    }
  }, []);

  const startLesson = async (overrideLang?: any, songIdParam?: string) => {
    const activeLang = (typeof overrideLang === 'string' ? overrideLang : null) || language;
    if (!activeLang) return;
    setView('loading');
    
    try {
      const token = localStorage.getItem('token');
      const hasSong = songIdParam || new URLSearchParams(window.location.search).get('songId');
      const endpoint = hasSong
        ? 'http://localhost:5000/api/lessons/generate-from-song'
        : 'http://localhost:5000/api/lessons/generate';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          language: activeLang,
          songId: hasSong || undefined
        })
      });
      
      if (!res.ok) throw new Error('Failed to generate lesson');
      
      const data = await res.json();
      setQuestions(data.questions);
      setCurrentQuestionIdx(0);
      setUserAnswers([]);
      setSelectedAnswer('');
      setIsAnswerChecked(false);
      setView('quiz');
    } catch (error) {
      console.error(error);
      alert("Couldn't generate lesson. Please try again.");
      setView('setup');
    }
  };

  const handleCheck = () => {
    if (isAnswerChecked) {
      // Move to next question or results
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedAnswer('');
        setIsAnswerChecked(false);
      } else {
        submitLesson();
      }
    } else {
      // Check answer
      if (!selectedAnswer) return;
      const question = questions[currentQuestionIdx];
      const cleanUser = selectedAnswer.trim().toLowerCase();
      const cleanCorrect = question.correctAnswer.trim().toLowerCase();
      let isCorrect = cleanUser === cleanCorrect;
      
      if (!isCorrect && language === 'hindi' && question.type === 'translate_word') {
        const matches = [...question.explanation.matchAll(/'([^']+)'/g)].map(m => m[1].toLowerCase().trim());
        if (matches.includes(cleanUser)) {
          isCorrect = true;
        }
      }
      
      setUserAnswers(prev => [...prev, {
        questionId: question.id,
        answer: selectedAnswer,
        isCorrect
      }]);
      setIsAnswerChecked(true);
    }
  };

  const submitLesson = async () => {
    setView('loading');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/lessons/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          language,
          questions,
          userAnswers
        })
      });
      
      if (!res.ok) throw new Error('Failed to submit lesson');
      
      const data = await res.json();
      setLessonResults(data);
      setView('results');
    } catch (error) {
      console.error(error);
      alert("Couldn't submit lesson.");
      setView('setup');
    }
  };

  const exitLesson = () => {
    if (view === 'quiz') {
      if (window.confirm("Leave lesson? Your progress will be lost.")) {
        setView('setup');
      }
    } else {
      setView('setup');
    }
  };

  // RENDER HELPERS
  const renderSetup = () => (
    <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', textAlign: 'center', paddingTop: '80px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '40px', fontWeight: 'bold' }}>Choose Your Language</h1>
      
      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '40px' }}>
        <div 
          onClick={() => setLanguage('hindi')}
          style={{
            width: '160px', height: '120px', background: language === 'hindi' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.08)',
            border: language === 'hindi' ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🇮🇳</div>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Hindi</div>
          <div style={{ fontSize: '14px', opacity: 0.6 }}>हिन्दी</div>
        </div>

        <div 
          onClick={() => setLanguage('spanish')}
          style={{
            width: '160px', height: '120px', background: language === 'spanish' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.08)',
            border: language === 'spanish' ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🇪🇸</div>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Spanish</div>
          <div style={{ fontSize: '14px', opacity: 0.6 }}>Español</div>
        </div>
      </div>


      <button 
        onClick={() => startLesson()}
        disabled={!language}
        style={{
          width: '100%', maxWidth: '300px', padding: '16px', borderRadius: '12px', border: 'none',
          background: language ? '#22c55e' : '#1f1f1f', color: language ? '#000' : '#4b4b4b',
          fontWeight: 'bold', fontSize: '18px', cursor: language ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
        }}
      >
        Start Lesson
      </button>
    </div>
  );

  const renderLoading = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <img src="/Logo-1.png" alt="Loading" style={{ width: '80px', animation: 'pulse 1.5s infinite', marginBottom: '24px' }} />
      <div style={{ fontSize: '18px', color: '#9ca3af' }}>Preparing your lesson...</div>
      <style>{`@keyframes pulse { 0% { opacity: 0.4; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.4; transform: scale(0.9); } }`}</style>
    </div>
  );

  const renderQuiz = () => {
    const question = questions[currentQuestionIdx];
    if (!question) return null;

    const progress = ((currentQuestionIdx) / (questions.length || 10)) * 100;
    const bubbleBg = question.type === 'multiple_choice' || question.type === 'translate_word' ? '#1a73e8' : '#22c55e';

    return (
      <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <X size={24} color="#9ca3af" cursor="pointer" onClick={exitLesson} />
          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#22c55e', transition: 'width 0.3s' }}></div>
          </div>
          <div style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 'bold' }}>{currentQuestionIdx + 1} / {questions.length}</div>
        </div>

        {/* Question Area */}
        <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: question.type === 'translate_word' ? '24px' : '0' }}>
            <img src="/Logo-1.png" alt="Owl" style={{ width: '48px', height: '48px' }} />
            <div style={{ 
              background: bubbleBg, color: '#fff', padding: '20px', borderRadius: '20px', borderBottomLeftRadius: '4px',
              fontSize: '16px', fontWeight: '500', position: 'relative'
            }}>
              {question.questionText}
              <div style={{ position: 'absolute', bottom: '10px', left: '-10px', width: '0', height: '0', borderTop: '10px solid transparent', borderRight: `10px solid ${bubbleBg}`, borderBottom: '10px solid transparent' }}></div>
            </div>
          </div>
          {(question.type === 'translate_word' || question.type === 'match_meaning') && (
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: '16px' }}>
              {question.targetWord}
            </div>
          )}
          {question.type === 'fill_blank' && question.sentence && (() => {
            const match = question.sentence.match(/^(.*?)\s*\((.*?)\)\s*$/);
            const foreignSentence = match ? match[1] : question.sentence;
            const translation = match ? match[2] : "";
            const parts = foreignSentence.split('___');
            return (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <div style={{ fontSize: '22px', fontWeight: '500', color: '#fff' }}>
                  {parts.map((part, index) => (
                    <span key={index}>
                      {part}
                      {index < parts.length - 1 && (
                        <span style={{ borderBottom: '3px solid #22c55e', color: '#22c55e', padding: '0 6px', fontWeight: 'bold' }}>___</span>
                      )}
                    </span>
                  ))}
                </div>
                {translation && (
                  <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '15px', marginTop: '8px' }}>
                    ({translation})
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Answer Area */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          {question.type === 'translate_word' ? (
            <div>
              <input 
                type="text" 
                value={selectedAnswer}
                onChange={(e) => !isAnswerChecked && setSelectedAnswer(e.target.value)}
                disabled={isAnswerChecked}
                placeholder="Type your answer"
                style={{ 
                  width: '100%', padding: '16px 20px', background: '#1c1c1e', border: '1px solid #3a3a3c',
                  borderRadius: '10px', color: '#fff', fontSize: '16px', marginBottom: '24px', outline: 'none'
                }}
              />
              {question.options && question.options.filter(opt => opt && opt.trim() !== '').length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {question.options.filter(opt => opt && opt.trim() !== '').map((opt, i) => {
                    const isSelected = selectedAnswer === opt;
                    return (
                      <button 
                        key={i}
                        onClick={() => !isAnswerChecked && setSelectedAnswer(opt)}
                        disabled={isAnswerChecked}
                        style={{
                          padding: '8px 12px',
                          background: 'transparent',
                          border: isSelected ? '1px solid #22c55e' : '1px solid #3a3a3c',
                          borderRadius: '8px',
                          color: '#9ca3af',
                          fontSize: '13px',
                          cursor: isAnswerChecked ? 'default' : 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >{opt}</button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {question.options && question.options.filter(opt => opt && opt.trim() !== '').map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                let bg = '#1c1c1e';
                let borderColor = '#3a3a3c';
                
                if (isSelected && !isAnswerChecked) {
                  bg = '#14532d';
                  borderColor = '#22c55e';
                } else if (isAnswerChecked) {
                  if (opt === question.correctAnswer) {
                    bg = '#14532d';
                    borderColor = '#22c55e';
                  } else if (isSelected && opt !== question.correctAnswer) {
                    bg = '#3b0000';
                    borderColor = '#ef4444';
                  }
                }

                return (
                  <button 
                    key={i}
                    onClick={() => !isAnswerChecked && setSelectedAnswer(opt)}
                    disabled={isAnswerChecked}
                    style={{
                      width: '100%', padding: '14px 20px', background: bg, border: `1px solid ${borderColor}`,
                      borderRadius: '10px', color: '#fff', fontSize: '15px', cursor: isAnswerChecked ? 'default' : 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', borderWidth: isSelected ? '2px' : '1px'
                    }}
                  >
                    {opt}
                    {isAnswerChecked && opt === question.correctAnswer && <Check size={20} color="#22c55e" />}
                    {isAnswerChecked && isSelected && opt !== question.correctAnswer && <XCircle size={20} color="#ef4444" />}
                  </button>
                )
              })}
            </div>
          )}

          {isAnswerChecked && (
            <div style={{ marginTop: '24px', color: '#9ca3af', fontSize: '13px', fontStyle: 'italic', textAlign: 'center' }}>
              {question.explanation}
            </div>
          )}
        </div>

        {/* Bottom Check Button */}
        <div style={{ padding: '24px 0', marginTop: 'auto' }}>
          <button 
            onClick={handleCheck}
            disabled={!isAnswerChecked && (
              question.type === 'translate_word'
                ? selectedAnswer.trim() === ""
                : !selectedAnswer
            )}
            style={{
              width: '100%', height: '52px', borderRadius: '12px', border: 'none',
              background: (!isAnswerChecked && (question.type === 'translate_word' ? selectedAnswer.trim() === "" : !selectedAnswer)) ? '#1f1f1f' : '#22c55e',
              color: (!isAnswerChecked && (question.type === 'translate_word' ? selectedAnswer.trim() === "" : !selectedAnswer)) ? '#4b4b4b' : '#000',
              fontWeight: '700', fontSize: '16px', cursor: (!isAnswerChecked && (question.type === 'translate_word' ? selectedAnswer.trim() === "" : !selectedAnswer)) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isAnswerChecked ? 'NEXT →' : 'CHECK'}
          </button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!lessonResults) return null;
    const pct = lessonResults.score / (lessonResults.total || 10);
    const stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;

    return (
      <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', paddingBottom: '40px', paddingTop: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{lessonResults.score}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Correct</div>
            </div>
            
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{lessonResults.score}/{lessonResults.total || 10}</div>
              <div style={{ fontSize: '14px', color: '#22c55e', fontWeight: 'bold' }}>+{lessonResults.xpEarned} XP</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{(lessonResults.total || 10) - lessonResults.score}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Incorrect</div>
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>Lesson Complete! 🎉</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3].map(i => (
              <span key={i} style={{ fontSize: '32px', color: i <= stars ? '#facc15' : 'rgba(255,255,255,0.1)' }}>★</span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
          {lessonResults.results.map((r: any, idx: number) => (
            <div key={idx} style={{ 
              background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px',
              borderLeft: `4px solid ${r.isCorrect ? '#22c55e' : '#ef4444'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#9ca3af' }}>Q{idx + 1}</span>
                {r.isCorrect ? <Check size={18} color="#22c55e" /> : <XCircle size={18} color="#ef4444" />}
              </div>
              <div style={{ color: '#fff', fontSize: '15px', marginBottom: '4px' }}>
                Answer: <span style={{ fontWeight: 'bold' }}>{r.correctAnswer}</span>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>{r.explanation}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => startLesson()}
            style={{
              flex: 1, padding: '16px', borderRadius: '12px', background: 'transparent',
              border: '2px solid #22c55e', color: '#22c55e', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
            }}
          >Try Again</button>
          <button 
            onClick={() => setView('setup')}
            style={{
              flex: 1, padding: '16px', borderRadius: '12px', background: '#22c55e',
              border: 'none', color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
            }}
          >New Lesson</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', display: 'flex' }}>
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
          <NavItem icon={<Home size={20} />} label="Home" onClick={() => navigate('/dashboard')} collapsed={isSidebarCollapsed} />
          <NavItem icon={<BookOpen size={20} />} label="Lessons" active collapsed={isSidebarCollapsed} />
          <NavItem icon={<Music size={20} />} label="Library" collapsed={isSidebarCollapsed} />
          <NavItem icon={<BarChart2 size={20} />} label="Statistics" collapsed={isSidebarCollapsed} />
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
          <NavItem icon={<Settings size={20} />} label="Settings" collapsed={isSidebarCollapsed} />
          <NavItem icon={<LogOut size={20} />} label="Logout" onClick={() => { localStorage.clear(); navigate('/login'); }} collapsed={isSidebarCollapsed} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, marginLeft: 'var(--sidebar-width, 0px)', padding: '40px', display: 'flex', flexDirection: 'column', width: '100%', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {view === 'setup' && renderSetup()}
        {view === 'loading' && renderLoading()}
        {view === 'quiz' && renderQuiz()}
        {view === 'results' && renderResults()}
      </main>
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
          main { padding: 24px !important; padding-bottom: 100px !important; padding-top: 80px !important; margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick, collapsed = false }: any) => (
  <div onClick={onClick} style={{ 
    display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '16px', padding: '12px 16px', borderRadius: '12px', 
    background: active ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
    color: active ? '#22c55e' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: active ? '700' : '500',
    justifyContent: collapsed ? 'center' : 'flex-start'
  }}>
    {icon} {!collapsed && <span>{label}</span>}
    {active && !collapsed && <div style={{ marginLeft: 'auto', width: '4px', height: '20px', background: '#22c55e', borderRadius: '2px' }} />}
  </div>
);

export default LessonsPage;
