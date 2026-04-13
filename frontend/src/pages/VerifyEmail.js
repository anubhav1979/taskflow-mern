import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    API.get(`/auth/verify-email/${token}`)
      .then(res => { setStatus('success'); setMessage(res.data.message); })
      .catch(err => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed'); });
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ marginBottom: '10px' }}>Email Verified!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              Sign In Now →
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ marginBottom: '10px' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{message}</p>
            <Link to="/register" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              Register Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;