/**
 * Session Management Utility
 * Handles participant session initialization and cleanup for HHLC User Study
 */

class SessionManager {
    constructor() {
        this.participantId = null;
        this.sessionId = null;
        this.isInitialized = false;
    }

    /**
     * Initialize a new session for a participant
     * Clears all previous localStorage data and sets up fresh session
     */
    async initializeSession() {
        try {
            // Clear all existing localStorage data
            this.clearLocalStorage();
            
            // Initialize server-side session
            const response = await fetch('/api/init-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Failed to initialize session');
            }
            
            const sessionData = await response.json();
            
            if (sessionData.success) {
                this.participantId = sessionData.participantId;
                this.sessionId = sessionData.sessionId;
                this.isInitialized = true;
                
                // Store session info in sessionStorage (not localStorage)
                sessionStorage.setItem('sessionManager', JSON.stringify({
                    participantId: this.participantId,
                    sessionId: this.sessionId,
                    initialized: true,
                    startTime: Date.now()
                }));
                
                console.log(`Session initialized for participant: ${this.participantId}`);
                return {
                    success: true,
                    participantId: this.participantId,
                    sessionId: this.sessionId
                };
            } else {
                throw new Error('Session initialization failed');
            }
        } catch (error) {
            console.error('Session initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if current session is valid
     */
    async checkSession() {
        try {
            const response = await fetch('/api/session-status');
            const sessionStatus = await response.json();
            
            // Also check sessionStorage for client-side state
            const clientSession = JSON.parse(sessionStorage.getItem('sessionManager') || '{}');
            
            this.isInitialized = sessionStatus.sessionActive && clientSession.initialized;
            this.participantId = sessionStatus.participantId;
            
            return {
                isValid: this.isInitialized,
                participantId: this.participantId,
                studyStartTime: sessionStatus.studyStartTime
            };
        } catch (error) {
            console.error('Session check error:', error);
            return { isValid: false, error: error.message };
        }
    }

    /**
     * Clear all localStorage data used by the study
     */
    clearLocalStorage() {
        const keysToRemove = [
            'participantData',
            'studyStartTime',
            'studyProgress',
            'currentStep',
            'chartResponses'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('localStorage cleared for new session');
    }

    /**
     * Clear session data on study completion or restart
     */
    async clearSession() {
        try {
            // Clear server-side session
            await fetch('/api/clear-session', { method: 'POST' });
            
            // Clear client-side storage
            this.clearLocalStorage();
            sessionStorage.removeItem('sessionManager');
            
            // Reset internal state
            this.participantId = null;
            this.sessionId = null;
            this.isInitialized = false;
            
            console.log('Session cleared successfully');
            return { success: true };
        } catch (error) {
            console.error('Session clear error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current participant ID
     */
    getParticipantId() {
        if (!this.isInitialized) {
            const clientSession = JSON.parse(sessionStorage.getItem('sessionManager') || '{}');
            return clientSession.participantId || null;
        }
        return this.participantId;
    }

    /**
     * Ensure session is initialized before proceeding
     */
    async ensureSession() {
        const sessionCheck = await this.checkSession();
        
        if (!sessionCheck.isValid) {
            console.log('No valid session found, redirecting to start...');
            window.location.href = 'index.html';
            return false;
        }
        
        return true;
    }

    /**
     * Initialize on page load if coming from start
     */
    static async initializeOnStart() {
        const sessionManager = new SessionManager();
        
        // Check if we're on the start page or if this is a fresh visit
        const currentPage = window.location.pathname;
        const isStartPage = currentPage.endsWith('index.html') || currentPage === '/' || currentPage.endsWith('/');
        
        if (isStartPage) {
            // Always initialize fresh session on start page
            return await sessionManager.initializeSession();
        } else {
            // On other pages, check if session exists
            const sessionCheck = await sessionManager.checkSession();
            if (!sessionCheck.isValid) {
                console.log('No valid session, redirecting to start...');
                window.location.href = 'index.html';
                return null;
            }
            return sessionManager;
        }
    }

    /**
     * Get current session data
     */
    getCurrentSession() {
        return JSON.parse(sessionStorage.getItem('sessionManager') || '{}');
    }

    /**
     * Save session data
     */
    saveSession(sessionData) {
        sessionStorage.setItem('sessionManager', JSON.stringify(sessionData));
    }

    /**
     * Add study completion marker
     */
    markStudyComplete() {
        if (this.isInitialized) {
            const clientSession = JSON.parse(sessionStorage.getItem('sessionManager') || '{}');
            clientSession.studyCompleted = true;
            clientSession.completionTime = Date.now();
            sessionStorage.setItem('sessionManager', JSON.stringify(clientSession));
        }
    }
}

// Auto-initialize session management
window.SessionManager = SessionManager;

// Automatically handle session on page load
document.addEventListener('DOMContentLoaded', async function() {
    const currentPage = window.location.pathname;
    const isStartPage = currentPage.endsWith('index.html') || currentPage === '/' || currentPage.endsWith('/');
    
    if (!isStartPage) {
        const sessionManager = new SessionManager();
        const sessionValid = await sessionManager.ensureSession();
        
        if (sessionValid) {
            // Store global reference for other scripts to use
            window.currentSession = sessionManager;
        }
    }
});
