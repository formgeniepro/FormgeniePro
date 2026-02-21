import React, { useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle, CreditCard, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { creditRequestsApi } from '../services/api';
import { Spinner } from './Spinner';

const ADDON_PLANS = [
    { value: 'starter', credits: 150, price: 100, label: 'Starter' },
    { value: 'pro', credits: 300, price: 180, label: 'Pro', popular: true },
    { value: 'executive', credits: 500, price: 300, label: 'Executive' },
];

interface CreditRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const CreditRequestModal: React.FC<CreditRequestModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [selectedPlan, setSelectedPlan] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const qrUrl = 'https://lh3.googleusercontent.com/d/1WpQ-BfetJZjCo-MI5Dbj2SU6syyPhcy6';

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

        if (!selectedPlan) { setError('Please select a plan.'); return; }
        if (!transactionId.trim()) { setError('Please enter your transaction ID.'); return; }

        setLoading(true);
        try {
            const data = await creditRequestsApi.submit(selectedPlan, transactionId, screenshot || undefined);
            setSuccess(data.message || 'Credit request submitted! Awaiting admin approval.');
            setSelectedPlan('');
            setTransactionId('');
            setScreenshot(null);
            setScreenshotPreview('');
            onSuccess?.();
        } catch (err: any) {
            setError(err.error || 'Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError('');
        setSuccess('');
        onClose();
    };

    if (!isOpen) return null;

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b6580',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '11px 14px', borderRadius: '10px',
        border: '1px solid #e8e5f0', background: '#fafafa', fontSize: '14px',
        color: '#1e1b2e', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)', zIndex: 1000,
                        }}
                    />

                    {/* Modal Centering Wrapper */}
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1001,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none', padding: '20px',
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                pointerEvents: 'auto',
                                width: '100%', maxWidth: '480px', maxHeight: '90vh',
                                background: '#fff', borderRadius: '16px',
                                border: '1px solid #e8e5f0',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            }}
                        >
                            {/* Gradient bar */}
                            <div style={{ height: '3px', background: 'linear-gradient(90deg, #7c3aed, #4285F4, #7c3aed)', flexShrink: 0 }} />

                            {/* Header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4285F4)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                                        <CreditCard style={{ width: 18, height: 18, color: 'white' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e1b2e' }}>Request Add-on Credits</h3>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#9e97b0' }}>Select a package and complete payment</p>
                                    </div>
                                </div>
                                <button onClick={handleClose} style={{
                                    background: 'transparent', border: 'none', padding: '6px',
                                    borderRadius: '8px', cursor: 'pointer', color: '#9ca3af',
                                    transition: 'background 0.15s',
                                }}>
                                    <X style={{ width: 20, height: 20 }} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div style={{ overflowY: 'auto', padding: '20px 24px 24px', flex: 1 }}>
                                {/* Success */}
                                {success && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
                                            borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0',
                                            color: '#065f46', fontSize: '13px', fontWeight: 500, marginBottom: '20px',
                                        }}>
                                        <CheckCircle style={{ width: 18, height: 18, color: '#10b981', flexShrink: 0 }} />
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
                                        <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    {/* Plan Selection */}
                                    <label style={labelStyle}>Select Package</label>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                        {ADDON_PLANS.map((plan) => {
                                            const isSelected = selectedPlan === plan.value;
                                            return (
                                                <div
                                                    key={plan.value}
                                                    onClick={() => setSelectedPlan(plan.value)}
                                                    style={{
                                                        flex: 1, padding: '14px 10px', borderRadius: '12px', cursor: 'pointer',
                                                        border: isSelected ? '2px solid #4285F4' : '2px solid #e8e5f0',
                                                        background: isSelected ? 'linear-gradient(135deg, #eff6ff, #e8f0fe)' : '#fafafa',
                                                        textAlign: 'center', transition: 'all 0.2s', position: 'relative',
                                                    }}
                                                >
                                                    {plan.popular && (
                                                        <span style={{
                                                            position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
                                                            background: 'linear-gradient(135deg, #4285F4, #5a9cf5)', color: 'white',
                                                            fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                                                            textTransform: 'uppercase', letterSpacing: '0.5px',
                                                        }}>
                                                            Popular
                                                        </span>
                                                    )}
                                                    <div style={{ fontSize: '22px', fontWeight: 800, color: isSelected ? '#4285F4' : '#1e1b2e' }}>
                                                        {plan.credits}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#6b6580', marginTop: '2px' }}>credits</div>
                                                    <div style={{
                                                        marginTop: '8px', fontSize: '14px', fontWeight: 700,
                                                        color: isSelected ? '#4285F4' : '#374151',
                                                    }}>
                                                        ₹{plan.price}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Divider */}
                                    <div style={{ borderTop: '1px solid #e8e5f0', margin: '20px 0', position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                                            background: '#fff', padding: '0 12px', fontSize: '11px', fontWeight: 600,
                                            color: '#9e97b0', textTransform: 'uppercase', letterSpacing: '1px',
                                        }}>
                                            Payment
                                        </span>
                                    </div>

                                    {/* QR Code */}
                                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                        <label style={{ ...labelStyle, marginBottom: '10px' }}>Scan & Pay</label>
                                        <div style={{
                                            display: 'inline-block', padding: '10px', background: 'white',
                                            borderRadius: '12px', border: '2px solid #e8e5f0',
                                        }}>
                                            <img src={qrUrl} alt="Payment QR" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#6b6580', marginTop: '12px', fontStyle: 'italic', lineHeight: 1.5 }}>
                                            * Kind info: The amount collected will be used for settling the Google for Gemini API requests; it is not utilized for personal consumption.
                                        </p>
                                    </div>

                                    {/* Transaction ID */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={labelStyle}>Transaction ID</label>
                                        <input
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            placeholder="Enter your payment transaction ID"
                                            style={inputStyle}
                                        />
                                    </div>

                                    {/* Screenshot Upload */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={labelStyle}>Payment Screenshot</label>
                                        <div
                                            style={{
                                                border: '2px dashed #d4cfe0', borderRadius: '12px', padding: '20px',
                                                textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                                                background: screenshotPreview ? '#fafafa' : 'transparent',
                                            }}
                                            onClick={() => document.getElementById('cr-screenshot-input')?.click()}
                                        >
                                            <input id="cr-screenshot-input" type="file" accept="image/*"
                                                onChange={handleFileChange} style={{ display: 'none' }} />
                                            {screenshotPreview ? (
                                                <div>
                                                    <img src={screenshotPreview} alt="Preview" style={{
                                                        maxWidth: '160px', maxHeight: '160px', borderRadius: '8px',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    }} />
                                                    <p style={{ color: '#4285F4', fontSize: '11px', marginTop: '8px', fontWeight: 500 }}>
                                                        Click to change
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Upload style={{ width: 28, height: 28, color: '#9e97b0', margin: '0 auto 6px' }} />
                                                    <p style={{ color: '#6b6580', fontSize: '12px', fontWeight: 500, margin: '0 0 4px' }}>
                                                        Click to upload screenshot
                                                    </p>
                                                    <p style={{ color: '#9e97b0', fontSize: '11px', margin: 0 }}>PNG, JPG up to 5MB</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <button type="submit" disabled={loading}
                                        style={{
                                            width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                                            background: loading ? '#93c5fd' : 'linear-gradient(135deg, #4285F4, #5a9cf5)',
                                            color: 'white', fontSize: '14px', fontWeight: 600,
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            boxShadow: '0 4px 16px rgba(66,133,244,0.25)',
                                        }}>
                                        {loading ? (
                                            <><Spinner size="h-4 w-4" /><span>Submitting...</span></>
                                        ) : (
                                            <><Sparkles style={{ width: 16, height: 16 }} />Submit Request</>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
