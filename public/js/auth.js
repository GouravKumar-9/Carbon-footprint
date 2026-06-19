/**
 * CarbonTrack India — Authentication & CSRF Module
 * Extracted from app.js to improve code quality and separation of concerns.
 */

// Helper to extract CSRF double-submit token from document.cookie
function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrfToken=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}

function isAuthenticated() {
  return !!localStorage.getItem('authUser') || !!sessionStorage.getItem('authToken');
}

function updateAuthUI() {
  const loggedIn = isAuthenticated();
  document.querySelectorAll('.private-link').forEach(el => {
    el.style.display = loggedIn ? '' : 'none';
  });
  const loginBtn = document.getElementById('nav-login-btn');
  if (loginBtn) loginBtn.style.display = loggedIn ? 'none' : '';

  const userJson = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
  if (loggedIn && userJson) {
    try {
      const user = JSON.parse(userJson);
      const greetingEl = document.querySelector('.dash-greeting');
      if (greetingEl) greetingEl.textContent = `Good morning, ${user.name || 'Gaurav'} 👋`;
    } catch (e) {
      console.error(e);
    }
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const emailInput    = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorEl       = document.getElementById('login-error-msg');

  if (emailInput)    emailInput.removeAttribute('aria-invalid');
  if (passwordInput) passwordInput.removeAttribute('aria-invalid');
  if (errorEl)       errorEl.style.display = 'none';

  const email    = emailInput    ? emailInput.value    : '';
  const password = passwordInput ? passwordInput.value : '';

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');

    // Storage updates (token handled securely by HTTP-only cookie)
    localStorage.setItem('authUser', JSON.stringify(data.user));
    sessionStorage.setItem('authUser', JSON.stringify(data.user));
    
    if (data.token) {
      sessionStorage.setItem('authToken', data.token);
    }

    showToast('Welcome back! 🌿', `Logged in as ${data.user.name}.`);
    if (emailInput)    emailInput.value    = '';
    if (passwordInput) passwordInput.value = '';
    updateAuthUI();
    showPage('dashboard');
  } catch (err) {
    console.error('Login error:', err);
    if (errorEl) {
      errorEl.textContent = err.message || 'Invalid email or password.';
      errorEl.style.display = 'block';
      if (emailInput)    emailInput.setAttribute('aria-invalid', 'true');
      if (passwordInput) passwordInput.setAttribute('aria-invalid', 'true');
    }
  }
}

async function handleLogout() {
  localStorage.removeItem('authUser');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
  try {
    await fetch('/api/logout', { 
      method: 'POST',
      headers: {
        'X-CSRF-Token': getCsrfToken()
      }
    });
  } catch (err) {
    console.error('Logout request failed:', err);
  }
  showToast('Logged out 🌿', 'You have successfully logged out.');
  updateAuthUI();
  showPage('landing');
}

function togglePasswordVisibility(event) {
  const input = document.getElementById('login-password');
  const btn   = event.currentTarget || event.target;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
    btn.setAttribute('aria-label', 'Hide password');
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
    btn.setAttribute('aria-label', 'Show password');
  }
}
