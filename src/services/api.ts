const API_BASE = import.meta.env.VITE_API_URL || '';

// GAS requires POST for everything to handle JSON body correctly in doPost
// Requests are sent to the single Script URL with an 'action' parameter

interface ApiOptions {
    action: string;
    data?: any;
    headers?: Record<string, string>;
}

function getToken(): string | null {
    return localStorage.getItem('fg_token');
}

export function setToken(token: string): void {
    localStorage.setItem('fg_token', token);
}

export function clearToken(): void {
    localStorage.removeItem('fg_token');
    localStorage.removeItem('fg_user');
}

export function getStoredUser(): any | null {
    const user = localStorage.getItem('fg_user');
    return user ? JSON.parse(user) : null;
}

export function setStoredUser(user: any): void {
    localStorage.setItem('fg_user', JSON.stringify(user));
}

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data:image/png;base64, prefix
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

async function apiRequest(action: string, data: any = {}) {
    if (!API_BASE) {
        console.error('VITE_API_URL is not set. Please restart with the GAS URL.');
        throw { error: 'API URL not configured' };
    }

    const token = getToken();

    // Construct payload
    const payload = {
        action,
        token, // Send token in body for GAS to check
        ...data
    };

    // GAS Web App often has CORS issues with application/json
    // sending as text/plain (default) avoids preflight in some cases,
    // but here we will try standard fetch.
    // Ensure "redirect: follow" is set.

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain' },
            redirect: 'follow'
        });

        const result = await response.json();

        if (result.error) {
            throw { error: result.error };
        }
        return result;
    } catch (err: any) {
        console.error('API Request Failed:', err);
        throw err.error ? err : { error: 'Network or Server Error' };
    }
}

// ─── Auth API ─────────────────────────────────────
export const authApi = {
    // Modified to handle file conversion internally
    register: async (formData: FormData) => {
        const data: any = {};
        formData.forEach((value, key) => {
            if (typeof value === 'string') data[key] = value;
        });

        const file = formData.get('screenshot') as File;
        if (file && file.size > 0) {
            data.screenshotBase64 = await fileToBase64(file);
            data.mimeType = file.type;
        }

        return apiRequest('register', data);
    },

    login: (username: string, password: string) =>
        apiRequest('login', { username, password }),

    getProfile: () => apiRequest('getProfile'),
};

// ─── Admin API ────────────────────────────────────
export const adminApi = {
    getUsers: (status?: string) =>
        apiRequest('getUsers', { status }),

    getUserDetail: (id: string) =>
        Promise.reject('Not implemented in GAS version'), // Optional, users list has all info

    approveUser: (userId: string) =>
        apiRequest('approveUser', { userId }),

    rejectUser: (userId: string) =>
        apiRequest('rejectUser', { userId }),

    updateCredits: (userId: string, amount: number, creditAction: 'add' | 'reduce') =>
        apiRequest('updateCredits', { userId, amount, creditAction }),

    getScreenshot: (userId: string) => {
        // We can just get it from the user list if we sync it?
        // Or implement a specific getter. 
        // For now, let's assume we need to fetch it or finding it in the user object.
        // GAS "Code.gs" doesn't have a 'getScreenshot' action exposed in my update?
        // Wait, I forgot 'getScreenshot' in Code.gs update?
        // Actually, Code.gs handleGetUsers can return it, or I can add a specific action.
        // Let's rely on the URL being in the user object or implement a 'getScreenshot' action.
        // Looking at Code.gs 'generateScreenshotUrl', it is internal.
        // I used 'getScreenshot' in api.ts before.
        // Let's add 'getScreenshot' action to Code.gs too? 
        // Or better, let's just make 'getUsers' return it?
        // Ideally, 'getUsers' returns user list.
        // Let's add 'getScreenshot' to Code.gs in next step if missed.
        return apiRequest('getScreenshot', { userId });
        // I need to add this to Code.gs
    },

    toggleUserStatus: (userId: string, status: 'approved' | 'disabled') =>
        apiRequest('toggleUserStatus', { userId, status }),

    deleteUser: (userId: string) =>
        apiRequest('deleteUser', { userId }),
};

// ─── Credits API ──────────────────────────────────
export const creditsApi = {
    getBalance: async () => {
        const data = await authApi.getProfile();
        return { balance: data.user.credits, credits: data.user.credits };
    },
    deduct: (count: number = 1) => {
        const user = getStoredUser();
        if (!user) return Promise.reject('User not found');
        return apiRequest('updateCredits', { userId: user.id, amount: count, creditAction: 'reduce' });
    },
    getLogs: () => Promise.resolve({ logs: [] }), // Placeholder
};

// ─── QR Code ──────────────────────────────────────
export const getQrCodeUrl = () => Promise.resolve({ url: '' }); // Placeholder

// ─── Announcements API ───────────────────────────
export const announcementsApi = {
    getActive: () => apiRequest('getAnnouncements', { activeOnly: true }),
    getAll: () => apiRequest('getAnnouncements'),
    create: (title: string, message: string, type: string = 'info') =>
        apiRequest('createAnnouncement', { title, message, type }),
    remove: (id: string) =>
        apiRequest('deleteAnnouncement', { id }),
    toggle: (id: string) =>
        apiRequest('toggleAnnouncement', { id }),
};

// ─── Credit Requests API ─────────────────────────
export const creditRequestsApi = {
    submit: async (plan: string, transaction_id: string, screenshotFile?: File) => {
        const data: any = { plan, transaction_id };
        if (screenshotFile && screenshotFile.size > 0) {
            data.screenshotBase64 = await fileToBase64(screenshotFile);
            data.mimeType = screenshotFile.type;
        }
        return apiRequest('requestCredits', data);
    },
    getAll: () => apiRequest('getCreditRequests'),
    approve: (requestId: string) => apiRequest('approveCreditRequest', { requestId }),
    reject: (requestId: string) => apiRequest('rejectCreditRequest', { requestId }),
};

export const guidelinesApi = {
    upload: async (file: File) => {
        const pdfBase64 = await fileToBase64(file);
        return apiRequest('uploadGuidelines', { pdfBase64, mimeType: file.type });
    },
    get: () => apiRequest('getGuidelines'),
};

// ─── Settings API ────────────────────────────────
export const settingsApi = {
    getLimitations: () => apiRequest('getLimitations'),
    updateLimitations: (limitations: string) => apiRequest('updateLimitations', { limitations }),
};

// ─── Automation Logs API ──────────────────────────
export const automationLogsApi = {
    log: (batchSize: number) => apiRequest('logAutomation', { batchSize }),
};
