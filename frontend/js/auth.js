const API_BASE_URL = 'http://localhost:8081/api';

// Switch between login and signup forms
function switchToSignup(event) {
    event.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('active');
}

function switchToLogin(event) {
    event.preventDefault();
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const btnText = document.getElementById('loginBtnText');
    const loader = document.getElementById('loginLoader');
    
    btnText.style.display = 'none';
    loader.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            showToast('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'movie.html';
            }, 1500);
        } else {
            showToast(data.message, 'error');
            btnText.style.display = 'block';
            loader.style.display = 'none';
        }
    } catch (error) {
        showToast('Connection error. Please try again.', 'error');
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
}

// Handle Signup
async function handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    const btnText = document.getElementById('signupBtnText');
    const loader = document.getElementById('signupLoader');
    
    btnText.style.display = 'none';
    loader.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            showToast('Account created! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'movie.html';
            }, 1500);
        } else {
            showToast(data.message, 'error');
            btnText.style.display = 'block';
            loader.style.display = 'none';
        }
    } catch (error) {
        showToast('Connection error. Please try again.', 'error');
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        window.location.href = 'movie.html';
    }
});