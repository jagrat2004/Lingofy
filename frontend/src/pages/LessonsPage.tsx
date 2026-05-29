import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, Music, BarChart2, Settings, LogOut, ChevronRight, X, Check, XCircle, Menu, ChevronLeft,
  Star, Trophy, Zap, Lock, Flame, Target, Award
} from 'lucide-react';

type ViewState = 'setup' | 'loading' | 'quiz' | 'results';
type Language = 'hindi' | 'spanish';

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

const BADGES = [
  { id: 'easy', icon: '🎖️', name: 'Easy Explorer', desc: 'Completed Easy Basics', color: '#12d15e', bg: 'rgba(18,209,94,0.15)', level: 'easy' },
  { id: 'intermediate', icon: '🏆', name: 'Inter Scholar', desc: 'Completed Intermediate', color: '#a855f7', bg: 'rgba(168,85,247,0.15)', level: 'intermediate' },
  { id: 'star', icon: '⭐', name: 'Language Star', desc: 'Mastered all 3 Hard Quizzes', color: '#facc15', bg: 'rgba(250,204,21,0.15)', level: 'hard' },
];

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
  const [quizLevel, setQuizLevel] = useState<string>('easy');
  const [roadmapProgress, setRoadmapProgress] = useState<any>(null);
  const [lessonResults, setLessonResults] = useState<any>(null);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number>(0);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [newBadgeEarned, setNewBadgeEarned] = useState<string | null>(null);
  const [confettiPieces, setConfettiPieces] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<any>(null);
  const confettiRef = useRef<any>(null);
  // Ref to always hold latest answers (avoids stale closure in submit)
  const latestAnswersRef = useRef<any[]>([]);

  const getRoadmapNodes = (progress: any) => {
    if (!progress) return [];
    const easyPassed = progress.easyCompleted >= 1;
    const interPassed = progress.intermediateCompleted >= 1;
    const hardCount = progress.hardCompleted;
    return [
      { id: 1, level: 'easy', title: 'Easy Basics', emoji: '🌱', description: 'Master basic vocabulary, common nouns, and greeting structures.', badge: BADGES[0], isUnlocked: true, isCompleted: easyPassed, isActive: progress.currentStage === 'easy', stars: 1 },
      { id: 2, level: 'intermediate', title: 'Intermediate Grammar', emoji: '📚', description: 'Dynamic sentence framing, verb conjugations, and conversational phrases.', badge: BADGES[1], isUnlocked: easyPassed, isCompleted: interPassed, isActive: progress.currentStage === 'intermediate', stars: 2 },
      { id: 3, level: 'hard', title: 'Advanced Quiz 1', emoji: '🔥', description: 'First milestone of advanced lessons. Complex expressions and idioms.', badge: BADGES[2], isUnlocked: interPassed, isCompleted: hardCount >= 1, isActive: progress.currentStage === 'hard' && hardCount === 0, stars: 3 },
      { id: 4, level: 'hard', title: 'Advanced Quiz 2', emoji: '⚡', description: 'Second milestone. Fluent sentence structuring and quick translations.', badge: BADGES[2], isUnlocked: interPassed && hardCount >= 1, isCompleted: hardCount >= 2, isActive: progress.currentStage === 'hard' && hardCount === 1, stars: 3 },
      { id: 5, level: 'hard', title: 'Advanced Quiz 3', emoji: '👑', description: 'Final advanced milestone. Prove your skills and unlock Language Star!', badge: BADGES[2], isUnlocked: interPassed && hardCount >= 2, isCompleted: hardCount >= 3, isActive: progress.currentStage === 'hard' && hardCount === 2, stars: 3 },
    ];
  };

  useEffect(() => {
    if (language && roadmapProgress) {
      const progress = roadmapProgress[language];
      if (progress) {
        const nodes = getRoadmapNodes(progress);
        const activeIdx = nodes.findIndex(n => n.isActive);
        if (activeIdx !== -1) { setSelectedNodeIdx(activeIdx); setQuizLevel(nodes[activeIdx].level); }
        else if (progress.currentStage === 'completed') { setSelectedNodeIdx(4); setQuizLevel('hard'); }
        else { setSelectedNodeIdx(0); setQuizLevel('easy'); }
      }
    }
  }, [language, roadmapProgress]);

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/lessons/progress', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setRoadmapProgress(data); }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchProgress();
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('language') as Language;
    const levelParam = params.get('level');
    if (langParam) {
      setLanguage(langParam);
      if (levelParam) { setQuizLevel(levelParam); startLesson(langParam, undefined, levelParam); }
    }
  }, []);

  const startLesson = async (overrideLang?: any, songIdParam?: string, levelParam?: string) => {
    const activeLang = (typeof overrideLang === 'string' ? overrideLang : null) || language;
    if (!activeLang) return;
    setView('loading');
    const activeLevel = levelParam || quizLevel || 'easy';
    setQuizLevel(activeLevel);
    try {
      const token = localStorage.getItem('token');
      const hasSong = songIdParam || new URLSearchParams(window.location.search).get('songId');
      const endpoint = hasSong ? 'http://localhost:5000/api/lessons/generate-from-song' : 'http://localhost:5000/api/lessons/generate';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ language: activeLang, level: activeLevel, songId: hasSong || undefined })
      });
      if (!res.ok) throw new Error('Failed to generate lesson');
      const data = await res.json();
      setQuestions(data.questions);
      setCurrentQuestionIdx(0);
      setUserAnswers([]);
      latestAnswersRef.current = []; // reset ref on new lesson
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
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedAnswer('');
        setIsAnswerChecked(false);
      } else {
        // Use ref so we always have the latest answers including the last one
        submitLesson(latestAnswersRef.current);
      }
    } else {
      if (!selectedAnswer) return;
      const question = questions[currentQuestionIdx];
      const cleanUser = selectedAnswer.trim().toLowerCase();
      const cleanCorrect = question.correctAnswer.trim().toLowerCase();
      let isCorrect = cleanUser === cleanCorrect;
      if (!isCorrect && language === 'hindi' && question.type === 'translate_word') {
        const matches = [...question.explanation.matchAll(/'([^']+)'/g)].map(m => m[1].toLowerCase().trim());
        if (matches.includes(cleanUser)) isCorrect = true;
      }
      const newAnswer = { questionId: question.id, answer: selectedAnswer, isCorrect };
      const updatedAnswers = [...userAnswers, newAnswer];
      latestAnswersRef.current = updatedAnswers; // sync ref immediately
      setUserAnswers(updatedAnswers);
      setIsAnswerChecked(true);
    }
  };

  const submitLesson = async (answersToSubmit?: any[]) => {
    const finalAnswers = answersToSubmit ?? userAnswers;
    const activeLang = language;

    if (!activeLang) {
      alert('Language not set. Please restart the lesson.');
      setView('setup');
      return;
    }

    setView('loading');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/lessons/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ language: activeLang, level: quizLevel, questions, userAnswers: finalAnswers })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${res.status}`);
      }
      const data = await res.json();
      setLessonResults(data);
      await fetchProgress();

      const passed = data.score >= 6;
      if (passed) {
        // Show celebration popup before results
        if (data.badgeEarned) setNewBadgeEarned(data.badgeEarned);
        setCelebrationData(data);
        setShowCelebration(true);
        launchConfetti();
      } else {
        setView('results');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(`Couldn't submit lesson: ${error.message}`);
      setView('setup');
    }
  };

  const launchConfetti = () => {
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['#12d15e', '#facc15', '#a855f7', '#ef4444', '#3b82f6', '#f97316'][Math.floor(Math.random() * 6)],
      delay: Math.random() * 1.5,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
    setConfettiPieces(pieces);
    setTimeout(() => setConfettiPieces([]), 4000);
  };

  const exitLesson = () => {
    if (view === 'quiz') { if (window.confirm("Leave lesson? Your progress will be lost.")) setView('setup'); }
    else setView('setup');
  };

  const renderCelebration = () => {
    if (!showCelebration || !celebrationData) return null;
    const score = celebrationData.score;
    const total = celebrationData.total || 10;
    const xp = celebrationData.xpEarned;
    const pct = score / total;
    const stars = pct >= 0.8 ? 3 : pct >= 0.6 ? 2 : 1;
    const levelColors: Record<string, string> = { easy: '#12d15e', intermediate: '#a855f7', hard: '#ef4444' };
    const levelColor = levelColors[quizLevel] || '#12d15e';
    const levelEmojis: Record<string, string> = { easy: '🌱', intermediate: '📚', hard: '🔥' };
    const levelEmoji = levelEmojis[quizLevel] || '🏆';
    const badgeInfo = newBadgeEarned
      ? BADGES.find(b => b.level === quizLevel) || null
      : null;

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fade-in 0.3s ease'
      }}>
        {/* Confetti layer */}
        {confettiPieces.map(p => (
          <div key={p.id} style={{
            position: 'fixed', top: '-20px', left: `${p.x}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall 3s ${p.delay}s ease-in forwards`,
            transform: `rotate(${p.rotation}deg)`, pointerEvents: 'none'
          }} />
        ))}

        {/* Modal card */}
        <div style={{
          background: 'linear-gradient(145deg, #0d0d0d 0%, #1a1a1a 100%)',
          border: `1px solid ${levelColor}30`,
          borderRadius: '32px',
          padding: '48px 40px',
          maxWidth: '460px',
          width: '90%',
          textAlign: 'center',
          boxShadow: `0 0 80px ${levelColor}25, 0 32px 80px rgba(0,0,0,0.6)`,
          position: 'relative',
          overflow: 'hidden',
          animation: 'pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1)'
        }}>
          {/* Glowing top ring */}
          <div style={{
            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
            width: '200px', height: '200px', borderRadius: '50%',
            background: `radial-gradient(circle, ${levelColor}20 0%, transparent 70%)`,
            pointerEvents: 'none'
          }} />

          {/* Bouncing trophy + emoji */}
          <div style={{ fontSize: '72px', marginBottom: '8px', animation: 'bounce-in 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}>
            🏆
          </div>
          <div style={{ fontSize: '28px', marginBottom: '20px', animation: 'bounce-in 0.5s ease 0.3s both' }}>
            {levelEmoji}
          </div>

          <h2 style={{
            fontSize: '30px', fontWeight: '900', margin: '0 0 6px 0',
            background: `linear-gradient(135deg, #fff 0%, ${levelColor} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'fade-in 0.4s ease 0.2s both'
          }}>
            Stage Passed! 🎉
          </h2>
          <p style={{ opacity: 0.5, fontSize: '14px', margin: '0 0 28px 0', animation: 'fade-in 0.4s ease 0.3s both' }}>
            {pct >= 0.9 ? 'Absolutely brilliant! Perfect near-score!' : pct >= 0.8 ? 'Excellent work, keep it up!' : 'Well done! You cleared the threshold!'}
          </p>

          {/* Score circle */}
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%', margin: '0 auto 24px',
            background: `conic-gradient(${levelColor} ${pct * 360}deg, rgba(255,255,255,0.06) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 32px ${levelColor}40`,
            animation: 'fade-in 0.5s ease 0.4s both', position: 'relative'
          }}>
            <div style={{
              width: '86px', height: '86px', borderRadius: '50%',
              background: '#111', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>{score}/{total}</div>
              <div style={{ fontSize: '11px', color: levelColor, fontWeight: '700' }}>+{xp} XP</div>
            </div>
          </div>

          {/* Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
            {[1,2,3].map(i => (
              <span key={i} style={{
                fontSize: '36px',
                opacity: i <= stars ? 1 : 0.12,
                filter: i <= stars ? 'drop-shadow(0 0 8px #facc15)' : 'grayscale(1)',
                animation: i <= stars ? `star-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.5 + i * 0.15}s both` : 'none'
              }}>⭐</span>
            ))}
          </div>

          {/* Badge earned reveal */}
          {badgeInfo && (
            <div style={{
              background: `${badgeInfo.bg}`, border: `1px solid ${badgeInfo.color}40`,
              borderRadius: '16px', padding: '14px 20px', marginBottom: '24px',
              display: 'flex', alignItems: 'center', gap: '14px',
              animation: 'pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.8s both'
            }}>
              <span style={{ fontSize: '36px', filter: `drop-shadow(0 0 12px ${badgeInfo.color})` }}>{badgeInfo.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>🏅 New Badge Unlocked!</div>
                <div style={{ fontWeight: '800', fontSize: '16px', color: badgeInfo.color }}>{badgeInfo.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.55, marginTop: '2px' }}>{badgeInfo.desc}</div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => { setShowCelebration(false); setView('setup'); }}
              style={{
                flex: 1, padding: '14px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
              }}
              className="btn-hover"
            >
              Back to Map
            </button>
            <button
              onClick={() => { setShowCelebration(false); setView('results'); }}
              style={{
                flex: 1, padding: '14px', borderRadius: '14px',
                background: levelColor, border: 'none',
                color: '#000', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: `0 8px 24px ${levelColor}40`
              }}
              className="btn-hover"
            >
              View Results →
            </button>
          </div>
        </div>

        <style>{`
          @keyframes pop-in { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes bounce-in { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes star-pop { 0% { transform: scale(0) rotate(-30deg); opacity: 0; } 70% { transform: scale(1.3) rotate(5deg); } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
          @keyframes confetti-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
          @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  };

  // ─── RENDER HELPERS ───────────────────────────────────────────────

  const renderSetup = () => {
    if (!language) {
      return (
        <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', paddingTop: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
            <h1 style={{ fontSize: '40px', fontWeight: '800', margin: '0 0 12px 0', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Choose Your Language Journey
            </h1>
            <p style={{ opacity: 0.5, fontSize: '16px', margin: 0 }}>Select a language to view your interactive roadmap and start earning badges</p>
          </div>

          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { lang: 'hindi' as Language, flag: '🇮🇳', name: 'Hindi', sub: 'हिन्दी', level: 'N3 Level', color: '#ff9933', glow: 'rgba(255,153,51,0.2)' },
              { lang: 'spanish' as Language, flag: '🇪🇸', name: 'Spanish', sub: 'Español', level: 'A2 Level', color: '#c60b1e', glow: 'rgba(198,11,30,0.2)' },
            ].map(({ lang, flag, name, sub, level, color, glow }) => {
              const prog = roadmapProgress?.[lang];
              const completedCount = prog ? (prog.easyCompleted >= 1 ? 1 : 0) + (prog.intermediateCompleted >= 1 ? 1 : 0) + Math.min(prog.hardCompleted, 3) : 0;
              const totalNodes = 5;
              return (
                <div
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className="lang-card-hover"
                  style={{
                    width: '280px', padding: '40px 28px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '28px',
                    cursor: 'pointer', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                  }}
                >
                  <div style={{ fontSize: '72px', filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.12))', transition: 'transform 0.3s' }}>{flag}</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '800', fontSize: '24px', color: '#fff' }}>{name}</div>
                    <div style={{ fontSize: '14px', color, fontWeight: '600', marginTop: '2px' }}>{sub}</div>
                    <div style={{ fontSize: '12px', opacity: 0.4, marginTop: '4px' }}>{level}</div>
                  </div>
                  {prog && (
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.5, marginBottom: '6px' }}>
                        <span>Progress</span><span>{completedCount}/{totalNodes} stages</span>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(completedCount / totalNodes) * 100}%`, background: `linear-gradient(90deg, ${color}, #12d15e)`, borderRadius: '100px', transition: 'width 0.8s ease' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                        {BADGES.map((b, i) => {
                          const earned = i === 0 ? prog.easyCompleted >= 1 : i === 1 ? prog.intermediateCompleted >= 1 : prog.hardCompleted >= 3;
                          return <span key={b.id} style={{ fontSize: '20px', opacity: earned ? 1 : 0.15, filter: earned ? 'none' : 'grayscale(1)', transition: 'all 0.3s' }}>{b.icon}</span>;
                        })}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: '8px', background: color, color: '#fff', padding: '10px 24px', borderRadius: '100px', fontWeight: '700', fontSize: '14px', opacity: 0.9 }}>
                    {prog ? 'Continue Journey →' : 'Start Journey →'}
                  </div>
                </div>
              );
            })}
          </div>
          <style>{`
            .lang-card-hover:hover { transform: translateY(-10px) scale(1.02); background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.15) !important; box-shadow: 0 24px 60px rgba(0,0,0,0.5) !important; }
          `}</style>
        </div>
      );
    }

    const progress = roadmapProgress?.[language];
    const nodes = getRoadmapNodes(progress);
    const selectedNode = nodes[selectedNodeIdx];
    const totalXP = progress ? (progress.easyCompleted * 100) + (progress.intermediateCompleted * 150) + (progress.hardCompleted * 200) : 0;
    const totalCompleted = progress ? (progress.easyCompleted >= 1 ? 1 : 0) + (progress.intermediateCompleted >= 1 ? 1 : 0) + Math.min(progress.hardCompleted || 0, 3) : 0;
    const streak = Math.floor(Math.random() * 7) + 1; // TODO: pull from API

    return (
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* ── Top Header ─────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setLanguage(null)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              className="btn-hover"
            >
              ← Languages
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '36px' }}>{language === 'hindi' ? '🇮🇳' : '🇪🇸'}</span>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, textTransform: 'capitalize' }}>{language} Journey</h1>
                <p style={{ margin: 0, fontSize: '13px', opacity: 0.5 }}>
                  {progress?.currentStage === 'completed' ? '🏆 All stages mastered!' : `Current: ${(progress?.currentStage || 'easy').charAt(0).toUpperCase() + (progress?.currentStage || 'easy').slice(1)} Stage`}
                </p>
              </div>
            </div>
          </div>

          {/* XP & Streak pills */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="#facc15" fill="#facc15" />
              <span style={{ color: '#facc15', fontWeight: '800', fontSize: '14px' }}>{totalXP} XP</span>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={14} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '14px' }}>{streak} day streak</span>
            </div>
            <div style={{ background: 'rgba(18,209,94,0.1)', border: '1px solid rgba(18,209,94,0.2)', padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={14} color="#12d15e" />
              <span style={{ color: '#12d15e', fontWeight: '800', fontSize: '14px' }}>{totalCompleted}/5 Done</span>
            </div>
          </div>
        </div>

        {/* ── Stats Row ──────────────────────── */}
        {progress && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Easy Quizzes', value: progress.easyCompleted, max: 1, color: '#12d15e', icon: '🌱', passed: progress.easyCompleted >= 1 },
              { label: 'Intermediate', value: progress.intermediateCompleted, max: 1, color: '#a855f7', icon: '📚', passed: progress.intermediateCompleted >= 1 },
              { label: 'Hard Quizzes', value: progress.hardCompleted, max: 3, color: '#ef4444', icon: '🔥', passed: progress.hardCompleted >= 3 },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${stat.passed ? stat.color + '40' : 'rgba(255,255,255,0.05)'}`, borderRadius: '20px', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '3px', width: `${(stat.value / stat.max) * 100}%`, background: stat.color, borderRadius: '0 0 4px 4px', transition: 'width 0.8s ease' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', opacity: 0.4, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{stat.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: stat.passed ? stat.color : '#fff' }}>{stat.value}<span style={{ fontSize: '16px', opacity: 0.4 }}>/{stat.max}</span></div>
                  </div>
                  <div style={{ fontSize: '28px', opacity: stat.passed ? 1 : 0.2 }}>{stat.icon}</div>
                </div>
                {stat.passed && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: stat.color, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> Passed!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Main split: Roadmap + Detail Panel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }} className="lessons-main-grid">
          
          {/* Left: Winding Roadmap */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '28px', padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: '560px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 48px 0', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '2px', alignSelf: 'flex-start' }}>LEARNING ROADMAP</h2>

            {/* Connector Line */}
            <div style={{ position: 'absolute', top: '120px', bottom: '60px', width: '3px', background: 'rgba(255,255,255,0.06)', zIndex: 1, left: '50%', transform: 'translateX(-50%)' }}>
              {progress && (() => {
                const completedPct = nodes.filter(n => n.isCompleted).length;
                return <div style={{ width: '100%', height: `${(completedPct / 4) * 100}%`, background: 'linear-gradient(180deg, #12d15e, #a855f7)', boxShadow: '0 0 12px rgba(18,209,94,0.4)', transition: 'height 0.8s ease', borderRadius: '4px' }} />;
              })()}
            </div>

            {/* Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', width: '100%', position: 'relative', padding: '0 24px' }}>
              {nodes.map((node, index) => {
                const isSelected = selectedNodeIdx === index;
                const isHovered = hoveredNode === index;
                const offsets = ['0px', '-50px', '0px', '50px', '0px'];
                const offset = offsets[index];

                let nodeColor = 'rgba(255,255,255,0.04)';
                let nodeBorder = '2px solid rgba(255,255,255,0.08)';
                let textColor = 'rgba(255,255,255,0.25)';
                let glow = 'none';
                let levelColor = '#12d15e';
                if (node.level === 'intermediate') levelColor = '#a855f7';
                if (node.level === 'hard') levelColor = '#ef4444';

                if (node.isCompleted) { nodeColor = levelColor; nodeBorder = `2px solid ${levelColor}`; textColor = '#000'; glow = `0 0 24px ${levelColor}50`; }
                else if (node.isActive) { nodeColor = '#111'; nodeBorder = `3px solid ${levelColor}`; textColor = levelColor; glow = `0 0 28px ${levelColor}60`; }
                else if (!node.isUnlocked) { nodeColor = 'rgba(255,255,255,0.01)'; nodeBorder = '2px dashed rgba(255,255,255,0.06)'; }
                if (isSelected || isHovered) { glow = `0 0 32px ${levelColor}80`; nodeBorder = `3px solid ${levelColor}`; }

                return (
                  <div
                    key={node.id}
                    onClick={() => { if (node.isUnlocked) { setSelectedNodeIdx(index); setQuizLevel(node.level); } }}
                    onMouseEnter={() => setHoveredNode(index)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, transform: `translateX(${offset})`, transition: 'transform 0.3s ease', cursor: node.isUnlocked ? 'pointer' : 'not-allowed' }}
                  >
                    {/* Node Circle */}
                    <div style={{
                      width: '68px', height: '68px', borderRadius: '50%', background: nodeColor, border: nodeBorder,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                      boxShadow: glow, transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      transform: (isSelected || isHovered) && node.isUnlocked ? 'scale(1.15)' : 'scale(1)'
                    }}>
                      {node.isCompleted ? <Check size={28} color={textColor} strokeWidth={3} /> : !node.isUnlocked ? <Lock size={20} color="rgba(255,255,255,0.15)" /> : node.emoji}
                    </div>

                    {/* Label */}
                    <div style={{
                      position: 'absolute', [index % 2 === 0 ? 'left' : 'right']: '86px',
                      width: '200px', textAlign: index % 2 === 0 ? 'left' : 'right', pointerEvents: 'none'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: node.isUnlocked ? '#fff' : 'rgba(255,255,255,0.2)', transition: 'color 0.3s', marginBottom: '2px' }}>
                        {node.title}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: node.isCompleted ? '#12d15e' : node.isActive ? '#facc15' : 'rgba(255,255,255,0.2)' }}>
                        {node.isCompleted ? '✓ Completed' : node.isActive ? '▶ Active' : !node.isUnlocked ? '🔒 Locked' : '○ Unlocked'}
                      </div>
                      {/* Star rating */}
                      <div style={{ display: 'flex', gap: '2px', marginTop: '4px', justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end' }}>
                        {[1,2,3].map(s => <span key={s} style={{ fontSize: '10px', color: s <= node.stars ? '#facc15' : 'rgba(255,255,255,0.1)' }}>★</span>)}
                      </div>
                    </div>

                    {/* Active Pulse Ring */}
                    {node.isActive && (
                      <div style={{ position: 'absolute', width: '88px', height: '88px', borderRadius: '50%', border: `2px solid ${levelColor}`, animation: 'pulse-ring 2s infinite', opacity: 0.4, pointerEvents: 'none' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detail + Badges Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Selected Node Card */}
            {selectedNode && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{
                    background: selectedNode.level === 'easy' ? 'rgba(18,209,94,0.12)' : selectedNode.level === 'intermediate' ? 'rgba(168,85,247,0.12)' : 'rgba(239,68,68,0.12)',
                    color: selectedNode.level === 'easy' ? '#12d15e' : selectedNode.level === 'intermediate' ? '#a855f7' : '#ef4444',
                    padding: '5px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {selectedNode.level} Stage
                  </span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[1,2,3].map(s => <span key={s} style={{ fontSize: '14px', color: s <= selectedNode.stars ? '#facc15' : 'rgba(255,255,255,0.1)' }}>★</span>)}
                  </div>
                </div>

                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{selectedNode.emoji}</div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px 0' }}>{selectedNode.title}</h2>
                <p style={{ opacity: 0.6, fontSize: '13px', lineHeight: '1.6', margin: '0 0 20px 0' }}>{selectedNode.description}</p>

                {/* Badge preview */}
                <div style={{ background: selectedNode.badge.earned ? `${selectedNode.badge.bg}` : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedNode.badge.earned ? selectedNode.badge.color + '40' : 'rgba(255,255,255,0.05)'}`, borderRadius: '16px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', transition: 'all 0.3s' }}>
                  <div style={{ fontSize: '32px', filter: selectedNode.badge.earned ? 'none' : 'grayscale(1)', opacity: selectedNode.badge.earned ? 1 : 0.2, transition: 'all 0.3s' }}>{selectedNode.badge.icon}</div>
                  <div>
                    <div style={{ fontSize: '10px', opacity: 0.4, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Badge Target</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: selectedNode.badge.earned ? selectedNode.badge.color : '#fff' }}>{selectedNode.badge.name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>{selectedNode.badge.earned ? '✓ Earned!' : 'Complete stage to unlock'}</div>
                  </div>
                </div>

                <button
                  onClick={() => startLesson(language, undefined, selectedNode.level)}
                  disabled={!selectedNode.isUnlocked}
                  style={{
                    width: '100%', background: selectedNode.isUnlocked ? (selectedNode.level === 'easy' ? '#12d15e' : selectedNode.level === 'intermediate' ? '#a855f7' : '#ef4444') : 'rgba(255,255,255,0.05)',
                    color: selectedNode.isUnlocked ? '#000' : 'rgba(255,255,255,0.2)', border: 'none', padding: '16px', borderRadius: '16px',
                    fontWeight: '800', fontSize: '15px', cursor: selectedNode.isUnlocked ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: selectedNode.isUnlocked ? '0 8px 24px rgba(0,0,0,0.3)' : 'none', transition: 'all 0.3s'
                  }}
                  className={selectedNode.isUnlocked ? 'btn-hover' : ''}
                >
                  {selectedNode.isUnlocked ? (
                    <><BookOpen size={18} /> {selectedNode.isCompleted ? 'Practice Again' : `Start ${selectedNode.title}`} <ChevronRight size={16} /></>
                  ) : (
                    <><Lock size={16} /> Complete previous stage first</>
                  )}
                </button>
              </div>
            )}

            {/* Badges Shelf */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Award size={16} color="#facc15" />
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>My Badges</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {BADGES.map((badge, i) => {
                  const earned = i === 0 ? (progress?.easyCompleted >= 1) : i === 1 ? (progress?.intermediateCompleted >= 1) : (progress?.hardCompleted >= 3);
                  return (
                    <div key={badge.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                      background: earned ? badge.bg : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${earned ? badge.color + '30' : 'rgba(255,255,255,0.04)'}`,
                      borderRadius: '14px', transition: 'all 0.3s'
                    }}>
                      <span style={{ fontSize: '28px', filter: earned ? 'none' : 'grayscale(1)', opacity: earned ? 1 : 0.15, transition: 'all 0.4s', transform: earned ? 'scale(1)' : 'scale(0.8)' }}>{badge.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: earned ? badge.color : 'rgba(255,255,255,0.3)' }}>{badge.name}</div>
                        <div style={{ fontSize: '11px', opacity: 0.4, marginTop: '2px' }}>{badge.desc}</div>
                      </div>
                      {earned && (
                        <div style={{ background: badge.color, borderRadius: '100px', padding: '3px 8px', fontSize: '10px', fontWeight: '800', color: '#000' }}>EARNED</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.5; } 70% { transform: scale(1.3); opacity: 0; } 100% { transform: scale(1.3); opacity: 0; } }
          .lessons-main-grid { @media (max-width: 900px) { grid-template-columns: 1fr !important; } }
          .btn-hover:hover { filter: brightness(1.12); transform: translateY(-2px); }
        `}</style>
      </div>
    );
  };

  const renderLoading = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '24px' }}>
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <img src="/Logo-1.png" alt="Loading" style={{ width: '80px', position: 'absolute', top: '10px', left: '10px', animation: 'float 2s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#12d15e', animation: 'spin 1s linear infinite' }} />
      </div>
      <div style={{ fontSize: '18px', color: '#9ca3af', fontWeight: '600' }}>Preparing your lesson...</div>
      <div style={{ fontSize: '13px', opacity: 0.4 }}>Generating AI-powered questions</div>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  const renderQuiz = () => {
    const question = questions[currentQuestionIdx];
    if (!question) return null;
    const progressPct = (currentQuestionIdx / (questions.length || 10)) * 100;
    const typeColor = question.type === 'fill_blank' ? '#22c55e' : '#1a73e8';
    const typeLabel = question.type === 'multiple_choice' ? 'Choose the correct answer' : question.type === 'fill_blank' ? 'Complete the sentence' : question.type === 'translate_word' ? 'Translate this word' : 'Match the meaning';

    return (
      <div style={{ maxWidth: '620px', width: '100%', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <X size={22} color="#6b7280" cursor="pointer" onClick={exitLesson} />
          <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #12d15e, #22c55e)', borderRadius: '100px', transition: 'width 0.4s ease', boxShadow: '0 0 8px rgba(18,209,94,0.4)' }} />
          </div>
          <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700', minWidth: '45px', textAlign: 'right' }}>{currentQuestionIdx + 1}/{questions.length}</span>
        </div>

        {/* Pass threshold info bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px', padding: '10px 16px', marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🎯</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
              Pass requirement: <span style={{ color: '#facc15' }}>6 or more correct</span> out of {questions.length}
            </span>
          </div>
          {/* Live correct count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', opacity: 0.4 }}>Correct so far:</span>
            <span style={{
              fontWeight: '800', fontSize: '14px',
              color: userAnswers.filter((a: any) => a.isCorrect).length >= 6 ? '#22c55e' : 'rgba(255,255,255,0.6)'
            }}>
              {userAnswers.filter((a: any) => a.isCorrect).length}
            </span>
          </div>
        </div>

        {/* Question type badge */}
        <div style={{ fontSize: '11px', fontWeight: '800', color: typeColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: typeColor }} />
          {typeLabel}
        </div>

        {/* Question bubble */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', marginBottom: '32px' }}>
          <img src="/Logo-1.png" alt="Bot" style={{ width: '48px', height: '48px', flexShrink: 0 }} />
          <div style={{ background: typeColor, color: '#fff', padding: '20px 24px', borderRadius: '20px', borderBottomLeftRadius: '4px', fontSize: '16px', fontWeight: '500', lineHeight: '1.5', position: 'relative', flex: 1 }}>
            {question.questionText}
            <div style={{ position: 'absolute', bottom: '12px', left: '-10px', width: 0, height: 0, borderTop: '10px solid transparent', borderRight: `10px solid ${typeColor}`, borderBottom: '10px solid transparent' }} />
          </div>
        </div>

        {/* Target word display */}
        {(question.type === 'translate_word' || question.type === 'match_meaning') && (
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '36px', fontWeight: '800', padding: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', display: 'inline-block', color: '#fff' }}>
              {question.targetWord}
            </div>
          </div>
        )}

        {/* Fill-blank sentence */}
        {question.type === 'fill_blank' && question.sentence && (() => {
          const match = question.sentence.match(/^(.*?)\s*\((.*?)\)\s*$/);
          const foreignSentence = match ? match[1] : question.sentence;
          const translation = match ? match[2] : '';
          const parts = foreignSentence.split('___');
          return (
            <div style={{ textAlign: 'center', marginBottom: '28px', padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff', lineHeight: '1.8' }}>
                {parts.map((p, idx) => (
                  <span key={idx}>{p}{idx < parts.length - 1 && <span style={{ borderBottom: '3px solid #22c55e', color: '#22c55e', padding: '0 8px', fontWeight: '800' }}>___</span>}</span>
                ))}
              </div>
              {translation && <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '14px', marginTop: '8px' }}>({translation})</div>}
            </div>
          );
        })()}

        {/* Answer area */}
        <div style={{ flex: 1 }}>
          {question.type === 'translate_word' ? (
            <div>
              <input
                type="text" value={selectedAnswer}
                onChange={e => !isAnswerChecked && setSelectedAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                disabled={isAnswerChecked}
                placeholder="Type your answer here..."
                style={{ width: '100%', padding: '16px 20px', background: '#1a1a1a', border: `1px solid ${isAnswerChecked ? (userAnswers[userAnswers.length - 1]?.isCorrect ? '#22c55e' : '#ef4444') : '#2a2a2a'}`, borderRadius: '14px', color: '#fff', fontSize: '16px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              />
              {question.options?.filter(o => o?.trim()).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {question.options.filter(o => o?.trim()).map((opt, i) => (
                    <button key={i} onClick={() => !isAnswerChecked && setSelectedAnswer(opt)} disabled={isAnswerChecked}
                      style={{ padding: '10px 14px', background: selectedAnswer === opt ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedAnswer === opt ? '#22c55e' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', color: selectedAnswer === opt ? '#22c55e' : '#9ca3af', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {question.options?.filter(o => o?.trim()).map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                let bg = 'rgba(255,255,255,0.03)'; let border = 'rgba(255,255,255,0.08)'; let color = '#fff';
                if (isSelected && !isAnswerChecked) { bg = 'rgba(34,197,94,0.1)'; border = '#22c55e'; color = '#fff'; }
                else if (isAnswerChecked) {
                  if (opt === question.correctAnswer) { bg = 'rgba(34,197,94,0.12)'; border = '#22c55e'; color = '#22c55e'; }
                  else if (isSelected) { bg = 'rgba(239,68,68,0.1)'; border = '#ef4444'; color = '#ef4444'; }
                }
                return (
                  <button key={i} onClick={() => !isAnswerChecked && setSelectedAnswer(opt)} disabled={isAnswerChecked}
                    style={{ width: '100%', padding: '15px 20px', background: bg, border: `2px solid ${border}`, borderRadius: '14px', color, fontSize: '15px', cursor: isAnswerChecked ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', fontWeight: isSelected ? '700' : '500', textAlign: 'left' }}>
                    <span>{opt}</span>
                    {isAnswerChecked && opt === question.correctAnswer && <Check size={18} color="#22c55e" strokeWidth={3} />}
                    {isAnswerChecked && isSelected && opt !== question.correctAnswer && <XCircle size={18} color="#ef4444" />}
                  </button>
                );
              })}
            </div>
          )}

          {isAnswerChecked && (
            <div style={{ marginTop: '20px', padding: '14px 18px', background: userAnswers[userAnswers.length-1]?.isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${userAnswers[userAnswers.length-1]?.isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '12px', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', lineHeight: '1.5' }}>
              💡 {question.explanation}
            </div>
          )}
        </div>

        {/* Check / Next button */}
        <div style={{ paddingTop: '24px' }}>
          <button
            onClick={handleCheck}
            disabled={!isAnswerChecked && (question.type === 'translate_word' ? !selectedAnswer.trim() : !selectedAnswer)}
            style={{
              width: '100%', height: '54px', borderRadius: '14px', border: 'none',
              background: (!isAnswerChecked && (question.type === 'translate_word' ? !selectedAnswer.trim() : !selectedAnswer)) ? 'rgba(255,255,255,0.05)' : isAnswerChecked ? '#22c55e' : '#1a73e8',
              color: (!isAnswerChecked && (question.type === 'translate_word' ? !selectedAnswer.trim() : !selectedAnswer)) ? 'rgba(255,255,255,0.2)' : '#000',
              fontWeight: '800', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px'
            }}
          >
            {isAnswerChecked ? 'CONTINUE →' : 'CHECK ANSWER'}
          </button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!lessonResults) return null;
    const pct = lessonResults.score / (lessonResults.total || 10);
    const stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
    const passed = pct >= 0.5;

    return (
      <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto', padding: '40px 0', position: 'relative' }}>
        {/* Confetti */}
        {confettiPieces.map(p => (
          <div key={p.id} style={{ position: 'fixed', top: '-20px', left: `${p.x}%`, width: `${p.size}px`, height: `${p.size}px`, background: p.color, borderRadius: '2px', animation: `confetti-fall 2.5s ${p.delay}s ease-in forwards`, transform: `rotate(${p.rotation}deg)`, pointerEvents: 'none', zIndex: 999 }} />
        ))}

        {/* Score circle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `3px solid ${passed ? '#22c55e' : '#ef4444'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>{lessonResults.score}/{lessonResults.total || 10}</div>
              <div style={{ fontSize: '13px', color: passed ? '#22c55e' : '#ef4444', fontWeight: '700' }}>+{lessonResults.xpEarned} XP</div>
            </div>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0' }}>{passed ? 'Stage Passed! 🎉' : 'Not Passed This Time'}</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[1,2,3].map(i => <span key={i} style={{ fontSize: '32px', filter: i <= stars ? 'none' : 'grayscale(1)', opacity: i <= stars ? 1 : 0.15, transition: 'all 0.5s', transitionDelay: `${i * 0.2}s` }}>⭐</span>)}
          </div>

          {/* Pass / Fail result banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`,
            borderRadius: '14px', padding: '14px 20px', width: '100%', boxSizing: 'border-box',
            animation: 'fade-in 0.4s ease'
          }}>
            <span style={{ fontSize: '28px' }}>{passed ? '✅' : '❌'}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '800', fontSize: '15px', color: passed ? '#22c55e' : '#ef4444' }}>
                {passed
                  ? `You scored ${lessonResults.score}/${lessonResults.total || 10} — Stage unlocked!`
                  : `You scored ${lessonResults.score}/${lessonResults.total || 10} — Need 6+ to pass`
                }
              </div>
              <div style={{ fontSize: '12px', opacity: 0.55, marginTop: '3px' }}>
                {passed
                  ? 'Great work! Your progress has been saved and the next stage is now unlocked.'
                  : 'You need at least 6 correct answers to pass this stage. Give it another shot!'}
              </div>
            </div>
          </div>
        </div>

        {/* New badge earned celebration */}
        {newBadgeEarned && (
          <div style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '32px', animation: 'fade-in 0.5s ease' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
            <div style={{ color: '#facc15', fontWeight: '800', fontSize: '18px', marginBottom: '4px' }}>New Badge Unlocked!</div>
            <div style={{ opacity: 0.6, fontSize: '14px' }}>{newBadgeEarned}</div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#22c55e' }}>{lessonResults.score}</div>
            <div style={{ fontSize: '12px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Correct</div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>{(lessonResults.total || 10) - lessonResults.score}</div>
            <div style={{ fontSize: '12px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Incorrect</div>
          </div>
        </div>

        {/* Results breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
          {lessonResults.results?.map((r: any, idx: number) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 18px', borderRadius: '14px', borderLeft: `4px solid ${r.isCorrect ? '#22c55e' : '#ef4444'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: '700' }}>Q{idx + 1}</span>
                  {r.isCorrect ? <Check size={14} color="#22c55e" /> : <XCircle size={14} color="#ef4444" />}
                </div>
                <div style={{ color: '#fff', fontSize: '13px', marginBottom: '4px' }}>Correct: <strong style={{ color: r.isCorrect ? '#22c55e' : '#fff' }}>{r.correctAnswer}</strong></div>
                <div style={{ color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }}>{r.explanation}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '14px' }}>
          <button onClick={() => startLesson()} style={{ flex: 1, padding: '16px', borderRadius: '14px', background: 'transparent', border: '2px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }} className="btn-hover">
            Try Again
          </button>
          <button onClick={() => { setNewBadgeEarned(null); setView('setup'); }} style={{ flex: 1, padding: '16px', borderRadius: '14px', background: '#22c55e', border: 'none', color: '#000', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }} className="btn-hover">
            Back to Map →
          </button>
        </div>

        <style>{`
          @keyframes confetti-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
          @keyframes fade-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    );
  };

  // ─── MAIN RENDER ────────────────────────────────────────────────

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif', display: 'flex' }}>
      <button onClick={() => setIsMobileOpen(true)} className="mobile-toggle" style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 90, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', cursor: 'pointer', display: 'none', color: '#fff', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
        <Menu size={20} />
      </button>

      {isMobileOpen && <div onClick={() => setIsMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 95 }} />}

      <aside className={`desktop-sidebar ${isMobileOpen ? 'sidebar-open' : ''}`} style={{ width: isSidebarCollapsed ? '88px' : '280px', background: '#000', borderRight: '1px solid rgba(255,255,255,0.05)', padding: isSidebarCollapsed ? '40px 12px' : '40px 24px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', marginBottom: '48px' }}>
          {!isSidebarCollapsed && <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><img src="/Logo-1.png" alt="Logo" style={{ width: '40px' }} /><span style={{ fontSize: '24px', fontWeight: '800' }}>Lingofy</span></div>}
          {isSidebarCollapsed && <img src="/Logo-1.png" alt="Logo" style={{ width: '40px' }} />}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="desktop-toggle-btn" style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '8px' }}>
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button onClick={() => setIsMobileOpen(false)} className="mobile-close-btn" style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'none', alignItems: 'center', padding: '6px', borderRadius: '8px' }}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <NavItem icon={<Home size={20} />} label="Home" onClick={() => navigate('/dashboard?tab=home')} collapsed={isSidebarCollapsed} />
          <NavItem icon={<BookOpen size={20} />} label="Lessons" active collapsed={isSidebarCollapsed} />
          <NavItem icon={<Music size={20} />} label="Library" onClick={() => navigate('/dashboard?tab=library')} collapsed={isSidebarCollapsed} />
          <NavItem icon={<BarChart2 size={20} />} label="Statistics" onClick={() => navigate('/dashboard?tab=statistics')} collapsed={isSidebarCollapsed} />
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
          <NavItem icon={<Settings size={20} />} label="Settings" collapsed={isSidebarCollapsed} />
          <NavItem icon={<LogOut size={20} />} label="Logout" onClick={() => { localStorage.clear(); navigate('/login'); }} collapsed={isSidebarCollapsed} />
        </div>
      </aside>

      <main className="main-content" style={{ flex: 1, marginLeft: 'var(--sidebar-width, 0px)', padding: '40px', display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        {view === 'setup' && renderSetup()}
        {view === 'loading' && renderLoading()}
        {view === 'quiz' && renderQuiz()}
        {view === 'results' && renderResults()}
      </main>

      {/* Celebration overlay — renders above everything on pass */}
      {renderCelebration()}


      <style>{`
        :root { --sidebar-width: ${isSidebarCollapsed ? '88px' : '280px'}; }
        .desktop-sidebar { transition: width 0.3s cubic-bezier(0.4,0,0.2,1), padding 0.3s ease; }
        .main-content { transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1); }
        .btn-hover { transition: all 0.2s; }
        .btn-hover:hover { filter: brightness(1.1); transform: translateY(-1px); }
        @media (max-width: 1024px) {
          :root { --sidebar-width: 0px; }
          .desktop-sidebar { transform: translateX(${isMobileOpen ? '0' : '-100%'}); display: flex !important; width: 280px !important; padding: 40px 24px !important; transition: transform 0.3s cubic-bezier(0.4,0,0.2,1) !important; }
          .mobile-toggle { display: flex !important; }
          .desktop-toggle-btn { display: none !important; }
          .mobile-close-btn { display: flex !important; }
          main { padding: 24px !important; padding-bottom: 100px !important; padding-top: 80px !important; margin-left: 0 !important; }
        }
        @media (max-width: 900px) {
          .lessons-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick, collapsed = false }: any) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '16px', padding: '12px 16px', borderRadius: '12px', background: active ? 'rgba(34,197,94,0.1)' : 'transparent', color: active ? '#22c55e' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: active ? '700' : '500', justifyContent: collapsed ? 'center' : 'flex-start' }}>
    {icon}{!collapsed && <span>{label}</span>}
    {active && !collapsed && <div style={{ marginLeft: 'auto', width: '4px', height: '20px', background: '#22c55e', borderRadius: '2px' }} />}
  </div>
);

export default LessonsPage;
