/**
 * Auth Module - Handles Firebase Authentication
 * Namespace: window.Auth
 */
window.Auth = (() => {
    'use strict';

    const loginPage = document.getElementById('login-page');
    const appPage = document.getElementById('app-page');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const loadingOverlay = document.getElementById('loading-overlay');

    /**
     * Generate initials-based avatar URL using UI Avatars service
     */
    function generateAvatarUrl(name) {
        const initials = (name || 'U')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
        // Create a canvas-based data URL for the avatar
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        // Background
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(40, 40, 40, 0, Math.PI * 2);
        ctx.fill();
        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 40, 42);
        return canvas.toDataURL('image/png');
    }

    /**
     * Sign in with Google popup
     */
    async function loginWithGoogle() {
        try {
            if (loadingOverlay) loadingOverlay.classList.add('active');
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Login error:', error);
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                if (window.UI && window.UI.showToast) {
                    window.UI.showToast('Giriş yapılırken bir hata oluştu: ' + error.message, 'error');
                }
            }
        } finally {
            if (loadingOverlay) loadingOverlay.classList.remove('active');
        }
    }

    /**
     * Sign out the current user
     */
    async function logout() {
        try {
            await auth.signOut();
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Başarıyla çıkış yapıldı.', 'success');
            }
        } catch (error) {
            console.error('Logout error:', error);
            if (window.UI && window.UI.showToast) {
                window.UI.showToast('Çıkış yapılırken bir hata oluştu.', 'error');
            }
        }
    }

    /**
     * Get the currently authenticated user
     */
    function getCurrentUser() {
        return auth.currentUser;
    }

    /**
     * Wrapper for Firebase onAuthStateChanged
     */
    function onAuthStateChanged(callback) {
        return auth.onAuthStateChanged(callback);
    }

    /**
     * Initialize auth state listener and update UI
     */
    function init() {
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                if (loginPage) loginPage.style.display = 'none';
                if (appPage) appPage.style.display = 'flex';

                // Set user avatar
                if (userAvatar) {
                    if (user.photoURL) {
                        userAvatar.src = user.photoURL;
                        userAvatar.onerror = () => {
                            userAvatar.src = generateAvatarUrl(user.displayName);
                        };
                    } else {
                        userAvatar.src = generateAvatarUrl(user.displayName);
                    }
                }

                // Set user info
                if (userName) userName.textContent = user.displayName || 'Kullanıcı';
                if (userEmail) userEmail.textContent = user.email || '';

                // Notify App module
                if (window.App && window.App.onUserLoggedIn) {
                    window.App.onUserLoggedIn(user);
                }
            } else {
                // User is signed out
                if (loginPage) loginPage.style.display = 'flex';
                if (appPage) appPage.style.display = 'none';

                // Notify App module
                if (window.App && window.App.onUserLoggedOut) {
                    window.App.onUserLoggedOut();
                }
            }

            // Hide loading overlay
            if (loadingOverlay) loadingOverlay.classList.remove('active');
        });
    }

    return {
        loginWithGoogle,
        logout,
        getCurrentUser,
        onAuthStateChanged,
        init
    };
})();
