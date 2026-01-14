const Auth = {
    user: null,

    async checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            this.user = data.user;
            this.updateUI();
        } catch (err) {
        }
    },

    async login(username, password, feedbackElement) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            window.location.href = '/dashboard.html';
        } else {
            if (feedbackElement) {
                feedbackElement.textContent = data.error || 'Login failed';
                feedbackElement.className = 'feedback-message feedback-error';
                feedbackElement.style.display = 'block';
            }
        }
    },

    async register(username, email, password, role, feedbackElement) {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });
        const data = await res.json();
        if (res.ok) {
            window.location.href = '/dashboard.html';
        } else {
            if (feedbackElement) {
                feedbackElement.textContent = data.error || 'Signup failed';
                feedbackElement.className = 'feedback-message feedback-error';
                feedbackElement.style.display = 'block';
            }
        }
    },

    async logout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/index.html';
    },

    updateUI() {
        const navAuth = document.getElementById('nav-auth');
        const navAnon = document.getElementById('nav-anon');
        
        if (this.user) {
            if (navAuth) navAuth.style.display = 'flex';
            if (navAnon) navAnon.style.display = 'none';
        } else {
            if (navAuth) navAuth.style.display = 'none';
            if (navAnon) navAnon.style.display = 'flex';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.checkAuth();
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
});
