import React from 'react';

const DashboardPage = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: '#0f0f13', 
      color: 'white',
      flexDirection: 'column'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Welcome to your Dashboard!</h1>
      <p style={{ opacity: 0.7 }}>Your musical language journey starts here.</p>
    </div>
  );
};

export default DashboardPage;
