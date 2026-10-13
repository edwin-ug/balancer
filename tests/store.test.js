const assert = require('assert');

// Simple mock for localStorage and window
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};
global.window = {};

// Load calculator & store
const { calculateBalancing } = require('../js/calculator.js');
global.calculateBalancing = calculateBalancing;

const { Store } = require('../js/store.js');

const store = new Store();

console.log('--- TESTING BALANCER STORE ---');

// Test default state
assert.strictEqual(store.settings.presetCapital, 20000000);
assert.strictEqual(store.settings.agents.length, 3);
assert.strictEqual(store.settings.stakeholders.length, 4);
assert.strictEqual(store.settings.floatAccounts.length, 13);
console.log('✓ Store initialization verified');

// Test saving a balancing session
const formData = {
  targetCapital: 20000000,
  float: { mtn1: 10000000, airtel1: 5000000 },
  cash: 4000000,
  agentPhones: { agent1: 1000000 },
  enableCommission: false,
  commissions: {},
  enableStakeholderOut: true,
  stakeholderOut: { stakeholder1: 500000 },
  enableStakeholderIn: true,
  stakeholderIn: { stakeholder2: 500000 },
  notes: 'First real balancing session'
};

const savedRec = store.saveBalancingSession(formData);
assert.strictEqual(store.history.length, 1);
assert.strictEqual(savedRec.targetCapital, 20000000);
assert.strictEqual(savedRec.netActualCapital, 20000000);
assert.strictEqual(savedRec.variance, 0);
assert.strictEqual(savedRec.status, 'balanced');
console.log('✓ Balancing session recorded and history updated');

// Test stakeholder ledger calculation
const ledger = store.getStakeholderLedger();
assert.strictEqual(ledger.stakeholder1.totalOut, 500000);
assert.strictEqual(ledger.stakeholder1.netBalance, 500000);
assert.strictEqual(ledger.stakeholder2.totalIn, 500000);
assert.strictEqual(ledger.stakeholder2.netBalance, -500000);
console.log('✓ Stakeholder ledger calculations verified');

// Test demo data load
store.loadDemoData();
assert.strictEqual(store.history.length, 2);
assert.strictEqual(store.settings.agents[0].name, 'Amina');
assert.strictEqual(store.settings.stakeholders[0].name, 'Director David');
console.log('✓ Demo data loaded and verified');

// Test adding a float account (parameter)
const newFloat = store.addFloatAccount('MTN 4', 'telecom', 'mtn');
assert(newFloat && newFloat.id);
assert.strictEqual(newFloat.name, 'MTN 4');
assert(store.settings.floatAccounts.some(acc => acc.name === 'MTN 4'));
console.log('✓ Adding float account verified');

// Test removing a float account (parameter)
const initialFloatCount = store.settings.floatAccounts.length;
store.removeFloatAccount('mtn1');
assert.strictEqual(store.settings.floatAccounts.length, initialFloatCount - 1);
assert(!store.settings.floatAccounts.some(acc => acc.id === 'mtn1'));
console.log('✓ Removing float account verified');

// Test restoring float accounts to defaults
store.resetFloatAccountsToDefault();
assert.strictEqual(store.settings.floatAccounts.length, 13);
assert(store.settings.floatAccounts.some(acc => acc.id === 'mtn1'));
console.log('✓ Restoring float accounts to defaults verified');

// Test adding and removing stakeholders
const newSh = store.addStakeholder('Director Paul');
assert(newSh && newSh.id);
assert.strictEqual(newSh.name, 'Director Paul');
assert(store.settings.stakeholders.some(s => s.name === 'Director Paul'));
const shCount = store.settings.stakeholders.length;
store.removeStakeholder(newSh.id);
assert.strictEqual(store.settings.stakeholders.length, shCount - 1);
console.log('✓ Adding and removing stakeholders verified');

// Test adding and removing agents
const newAg = store.addAgent('Agent Mary');
assert(newAg && newAg.id);
assert.strictEqual(newAg.name, 'Agent Mary');
assert(store.settings.agents.some(a => a.name === 'Agent Mary'));
const agCount = store.settings.agents.length;
store.removeAgent(newAg.id);
assert.strictEqual(store.settings.agents.length, agCount - 1);
console.log('✓ Adding and removing agents verified');

// Test Cloud Synchronization: applyRemoteData
const remoteSettings = {
  presetCapital: 35000000,
  capitalSource: 'preset',
  floatAccounts: [
    { id: 'mtn_remote', name: 'MTN Remote Line', category: 'telecom', provider: 'mtn', enabled: true }
  ]
};
const remoteHistory = [
  { id: 'remote_session_1', timestamp: Date.now(), targetCapital: 35000000, netActualCapital: 35000000, variance: 0, status: 'balanced' }
];

const syncResult = store.applyRemoteData({
  settings: remoteSettings,
  history: remoteHistory,
  currentForm: { cash: 1500000 }
});

assert.strictEqual(syncResult, true);
assert.strictEqual(store.settings.presetCapital, 35000000);
assert.strictEqual(store.history.length, 1);
assert.strictEqual(store.history[0].id, 'remote_session_1');
assert.strictEqual(store.currentForm.cash, 1500000);
console.log('✓ applyRemoteData multi-device sync verified');

// Test data sanitization
const sanitized = store.sanitizeSettings({ presetCapital: '45000000', agents: [{ id: 'a1', name: 'Test Agent' }] });
assert.strictEqual(sanitized.presetCapital, 45000000);
assert.strictEqual(sanitized.agents[0].name, 'Test Agent');
console.log('✓ Store data sanitization verified');

console.log('--- STORE TESTS PASSED SUCCESSFULLY! ---');
