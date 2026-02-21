import React, { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, AlertCircle, CheckCircle, Upload, Image, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Spinner } from '../components/Spinner';
import { getQrCodeUrl } from '../services/api';

const PLANS = [
    { value: 'starter', label: 'Starter – 150 submissions (₹100)', credits: 150 },
    { value: 'pro', label: 'Pro – 300 submissions (₹180)', credits: 300 },
    { value: 'executive', label: 'Executive – 500 submissions (₹300)', credits: 500 },
];

export const RegisterPage: React.FC = () => {
    const { register } = useAuth();
    const [form, setForm] = useState({
        name: '', contact_number: '', email: '', plan: '',
        username: '', password: '', transaction_id: '',
    });
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string>('');
    const [qrUrl] = useState('https://lh3.googleusercontent.com/d/1WpQ-BfetJZjCo-MI5Dbj2SU6syyPhcy6');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Only image files are allowed.');
                return;
            }
            setScreenshot(file);
            const reader = new FileReader();
            reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, val]) => formData.append(key, val));
            if (screenshot) formData.append('screenshot', screenshot);

            const data = await register(formData);
            setSuccess(data.message || 'Registration successful! Awaiting admin approval.');
            setForm({ name: '', contact_number: '', email: '', plan: '', username: '', password: '', transaction_id: '' });
            setScreenshot(null);
            setScreenshotPreview('');
        } catch (err: any) {
            setError(err.error || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px', borderRadius: '10px',
        border: '1px solid #e8e5f0', background: '#fafafa', fontSize: '14px',
        color: '#1e1b2e', outline: 'none', transition: 'all 0.2s',
        boxSizing: 'border-box' as const,
    };

    const labelStyle = {
        display: 'block', fontSize: '12px', fontWeight: 600 as const, color: '#6b6580',
        textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                background: 'linear-gradient(135deg, #f8f7fc 0%, #eef2ff 50%, #f0f4ff 100%)',
                fontFamily: "'Inter', sans-serif", padding: '40px 20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    width: '100%', maxWidth: '560px', background: '#fff', borderRadius: '16px',
                    border: '1px solid #e8e5f0', boxShadow: '0 4px 24px rgba(66,133,244,0.08)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ height: '3px', background: 'linear-gradient(90deg, #4285F4, #5a9cf5, #4285F4)' }} />

                <div style={{ padding: '36px 32px' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        <div style={{
                            display: 'inline-flex', padding: '0', borderRadius: '12px',
                            background: 'transparent', marginBottom: '10px',
                        }}>
                            <img src={logoImg} alt="Form Genie Logo" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
                        </div>
                        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e1b2e', margin: '8px 0 4px' }}>
                            Create Account
                        </h1>
                        <p style={{ color: '#9e97b0', fontSize: '13px', margin: 0 }}>
                            Join Form Genie to start automating forms
                        </p>
                    </div>

                    {/* Success */}
                    {success && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
                                borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0',
                                color: '#065f46', fontSize: '13px', fontWeight: 500, marginBottom: '20px',
                            }}>
                            <CheckCircle style={{ width: 18, height: 18, color: '#10b981' }} />
                            {success}
                        </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
                                borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca',
                                color: '#991b1b', fontSize: '13px', fontWeight: 500, marginBottom: '20px',
                            }}>
                            <AlertCircle style={{ width: 18, height: 18 }} />
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>Full Name</label>
                                <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Contact Number</label>
                                <input name="contact_number" value={form.contact_number} onChange={handleChange} required placeholder="+91 98xxxxxxxx" style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Email ID</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" style={inputStyle} />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Select Plan</label>
                            <select name="plan" value={form.plan} onChange={handleChange} required
                                style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}>
                                <option value="">Choose a plan...</option>
                                {PLANS.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>Username</label>
                                <input name="username" value={form.username} onChange={handleChange} required placeholder="Choose a username" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Password</label>
                                <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Min 6 characters" style={inputStyle} />
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid #e8e5f0', margin: '24px 0', position: 'relative' }}>
                            <span style={{
                                position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                                background: '#fff', padding: '0 12px', fontSize: '11px', fontWeight: 600,
                                color: '#9e97b0', textTransform: 'uppercase', letterSpacing: '1px',
                            }}>
                                Payment Details
                            </span>
                        </div>

                        {/* QR Code Display */}
                        {qrUrl && (
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <label style={{ ...labelStyle, marginBottom: '10px' }}>Scan & Pay</label>
                                <div style={{
                                    display: 'inline-block', padding: '12px', background: 'white',
                                    borderRadius: '12px', border: '2px solid #e8e5f0',
                                }}>
                                    <img src={qrUrl} alt="Payment QR Code" style={{ width: '180px', height: '180px', objectFit: 'contain' }} />
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Transaction ID</label>
                            <input name="transaction_id" value={form.transaction_id} onChange={handleChange} required
                                placeholder="Enter your payment transaction ID" style={inputStyle} />
                        </div>

                        {/* File Upload */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Payment Screenshot</label>
                            <div style={{
                                border: '2px dashed #d4cfe0', borderRadius: '12px', padding: '24px',
                                textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                                background: screenshotPreview ? '#fafafa' : 'transparent',
                            }}
                                onClick={() => document.getElementById('screenshot-input')?.click()}
                            >
                                <input id="screenshot-input" type="file" accept="image/*"
                                    onChange={handleFileChange} style={{ display: 'none' }} />
                                {screenshotPreview ? (
                                    <div>
                                        <img src={screenshotPreview} alt="Preview" style={{
                                            maxWidth: '200px', maxHeight: '200px', borderRadius: '8px',
                                            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                                        }} />
                                        <p style={{ color: '#4285F4', fontSize: '12px', marginTop: '8px', fontWeight: 500 }}>
                                            Click to change
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload style={{ width: 32, height: 32, color: '#9e97b0', margin: '0 auto 8px' }} />
                                        <p style={{ color: '#6b6580', fontSize: '13px', fontWeight: 500, margin: '0 0 4px' }}>
                                            Click to upload screenshot
                                        </p>
                                        <p style={{ color: '#9e97b0', fontSize: '11px', margin: 0 }}>PNG, JPG up to 5MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                background: loading ? '#93c5fd' : 'linear-gradient(135deg, #4285F4, #5a9cf5)',
                                color: 'white', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 4px 16px rgba(66,133,244,0.25)',
                            }}>
                            {loading ? (
                                <><Spinner size="h-4 w-4" /><span>Creating Account...</span></>
                            ) : (
                                <><UserPlus style={{ width: 18, height: 18 }} />Create Account</>
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#9e97b0' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: '#4285F4', fontWeight: 600, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};
