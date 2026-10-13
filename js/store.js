/**
 * Balancer - Store & Persistence (localStorage)
 */

const STORAGE_KEYS = {
  SETTINGS: 'balancer_settings_v1',
  CURRENT_FORM: 'balancer_current_form_v1',
  HISTORY: 'balancer_history_v1'
};

function detectProvider(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('mtn')) return 'mtn';
  if (lower.includes('airtel')) return 'airtel';
  if (lower.includes('stanbic')) return 'stanbic';
  if (lower.includes('centenary')) return 'centenary';
  if (lower.includes('africa') || lower.includes('boa')) return 'boa';
  if (lower.includes('equity')) return 'equity';
  if (lower.includes('dfcu')) return 'dfcu';
  if (lower.includes('payway')) return 'payway';
  if (lower.includes('bank')) return 'bank';
  return 'other';
}

function detectCategory(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('mtn') || lower.includes('airtel') || lower.includes('telecom')) return 'telecom';
  if (lower.includes('bank') || lower.includes('boa') || lower.includes('equity') || lower.includes('stanbic') || lower.includes('centenary') || lower.includes('dfcu')) return 'bank';
  if (lower.includes('payway') || lower.includes('aggregator') || lower.includes('wave') || lower.includes('ezee')) return 'aggregator';
  return 'other';
}

const DEFAULT_SETTINGS = {
  presetCapital: 20000000,
  capitalSource: 'last', // 'last' or 'preset'
  currency: 'UGX',
  agents: [
    { id: 'agent1', name: 'Agent 1', defaultName: 'Agent 1', enabled: true },
    { id: 'agent2', name: 'Agent 2', defaultName: 'Agent 2', enabled: true },
    { id: 'agent3', name: 'Agent 3', defaultName: 'Agent 3', enabled: true }
  ],
  stakeholders: [
    { id: 'stakeholder1', name: 'Stakeholder 1', defaultName: 'Stakeholder 1', enabled: true },
    { id: 'stakeholder2', name: 'Stakeholder 2', defaultName: 'Stakeholder 2', enabled: true },
    { id: 'stakeholder3', name: 'Stakeholder 3', defaultName: 'Stakeholder 3', enabled: true },
    { id: 'stakeholder4', name: 'Stakeholder 4', defaultName: 'Stakeholder 4', enabled: true }
  ],
  floatAccounts: [
    { id: 'mtn1', name: 'MTN 1', category: 'telecom', provider: 'mtn', enabled: true },
    { id: 'mtn2', name: 'MTN 2', category: 'telecom', provider: 'mtn', enabled: true },
    { id: 'mtn3', name: 'MTN 3', category: 'telecom', provider: 'mtn', enabled: true },
    { id: 'airtel1', name: 'Airtel 1', category: 'telecom', provider: 'airtel', enabled: true },
    { id: 'airtel2', name: 'Airtel 2', category: 'telecom', provider: 'airtel', enabled: true },
    { id: 'bank_of_africa1', name: 'Bank of Africa 1', category: 'bank', provider: 'boa', enabled: true },
    { id: 'bank_of_africa2', name: 'Bank of Africa 2', category: 'bank', provider: 'boa', enabled: true },
    { id: 'centenary', name: 'Centenary Bank', category: 'bank', provider: 'centenary', enabled: true },
    { id: 'stanbic1', name: 'Stanbic Bank 1', category: 'bank', provider: 'stanbic', enabled: true },
    { id: 'stanbic2', name: 'Stanbic Bank 2', category: 'bank', provider: 'stanbic', enabled: true },
    { id: 'payway', name: 'Payway', category: 'aggregator', provider: 'payway', enabled: true },
    { id: 'equity', name: 'Equity Bank', category: 'bank', provider: 'equity', enabled: true },
    { id: 'dfcu', name: 'DFCU Bank', category: 'bank', provider: 'dfcu', enabled: true }
  ],
  commissionAccounts: [
    { id: 'mtn1', name: 'MTN 1 Commission', provider: 'mtn', enabled: true },
    { id: 'mtn2', name: 'MTN 2 Commission', provider: 'mtn', enabled: true },
    { id: 'mtn3', name: 'MTN 3 Commission', provider: 'mtn', enabled: true },
    { id: 'airtel1', name: 'Airtel 1 Commission', provider: 'airtel', enabled: true },
    { id: 'airtel2', name: 'Airtel 2 Commission', provider: 'airtel', enabled: true }
  ]
};

const INITIAL_DEFAULT_SETTINGS = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

function getDefaultFormState(settings, lastBalancingRecord = null) {
  let targetCapital = settings.presetCapital;
  let targetSourceLabel = 'Preset Capital';

  if (settings.capitalSource === 'last' && lastBalancingRecord) {
    targetCapital = lastBalancingRecord.netActualCapital;
    targetSourceLabel = `Last Balancing (${new Date(lastBalancingRecord.timestamp).toLocaleDateString()})`;
  }

  const float = {};
  settings.floatAccounts.forEach(acc => {
    float[acc.id] = 0;
  });

  const agentPhones = {};
  settings.agents.forEach(agent => {
    agentPhones[agent.id] = 0;
  });

  const commissions = {};
  settings.commissionAccounts.forEach(comm => {
    commissions[comm.id] = 0;
  });

  const stakeholderOut = {};
  const stakeholderIn = {};
  settings.stakeholders.forEach(sh => {
    stakeholderOut[sh.id] = 0;
    stakeholderIn[sh.id] = 0;
  });

  return {
    targetCapital,
    targetSourceLabel,
    capitalSourceMode: settings.capitalSource,
    float,
    cash: 0,
    cashDenominations: {
      note50k: 0,
      note20k: 0,
      note10k: 0,
      note5k: 0,
      note2k: 0,
      note1k: 0,
      coins: 0
    },
    agentPhones,
    enableCommission: false,
    commissions,
    enableStakeholderOut: false,
    stakeholderOut,
    enableStakeholderIn: false,
    stakeholderIn,
    notes: '',
    updatedAt: Date.now()
  };
}

class Store {
  constructor() {
    this.settings = this.loadSettings();
    this.history = this.loadHistory();
    this.currentForm = this.loadCurrentForm();
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const mapList = (list, defaultList) => {
          if (!Array.isArray(list)) return JSON.parse(JSON.stringify(defaultList));
          return list.map(item => ({
            ...item,
            enabled: item.enabled !== false
          }));
        };

        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          agents: mapList(parsed.agents, DEFAULT_SETTINGS.agents),
          stakeholders: mapList(parsed.stakeholders, DEFAULT_SETTINGS.stakeholders),
          floatAccounts: mapList(parsed.floatAccounts, DEFAULT_SETTINGS.floatAccounts),
          commissionAccounts: mapList(parsed.commissionAccounts, DEFAULT_SETTINGS.commissionAccounts)
        };
      }
    } catch (e) {
      console.warn('Failed to load settings from storage, using defaults:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }
    this.notify();
  }

  // --- Dynamic Parameter & Entity Management ---
  addFloatAccount(name, category, provider) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'float';
    let id = baseSlug;
    let counter = 1;
    while (this.settings.floatAccounts.some(acc => acc.id === id)) {
      id = `${baseSlug}_${counter++}`;
    }
    const newAcc = {
      id,
      name: cleanName,
      category: category || detectCategory(cleanName),
      provider: provider || detectProvider(cleanName),
      enabled: true
    };
    this.settings.floatAccounts.push(newAcc);
    if (!this.currentForm.float) this.currentForm.float = {};
    if (!(id in this.currentForm.float)) {
      this.currentForm.float[id] = 0;
    }
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
    return newAcc;
  }

  removeFloatAccount(id) {
    this.settings.floatAccounts = this.settings.floatAccounts.filter(acc => acc.id !== id);
    if (this.currentForm.float && id in this.currentForm.float) {
      delete this.currentForm.float[id];
    }
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
  }

  toggleFloatAccount(id, isEnabled) {
    const acc = this.settings.floatAccounts.find(a => a.id === id);
    if (acc) {
      acc.enabled = Boolean(isEnabled);
      this.saveSettings(this.settings);
    }
  }

  resetFloatAccountsToDefault() {
    this.settings.floatAccounts = JSON.parse(JSON.stringify(INITIAL_DEFAULT_SETTINGS.floatAccounts));
    if (!this.currentForm.float) this.currentForm.float = {};
    this.settings.floatAccounts.forEach(acc => {
      if (!(acc.id in this.currentForm.float)) {
        this.currentForm.float[acc.id] = 0;
      }
    });
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
  }

  addStakeholder(name) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const baseSlug = 'sh_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    let id = baseSlug;
    let counter = 1;
    while (this.settings.stakeholders.some(s => s.id === id)) {
      id = `${baseSlug}_${counter++}`;
    }
    const newSh = {
      id,
      name: cleanName,
      defaultName: cleanName,
      enabled: true
    };
    this.settings.stakeholders.push(newSh);
    if (!this.currentForm.stakeholderOut) this.currentForm.stakeholderOut = {};
    if (!this.currentForm.stakeholderIn) this.currentForm.stakeholderIn = {};
    this.currentForm.stakeholderOut[id] = 0;
    this.currentForm.stakeholderIn[id] = 0;
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
    return newSh;
  }

  removeStakeholder(id) {
    this.settings.stakeholders = this.settings.stakeholders.filter(s => s.id !== id);
    if (this.currentForm.stakeholderOut && id in this.currentForm.stakeholderOut) {
      delete this.currentForm.stakeholderOut[id];
    }
    if (this.currentForm.stakeholderIn && id in this.currentForm.stakeholderIn) {
      delete this.currentForm.stakeholderIn[id];
    }
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
  }

  toggleStakeholder(id, isEnabled) {
    const sh = this.settings.stakeholders.find(s => s.id === id);
    if (sh) {
      sh.enabled = Boolean(isEnabled);
      this.saveSettings(this.settings);
    }
  }

  resetStakeholdersToDefault() {
    this.settings.stakeholders = JSON.parse(JSON.stringify(INITIAL_DEFAULT_SETTINGS.stakeholders));
    if (!this.currentForm.stakeholderOut) this.currentForm.stakeholderOut = {};
    if (!this.currentForm.stakeholderIn) this.currentForm.stakeholderIn = {};
    this.settings.stakeholders.forEach(s => {
      if (!(s.id in this.currentForm.stakeholderOut)) this.currentForm.stakeholderOut[s.id] = 0;
      if (!(s.id in this.currentForm.stakeholderIn)) this.currentForm.stakeholderIn[s.id] = 0;
    });
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
  }

  addAgent(name) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const baseSlug = 'ag_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    let id = baseSlug;
    let counter = 1;
    while (this.settings.agents.some(a => a.id === id)) {
      id = `${baseSlug}_${counter++}`;
    }
    const newAg = {
      id,
      name: cleanName,
      defaultName: cleanName,
      enabled: true
    };
    this.settings.agents.push(newAg);
    if (!this.currentForm.agentPhones) this.currentForm.agentPhones = {};
    this.currentForm.agentPhones[id] = 0;
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
    return newAg;
  }

  removeAgent(id) {
    this.settings.agents = this.settings.agents.filter(a => a.id !== id);
    if (this.currentForm.agentPhones && id in this.currentForm.agentPhones) {
      delete this.currentForm.agentPhones[id];
    }
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
  }

  toggleAgent(id, isEnabled) {
    const ag = this.settings.agents.find(a => a.id === id);
    if (ag) {
      ag.enabled = Boolean(isEnabled);
      this.saveSettings(this.settings);
    }
  }

  resetAgentsToDefault() {
    this.settings.agents = JSON.parse(JSON.stringify(INITIAL_DEFAULT_SETTINGS.agents));
    if (!this.currentForm.agentPhones) this.currentForm.agentPhones = {};
    this.settings.agents.forEach(a => {
      if (!(a.id in this.currentForm.agentPhones)) this.currentForm.agentPhones[a.id] = 0;
    });
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
  }

  addCommissionAccount(name, provider) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const baseSlug = 'comm_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    let id = baseSlug;
    let counter = 1;
    while (this.settings.commissionAccounts.some(c => c.id === id)) {
      id = `${baseSlug}_${counter++}`;
    }
    const newComm = {
      id,
      name: cleanName,
      provider: provider || detectProvider(cleanName),
      enabled: true
    };
    this.settings.commissionAccounts.push(newComm);
    if (!this.currentForm.commissions) this.currentForm.commissions = {};
    this.currentForm.commissions[id] = 0;
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
    return newComm;
  }

  removeCommissionAccount(id) {
    this.settings.commissionAccounts = this.settings.commissionAccounts.filter(c => c.id !== id);
    if (this.currentForm.commissions && id in this.currentForm.commissions) {
      delete this.currentForm.commissions[id];
    }
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
  }

  toggleCommissionAccount(id, isEnabled) {
    const comm = this.settings.commissionAccounts.find(c => c.id === id);
    if (comm) {
      comm.enabled = Boolean(isEnabled);
      this.saveSettings(this.settings);
    }
  }

  resetCommissionAccountsToDefault() {
    this.settings.commissionAccounts = JSON.parse(JSON.stringify(INITIAL_DEFAULT_SETTINGS.commissionAccounts));
    if (!this.currentForm.commissions) this.currentForm.commissions = {};
    this.settings.commissionAccounts.forEach(c => {
      if (!(c.id in this.currentForm.commissions)) this.currentForm.commissions[c.id] = 0;
    });
    this.saveSettings(this.settings);
    this.saveCurrentForm(this.currentForm);
  }

  resetAllToDefault() {
    this.settings = JSON.parse(JSON.stringify(INITIAL_DEFAULT_SETTINGS));
    this.saveSettings(this.settings);
    this.resetCurrentForm();
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load history from storage:', e);
    }
    return [];
  }

  saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    } catch (e) {
      console.error('Error saving history to localStorage:', e);
    }
    this.notify();
  }

  getLastRecord() {
    if (!this.history || this.history.length === 0) return null;
    return this.history[0]; // History is stored with newest first
  }

  loadCurrentForm() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_FORM);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load current form from storage:', e);
    }
    return getDefaultFormState(this.settings, this.getLastRecord());
  }

  saveCurrentForm(formData) {
    this.currentForm = { ...formData, updatedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_FORM, JSON.stringify(this.currentForm));
    } catch (e) {
      console.error('Error saving current form to localStorage:', e);
    }
    this.notify();
  }

  resetCurrentForm() {
    const lastRec = this.getLastRecord();
    this.currentForm = getDefaultFormState(this.settings, lastRec);
    this.saveCurrentForm(this.currentForm);
  }

  saveBalancingSession(formData, notes = '') {
    const calc = calculateBalancing(formData, this.settings);
    const sessionRecord = {
      id: 'bal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
      notes: notes || formData.notes || '',
      capitalSourceMode: formData.capitalSourceMode || this.settings.capitalSource,
      targetCapital: calc.targetCapital,
      netActualCapital: calc.netActualCapital,
      variance: calc.variance,
      status: calc.status,
      statusText: calc.statusText,
      // Full details snapshot
      float: { ...formData.float },
      floatTotal: calc.floatTotal,
      cash: formData.cash,
      agentPhones: { ...formData.agentPhones },
      agentPhonesTotal: calc.agentPhonesTotal,
      enableCommission: formData.enableCommission,
      commissions: { ...formData.commissions },
      commissionTotal: calc.commissionTotal,
      enableStakeholderOut: formData.enableStakeholderOut,
      stakeholderOut: { ...formData.stakeholderOut },
      stakeholderOutTotal: calc.stakeholderOutTotal,
      enableStakeholderIn: formData.enableStakeholderIn,
      stakeholderIn: { ...formData.stakeholderIn },
      stakeholderInTotal: calc.stakeholderInTotal,
      totalCountedAssets: calc.totalCountedAssets,
      grossCapital: calc.grossCapital,
      deductions: calc.deductions,
      // Metadata snapshots for names at time of balancing
      agentsSnapshot: this.settings.agents.reduce((acc, a) => {
        acc[a.id] = a.name;
        return acc;
      }, {}),
      stakeholdersSnapshot: this.settings.stakeholders.reduce((acc, s) => {
        acc[s.id] = s.name;
        return acc;
      }, {})
    };

    // Prepend to history so newest is index 0
    this.history.unshift(sessionRecord);
    this.saveHistory();

    // Reset current form for next balancing, adopting new last balancing capital
    this.currentForm = getDefaultFormState(this.settings, sessionRecord);
    this.saveCurrentForm(this.currentForm);

    return sessionRecord;
  }

  deleteHistoryRecord(id) {
    this.history = this.history.filter(item => item.id !== id);
    this.saveHistory();
  }

  clearAllHistory() {
    this.history = [];
    this.saveHistory();
    this.resetCurrentForm();
  }

  // Load sample demo data for quick exploration
  loadDemoData() {
    const now = Date.now();
    const demoSessions = [
      {
        id: 'demo_1',
        timestamp: now - 86400000 * 2, // 2 days ago
        targetCapital: 25000000,
        netActualCapital: 25000000,
        variance: 0,
        status: 'balanced',
        statusText: 'Balanced (UGX 0)',
        float: {
          mtn1: 3500000,
          mtn2: 2000000,
          mtn3: 1500000,
          airtel1: 3000000,
          airtel2: 1800000,
          stanbic1: 4000000,
          stanbic2: 1200000,
          equity: 1500000,
          dfcu: 1000000,
          centenary: 1500000,
          bank_of_africa1: 500000,
          bank_of_africa2: 500000,
          payway: 1000000
        },
        floatTotal: 23000000,
        cash: 1500000,
        agentPhones: { agent1: 300000, agent2: 200000, agent3: 0 },
        agentPhonesTotal: 500000,
        enableCommission: false,
        commissions: {},
        commissionTotal: 0,
        enableStakeholderOut: false,
        stakeholderOut: {},
        stakeholderOutTotal: 0,
        enableStakeholderIn: false,
        stakeholderIn: {},
        stakeholderInTotal: 0,
        totalCountedAssets: 25000000,
        grossCapital: 25000000,
        notes: 'End of shift balancing - perfect match',
        agentsSnapshot: { agent1: 'Amina', agent2: 'Kato', agent3: 'Joseph' },
        stakeholdersSnapshot: {
          stakeholder1: 'Director David',
          stakeholder2: 'Director Grace',
          stakeholder3: 'Partner Brian',
          stakeholder4: 'Manager Sarah'
        }
      },
      {
        id: 'demo_2',
        timestamp: now - 86400000, // yesterday
        targetCapital: 25000000,
        netActualCapital: 24750000,
        variance: -250000,
        status: 'shortage',
        statusText: 'Shortage (-UGX 250,000)',
        float: {
          mtn1: 4000000,
          mtn2: 2000000,
          mtn3: 1500000,
          airtel1: 3200000,
          airtel2: 1500000,
          stanbic1: 3800000,
          stanbic2: 1000000,
          equity: 1200000,
          dfcu: 800000,
          centenary: 1400000,
          bank_of_africa1: 600000,
          bank_of_africa2: 400000,
          payway: 900000
        },
        floatTotal: 22300000,
        cash: 1800000,
        agentPhones: { agent1: 400000, agent2: 250000, agent3: 0 },
        agentPhonesTotal: 650000,
        enableCommission: true,
        commissions: { mtn1: 95000, mtn2: 40000, mtn3: 20000, airtel1: 35000, airtel2: 10000 },
        commissionTotal: 200000,
        enableStakeholderOut: true,
        stakeholderOut: { stakeholder1: 500000, stakeholder2: 0, stakeholder3: 0, stakeholder4: 0 },
        stakeholderOutTotal: 500000,
        enableStakeholderIn: true,
        stakeholderIn: { stakeholder1: 0, stakeholder2: 300000, stakeholder3: 0, stakeholder4: 0 },
        stakeholderInTotal: 300000,
        totalCountedAssets: 24750000,
        grossCapital: 25250000,
        deductions: 500000,
        notes: 'Director David took 500k for fuel, Grace injected 300k float, 200k commission deducted',
        agentsSnapshot: { agent1: 'Amina', agent2: 'Kato', agent3: 'Joseph' },
        stakeholdersSnapshot: {
          stakeholder1: 'Director David',
          stakeholder2: 'Director Grace',
          stakeholder3: 'Partner Brian',
          stakeholder4: 'Manager Sarah'
        }
      }
    ];

    this.settings.agents[0].name = 'Amina';
    this.settings.agents[1].name = 'Kato';
    this.settings.agents[2].name = 'Joseph';
    this.settings.stakeholders[0].name = 'Director David';
    this.settings.stakeholders[1].name = 'Director Grace';
    this.settings.stakeholders[2].name = 'Partner Brian';
    this.settings.stakeholders[3].name = 'Manager Sarah';
    this.saveSettings(this.settings);

    this.history = demoSessions;
    this.saveHistory();
    this.resetCurrentForm();
  }

  // Get aggregated ledger for stakeholders across all history
  getStakeholderLedger() {
    const summary = {};
    this.settings.stakeholders.forEach(sh => {
      summary[sh.id] = {
        id: sh.id,
        name: sh.name,
        totalOut: 0,
        totalIn: 0,
        netBalance: 0, // totalOut - totalIn (>0 means owes business, <0 means business owes stakeholder)
        transactions: []
      };
    });

    this.history.forEach(session => {
      const date = session.timestamp;
      this.settings.stakeholders.forEach(sh => {
        const outAmt = (session.stakeholderOut && session.stakeholderOut[sh.id]) || 0;
        const inAmt = (session.stakeholderIn && session.stakeholderIn[sh.id]) || 0;
        if (outAmt > 0 || inAmt > 0) {
          summary[sh.id].totalOut += outAmt;
          summary[sh.id].totalIn += inAmt;
          summary[sh.id].transactions.push({
            sessionId: session.id,
            date,
            out: outAmt,
            in: inAmt,
            net: outAmt - inAmt,
            notes: session.notes
          });
        }
      });
    });

    Object.values(summary).forEach(item => {
      item.netBalance = item.totalOut - item.totalIn;
    });

    return summary;
  }

  // Get aggregated ledger for agents across all history
  getAgentLedger() {
    const summary = {};
    this.settings.agents.forEach(agent => {
      summary[agent.id] = {
        id: agent.id,
        name: agent.name,
        history: [],
        latestAmount: 0
      };
    });

    this.history.forEach(session => {
      this.settings.agents.forEach(agent => {
        const amt = (session.agentPhones && session.agentPhones[agent.id]) || 0;
        if (amt > 0) {
          summary[agent.id].history.push({
            sessionId: session.id,
            date: session.timestamp,
            amount: amt
          });
        }
      });
    });

    // Determine latest recorded amount
    this.settings.agents.forEach(agent => {
      if (summary[agent.id].history.length > 0) {
        summary[agent.id].latestAmount = summary[agent.id].history[0].amount;
      }
    });

    return summary;
  }
}

// Export for browser and node
if (typeof window !== 'undefined') {
  window.Store = Store;
  window.STORAGE_KEYS = STORAGE_KEYS;
  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  window.INITIAL_DEFAULT_SETTINGS = INITIAL_DEFAULT_SETTINGS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Store,
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    INITIAL_DEFAULT_SETTINGS,
    getDefaultFormState
  };
}

