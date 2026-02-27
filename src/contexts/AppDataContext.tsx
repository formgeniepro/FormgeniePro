import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import logoImg from '../assets/logo.png';
import { settingsApi, guidelinesApi, paymentQrApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────

interface Plan {
    value: string;
    label: string;
    credits: number;
    price: number;
    popular?: boolean;
}

interface AppConfig {
    registration_enabled: boolean;
    plans: Plan[];
}

interface AppData {
    appConfig: AppConfig;
    limitations: string;
    guidelinesUrl: string;
    paymentQrUrl: string;
    isLoading: boolean;
    refresh: () => void;
}

const DEFAULT_CONFIG: AppConfig = {
    registration_enabled: true,
    plans: [
        { value: 'basic', credits: 75, price: 50, label: 'Basic' },
        { value: 'starter', credits: 150, price: 100, label: 'Starter', popular: true },
        { value: 'pro', credits: 320, price: 200, label: 'Pro' },
    ],
};

const AppDataContext = createContext<AppData | undefined>(undefined);

// ─── Splash Screen ──────────────────────────────────

const SplashScreen: React.FC = () => (
    <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8f7fc 0%, #eef2ff 50%, #f0f4ff 100%)',
            fontFamily: "'Inter', sans-serif",
        }}
    >
        {/* Logo + Ring */}
        <div style={{ position: 'relative', marginBottom: '28px' }}>
            {/* Spinning gradient ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute', inset: -8,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #4285F4, #5a9cf5, #a855f7, #4285F4)',
                    mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
                    WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
                }}
            />
            <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(66,133,244,0.15)',
            }}>
                <img src={logoImg} alt="Form Genie" style={{ width: 52, height: 52, objectFit: 'contain' }} />
            </div>
        </div>

        {/* Brand name */}
        <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
                fontSize: '22px', fontWeight: 800, color: '#1e1b2e',
                margin: '0 0 6px', letterSpacing: '-0.3px',
            }}
        >
            Form Genie
        </motion.h1>
        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{ fontSize: '13px', color: '#9e97b0', margin: '0 0 28px' }}
        >
            Smart Automation Platform
        </motion.p>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                    style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4285F4, #a855f7)',
                    }}
                />
            ))}
        </div>
    </motion.div>
);

// ─── Provider ───────────────────────────────────────

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [limitations, setLimitations] = useState('');
    const [guidelinesUrl, setGuidelinesUrl] = useState('');
    const [paymentQrUrl, setPaymentQrUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [configRes, limRes, guidelinesRes, qrRes] = await Promise.allSettled([
                settingsApi.getAppConfig(),
                settingsApi.getLimitations(),
                guidelinesApi.get(),
                paymentQrApi.get(),
            ]);

            if (configRes.status === 'fulfilled' && configRes.value?.config) {
                setAppConfig(configRes.value.config);
            }
            if (limRes.status === 'fulfilled') {
                setLimitations(limRes.value?.limitations || '');
            }
            if (guidelinesRes.status === 'fulfilled') {
                setGuidelinesUrl(guidelinesRes.value?.url || '');
            }
            if (qrRes.status === 'fulfilled') {
                setPaymentQrUrl(qrRes.value?.url || '');
            }
        } catch {
            // Silently fall back to defaults on total failure
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return (
        <AppDataContext.Provider value={{
            appConfig, limitations, guidelinesUrl, paymentQrUrl,
            isLoading, refresh: fetchAll,
        }}>
            <AnimatePresence>
                {isLoading && <SplashScreen key="splash" />}
            </AnimatePresence>
            {children}
        </AppDataContext.Provider>
    );
};

// ─── Hook ────────────────────────────────────────────

export const useAppData = (): AppData => {
    const ctx = useContext(AppDataContext);
    if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
    return ctx;
};
