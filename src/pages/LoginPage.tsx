import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle, Clock, XCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { Spinner } from '../components/Spinner';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<{ message: string; status?: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await login(username, password);
            if (data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError({ message: err.error || 'Login failed.', status: err.status === 403 ? err.status : undefined });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #f8f7fc 0%, #eef2ff 50%, #f0f4ff 100%)',
                fontFamily: "'Inter', sans-serif", padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '16px',
                    border: '1px solid #e8e5f0', boxShadow: '0 4px 24px rgba(66,133,244,0.08)',
                    overflow: 'hidden',
                }}
            >
                {/* Top accent */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg, #4285F4, #5a9cf5, #4285F4)' }} />

                <div style={{ padding: '40px 36px' }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            display: 'inline-flex', padding: '0', borderRadius: '14px',
                            background: 'transparent', marginBottom: '12px',
                        }}>
                            <img src="https://lh3.googleusercontent.com/d/1w_6oSf25-rUAkZbuIqtX6wfYmmDD46Rl" alt="Form Genie Logo" style={{ height: 60, width: 'auto', objectFit: 'contain' }} />
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e1b2e', margin: '8px 0 4px' }}>
                            Welcome Back
                        </h1>
                        <p style={{ color: '#9e97b0', fontSize: '14px', margin: 0 }}>Sign in to your Form Genie account</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
                                borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: 500,
                                ...(error.status === 'pending'
                                    ? { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }
                                    : error.status === 'rejected'
                                        ? { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }
                                        : { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }),
                            }}
                        >
                            {error.message.includes('awaiting') ? (
                                <Clock style={{ width: 18, height: 18, flexShrink: 0, color: '#f59e0b' }} />
                            ) : error.message.includes('rejected') ? (
                                <XCircle style={{ width: 18, height: 18, flexShrink: 0, color: '#ef4444' }} />
                            ) : (
                                <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                            )}
                            {error.message}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b6580', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                                    border: '1px solid #e8e5f0', background: '#fafafa', fontSize: '14px',
                                    color: '#1e1b2e', outline: 'none', transition: 'all 0.2s',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4285F4';
                                    e.target.style.background = '#fff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(66,133,244,0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e8e5f0';
                                    e.target.style.background = '#fafafa';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b6580', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                                    border: '1px solid #e8e5f0', background: '#fafafa', fontSize: '14px',
                                    color: '#1e1b2e', outline: 'none', transition: 'all 0.2s',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#4285F4';
                                    e.target.style.background = '#fff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(66,133,244,0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e8e5f0';
                                    e.target.style.background = '#fafafa';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !username || !password}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                background: loading ? '#93c5fd' : 'linear-gradient(135deg, #4285F4, #5a9cf5)',
                                color: 'white', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(66,133,244,0.25)',
                            }}
                        >
                            {loading ? (
                                <><Spinner size="h-4 w-4" /><span>Signing in...</span></>
                            ) : (
                                <><LogIn style={{ width: 18, height: 18 }} />Sign In</>
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#9e97b0' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: '#4285F4', fontWeight: 600, textDecoration: 'none' }}>
                            Register here
                        </Link>
                    </p>
                </div>
            </motion.div>

            <WhatsAppButton />
        </motion.div>
    );
};
