import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        if (data.role === 'admin') {
          navigate('/admin');
        } else if (data.hasPreferences) {
          navigate('/dashboard');
        } else {
          navigate('/preferences');
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
        <h2 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>Sign Up</h2>

        <form style={{ width: '100%' }} onSubmit={handleSignup}>
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="Enter your Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter your Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: '32px' }}>
            <label>Re-enter your Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Re-enter your Password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(to right, #0b1c11, #12793d, #0b1c11)', border: '1px solid #1a3c26' }}>
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
