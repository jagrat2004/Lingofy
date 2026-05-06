import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          // If user already has preferences, go straight to dashboard
          if (data.hasPreferences) {
            navigate('/dashboard');
          } else {
            navigate('/preferences');
          }
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="logo-container" style={{ position: 'absolute', top: '40px' }}>
        <img src="/Logo-1.png" alt="Lingofy Logo" style={{ width: '60px', height: '60px' }} />
        <div className="logo-text" style={{ fontSize: '24px' }}>Lingofy</div>
      </div>

      <div className="auth-card" style={{ marginTop: '60px' }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            <span>Login with Google</span>
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" width="20" height="20" />
            <span>Login with Facebook</span>
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" alt="Apple" width="20" height="20" />
            <span>Login with Apple</span>
          </button>
        </div>

        <div style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px' }}></div>

        <form style={{ width: '100%' }} onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email or Username</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Email or Username" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '12px' }}>
            <input type="checkbox" id="remember" style={{ accentColor: '#12793d' }} />
            <label htmlFor="remember" style={{ color: '#ccc' }}>Remember Me</label>
          </div>

          <button type="submit" className="btn btn-primary">
            Log In
          </button>
        </form>

        <div style={{ marginTop: '24px' }}>
          <a href="#" style={{ fontSize: '13px', color: '#ccc', textDecoration: 'underline' }}>Forgot your Password?</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
