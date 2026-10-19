/**
 * Balancer - Firebase Authentication Module
 * Handles Dedicated Login Screen Gate, Email/Password Sign-In, Sign-Up, Sign-Out, Password Reset, and State Observation
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";
import { cloudSync } from "./sync.js";

// Initialize Firebase App & Auth
let app;
let auth;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  cloudSync.init(app);
} catch (err) {
  console.error("Failed to initialize Firebase:", err);
}

// Global reference
// Global reference
window.balancerAuth = {
  auth,
  currentUser: null
};

// Global showToast fallback guaranteed to work anywhere
function showToast(message, type = 'info') {
  if (typeof window !== 'undefined' && typeof window.showToast === 'function' && window.showToast !== showToast) {
    return window.showToast(message, type);
  }
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  let iconSvg = `<svg class="ui-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  if (type === 'success') {
    iconSvg = `<svg class="ui-svg-sm" style="color: var(--success);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="ui-svg-sm" style="color: var(--danger);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  }
  toast.innerHTML = `<span>${iconSvg}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Friendly Firebase error message translator
function getFriendlyAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few moments and try again.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    default:
      return 'Authentication failed. Please check your credentials and try again.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Gate & Root Elements
  const authLoadingSplash = document.getElementById('authLoadingSplash');
  const authGateScreen = document.getElementById('authGateScreen');
  const appRoot = document.getElementById('appRoot');

  // Header Elements
  const btnAuthHeader = document.getElementById('btnAuthHeader');
  const authHeaderLabel = document.getElementById('authHeaderLabel');
  
  // Modal Elements
  const modalAuth = document.getElementById('modalAuth');
  const authProfileEmail = document.getElementById('authProfileEmail');
  const authProfileUid = document.getElementById('authProfileUid');
  const btnAuthSignOut = document.getElementById('btnAuthSignOut');

  // Settings tab status
  const settingsAuthStatus = document.getElementById('settingsAuthStatus');
  const btnSettingsOpenAuth = document.getElementById('btnSettingsOpenAuth');

  // Forms on Login Screen
  const formSignIn = document.getElementById('formSignIn');
  const formSignUp = document.getElementById('formSignUp');
  const formReset = document.getElementById('formReset');

  // Inline Alert Managers
  function showAuthAlert(panel, message, type = 'error') {
    let alertEl;
    if (panel === 'signin') alertEl = document.getElementById('authAlertSignIn');
    else if (panel === 'signup') alertEl = document.getElementById('authAlertSignUp');
    else if (panel === 'reset') alertEl = document.getElementById('authAlertReset');

    if (!alertEl) return;
    const iconSvg = type === 'success'
      ? `<svg class="ui-svg-sm" style="color: var(--success);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg class="ui-svg-sm" style="color: var(--danger);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    alertEl.className = `auth-alert auth-alert-${type}`;
    alertEl.innerHTML = `<span>${iconSvg}</span> <span>${message}</span>`;
    alertEl.style.display = 'flex';
  }

  function clearAuthAlerts() {
    ['authAlertSignIn', 'authAlertSignUp', 'authAlertReset'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'none';
        el.innerHTML = '';
      }
    });
  }

  // Clear alerts as soon as user types
  document.querySelectorAll('.auth-input').forEach(input => {
    input.addEventListener('input', () => {
      clearAuthAlerts();
    });
  });

  // -------------------------------------------------------------
  // TAB SWITCHING (Accents appear strictly and exclusively on the active tab)
  // -------------------------------------------------------------
  function switchAuthTab(tabName) {
    clearAuthAlerts();
    const allTabs = document.querySelectorAll('.auth-tab');
    const allPanels = document.querySelectorAll('.auth-panel');

    allTabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    allPanels.forEach(panel => {
      if (panel.getAttribute('data-panel') === tabName) {
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    });
  }

  // Attach tab click listeners
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = tab.getAttribute('data-tab');
      if (tabName) switchAuthTab(tabName);
    });
  });

  // Attach link switchers (e.g. "Create an account", "Forgot password?", "Sign in here")
  document.querySelectorAll('.link-switch-auth').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      if (target) switchAuthTab(target);
    });
  });

  // -------------------------------------------------------------
  // THEME TOGGLING ON LOGIN SCREEN
  // -------------------------------------------------------------
  function syncThemeIcons(theme) {
    document.querySelectorAll('.theme-icon-moon').forEach(moon => {
      moon.style.display = theme === 'dark' ? 'none' : 'inline-block';
    });
    document.querySelectorAll('.theme-icon-sun').forEach(sun => {
      sun.style.display = theme === 'dark' ? 'inline-block' : 'none';
    });
  }

  const savedTheme = localStorage.getItem('balancer_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  syncThemeIcons(savedTheme);

  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('balancer_theme', next);
      syncThemeIcons(next);
    });
  });

  // -------------------------------------------------------------
  // AUTH STATE OBSERVER (ENFORCES LOGIN GATE)
  // -------------------------------------------------------------
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      window.balancerAuth.currentUser = user;
      
      // Hide initial loading splash immediately
      if (authLoadingSplash) {
        authLoadingSplash.style.display = 'none';
      }

      if (user) {
        // User IS authenticated: Reveal App, Hide Login Screen
        if (authGateScreen) authGateScreen.style.display = 'none';
        if (appRoot) appRoot.style.display = 'block';

        const shortEmail = user.email ? (user.email.length > 20 ? user.email.slice(0, 18) + '...' : user.email) : 'Agent';
        if (authHeaderLabel) authHeaderLabel.textContent = shortEmail;
        if (btnAuthHeader) {
          btnAuthHeader.classList.add('authenticated');
          btnAuthHeader.title = `Signed in as ${user.email} (Click for account profile)`;
        }

        if (authProfileEmail) authProfileEmail.textContent = user.email || 'N/A';
        if (authProfileUid) authProfileUid.textContent = user.uid;

        if (settingsAuthStatus) {
          settingsAuthStatus.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="status-pill status-balanced" style="font-size: 0.8rem; padding: 3px 8px;">Authenticated</span>
              <span style="font-weight: 600; font-size: 0.9rem;">${user.email}</span>
            </div>
          `;
        }
        if (btnSettingsOpenAuth) {
          btnSettingsOpenAuth.textContent = 'Account Profile';
        }

        // Connect real-time bidirectional cloud sync across devices
        cloudSync.connectUser(user, window.balancerStore);
      } else {
        // User is SIGNED OUT: Close any open modals, hide App, reveal Login Screen Gate
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
        cloudSync.disconnectUser();
        if (appRoot) appRoot.style.display = 'none';
        if (authGateScreen) authGateScreen.style.display = 'flex';

        if (authHeaderLabel) authHeaderLabel.textContent = 'Sign In';
        if (btnAuthHeader) {
          btnAuthHeader.classList.remove('authenticated');
        }

        // Clear password fields for security and clean state
        const signInPwd = document.getElementById('inputSignInPassword');
        if (signInPwd) signInPwd.value = '';
        const signUpPwd = document.getElementById('inputSignUpPassword');
        if (signUpPwd) signUpPwd.value = '';
        const signUpConfirmPwd = document.getElementById('inputSignUpConfirmPassword');
        if (signUpConfirmPwd) signUpConfirmPwd.value = '';

        // Reset to Sign In tab cleanly
        switchAuthTab('signin');

        if (settingsAuthStatus) {
          settingsAuthStatus.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="status-pill status-surplus" style="background: var(--bg-card); color: var(--text-muted); border-color: var(--border); font-size: 0.8rem; padding: 3px 8px;">Not Signed In</span>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Sign in to secure access to Balancer</span>
            </div>
          `;
        }
        if (btnSettingsOpenAuth) {
          btnSettingsOpenAuth.textContent = 'Sign In / Register';
        }
      }
    });
  }

  // -------------------------------------------------------------
  // OPEN ACCOUNT PROFILE MODAL (When authenticated)
  // -------------------------------------------------------------
  function openProfileModal() {
    if (window.balancerAuth.currentUser) {
      if (modalAuth) modalAuth.classList.add('open');
    } else {
      if (appRoot) appRoot.style.display = 'none';
      if (authGateScreen) authGateScreen.style.display = 'flex';
      switchAuthTab('signin');
    }
  }

  if (btnAuthHeader) btnAuthHeader.addEventListener('click', openProfileModal);
  if (btnSettingsOpenAuth) btnSettingsOpenAuth.addEventListener('click', openProfileModal);

  const btnForceSync = document.getElementById('btnForceSync');
  if (btnForceSync) {
    btnForceSync.addEventListener('click', async () => {
      btnForceSync.disabled = true;
      btnForceSync.innerHTML = '<span>Syncing...</span>';
      await cloudSync.forceSyncNow(window.balancerStore);
      btnForceSync.disabled = false;
      btnForceSync.innerHTML = '<span>Sync Now</span>';
      showToast('Cloud sync complete', 'success');
    });
  }

  // -------------------------------------------------------------
  // FORM 1: SIGN IN
  // -------------------------------------------------------------
  if (formSignIn) {
    formSignIn.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthAlerts();

      const emailInput = document.getElementById('inputSignInEmail');
      const passwordInput = document.getElementById('inputSignInPassword');
      const email = (emailInput ? emailInput.value : '').trim().toLowerCase();
      const password = passwordInput ? passwordInput.value : '';
      const btnSubmit = formSignIn.querySelector('button[type="submit"]');

      if (!email) {
        showAuthAlert('signin', 'Please enter your email address.', 'error');
        showToast('Please enter your email address', 'warning');
        if (emailInput) emailInput.focus();
        return;
      }

      if (!password) {
        showAuthAlert('signin', 'Please enter your password.', 'error');
        showToast('Please enter your password', 'warning');
        if (passwordInput) passwordInput.focus();
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showAuthAlert('signin', 'Please enter a valid email address (e.g. name@domain.com).', 'error');
        showToast('Please enter a valid email address', 'warning');
        if (emailInput) emailInput.focus();
        return;
      }

      if (!auth) {
        const errorMsg = 'Authentication service is unavailable. Please check your internet connection.';
        showAuthAlert('signin', errorMsg, 'error');
        showToast(errorMsg, 'error');
        return;
      }

      const originalHtml = btnSubmit ? btnSubmit.innerHTML : '<span>Sign In to Balancer</span>';
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="auth-btn-spinner"></span> <span>Signing in...</span>`;
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        clearAuthAlerts();
        showToast(`Welcome back, ${userCredential.user?.email || email}!`, 'success');
        formSignIn.reset();
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      } catch (err) {
        console.error('Sign In Error:', err);
        const msg = getFriendlyAuthErrorMessage(err.code);
        showAuthAlert('signin', msg, 'error');
        showToast(msg, 'error');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = originalHtml;
        }
      }
    });
  }

  // -------------------------------------------------------------
  // FORM 2: CREATE ACCOUNT (SIGN UP)
  // -------------------------------------------------------------
  if (formSignUp) {
    formSignUp.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthAlerts();

      const emailInput = document.getElementById('inputSignUpEmail');
      const passwordInput = document.getElementById('inputSignUpPassword');
      const confirmPasswordInput = document.getElementById('inputSignUpConfirmPassword');

      const email = (emailInput ? emailInput.value : '').trim().toLowerCase();
      const password = passwordInput ? passwordInput.value : '';
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
      const btnSubmit = formSignUp.querySelector('button[type="submit"]');

      if (!email) {
        showAuthAlert('signup', 'Please enter your email address.', 'error');
        showToast('Please enter your email address', 'warning');
        if (emailInput) emailInput.focus();
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showAuthAlert('signup', 'Please enter a valid email address.', 'error');
        showToast('Please enter a valid email address', 'warning');
        if (emailInput) emailInput.focus();
        return;
      }

      if (!password) {
        showAuthAlert('signup', 'Please enter a password.', 'error');
        showToast('Please enter a password', 'warning');
        if (passwordInput) passwordInput.focus();
        return;
      }

      if (password.length < 6) {
        showAuthAlert('signup', 'Password must be at least 6 characters long.', 'error');
        showToast('Password must be at least 6 characters', 'warning');
        if (passwordInput) passwordInput.focus();
        return;
      }

      if (password !== confirmPassword) {
        showAuthAlert('signup', 'Passwords do not match. Please re-enter.', 'error');
        showToast('Passwords do not match', 'warning');
        if (confirmPasswordInput) confirmPasswordInput.focus();
        return;
      }

      if (!auth) {
        const errorMsg = 'Authentication service is unavailable. Please check your internet connection.';
        showAuthAlert('signup', errorMsg, 'error');
        showToast(errorMsg, 'error');
        return;
      }

      const originalHtml = btnSubmit ? btnSubmit.innerHTML : '<span>Create Account</span>';
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="auth-btn-spinner"></span> <span>Creating account...</span>`;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        clearAuthAlerts();
        showToast(`Account successfully created for ${userCredential.user?.email || email}!`, 'success');
        formSignUp.reset();
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      } catch (err) {
        console.error('Sign Up Error:', err);
        const msg = getFriendlyAuthErrorMessage(err.code);
        showAuthAlert('signup', msg, 'error');
        showToast(msg, 'error');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = originalHtml;
        }
      }
    });
  }

  // -------------------------------------------------------------
  // FORM 3: RESET PASSWORD
  // -------------------------------------------------------------
  if (formReset) {
    formReset.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthAlerts();

      const emailInput = document.getElementById('inputResetEmail');
      const email = (emailInput ? emailInput.value : '').trim().toLowerCase();
      const btnSubmit = formReset.querySelector('button[type="submit"]');

      if (!email) {
        showAuthAlert('reset', 'Please enter your registered email address.', 'error');
        showToast('Please enter your account email address', 'warning');
        if (emailInput) emailInput.focus();
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showAuthAlert('reset', 'Please enter a valid email address.', 'error');
        showToast('Please enter a valid email address', 'warning');
        if (emailInput) emailInput.focus();
        return;
      }

      if (!auth) {
        const errorMsg = 'Authentication service is unavailable. Please check your internet connection.';
        showAuthAlert('reset', errorMsg, 'error');
        showToast(errorMsg, 'error');
        return;
      }

      const originalHtml = btnSubmit ? btnSubmit.innerHTML : '<span>Send Password Reset Link</span>';
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="auth-btn-spinner"></span> <span>Sending reset link...</span>`;
      }

      try {
        await sendPasswordResetEmail(auth, email);
        showAuthAlert('reset', `Password reset link sent to ${email}. Please check your inbox.`, 'success');
        showToast(`Password reset link sent to ${email}`, 'success');
        formReset.reset();
        setTimeout(() => {
          switchAuthTab('signin');
        }, 2500);
      } catch (err) {
        console.error('Reset Error:', err);
        const msg = getFriendlyAuthErrorMessage(err.code);
        showAuthAlert('reset', msg, 'error');
        showToast(msg, 'error');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = originalHtml;
        }
      }
    });
  }

  // -------------------------------------------------------------
  // SIGN OUT ACTION
  // -------------------------------------------------------------
  if (btnAuthSignOut) {
    btnAuthSignOut.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to sign out of Balancer?')) return;
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      try {
        await signOut(auth);
        showToast('Signed out of Balancer', 'info');
      } catch (err) {
        console.error('Sign Out Error:', err);
        showToast('Failed to sign out', 'error');
      }
    });
  }
});
