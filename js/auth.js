/**
 * 8Agency Dashboard - Authentication System
 * Multi-user authentication with role-based access
 */

const AuthSystem = {
    // Predefined users - The 8 Agency Team (todos con acceso completo)
    users: [
        { username: 'alexis', password: '8agency', name: 'Alexis', role: 'Admin', avatar: 'A' },
        { username: 'rodolfo', password: '8agency', name: 'Rodolfo', role: 'Admin', avatar: 'R' },
        { username: 'diego', password: '8agency', name: 'Diego', role: 'Admin', avatar: 'D' },
        { username: 'luz', password: '8agency', name: 'Luz', role: 'Admin', avatar: 'L' }
    ],

    // Session storage key
    SESSION_KEY: '8agency_session',

    /**
     * Initialize authentication
     */
    init() {
        // Check if on login page
        if (document.getElementById('loginForm')) {
            this.initLoginPage();
        }

        // Check if on dashboard page
        if (document.querySelector('.dashboard-page')) {
            this.checkAuth();
            this.initLogout();
        }
    },

    /**
     * Initialize login page functionality
     */
    initLoginPage() {
        const form = document.getElementById('loginForm');
        const togglePassword = document.querySelector('.toggle-password');
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('errorMessage');

        // Check if already logged in
        if (this.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return;
        }

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim().toLowerCase();
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;

            const result = this.login(username, password, remember);

            if (result.success) {
                window.location.href = 'dashboard.html';
            } else {
                this.showError(errorMessage, result.message);
            }
        });

        // Toggle password visibility
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;

                const eyeIcon = togglePassword.querySelector('.eye-icon');
                if (type === 'text') {
                    eyeIcon.innerHTML = `
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                    `;
                } else {
                    eyeIcon.innerHTML = `
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    `;
                }
            });
        }

        // Clear error on input
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                errorMessage.classList.remove('show');
            });
        });
    },

    /**
     * Attempt to log in a user
     */
    login(username, password, remember = false) {
        const user = this.users.find(u =>
            u.username.toLowerCase() === username && u.password === password
        );

        if (!user) {
            return { success: false, message: 'Usuario o contraseña incorrectos' };
        }

        // Create session
        const session = {
            username: user.username,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            loginTime: new Date().toISOString(),
            remember: remember
        };

        // Store session
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(this.SESSION_KEY, JSON.stringify(session));

        return { success: true, user: session };
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.getSession() !== null;
    },

    /**
     * Get current session
     */
    getSession() {
        let session = sessionStorage.getItem(this.SESSION_KEY);
        if (!session) {
            session = localStorage.getItem(this.SESSION_KEY);
        }

        if (session) {
            try {
                return JSON.parse(session);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    /**
     * Check authentication and redirect if not logged in
     */
    checkAuth() {
        const session = this.getSession();

        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        // Update UI with user info
        this.updateUserUI(session);
    },

    /**
     * Update UI with user information
     */
    updateUserUI(session) {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');

        if (userAvatar) userAvatar.textContent = session.avatar;
        if (userName) userName.textContent = session.name;
        if (userRole) userRole.textContent = session.role;
    },

    /**
     * Initialize logout functionality
     */
    initLogout() {
        const logoutBtn = document.getElementById('logoutBtn');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    },

    /**
     * Log out user
     */
    logout() {
        sessionStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'index.html';
    },

    /**
     * Show error message
     */
    showError(element, message) {
        element.textContent = message;
        element.classList.add('show');

        // Shake animation
        element.parentElement.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            element.parentElement.style.animation = '';
        }, 500);
    }
};

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    AuthSystem.init();
});
