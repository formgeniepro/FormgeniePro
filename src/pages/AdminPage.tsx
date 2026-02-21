import React, { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { adminApi, announcementsApi, creditRequestsApi, guidelinesApi } from '../services/api';
import { Spinner } from '../components/Spinner';
import {
    Users, CheckCircle, XCircle, Clock, Eye, Plus, Minus,
    Search, Filter, ChevronDown, AlertCircle, CreditCard,
    Megaphone, Trash2, ToggleLeft, ToggleRight, Send, Menu, Sparkles, FileText, Upload, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: string; name: string; contact_number: string; email: string;
    username: string; role: string; plan: string; credits: number;
    status: string; created_at: string;
}

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: string;
    active: boolean;
    created_at: string;
}

// ─── Announcements Manager ─────────────────────────
const AnnouncementsManager: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [creating, setCreating] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await announcementsApi.getAll();
            setAnnouncements(data.announcements || []);
        } catch {
            setFeedback({ type: 'error', text: 'Failed to load announcements' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const handleCreate = async () => {
        if (!title.trim() || !message.trim()) return;
        setCreating(true);
        try {
            await announcementsApi.create(title.trim(), message.trim(), type);
            setFeedback({ type: 'success', text: 'Announcement created!' });
            setTitle('');
            setMessage('');
            setType('info');
            fetchAnnouncements();
        } catch {
            setFeedback({ type: 'error', text: 'Failed to create announcement' });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await announcementsApi.remove(id);
            setFeedback({ type: 'success', text: 'Announcement deleted' });
            fetchAnnouncements();
        } catch {
            setFeedback({ type: 'error', text: 'Failed to delete' });
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await announcementsApi.toggle(id);
            fetchAnnouncements();
        } catch {
            setFeedback({ type: 'error', text: 'Failed to toggle' });
        }
    };

    const typeColors: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
        warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
        success: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
        urgent: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
    };

    return (
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e1b2e', marginBottom: '4px' }}>
                Announcements
            </h1>
            <p style={{ color: '#6b6580', fontSize: '14px', marginBottom: '24px' }}>
                Create and manage announcements visible to all users.
            </p>

            {/* Feedback */}
            <AnimatePresence>
                {feedback && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                            borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: 500,
                            background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                        }}>
                        {feedback.type === 'success' ? <CheckCircle style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
                        {feedback.text}
                        <button onClick={() => setFeedback(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '16px' }}>×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Form */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8e5f0', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Megaphone style={{ width: 18, height: 18, color: '#7c3aed' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b2e' }}>New Announcement</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <input value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Announcement title..."
                        style={{
                            flex: 1, padding: '10px 14px', borderRadius: '10px',
                            border: '1px solid #e8e5f0', fontSize: '13px', outline: 'none',
                            boxSizing: 'border-box',
                        }} />
                    <select value={type} onChange={(e) => setType(e.target.value)}
                        style={{
                            padding: '10px 14px', borderRadius: '10px', border: '1px solid #e8e5f0',
                            fontSize: '13px', cursor: 'pointer', outline: 'none', background: '#fff',
                        }}>
                        <option value="info">ℹ️ Info</option>
                        <option value="warning">⚠️ Warning</option>
                        <option value="success">✅ Success</option>
                        <option value="urgent">🚨 Urgent</option>
                    </select>
                </div>

                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your announcement message..."
                    rows={3}
                    style={{
                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                        border: '1px solid #e8e5f0', fontSize: '13px', outline: 'none',
                        resize: 'none', boxSizing: 'border-box', marginBottom: '12px',
                        fontFamily: 'inherit',
                    }} />

                <button onClick={handleCreate} disabled={creating || !title.trim() || !message.trim()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 24px', borderRadius: '10px', border: 'none',
                        background: (!title.trim() || !message.trim()) ? '#d1d5db' : 'linear-gradient(135deg, #7c3aed, #9333ea)',
                        color: 'white', fontSize: '13px', fontWeight: 600,
                        cursor: (!title.trim() || !message.trim()) ? 'not-allowed' : 'pointer',
                        boxShadow: (!title.trim() || !message.trim()) ? 'none' : '0 4px 16px rgba(124,58,237,0.25)',
                    }}>
                    {creating ? <Spinner size="h-4 w-4" /> : <Send style={{ width: 14, height: 14 }} />}
                    Publish Announcement
                </button>
            </div>

            {/* Announcements List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}><Spinner size="h-6 w-6" /></div>
            ) : announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9e97b0' }}>
                    <Megaphone style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>No announcements yet</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {announcements.map((ann) => {
                        const tc = typeColors[ann.type] || typeColors.info;
                        return (
                            <motion.div key={ann.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: '#fff', borderRadius: '12px', border: '1px solid #e8e5f0',
                                    padding: '16px 20px', opacity: ann.active ? 1 : 0.5,
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'opacity 0.2s',
                                }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                                                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`,
                                            }}>{ann.type}</span>
                                            {!ann.active && (
                                                <span style={{ fontSize: '10px', fontWeight: 600, color: '#9e97b0', textTransform: 'uppercase' }}>Hidden</span>
                                            )}
                                        </div>
                                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#1e1b2e' }}>{ann.title}</h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#6b6580', lineHeight: 1.5 }}>{ann.message}</p>
                                        <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#9e97b0' }}>
                                            {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', marginLeft: '16px', flexShrink: 0 }}>
                                        <button onClick={() => handleToggle(ann.id)} title={ann.active ? 'Hide' : 'Show'}
                                            style={{
                                                padding: '6px 10px', borderRadius: '8px', border: '1px solid #e8e5f0',
                                                background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                fontSize: '11px', fontWeight: 600, color: ann.active ? '#065f46' : '#9e97b0',
                                            }}>
                                            {ann.active ? <ToggleRight style={{ width: 14, height: 14 }} /> : <ToggleLeft style={{ width: 14, height: 14 }} />}
                                            {ann.active ? 'Active' : 'Hidden'}
                                        </button>
                                        <button onClick={() => handleDelete(ann.id)} title="Delete"
                                            style={{
                                                padding: '6px 10px', borderRadius: '8px', border: '1px solid #fecaca',
                                                background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                color: '#991b1b',
                                            }}>
                                            <Trash2 style={{ width: 14, height: 14 }} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── User Management Panel ─────────────────────────
const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [screenshotUrl, setScreenshotUrl] = useState('');
    const [creditModal, setCreditModal] = useState<{ user: User; show: boolean }>({ user: {} as User, show: false });
    const [creditAmount, setCreditAmount] = useState('');
    const [actionLoading, setActionLoading] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers(statusFilter);
            setUsers(data.users);
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to load users' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [statusFilter]);

    const handleApprove = async (userId: string) => {
        setActionLoading(userId);
        try {
            const data = await adminApi.approveUser(userId);
            setMessage({ type: 'success', text: data.message });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.error || 'Failed to approve' });
        } finally {
            setActionLoading('');
        }
    };

    const handleReject = async (userId: string) => {
        setActionLoading(userId);
        try {
            const data = await adminApi.rejectUser(userId);
            setMessage({ type: 'success', text: data.message });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.error || 'Failed to reject' });
        } finally {
            setActionLoading('');
        }
    };

    const handleViewScreenshot = async (userId: string) => {
        try {
            const data = await adminApi.getScreenshot(userId);
            setScreenshotUrl(data.screenshotUrl);
        } catch {
            setScreenshotUrl('');
        }
    };

    const handleCredits = async (userId: string, action: 'add' | 'reduce') => {
        if (!creditAmount || parseInt(creditAmount) <= 0) return;
        setActionLoading(userId);
        try {
            const data = await adminApi.updateCredits(userId, parseInt(creditAmount), action);
            setMessage({ type: 'success', text: data.message });
            setCreditModal({ user: {} as User, show: false });
            setCreditAmount('');
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.error || 'Failed to update credits' });
        } finally {
            setActionLoading('');
        }
    };

    const handleToggleStatus = async (userId: string, newStatus: 'approved' | 'disabled') => {
        setActionLoading(userId);
        try {
            const data = await adminApi.toggleUserStatus(userId, newStatus);
            setMessage({ type: 'success', text: data.message });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.error || 'Failed to update status' });
        } finally {
            setActionLoading('');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        setActionLoading(userId);
        try {
            await adminApi.deleteUser(userId);
            setMessage({ type: 'success', text: 'User deleted successfully' });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.error || 'Failed to delete user' });
        } finally {
            setActionLoading('');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusColors: Record<string, { bg: string; text: string; border: string }> = {
        pending: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
        approved: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
        rejected: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
        disabled: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
    };

    return (
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e1b2e', marginBottom: '4px' }}>
                User Management
            </h1>
            <p style={{ color: '#6b6580', fontSize: '14px', marginBottom: '24px' }}>
                Manage user registrations, approvals, and credits.
            </p>

            {/* Message */}
            <AnimatePresence>
                {message && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                            borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: 500,
                            background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                            color: message.type === 'success' ? '#065f46' : '#991b1b',
                        }}>
                        {message.type === 'success' ? <CheckCircle style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
                        {message.text}
                        <button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '16px' }}>×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9e97b0' }} />
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        style={{
                            width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px',
                            border: '1px solid #e8e5f0', background: '#fff', fontSize: '13px',
                            outline: 'none', boxSizing: 'border-box',
                        }} />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: '10px 14px', borderRadius: '10px', border: '1px solid #e8e5f0',
                        background: '#fff', fontSize: '13px', cursor: 'pointer', outline: 'none',
                    }}>
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Users Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}><Spinner size="h-6 w-6" /></div>
            ) : filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9e97b0' }}>
                    <Users style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>No users found</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8e5f0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#f8f7fc', borderBottom: '1px solid #e8e5f0' }}>
                                    {['Name', 'Email', 'Plan', 'Credits', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b6580', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => {
                                    const sc = statusColors[user.status] || statusColors.pending;
                                    return (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #f0eef5', transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: 600, color: '#1e1b2e' }}>{user.name}</div>
                                                <div style={{ fontSize: '11px', color: '#9e97b0' }}>@{user.username}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#6b6580' }}>{user.email}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ textTransform: 'capitalize', fontWeight: 500, color: '#1e1b2e' }}>{user.plan || '—'}</span>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1e1b2e' }}>{user.credits.toLocaleString()}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '4px 10px', borderRadius: '8px',
                                                    fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                                                    background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                                                }}>{user.status}</span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {user.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleApprove(user.id)} disabled={actionLoading === user.id}
                                                                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#ecfdf5', color: '#065f46', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <CheckCircle style={{ width: 12, height: 12 }} /> Approve
                                                            </button>
                                                            <button onClick={() => handleReject(user.id)} disabled={actionLoading === user.id}
                                                                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#fef2f2', color: '#991b1b', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <XCircle style={{ width: 12, height: 12 }} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => { handleViewScreenshot(user.id); setSelectedUser(user); }}
                                                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e8e5f0', background: '#fff', color: '#6b6580', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Eye style={{ width: 12, height: 12 }} /> Screenshot
                                                    </button>
                                                    <button onClick={() => setCreditModal({ user, show: true })}
                                                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e8e5f0', background: '#fff', color: '#6b6580', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CreditCard style={{ width: 12, height: 12 }} /> Credits
                                                    </button>
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleToggleStatus(user.id, user.status === 'disabled' ? 'approved' : 'disabled')}
                                                            disabled={actionLoading === user.id}
                                                            style={{
                                                                padding: '6px 12px', borderRadius: '8px', border: '1px solid #e8e5f0',
                                                                background: '#fff', color: user.status === 'disabled' ? '#059669' : '#dc2626',
                                                                fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                                            }}>
                                                            {user.status === 'disabled' ? <ToggleLeft style={{ width: 12, height: 12 }} /> : <ToggleRight style={{ width: 12, height: 12 }} />}
                                                            {user.status === 'disabled' ? 'Enable' : 'Disable'}
                                                        </button>
                                                    )}
                                                    {user.role !== 'admin' && (
                                                        <button onClick={() => handleDelete(user.id)} disabled={actionLoading === user.id}
                                                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Trash2 style={{ width: 12, height: 12 }} /> Delete
                                                        </button>
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }

            {/* Screenshot Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}
                        onClick={() => { setSelectedUser(null); setScreenshotUrl(''); }}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '85vh', overflow: 'auto' }}
                            onClick={(e) => e.stopPropagation()}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e1b2e', marginBottom: '4px' }}>Payment Screenshot</h3>
                            <p style={{ color: '#6b6580', fontSize: '13px', marginBottom: '16px' }}>{selectedUser.name} — {selectedUser.email}</p>
                            {screenshotUrl ? (
                                <img src={screenshotUrl} alt="Payment Screenshot" referrerPolicy="no-referrer"
                                    style={{ width: '100%', borderRadius: '10px', border: '1px solid #e8e5f0', display: 'block' }} />
                            ) : (
                                <p style={{ color: '#9e97b0', textAlign: 'center', padding: '40px 0' }}>No screenshot available</p>
                            )}
                            <button onClick={() => { setSelectedUser(null); setScreenshotUrl(''); }}
                                style={{ marginTop: '16px', width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e8e5f0', background: '#f8f7fc', color: '#6b6580', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Close</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Credit Modal */}
            <AnimatePresence>
                {creditModal.show && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                        onClick={() => setCreditModal({ user: {} as User, show: false })}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%' }}
                            onClick={(e) => e.stopPropagation()}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e1b2e', marginBottom: '4px' }}>Manage Credits</h3>
                            <p style={{ color: '#6b6580', fontSize: '13px', marginBottom: '8px' }}>
                                {creditModal.user.name} — Current: <strong>{creditModal.user.credits}</strong>
                            </p>
                            <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)}
                                placeholder="Enter amount" min="1"
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e8e5f0', fontSize: '14px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleCredits(creditModal.user.id, 'add')}
                                    disabled={!creditAmount || actionLoading === creditModal.user.id}
                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#ecfdf5', color: '#065f46', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <Plus style={{ width: 14, height: 14 }} /> Add
                                </button>
                                <button onClick={() => handleCredits(creditModal.user.id, 'reduce')}
                                    disabled={!creditAmount || actionLoading === creditModal.user.id}
                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#fef2f2', color: '#991b1b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <Minus style={{ width: 14, height: 14 }} /> Reduce
                                </button>
                            </div>
                            <button onClick={() => setCreditModal({ user: {} as User, show: false })}
                                style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e8e5f0', background: '#f8f7fc', color: '#6b6580', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

// ─── Credit Requests Manager ───────────────────────
interface CreditRequest {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    plan: string;
    credits_requested: number;
    amount: number;
    transaction_id: string;
    screenshot_url: string;
    status: string;
    created_at: string;
}

const CreditRequestsManager: React.FC = () => {
    const [requests, setRequests] = useState<CreditRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [processing, setProcessing] = useState<string | null>(null);
    const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            const data = await creditRequestsApi.getAll();
            setRequests(data.requests || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleApprove = async (requestId: string) => {
        if (!confirm('Approve this credit request? Credits will be added to the user\'s balance.')) return;
        setProcessing(requestId);
        try {
            await creditRequestsApi.approve(requestId);
            await fetchRequests();
        } catch (err: any) {
            alert(err.error || 'Failed to approve');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!confirm('Reject this credit request?')) return;
        setProcessing(requestId);
        try {
            await creditRequestsApi.reject(requestId);
            await fetchRequests();
        } catch (err: any) {
            alert(err.error || 'Failed to reject');
        } finally {
            setProcessing(null);
        }
    };

    const filtered = requests.filter(r => filter === 'all' || r.status === filter);
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const statusStyle = (status: string): React.CSSProperties => {
        switch (status) {
            case 'approved': return { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' };
            case 'rejected': return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' };
            default: return { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' };
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Spinner />
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e1b2e', margin: 0 }}>
                    Credit Requests
                    {pendingCount > 0 && (
                        <span style={{
                            marginLeft: '10px', fontSize: '12px', fontWeight: 700,
                            background: '#fef3c7', color: '#92400e', padding: '3px 10px',
                            borderRadius: '20px', verticalAlign: 'middle',
                        }}>
                            {pendingCount} pending
                        </span>
                    )}
                </h2>

                {/* Filter */}
                <div style={{ display: 'flex', gap: '6px', background: '#f0eef5', borderRadius: '10px', padding: '3px' }}>
                    {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{
                                padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                                textTransform: 'capitalize',
                                background: filter === f ? '#fff' : 'transparent',
                                color: filter === f ? '#4285F4' : '#9e97b0',
                                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                            }}
                        >{f}</button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px', color: '#9e97b0',
                    background: '#fafafa', borderRadius: '16px', border: '1px solid #e8e5f0',
                }}>
                    <CreditCard style={{ width: 40, height: 40, color: '#d4cfe0', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>No {filter !== 'all' ? filter : ''} credit requests</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map(req => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: '#fff', borderRadius: '14px', border: '1px solid #e8e5f0',
                                padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: '#1e1b2e' }}>{req.user_name}</h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#9e97b0' }}>{req.user_email}</p>
                                </div>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700, padding: '4px 12px',
                                    borderRadius: '20px', textTransform: 'capitalize',
                                    ...statusStyle(req.status),
                                }}>
                                    {req.status}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ background: '#f8f7fc', padding: '10px 14px', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#9e97b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b2e', textTransform: 'capitalize', marginTop: '2px' }}>{req.plan}</div>
                                </div>
                                <div style={{ background: '#f0f4ff', padding: '10px 14px', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#9e97b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Credits</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#4285F4', marginTop: '2px' }}>+{req.credits_requested}</div>
                                </div>
                                <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#9e97b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>₹{req.amount}</div>
                                </div>
                                {req.transaction_id && (
                                    <div style={{ background: '#f8f7fc', padding: '10px 14px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#9e97b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Txn ID</div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e1b2e', fontFamily: 'monospace', marginTop: '2px' }}>{req.transaction_id}</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {req.screenshot_url && (
                                    <button onClick={() => setViewingScreenshot(req.screenshot_url)}
                                        style={{
                                            padding: '7px 14px', borderRadius: '8px', border: '1px solid #e8e5f0',
                                            background: 'white', color: '#6b6580', fontSize: '12px', fontWeight: 600,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                        }}
                                    >
                                        <Eye style={{ width: 14, height: 14 }} /> Screenshot
                                    </button>
                                )}

                                {req.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleApprove(req.id)} disabled={processing === req.id}
                                            style={{
                                                padding: '7px 14px', borderRadius: '8px', border: 'none',
                                                background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                                                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '6px', opacity: processing === req.id ? 0.6 : 1,
                                            }}
                                        >
                                            <CheckCircle style={{ width: 14, height: 14 }} /> Approve
                                        </button>
                                        <button onClick={() => handleReject(req.id)} disabled={processing === req.id}
                                            style={{
                                                padding: '7px 14px', borderRadius: '8px', border: '1px solid #fecaca',
                                                background: '#fef2f2', color: '#dc2626',
                                                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '6px', opacity: processing === req.id ? 0.6 : 1,
                                            }}
                                        >
                                            <XCircle style={{ width: 14, height: 14 }} /> Reject
                                        </button>
                                    </>
                                )}

                                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9e97b0' }}>
                                    {new Date(req.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Screenshot Modal */}
            <AnimatePresence>
                {viewingScreenshot && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setViewingScreenshot(null)}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000, backdropFilter: 'blur(4px)', cursor: 'pointer',
                        }}
                    >
                        <motion.img
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            src={viewingScreenshot} alt="Payment Screenshot" referrerPolicy="no-referrer"
                            style={{ maxWidth: '90%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Guidelines Manager ────────────────────────────
const GuidelinesManager: React.FC = () => {
    const [pdfUrl, setPdfUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchGuidelines = async () => {
        try {
            const data = await guidelinesApi.get();
            setPdfUrl(data.url || '');
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGuidelines(); }, []);

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setFeedback(null);
        try {
            await guidelinesApi.upload(selectedFile);
            setFeedback({ type: 'success', text: 'Guidelines PDF uploaded successfully!' });
            setSelectedFile(null);
            // Re-fetch to get new URL
            setLoading(true);
            await fetchGuidelines();
        } catch (err: any) {
            setFeedback({ type: 'error', text: err.error || 'Failed to upload PDF' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e1b2e', marginBottom: '4px' }}>
                Guidelines PDF
            </h1>
            <p style={{ color: '#6b6580', fontSize: '14px', marginBottom: '24px' }}>
                Upload a "Guidelines to Use" PDF that will be displayed to all users on the Automate Form page.
            </p>

            {/* Feedback */}
            <AnimatePresence>
                {feedback && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                            borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: 500,
                            background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                        }}>
                        {feedback.type === 'success' ? <CheckCircle style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
                        {feedback.text}
                        <button onClick={() => setFeedback(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '16px' }}>×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Section */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8e5f0', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Upload style={{ width: 18, height: 18, color: '#4285F4' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b2e' }}>
                        {pdfUrl ? 'Replace Guidelines PDF' : 'Upload Guidelines PDF'}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{
                        flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 16px', borderRadius: '10px', border: '2px dashed #d4cfe0',
                        background: '#fafafa', cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                        <FileText style={{ width: 20, height: 20, color: '#9e97b0', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: selectedFile ? '#1e1b2e' : '#9e97b0', fontWeight: selectedFile ? 600 : 400 }}>
                            {selectedFile ? selectedFile.name : 'Choose a PDF file...'}
                        </span>
                        <input type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
                            onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} />
                    </label>

                    <button onClick={handleUpload} disabled={!selectedFile || uploading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px', borderRadius: '10px', border: 'none',
                            background: (!selectedFile || uploading) ? '#d1d5db' : 'linear-gradient(135deg, #4285F4, #5a9cf5)',
                            color: 'white', fontSize: '13px', fontWeight: 600,
                            cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer',
                            boxShadow: (!selectedFile || uploading) ? 'none' : '0 4px 16px rgba(66,133,244,0.25)',
                            whiteSpace: 'nowrap',
                        }}>
                        {uploading ? <><Spinner size="h-4 w-4" /> Uploading...</> : <><Upload style={{ width: 14, height: 14 }} /> Upload PDF</>}
                    </button>
                </div>
            </div>

            {/* Current PDF Preview */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8e5f0', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText style={{ width: 18, height: 18, color: '#10b981' }} />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e1b2e' }}>Current Guidelines</span>
                    </div>
                    {pdfUrl && (
                        <button onClick={() => { setLoading(true); fetchGuidelines(); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '8px', border: '1px solid #e8e5f0',
                                background: '#fff', color: '#6b6580', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                            }}>
                            <RefreshCw style={{ width: 12, height: 12 }} /> Refresh
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <Spinner />
                    </div>
                ) : pdfUrl ? (
                    <iframe
                        src={pdfUrl}
                        style={{
                            width: '100%', height: '600px', border: '1px solid #e8e5f0',
                            borderRadius: '10px', background: '#f8f7fc',
                        }}
                        title="Guidelines PDF Preview"
                        allow="autoplay"
                    />
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9e97b0' }}>
                        <FileText style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.5 }} />
                        <p style={{ fontSize: '14px', fontWeight: 500 }}>No guidelines PDF uploaded yet</p>
                        <p style={{ fontSize: '12px', color: '#b8b3c8' }}>Upload a PDF above to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Admin Layout ──────────────────────────────────
export const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'announcements' | 'credits' | 'guidelines'>('users');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
        fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
        background: active ? '#fff' : 'transparent',
        color: active ? '#4285F4' : '#9e97b0',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
        display: 'flex', alignItems: 'center', gap: '8px',
    });

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
                {/* Tab Switcher */}
                <div style={{
                    display: 'inline-flex', background: '#f0eef5', borderRadius: '12px', padding: '4px',
                    marginBottom: '24px', border: '1px solid #e8e5f0', overflowX: 'auto', maxWidth: '100%'
                }}>
                    <button onClick={() => setActiveTab('users')} style={tabStyle(activeTab === 'users')}>
                        <Users style={{ width: 16, height: 16, flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap' }}>User Management</span>
                    </button>
                    <button onClick={() => setActiveTab('announcements')} style={tabStyle(activeTab === 'announcements')}>
                        <Megaphone style={{ width: 16, height: 16, flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap' }}>Announcements</span>
                    </button>
                    <button onClick={() => setActiveTab('credits')} style={tabStyle(activeTab === 'credits')}>
                        <CreditCard style={{ width: 16, height: 16, flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap' }}>Credit Requests</span>
                    </button>
                    <button onClick={() => setActiveTab('guidelines')} style={tabStyle(activeTab === 'guidelines')}>
                        <FileText style={{ width: 16, height: 16, flexShrink: 0 }} /> <span style={{ whiteSpace: 'nowrap' }}>Guidelines</span>
                    </button>
                </div>

                {activeTab === 'users' ? <UserManagement /> : activeTab === 'announcements' ? <AnnouncementsManager /> : activeTab === 'credits' ? <CreditRequestsManager /> : <GuidelinesManager />}
            </main>
        </div>
    );
};
