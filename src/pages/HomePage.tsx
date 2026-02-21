import React from 'react';
import logoImg from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { WhatsAppButton } from '../components/WhatsAppButton';

const pageVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } },
};

export const HomePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f8f7fc 0%, #eef2ff 50%, #f0f4ff 100%)',
                fontFamily: "'Inter', sans-serif",
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background Blobs */}
            <div style={{
                position: 'fixed', top: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(66,133,244,0.08) 0%, transparent 70%)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'fixed', bottom: '-120px', right: '-120px', width: '450px', height: '450px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)', pointerEvents: 'none',
            }} />

            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginBottom: '16px', position: 'relative' }}
            >
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(66,133,244,0.15)', borderRadius: '20px',
                    filter: 'blur(24px)', transform: 'scale(1.8)',
                }} />
                <div style={{
                    position: 'relative', background: 'transparent',
                    padding: '0', borderRadius: '20px', boxShadow: 'none',
                }}>
                    <img src={logoImg} alt="Form Genie Logo" style={{ height: 100, width: 'auto', objectFit: 'contain' }} />
                </div>
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                style={{
                    fontSize: '42px', fontWeight: 800, margin: '16px 0 8px',
                    background: 'linear-gradient(135deg, #4285F4, #5a9cf5)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}
            >
                Form Genie
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                style={{ color: '#6b6580', fontSize: '16px', marginBottom: '48px', fontWeight: 500 }}
            >
                Smart Google Form Automation Platform
            </motion.p>

            {/* Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}
            >
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '14px 36px', borderRadius: '14px', border: 'none',
                        background: 'linear-gradient(135deg, #4285F4, #5a9cf5)', color: 'white',
                        fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(66,133,244,0.3)',
                        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(66,133,244,0.4)';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(66,133,244,0.3)';
                    }}
                >
                    <LogIn style={{ width: 18, height: 18 }} />
                    Login
                </button>

                <button
                    onClick={() => navigate('/register')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '14px 36px', borderRadius: '14px',
                        border: '2px solid #4285F4', background: 'white', color: '#4285F4',
                        fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLElement).style.background = '#f0f4ff';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.background = 'white';
                    }}
                >
                    <UserPlus style={{ width: 18, height: 18 }} />
                    Register
                </button>
            </motion.div>

            <WhatsAppButton />
        </motion.div>
    );
};
