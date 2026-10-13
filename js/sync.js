/**
 * Balancer - Multi-Device Cloud Synchronization Module
 * Real-time bidirectional synchronization using Cloud Firestore (balancer-1ab7e)
 */

import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

class CloudSync {
  constructor() {
    this.db = null;
    this.currentUser = null;
    this.store = null;
    this.unsubscribeSnapshot = null;
    this.storeUnsubscribe = null;
    this.isApplyingRemoteUpdate = false;
    this.syncTimeout = null;
    this.status = 'idle'; // 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
    this.statusMessage = 'Not connected';
    this.listeners = [];
  }

  init(app) {
    if (!app) return;
    try {
      this.db = getFirestore(app);
      console.log('Cloud Firestore initialized for Balancer real-time sync');
    } catch (err) {
      console.error('Failed to initialize Firestore:', err);
      this.setStatus('error', 'Firestore init error');
    }
  }

  onStatusChange(fn) {
    this.listeners.push(fn);
    fn(this.status, this.statusMessage);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  setStatus(status, message) {
    this.status = status;
    this.statusMessage = message;
    this.listeners.forEach(fn => fn(status, message));
    this.updateUI();
  }

  updateUI() {
    const indicator = document.getElementById('cloudSyncIndicator');
    const statusText = document.getElementById('cloudSyncStatusText');
    const profileSyncStatus = document.getElementById('profileSyncStatus');

    if (indicator) {
      indicator.className = `cloud-sync-badge sync-${this.status}`;
      indicator.title = `Cloud Sync: ${this.statusMessage}`;
    }
    if (statusText) {
      if (this.status === 'syncing') statusText.textContent = 'Syncing...';
      else if (this.status === 'synced') statusText.textContent = 'Synced';
      else if (this.status === 'error') statusText.textContent = 'Sync Error';
      else if (this.status === 'offline') statusText.textContent = 'Offline';
      else statusText.textContent = 'Ready';
    }
    if (profileSyncStatus) {
      profileSyncStatus.textContent = this.statusMessage;
    }
  }

  connectUser(user, store) {
    if (!this.db || !user) return;
    this.currentUser = user;
    this.store = store || (typeof window !== 'undefined' ? window.balancerStore : null);
    this.cleanup();

    this.setStatus('syncing', 'Connecting to cloud...');
    const userDocRef = doc(this.db, 'users', user.uid);

    // Real-time listener: delivers live updates whenever changes occur on this or other devices
    this.unsubscribeSnapshot = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.metadata && docSnap.metadata.hasPendingWrites) {
          // Local write completed locally and is syncing to cloud
          this.setStatus('synced', 'Changes saved to cloud');
          return;
        }

        const activeStore = this.store || (typeof window !== 'undefined' ? window.balancerStore : null);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && activeStore) {
            this.isApplyingRemoteUpdate = true;
            try {
              activeStore.applyRemoteData({
                settings: data.settings,
                history: data.history,
                currentForm: data.currentForm
              });
              this.setStatus('synced', 'Synced across devices');
            } catch (err) {
              console.error('Error applying remote data:', err);
              this.setStatus('error', 'Sync merge error');
            } finally {
              this.isApplyingRemoteUpdate = false;
            }
          }
        } else {
          // First time sign-in on fresh account: push initial store state to cloud
          if (activeStore) {
            this.uploadInitialState(user, activeStore);
          }
        }
      },
      (error) => {
        console.error('Firestore onSnapshot error:', error);
        this.setStatus('error', 'Sync connection failed');
      }
    );

    // Subscribe to store updates to automatically push local changes to Firestore
    const currentActiveStore = this.store || (typeof window !== 'undefined' ? window.balancerStore : null);
    if (currentActiveStore && !this.storeUnsubscribe) {
      this.storeUnsubscribe = currentActiveStore.subscribe(() => {
        if (this.isApplyingRemoteUpdate || !this.currentUser) return;
        this.schedulePush(currentActiveStore);
      });
    }
  }

  async uploadInitialState(user, store) {
    if (!this.db || !user || !store) return;
    try {
      this.setStatus('syncing', 'Backing up to cloud...');
      const userDocRef = doc(this.db, 'users', user.uid);
      const payload = {
        uid: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: store.sanitizeSettings(store.settings),
        history: store.sanitizeHistory(store.history),
        currentForm: store.sanitizeCurrentForm(store.currentForm)
      };
      await setDoc(userDocRef, payload);
      this.setStatus('synced', 'Initial data backed up');
    } catch (err) {
      console.error('Failed initial upload:', err);
      this.setStatus('error', 'Initial cloud upload failed');
    }
  }

  schedulePush(store) {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.setStatus('syncing', 'Syncing changes...');
    this.syncTimeout = setTimeout(() => {
      this.pushToCloud(store);
    }, 600);
  }

  async pushToCloud(store) {
    if (!this.db || !this.currentUser || !store) return;
    try {
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const payload = {
        updatedAt: Date.now(),
        settings: store.sanitizeSettings(store.settings),
        history: store.sanitizeHistory(store.history),
        currentForm: store.sanitizeCurrentForm(store.currentForm)
      };
      await setDoc(userDocRef, payload, { merge: true });
      this.setStatus('synced', 'All changes synced');
    } catch (err) {
      console.error('Cloud push failed:', err);
      this.setStatus('error', 'Sync failed, will retry');
    }
  }

  async forceSyncNow(store) {
    const activeStore = store || this.store || (typeof window !== 'undefined' ? window.balancerStore : null);
    if (!this.db || !this.currentUser || !activeStore) return false;
    this.setStatus('syncing', 'Synchronizing now...');
    try {
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.isApplyingRemoteUpdate = true;
        activeStore.applyRemoteData({
          settings: data.settings,
          history: data.history,
          currentForm: data.currentForm
        });
        this.isApplyingRemoteUpdate = false;
      } else {
        await this.uploadInitialState(this.currentUser, activeStore);
      }
      this.setStatus('synced', 'Sync up to date');
      return true;
    } catch (err) {
      console.error('Force sync error:', err);
      this.setStatus('error', 'Sync failed');
      return false;
    }
  }

  cleanup() {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  disconnectUser() {
    this.cleanup();
    this.currentUser = null;
    this.setStatus('idle', 'Signed Out');
  }
}

export const cloudSync = new CloudSync();
if (typeof window !== 'undefined') {
  window.cloudSync = cloudSync;
}
