import React, { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { ParsedForm, GenerationState } from '../types';
import { fetchUrlContent } from '../services/proxyService';
import { parseFormHTML } from '../services/parserService';
import { FormPreview } from '../components/FormPreview';
import { Spinner } from '../components/Spinner';
import { creditsApi, guidelinesApi, settingsApi } from '../services/api';
import { Link2, FileCode2, AlertCircle, Sparkles, Zap, CreditCard, TrendingUp, Activity, Menu, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Dashboard Overview ────────────────────────────
const DashboardOverview: React.FC = () => {
    const { user } = useAuth();

    const stats = [
        {
            label: 'Credits Remaining',
            value: user?.role === 'admin' ? '∞' : (user?.credits || 0).toLocaleString(),
            icon: <CreditCard style={{ width: 20, height: 20, color: '#4285F4' }} />,
            color: '#4285F4',
            bgColor: '#eff6ff',
        },
        {
            label: 'Plan',
            value: user?.role === 'admin' ? 'Admin' : (user?.plan || 'N/A').charAt(0).toUpperCase() + (user?.plan || 'N/A').slice(1),
            icon: <TrendingUp style={{ width: 20, height: 20, color: '#10b981' }} />,
            color: '#10b981',
            bgColor: '#ecfdf5',
        },
        {
            label: 'Status',
            value: user?.role === 'admin' ? 'Active' : (user?.status || 'N/A').charAt(0).toUpperCase() + (user?.status || 'N/A').slice(1),
            icon: <Activity style={{ width: 20, height: 20, color: '#8b5cf6' }} />,
            color: '#8b5cf6',
            bgColor: '#f5f3ff',
        },
    ];

    return (
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e1b2e', marginBottom: '4px' }}>
                Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p style={{ color: '#6b6580', fontSize: '14px', marginBottom: '32px' }}>
                Here's your Form Genie dashboard overview.
            </p>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{
                            background: '#fff', borderRadius: '14px', padding: '24px',
                            border: '1px solid #e8e5f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        }}
                    >
                        <div style={{
                            display: 'inline-flex', padding: '10px', borderRadius: '10px',
                            background: stat.bgColor, marginBottom: '12px',
                        }}>
                            {stat.icon}
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e1b2e' }}>{stat.value}</div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#9e97b0', marginTop: '4px' }}>{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Start */}
            <div style={{
                background: 'linear-gradient(135deg, #4285F4, #5a9cf5)', borderRadius: '16px',
                padding: '32px', color: 'white',
            }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>🚀 Quick Start</h3>
                <p style={{ fontSize: '14px', opacity: 0.85, margin: '0 0 20px' }}>
                    Navigate to "Automate Form" in the sidebar to import a Google Form and start automating submissions.
                </p>
                <Link to="/dashboard/automate" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.2)', color: 'white',
                    fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                    backdropFilter: 'blur(4px)', transition: 'all 0.2s',
                }}>
                    <Zap style={{ width: 16, height: 16 }} /> Start Automation
                </Link>
            </div>
        </div>
    );
};

// ─── Automate Form Page (existing app) ─────────────
const AutomateForm: React.FC = () => {
    const { user, refreshCredits } = useAuth();
    const [url, setUrl] = useState('');
    const [manualHtml, setManualHtml] = useState('');
    const [inputType, setInputType] = useState<'url' | 'html'>('url');
    const [parsedForm, setParsedForm] = useState<ParsedForm | null>(null);
    const [status, setStatus] = useState<GenerationState>({ status: 'idle' });
    const [guidelinesUrl, setGuidelinesUrl] = useState('');
    const [guidelinesLoading, setGuidelinesLoading] = useState(true);
    const [limitations, setLimitations] = useState('');
    const [limitationsLoading, setLimitationsLoading] = useState(true);

    useEffect(() => {
        guidelinesApi.get().then(data => {
            setGuidelinesUrl(data.url || '');
        }).catch(() => { }).finally(() => setGuidelinesLoading(false));

        settingsApi.getLimitations().then(data => {
            setLimitations(data.limitations || '');
        }).catch(() => { }).finally(() => setLimitationsLoading(false));
    }, []);

    const handleImport = async () => {
        if (inputType === 'url' && !url) return;
        if (inputType === 'html' && !manualHtml) return;

        // Credit check before importing (for users)
        if (user?.role !== 'admin') {
            if ((user?.credits || 0) <= 0) {
                setStatus({ status: 'error', message: 'Insufficient credits. Please purchase more to continue.' });
                return;
            }
        }

        try {
            let htmlContent = '';
            if (inputType === 'url') {
                setStatus({ status: 'fetching_html', message: 'Fetching form content...' });
                htmlContent = await fetchUrlContent(url);
            } else {
                htmlContent = manualHtml;
            }
            setStatus({ status: 'analyzing', message: 'Parsing form structure...' });
            await new Promise(resolve => setTimeout(resolve, 100));
            const formStructure = await parseFormHTML(htmlContent);
            setParsedForm(formStructure);
            setStatus({ status: 'success' });
        } catch (error: any) {
            setStatus({ status: 'error', message: error.message || 'Something went wrong.' });
        }
    };

    const reset = () => {
        setParsedForm(null);
        setStatus({ status: 'idle' });
        setUrl('');
        setManualHtml('');
        refreshCredits();
    };

    const isLoading = status.status === 'fetching_html' || status.status === 'analyzing';
    const isDisabled = isLoading || (inputType === 'url' && !url) || (inputType === 'html' && !manualHtml);

    if (parsedForm) {
        return <FormPreview form={parsedForm} onBack={reset} />;
    }

    return (
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e1b2e', marginBottom: '4px' }}>
                Automate Form
            </h1>
            <p style={{ color: '#6b6580', fontSize: '14px', marginBottom: '28px' }}>
                Import a Google Form to configure and automate submissions.
            </p>

            {/* Credit Warning */}
            {user?.role !== 'admin' && user?.credits !== undefined && user.credits <= 10 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                    borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a',
                    color: '#92400e', fontSize: '13px', fontWeight: 500, marginBottom: '20px',
                }}>
                    <AlertCircle style={{ width: 16, height: 16, color: '#f59e0b' }} />
                    Low credits: {user.credits} remaining
                </div>
            )}

            <div style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #e8e5f0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
            }}>
                <div style={{ height: '3px', background: 'linear-gradient(90deg, #4285F4, #5a9cf5, #4285F4)' }} />
                <div style={{ padding: '28px' }}>
                    {/* Tabs */}
                    <div style={{
                        display: 'flex', background: '#f8f7fc', borderRadius: '12px', padding: '4px',
                        marginBottom: '24px', border: '1px solid #e8e5f0',
                    }}>
                        {(['url', 'html'] as const).map((type) => (
                            <button key={type} onClick={() => setInputType(type)}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
                                    background: inputType === type ? '#fff' : 'transparent',
                                    color: inputType === type ? '#4285F4' : '#9e97b0',
                                    boxShadow: inputType === type ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                                }}>
                                {type === 'url' ? <><Link2 style={{ width: 15, height: 15 }} /> Public URL</> : <><FileCode2 style={{ width: 15, height: 15 }} /> Source HTML</>}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    {inputType === 'url' ? (
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9e97b0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Google Form Link</label>
                            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://docs.google.com/forms/d/e/..."
                                style={{
                                    width: '100%', background: '#fafafa', border: '1px solid #e8e5f0', borderRadius: '10px',
                                    padding: '12px 16px', fontSize: '14px', color: '#1e1b2e', outline: 'none',
                                    boxSizing: 'border-box', transition: 'all 0.2s',
                                }} />
                            <p style={{ fontSize: '11px', color: '#9e97b0', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Zap style={{ width: 12, height: 12, color: '#f59e0b' }} /> Try "Source HTML" if URL blocked by CORS
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9e97b0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Paste Page Source</label>
                            <textarea value={manualHtml} onChange={(e) => setManualHtml(e.target.value)}
                                placeholder="<html>...</html>" rows={6}
                                style={{
                                    width: '100%', background: '#fafafa', border: '1px solid #e8e5f0', borderRadius: '10px',
                                    padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: '#1e1b2e',
                                    outline: 'none', resize: 'none', boxSizing: 'border-box',
                                }} />
                        </div>
                    )}

                    {/* Error */}
                    {status.status === 'error' && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '16px',
                            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                            padding: '12px 16px', color: '#991b1b', fontSize: '13px',
                        }}>
                            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: '2px' }} />
                            {status.message}
                        </div>
                    )}

                    {/* Submit */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button onClick={handleImport} disabled={isDisabled}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '12px 28px', borderRadius: '12px', border: 'none',
                                background: isDisabled ? '#d1d5db' : 'linear-gradient(135deg, #4285F4, #5a9cf5)',
                                color: 'white', fontSize: '14px', fontWeight: 600, cursor: isDisabled ? 'not-allowed' : 'pointer',
                                boxShadow: isDisabled ? 'none' : '0 4px 16px rgba(66,133,244,0.25)',
                            }}>
                            {isLoading ? (
                                <><Spinner size="h-4 w-4" /><span>{status.message}</span></>
                            ) : (
                                <><Sparkles style={{ width: 16, height: 16 }} /> Import Form</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* System Limitations Section */}
            {!limitationsLoading && limitations && (
                <div style={{ marginTop: '28px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
                    }}>
                        <AlertCircle style={{ width: 20, height: 20, color: '#f59e0b' }} />
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e1b2e', margin: 0 }}>
                            ⚠️ System Limitations
                        </h2>
                    </div>

                    <div style={{
                        background: '#fffbeb', borderRadius: '16px', border: '1px solid #fde68a',
                        padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                        <ul style={{ margin: 0, paddingLeft: '24px', color: '#92400e', fontSize: '14px', lineHeight: 1.6 }}>
                            {limitations.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                                <li key={idx} style={{ marginBottom: '8px' }}>{line}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Guidelines PDF Section */}
            <div style={{ marginTop: '28px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
                }}>
                    <FileText style={{ width: 20, height: 20, color: '#4285F4' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e1b2e', margin: 0 }}>
                        📖 Guidelines
                    </h2>
                </div>

                <div style={{
                    background: '#fff', borderRadius: '16px', border: '1px solid #e8e5f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
                }}>
                    <div style={{ height: '3px', background: 'linear-gradient(90deg, #10b981, #34d399, #10b981)' }} />
                    <div style={{ padding: '24px' }}>
                        {guidelinesLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
                                <Spinner size="h-6 w-6" />
                            </div>
                        ) : guidelinesUrl ? (
                            <iframe
                                src={guidelinesUrl}
                                style={{
                                    width: '100%', height: '700px', border: '1px solid #e8e5f0',
                                    borderRadius: '10px', background: '#f8f7fc',
                                }}
                                title="Guidelines PDF"
                                allow="autoplay"
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9e97b0' }}>
                                <FileText style={{ width: 36, height: 36, margin: '0 auto 10px', opacity: 0.4 }} />
                                <p style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 4px' }}>No guidelines available</p>
                                <p style={{ fontSize: '12px', color: '#b8b3c8', margin: 0 }}>The admin has not uploaded any guidelines yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

// ─── Dashboard Layout ──────────────────────────────
export const DashboardPage: React.FC = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="layout-shell">
            {/* Mobile Header */}
            <div className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'transparent', padding: '0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={logoImg} alt="Form Genie Logo" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e1b2e', margin: 0 }}>Form Genie</h2>
                </div>
                <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="sidebar-close-btn"
                    style={{ display: 'block', border: '1px solid #f3f4f6' }}
                >
                    <Menu size={20} />
                </button>
            </div>

            <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

            <main className="layout-main" style={{ minHeight: '100vh' }}>
                <Routes>
                    <Route index element={<DashboardOverview />} />
                    <Route path="automate" element={<AutomateForm />} />
                </Routes>
            </main>
        </div>
    );
};
