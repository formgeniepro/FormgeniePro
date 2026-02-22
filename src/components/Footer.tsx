import React from 'react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
                textAlign: 'center',
                padding: '24px 12px 14px',
                fontSize: '11px',
                color: '#9e97b0',
                fontWeight: 600,
                width: '100%',
                background: 'linear-gradient(to top, rgba(248, 247, 252, 1) 0%, rgba(248, 247, 252, 0.8) 50%, rgba(248, 247, 252, 0) 100%)',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                letterSpacing: '0.2px',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
            }}
        >
            Crafted by AK <span style={{ color: '#f87171' }}>❤️</span>
        </motion.div>
    );
};
