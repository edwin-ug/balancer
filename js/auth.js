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
window.balancerAuth = {
  auth,
  currentUser: null
};

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
    default:
      return 'Authentication failed. Please check your input and try again.';
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

  // -------------------------------------------------------------
  // TAB SWITCHING (Accents appear strictly and exclusively on the active tab)
  // -------------------------------------------------------------
  function switchAuthTab(tabName) {
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
        // User is SIGNED OUT: Hide App, Reveal Login Screen Gate
        cloudSync.disconnectUser();
        if (appRoot) appRoot.style.display = 'none';
        if (authGateScreen) authGateScreen.style.display = 'flex';

        if (authHeaderLabel) authHeaderLabel.textContent = 'Sign In';
        if (btnAuthHeader) {
          btnAuthHeader.classList.remove('authenticated');
        }

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
      if (window.showToast) window.showToast('Cloud sync complete', 'success');
    });
  }

  // -------------------------------------------------------------
  // FORM 1: SIGN IN
  // -------------------------------------------------------------
  if (formSignIn) {
    formSignIn.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('inputSignInEmail').value.trim();
      const password = document.getElementById('inputSignInPassword').value;
      const btnSubmit = formSignIn.querySelector('button[type="submit"]');

      if (!email || !password) {
        if (window.showToast) window.showToast('Please enter both email and password', 'warning');
        return;
      }

      const originalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Signing in...';

      try {
        await signInWithEmailAndPassword(auth, email, password);
        if (window.showToast) window.showToast(`Welcome back, ${email}!`, 'success');
        formSignIn.reset();
      } catch (err) {
        console.error('Sign In Error:', err);
        const msg = getFriendlyAuthErrorMessage(err.code);
        if (window.showToast) window.showToast(msg, 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
      }
    });
  }

  // -------------------------------------------------------------
  // FORM 2: CREATE ACCOUNT (SIGN UP)
  // -------------------------------------------------------------
  if (formSignUp) {
    formSignUp.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('inputSignUpEmail').value.trim();
      const password = document.getElementById('inputSignUpPassword').value;
      const confirmPassword = document.getElementById('inputSignUpConfirmPassword').value;
      const btnSubmit = formSignUp.querySelector('button[type="submit"]');

      if (!email || !password) {
        if (window.showToast) window.showToast('Please fill out all required fields', 'warning');
        return;
      }

      if (password !== confirmPassword) {
        if (window.showToast) window.showToast('Passwords do not match', 'warning');
        return;
      }

      if (password.length < 6) {
        if (window.showToast) window.showToast('Password must be at least 6 characters', 'warning');
        return;
      }

      const originalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Creating account...';

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        if (window.showToast) window.showToast(`Account successfully created for ${email}!`, 'success');
        formSignUp.reset();
      } catch (err) {
        console.error('Sign Up Error:', err);
        const msg = getFriendlyAuthErrorMessage(err.code);
        if (window.showToast) window.showToast(msg, 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
      }
    });
  }

  // -------------------------------------------------------------
  // FORM 3: RESET PASSWORD
  // -------------------------------------------------------------
  if (formReset) {
    formReset.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('inputResetEmail').value.trim();
      const btnSubmit = formReset.querySelector('button[type="submit"]');

      if (!email) {
        if (window.showToast) window.showToast('Please enter your account email address', 'warning');
        return;
      }

      const originalText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Sending reset link...';

      try {
        await sendPasswordResetEmail(auth, email);
        if (window.showToast) window.showToast(`Password reset link sent to ${email}`, 'success');
        switchAuthTab('signin');
        formReset.reset();
      } catch (err) {
        console.error('Reset Error:', err);
        const msg = getFriendlyAuthErrorMessage(err.code);
        if (window.showToast) window.showToast(msg, 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
      }
    });
  }

  // -------------------------------------------------------------
  // SIGN OUT ACTION
  // -------------------------------------------------------------
  if (btnAuthSignOut) {
    btnAuthSignOut.addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out of Balancer?')) {
        try {
          await signOut(auth);
          if (modalAuth) modalAuth.classList.remove('open');
          if (window.showToast) window.showToast('Signed out of Balancer', 'info');
        } catch (err) {
          console.error('Sign Out Error:', err);
          if (window.showToast) window.showToast('Failed to sign out', 'error');
        }
      }
    });
  }
});
