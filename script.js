const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const API_BASE_URL = window.location.port === '3000' ? '' : 'http://localhost:3000';

function openLoginModal() {
    loginModal.style.display = 'block';
}

function closeLoginModal() {
    loginModal.style.display = 'none';
}

function openSignupModal() {
    signupModal.style.display = 'block';
}

function closeSignupModal() {
    signupModal.style.display = 'none';
}

function toggleModals(event) {
    event.preventDefault();

    if (loginModal.style.display === 'block') {
        closeLoginModal();
        openSignupModal();
        return;
    }

    closeSignupModal();
    openLoginModal();
}

async function requestJson(url, payload) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
    });

    const responseType = response.headers.get('content-type') || '';
    let data = { success: false, message: 'Unexpected server response' };

    if (responseType.includes('application/json')) {
        try {
            data = await response.json();
        } catch (error) {
            data = { success: false, message: 'Invalid JSON response from server' };
        }
    } else {
        const rawBody = await response.text();
        const looksLikeHtml = /<html|<!doctype/i.test(rawBody);
        data = {
            success: false,
            message: looksLikeHtml
                ? 'API endpoint not found. Start Node server and open http://localhost:3000'
                : (rawBody || `Request failed with status ${response.status}`)
        };
    }

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
}

function setButtonLoading(button, isLoading, loadingText, defaultText) {
    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : defaultText;
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const signupForm = document.querySelector('.signup-form');

    loginForm.addEventListener('submit', async event => {
        event.preventDefault();

        const submitButton = loginForm.querySelector('button[type="submit"]');
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        setButtonLoading(submitButton, true, 'Logging in...', 'Login');

        try {
            const loginResult = await requestJson('/api/login', { email, password });
            closeLoginModal();
            if (loginResult.data && loginResult.data.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'user-dashboard.html';
            }
        } catch (error) {
            alert(error.message || 'Login failed');
        } finally {
            setButtonLoading(submitButton, false, 'Logging in...', 'Login');
        }
    });

    signupForm.addEventListener('submit', async event => {
        event.preventDefault();

        const submitButton = signupForm.querySelector('button[type="submit"]');
        const firstName = document.getElementById('signup-fname').value.trim();
        const lastName = document.getElementById('signup-lname').value.trim();
        const name = `${firstName} ${lastName}`.trim();
        const email = document.getElementById('signup-email').value.trim();
        const birthday = document.getElementById('signup-birthday').value;
        const gender = document.getElementById('signup-gender').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        const agreedTerms = document.getElementById('agree-terms').checked;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (!agreedTerms) {
            alert('Please agree to the Terms of Service and Privacy Policy');
            return;
        }

        setButtonLoading(submitButton, true, 'Creating account...', 'Create Account');

        try {
            await requestJson('/api/signup', {
                name,
                firstName,
                lastName,
                email,
                birthday,
                gender,
                password
            });
            alert('Account created successfully. Please log in.');
            signupForm.reset();
            closeSignupModal();
            openLoginModal();
        } catch (error) {
            alert(error.message || 'Sign up failed');
        } finally {
            setButtonLoading(submitButton, false, 'Creating account...', 'Create Account');
        }
    });
});

window.addEventListener('click', event => {
    if (event.target === loginModal) {
        closeLoginModal();
    }

    if (event.target === signupModal) {
        closeSignupModal();
    }
});

window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        closeLoginModal();
        closeSignupModal();
    }
});
