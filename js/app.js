/**
 * Balancer - Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize state store
  const store = new window.Store();
  window.balancerStore = store;

  // React to store changes (including real-time cloud sync from other devices)
  store.subscribe(() => {
    renderFormFields();
    recalculateAndRender();
    const activeTab = document.querySelector('.nav-tab.active');
    if (activeTab) {
      const tabId = activeTab.getAttribute('data-tab');
      if (tabId === 'history') renderHistoryList();
      if (tabId === 'ledger') renderLedgers();
      if (tabId === 'settings') renderSettings();
    }
  });

  // Elements
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabViews = document.querySelectorAll('.tab-view');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const quickResetBtn = document.getElementById('quickResetBtn');
  const historyBadge = document.getElementById('historyBadge');

  // Balancing inputs & containers
  const floatContainer = document.getElementById('floatInputsContainer');
  const agentContainer = document.getElementById('agentInputsContainer');
  const commissionContainer = document.getElementById('commissionInputsContainer');
  const stakeholderOutContainer = document.getElementById('stakeholderOutInputsContainer');
  const stakeholderInContainer = document.getElementById('stakeholderInInputsContainer');
  const inputCash = document.getElementById('inputCash');
  const sessionNotes = document.getElementById('sessionNotes');

  // Toggles
  const toggleCommission = document.getElementById('toggleCommission');
  const commissionToggleWrapper = document.getElementById('commissionToggleWrapper');
  const commissionFieldsWrapper = document.getElementById('commissionFieldsWrapper');

  const toggleStakeholderOut = document.getElementById('toggleStakeholderOut');
  const stakeholderOutToggleWrapper = document.getElementById('stakeholderOutToggleWrapper');
  const stakeholderOutFieldsWrapper = document.getElementById('stakeholderOutFieldsWrapper');

  const toggleStakeholderIn = document.getElementById('toggleStakeholderIn');
  const stakeholderInToggleWrapper = document.getElementById('stakeholderInToggleWrapper');
  const stakeholderInFieldsWrapper = document.getElementById('stakeholderInFieldsWrapper');

  // Target Capital Displays
  const targetAmountDisplay = document.getElementById('targetAmountDisplay');
  const targetSourceDisplay = document.getElementById('targetSourceDisplay');
  const btnSwitchCapitalSource = document.getElementById('btnSwitchCapitalSource');
  const btnEditTargetCapital = document.getElementById('btnEditTargetCapital');

  // Subtotals
  const floatSubtotalBadge = document.getElementById('floatSubtotalBadge');
  const floatSubtotalText = document.getElementById('floatSubtotalText');
  const agentsSubtotalBadge = document.getElementById('agentsSubtotalBadge');
  const agentsSubtotalText = document.getElementById('agentsSubtotalText');
  const commissionsSubtotalBadge = document.getElementById('commissionsSubtotalBadge');
  const commissionsSubtotalText = document.getElementById('commissionsSubtotalText');
  const stakeholderOutSubtotalBadge = document.getElementById('stakeholderOutSubtotalBadge');
  const stakeholderOutSubtotalText = document.getElementById('stakeholderOutSubtotalText');
  const stakeholderInSubtotalBadge = document.getElementById('stakeholderInSubtotalBadge');
  const stakeholderInSubtotalText = document.getElementById('stakeholderInSubtotalText');

  // Explainer Elements
  const breakdownStatusPill = document.getElementById('breakdownStatusPill');
  const breakdownStatusText = document.getElementById('breakdownStatusText');
  const explainerFloat = document.getElementById('explainerFloat');
  const explainerCash = document.getElementById('explainerCash');
  const explainerPhones = document.getElementById('explainerPhones');
  const explainerCommission = document.getElementById('explainerCommission');
  const explainerCommissionRow = document.getElementById('explainerCommissionRow');
  const explainerCountedTotal = document.getElementById('explainerCountedTotal');
  const explainerStakeholderOut = document.getElementById('explainerStakeholderOut');
  const explainerOutRow = document.getElementById('explainerOutRow');
  const explainerStakeholderIn = document.getElementById('explainerStakeholderIn');
  const explainerInRow = document.getElementById('explainerInRow');
  const explainerNetCapital = document.getElementById('explainerNetCapital');
  const explainerTargetCapital = document.getElementById('explainerTargetCapital');
  const explainerVariance = document.getElementById('explainerVariance');

  // Sticky Bar Elements
  const stickyStatusBadge = document.getElementById('stickyStatusBadge');
  const stickyStatusText = document.getElementById('stickyStatusText');
  const stickyTargetCapital = document.getElementById('stickyTargetCapital');
  const stickyNetCapital = document.getElementById('stickyNetCapital');
  const stickyVariance = document.getElementById('stickyVariance');
  const btnStickySave = document.getElementById('btnStickySave');
  const btnStickyShare = document.getElementById('btnStickyShare');

  // Action Buttons
  const btnSaveBalancingPrimary = document.getElementById('btnSaveBalancingPrimary');
  const btnShareWhatsApp = document.getElementById('btnShareWhatsApp');
  const btnPrintSlip = document.getElementById('btnPrintSlip');

  // Executive Hero Elements
  const heroStatusPill = document.getElementById('heroStatusPill');
  const heroStatusText = document.getElementById('heroStatusText');
  const heroNetCapital = document.getElementById('heroNetCapital');
  const heroVariance = document.getElementById('heroVariance');
  const btnHeroSave = document.getElementById('btnHeroSave');
  const btnHeroShare = document.getElementById('btnHeroShare');

  // Modals
  const modalDenominations = document.getElementById('modalDenominations');
  const btnOpenDenominations = document.getElementById('btnOpenDenominations');
  const denomCalculatedTotal = document.getElementById('denomCalculatedTotal');
  const btnApplyDenominations = document.getElementById('btnApplyDenominations');

  const modalEditTarget = document.getElementById('modalEditTarget');
  const modalInputTargetCapital = document.getElementById('modalInputTargetCapital');
  const btnTargetUsePreset = document.getElementById('btnTargetUsePreset');
  const btnTargetUseLast = document.getElementById('btnTargetUseLast');
  const btnApplyTargetCapital = document.getElementById('btnApplyTargetCapital');

  const modalHistoryDetails = document.getElementById('modalHistoryDetails');
  const modalHistoryContent = document.getElementById('modalHistoryContent');
  const btnModalShareWhatsApp = document.getElementById('btnModalShareWhatsApp');
  const btnModalPrintSlip = document.getElementById('btnModalPrintSlip');

  // Settings elements
  const settingsFloatAccountsGrid = document.getElementById('settingsFloatAccountsGrid');
  const floatCountBadge = document.getElementById('floatCountBadge');
  const newFloatName = document.getElementById('newFloatName');
  const newFloatCategory = document.getElementById('newFloatCategory');
  const btnAddFloatAccount = document.getElementById('btnAddFloatAccount');
  const btnResetFloatDefaults = document.getElementById('btnResetFloatDefaults');

  const settingsStakeholdersGrid = document.getElementById('settingsStakeholdersGrid');
  const stakeholdersCountBadge = document.getElementById('stakeholdersCountBadge');
  const newStakeholderName = document.getElementById('newStakeholderName');
  const btnAddStakeholder = document.getElementById('btnAddStakeholder');
  const btnResetStakeholdersDefaults = document.getElementById('btnResetStakeholdersDefaults');

  const settingsAgentsGrid = document.getElementById('settingsAgentsGrid');
  const agentsCountBadge = document.getElementById('agentsCountBadge');
  const newAgentName = document.getElementById('newAgentName');
  const btnAddAgent = document.getElementById('btnAddAgent');
  const btnResetAgentsDefaults = document.getElementById('btnResetAgentsDefaults');

  const settingsCommissionsGrid = document.getElementById('settingsCommissionsGrid');
  const commissionsCountBadge = document.getElementById('commissionsCountBadge');
  const newCommissionName = document.getElementById('newCommissionName');
  const newCommissionProvider = document.getElementById('newCommissionProvider');
  const btnAddCommissionAccount = document.getElementById('btnAddCommissionAccount');
  const btnResetCommissionsDefaults = document.getElementById('btnResetCommissionsDefaults');

  const settingPresetCapital = document.getElementById('settingPresetCapital');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const btnResetAllDefaults = document.getElementById('btnResetAllDefaults');
  const btnLoadDemoData = document.getElementById('btnLoadDemoData');
  const btnExportJSON = document.getElementById('btnExportJSON');
  const btnImportJSON = document.getElementById('btnImportJSON');
  const importFileInput = document.getElementById('importFileInput');

  // History elements
  const historyListContainer = document.getElementById('historyListContainer');
  const historySearch = document.getElementById('historySearch');
  const historyFilterStatus = document.getElementById('historyFilterStatus');
  const btnExportCSV = document.getElementById('btnExportCSV');
  const btnClearHistory = document.getElementById('btnClearHistory');

  // Ledger elements
  const stakeholderLedgerTableBody = document.getElementById('stakeholderLedgerTableBody');
  const agentLedgerTableBody = document.getElementById('agentLedgerTableBody');

  let activeModalSession = null;

  // -------------------------------------------------------------
  // THEME MANAGEMENT (SVG icons)
  // -------------------------------------------------------------
  const savedTheme = localStorage.getItem('balancer_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);

  function updateThemeIcons(theme) {
    const moonIcon = themeToggleBtn.querySelector('.theme-icon-moon');
    const sunIcon = themeToggleBtn.querySelector('.theme-icon-sun');
    if (moonIcon && sunIcon) {
      if (theme === 'dark') {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'inline-block';
      } else {
        moonIcon.style.display = 'inline-block';
        sunIcon.style.display = 'none';
      }
    }
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('balancer_theme', newTheme);
    updateThemeIcons(newTheme);
  });

  // -------------------------------------------------------------
  // TOAST NOTIFICATIONS (SVG icons)
  // -------------------------------------------------------------
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';

    let iconSvg = `
      <svg class="ui-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
    if (type === 'success') {
      iconSvg = `
        <svg class="ui-svg-sm" style="color: var(--success);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    } else if (type === 'error') {
      iconSvg = `
        <svg class="ui-svg-sm" style="color: var(--danger);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    }

    toast.innerHTML = `<span>${iconSvg}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Export showToast globally
  window.showToast = showToast;

  // -------------------------------------------------------------
  // TAB NAVIGATION
  // -------------------------------------------------------------
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabViews.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const targetView = document.getElementById(`tab-${tabId}`);
      if (targetView) targetView.classList.add('active');

      if (tabId === 'history') renderHistoryList();
      if (tabId === 'ledger') renderLedgers();
      if (tabId === 'settings') renderSettings();
    });
  });

  // -------------------------------------------------------------
  // INPUT FORMATTING HELPER
  // -------------------------------------------------------------
  function attachMoneyInputListeners(inputEl, onChangeCallback) {
    // Select all on focus for rapid typing
    inputEl.addEventListener('focus', () => {
      setTimeout(() => inputEl.select(), 50);
    });

    // Format numbers with commas as user types
    inputEl.addEventListener('input', (e) => {
      const rawVal = e.target.value;
      const num = window.parseWholeNumber(rawVal);
      e.target.value = window.formatUGX(num);
      if (onChangeCallback) onChangeCallback(num);
    });

    // Safe blur fallback to 0
    inputEl.addEventListener('blur', (e) => {
      if (!e.target.value.trim()) {
        e.target.value = '0';
        if (onChangeCallback) onChangeCallback(0);
      }
    });
  }

  // -------------------------------------------------------------
  // RENDER DYNAMIC FORM FIELDS
  // -------------------------------------------------------------
  function renderFormFields() {
    // 1. Float Accounts
    floatContainer.innerHTML = '';
    const activeFloat = store.settings.floatAccounts.filter(acc => acc.enabled !== false);
    if (activeFloat.length === 0) {
      floatContainer.innerHTML = '<p style="color:var(--text-muted); padding:10px; grid-column:1/-1;">No float accounts enabled. Enable or add accounts in Settings.</p>';
    }
    activeFloat.forEach(acc => {
      const currentVal = store.currentForm.float[acc.id] || 0;
      const itemEl = document.createElement('div');
      itemEl.className = 'input-item';
      itemEl.innerHTML = `
        <div class="input-item-header">
          <label for="float_${acc.id}" class="input-label">
            ${acc.name}
          </label>
          <span class="provider-pill provider-${acc.provider}">${acc.provider}</span>
        </div>
        <div class="money-input-wrapper">
          <span class="input-currency-prefix">UGX</span>
          <input 
            type="text" 
            inputmode="numeric" 
            pattern="[0-9,]*" 
            id="float_${acc.id}" 
            class="money-input" 
            value="${window.formatUGX(currentVal)}"
            autocomplete="off"
          >
        </div>
      `;
      floatContainer.appendChild(itemEl);

      const input = itemEl.querySelector(`#float_${acc.id}`);
      attachMoneyInputListeners(input, (newVal) => {
        store.currentForm.float[acc.id] = newVal;
        recalculateAndRender();
      });
    });

    // 2. Agent Phones
    agentContainer.innerHTML = '';
    const activeAgents = store.settings.agents.filter(agent => agent.enabled !== false);
    if (activeAgents.length === 0) {
      agentContainer.innerHTML = '<p style="color:var(--text-muted); padding:10px; grid-column:1/-1;">No agents configured. Enable or add agents in Settings.</p>';
    }
    activeAgents.forEach(agent => {
      const currentVal = store.currentForm.agentPhones[agent.id] || 0;
      const itemEl = document.createElement('div');
      itemEl.className = 'input-item';
      itemEl.innerHTML = `
        <div class="input-item-header">
          <label for="agent_${agent.id}" class="input-label">
            ${agent.name}
          </label>
          <span class="provider-pill" style="background:#e0e7ff; color:#4338ca;">Phone</span>
        </div>
        <div class="money-input-wrapper">
          <span class="input-currency-prefix">UGX</span>
          <input 
            type="text" 
            inputmode="numeric" 
            pattern="[0-9,]*" 
            id="agent_${agent.id}" 
            class="money-input" 
            value="${window.formatUGX(currentVal)}"
            autocomplete="off"
          >
        </div>
      `;
      agentContainer.appendChild(itemEl);

      const input = itemEl.querySelector(`#agent_${agent.id}`);
      attachMoneyInputListeners(input, (newVal) => {
        store.currentForm.agentPhones[agent.id] = newVal;
        recalculateAndRender();
      });
    });

    // 3. Commissions
    commissionContainer.innerHTML = '';
    const activeCommissions = store.settings.commissionAccounts.filter(comm => comm.enabled !== false);
    if (activeCommissions.length === 0) {
      commissionContainer.innerHTML = '<p style="color:var(--text-muted); padding:10px; grid-column:1/-1;">No commission accounts configured. Enable or add in Settings.</p>';
    }
    activeCommissions.forEach(comm => {
      const currentVal = store.currentForm.commissions[comm.id] || 0;
      const itemEl = document.createElement('div');
      itemEl.className = 'input-item';
      itemEl.innerHTML = `
        <div class="input-item-header">
          <label for="comm_${comm.id}" class="input-label">
            ${comm.name}
          </label>
          <span class="provider-pill provider-${comm.provider}">${comm.provider}</span>
        </div>
        <div class="money-input-wrapper">
          <span class="input-currency-prefix">UGX</span>
          <input 
            type="text" 
            inputmode="numeric" 
            pattern="[0-9,]*" 
            id="comm_${comm.id}" 
            class="money-input" 
            value="${window.formatUGX(currentVal)}"
            autocomplete="off"
          >
        </div>
      `;
      commissionContainer.appendChild(itemEl);

      const input = itemEl.querySelector(`#comm_${comm.id}`);
      attachMoneyInputListeners(input, (newVal) => {
        store.currentForm.commissions[comm.id] = newVal;
        recalculateAndRender();
      });
    });

    // 4. Stakeholder Money Out (Taken Out)
    stakeholderOutContainer.innerHTML = '';
    const activeStakeholders = store.settings.stakeholders.filter(sh => sh.enabled !== false);
    if (activeStakeholders.length === 0) {
      stakeholderOutContainer.innerHTML = '<p style="color:var(--text-muted); padding:10px; grid-column:1/-1;">No stakeholders configured. Enable or create in Settings.</p>';
    }
    activeStakeholders.forEach(sh => {
      const currentVal = store.currentForm.stakeholderOut[sh.id] || 0;
      const itemEl = document.createElement('div');
      itemEl.className = 'input-item';
      itemEl.innerHTML = `
        <div class="input-item-header">
          <label for="sh_out_${sh.id}" class="input-label">
            ${sh.name}
          </label>
          <span class="provider-pill" style="background:#fee2e2; color:#b91c1c;">Out (+)</span>
        </div>
        <div class="money-input-wrapper">
          <span class="input-currency-prefix">UGX</span>
          <input 
            type="text" 
            inputmode="numeric" 
            pattern="[0-9,]*" 
            id="sh_out_${sh.id}" 
            class="money-input" 
            value="${window.formatUGX(currentVal)}"
            autocomplete="off"
          >
        </div>
      `;
      stakeholderOutContainer.appendChild(itemEl);

      const input = itemEl.querySelector(`#sh_out_${sh.id}`);
      attachMoneyInputListeners(input, (newVal) => {
        store.currentForm.stakeholderOut[sh.id] = newVal;
        recalculateAndRender();
      });
    });

    // 5. Stakeholder Money In (Added)
    stakeholderInContainer.innerHTML = '';
    if (activeStakeholders.length === 0) {
      stakeholderInContainer.innerHTML = '<p style="color:var(--text-muted); padding:10px; grid-column:1/-1;">No stakeholders configured. Enable or create in Settings.</p>';
    }
    activeStakeholders.forEach(sh => {
      const currentVal = store.currentForm.stakeholderIn[sh.id] || 0;
      const itemEl = document.createElement('div');
      itemEl.className = 'input-item';
      itemEl.innerHTML = `
        <div class="input-item-header">
          <label for="sh_in_${sh.id}" class="input-label">
            ${sh.name}
          </label>
          <span class="provider-pill" style="background:#fef3c7; color:#b45309;">In (-)</span>
        </div>
        <div class="money-input-wrapper">
          <span class="input-currency-prefix">UGX</span>
          <input 
            type="text" 
            inputmode="numeric" 
            pattern="[0-9,]*" 
            id="sh_in_${sh.id}" 
            class="money-input" 
            value="${window.formatUGX(currentVal)}"
            autocomplete="off"
          >
        </div>
      `;
      stakeholderInContainer.appendChild(itemEl);

      const input = itemEl.querySelector(`#sh_in_${sh.id}`);
      attachMoneyInputListeners(input, (newVal) => {
        store.currentForm.stakeholderIn[sh.id] = newVal;
        recalculateAndRender();
      });
    });

    // Cash in till
    inputCash.value = window.formatUGX(store.currentForm.cash || 0);
    attachMoneyInputListeners(inputCash, (newVal) => {
      store.currentForm.cash = newVal;
      recalculateAndRender();
    });

    // Session notes
    sessionNotes.value = store.currentForm.notes || '';
    sessionNotes.addEventListener('input', (e) => {
      store.currentForm.notes = e.target.value;
    });

    // Sync toggle states
    toggleCommission.checked = Boolean(store.currentForm.enableCommission);
    setCollapsibleState(commissionFieldsWrapper, toggleCommission.checked);

    toggleStakeholderOut.checked = Boolean(store.currentForm.enableStakeholderOut);
    setCollapsibleState(stakeholderOutFieldsWrapper, toggleStakeholderOut.checked);

    toggleStakeholderIn.checked = Boolean(store.currentForm.enableStakeholderIn);
    setCollapsibleState(stakeholderInFieldsWrapper, toggleStakeholderIn.checked);
  }

  function setCollapsibleState(element, isExpanded) {
    if (isExpanded) {
      element.classList.remove('collapsed');
      element.classList.add('expanded');
    } else {
      element.classList.remove('expanded');
      element.classList.add('collapsed');
    }
  }

  // Toggle events
  commissionToggleWrapper.addEventListener('click', () => {
    toggleCommission.checked = !toggleCommission.checked;
    store.currentForm.enableCommission = toggleCommission.checked;
    setCollapsibleState(commissionFieldsWrapper, toggleCommission.checked);
    recalculateAndRender();
  });

  stakeholderOutToggleWrapper.addEventListener('click', () => {
    toggleStakeholderOut.checked = !toggleStakeholderOut.checked;
    store.currentForm.enableStakeholderOut = toggleStakeholderOut.checked;
    setCollapsibleState(stakeholderOutFieldsWrapper, toggleStakeholderOut.checked);
    recalculateAndRender();
  });

  stakeholderInToggleWrapper.addEventListener('click', () => {
    toggleStakeholderIn.checked = !toggleStakeholderIn.checked;
    store.currentForm.enableStakeholderIn = toggleStakeholderIn.checked;
    setCollapsibleState(stakeholderInFieldsWrapper, toggleStakeholderIn.checked);
    recalculateAndRender();
  });

  // -------------------------------------------------------------
  // RECALCULATION & LIVE DISPLAY ENGINE
  // -------------------------------------------------------------
  function recalculateAndRender() {
    const calc = window.calculateBalancing(store.currentForm, store.settings);

    // Update target banner
    targetAmountDisplay.textContent = window.formatUGX(calc.targetCapital);
    targetSourceDisplay.textContent = `Source: ${store.currentForm.targetSourceLabel || 'Target Capital'}`;

    // Update subtotals
    floatSubtotalBadge.textContent = `UGX ${window.formatUGX(calc.floatTotal)}`;
    floatSubtotalText.textContent = `UGX ${window.formatUGX(calc.floatTotal)}`;

    agentsSubtotalBadge.textContent = `UGX ${window.formatUGX(calc.agentPhonesTotal)}`;
    agentsSubtotalText.textContent = `UGX ${window.formatUGX(calc.agentPhonesTotal)}`;

    // Note: Commission earned is deducted from capital because it does not belong to the business
    if (commissionsSubtotalBadge) commissionsSubtotalBadge.textContent = `-UGX ${window.formatUGX(calc.commissionTotal)}`;
    commissionsSubtotalText.textContent = `-UGX ${window.formatUGX(calc.commissionTotal)}`;

    if (stakeholderOutSubtotalBadge) stakeholderOutSubtotalBadge.textContent = `+UGX ${window.formatUGX(calc.stakeholderOutTotal)}`;
    stakeholderOutSubtotalText.textContent = `+UGX ${window.formatUGX(calc.stakeholderOutTotal)}`;

    if (stakeholderInSubtotalBadge) stakeholderInSubtotalBadge.textContent = `-UGX ${window.formatUGX(calc.stakeholderInTotal)}`;
    stakeholderInSubtotalText.textContent = `-UGX ${window.formatUGX(calc.stakeholderInTotal)}`;

    // Explainer breakdown
    explainerFloat.textContent = `UGX ${window.formatUGX(calc.floatTotal)}`;
    explainerCash.textContent = `UGX ${window.formatUGX(calc.cashTotal)}`;
    explainerPhones.textContent = `UGX ${window.formatUGX(calc.agentPhonesTotal)}`;
    explainerCountedTotal.textContent = `UGX ${window.formatUGX(calc.totalCountedAssets)}`;

    if (calc.isCommissionEnabled && calc.commissionTotal > 0) {
      explainerCommissionRow.style.display = 'flex';
      explainerCommission.textContent = `-UGX ${window.formatUGX(calc.commissionTotal)}`;
    } else {
      explainerCommissionRow.style.display = 'none';
    }

    if (calc.stakeholderOutTotal > 0 || calc.isStakeholderOutEnabled) {
      explainerOutRow.style.display = 'flex';
      explainerStakeholderOut.textContent = `+UGX ${window.formatUGX(calc.stakeholderOutTotal)}`;
    } else {
      explainerOutRow.style.display = 'none';
    }

    if (calc.stakeholderInTotal > 0 || calc.isStakeholderInEnabled) {
      explainerInRow.style.display = 'flex';
      explainerStakeholderIn.textContent = `-UGX ${window.formatUGX(calc.stakeholderInTotal)}`;
    } else {
      explainerInRow.style.display = 'none';
    }

    explainerNetCapital.textContent = `UGX ${window.formatUGX(calc.netActualCapital)}`;
    explainerTargetCapital.textContent = `UGX ${window.formatUGX(calc.targetCapital)}`;

    // Status SVG and class formatting
    let badgeClass = 'status-balanced';
    let iconSvg = `
      <svg class="status-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    let varianceDisplay = `UGX 0 (Perfect Match)`;

    if (calc.status === 'surplus') {
      badgeClass = 'status-surplus';
      iconSvg = `
        <svg class="status-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="16 12 12 8 8 12"></polyline>
          <line x1="12" y1="16" x2="12" y2="8"></line>
        </svg>
      `;
      varianceDisplay = `+UGX ${window.formatUGX(calc.variance)} (Surplus)`;
    } else if (calc.status === 'shortage') {
      badgeClass = 'status-shortage';
      iconSvg = `
        <svg class="status-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="8 12 12 16 16 12"></polyline>
          <line x1="12" y1="8" x2="12" y2="16"></line>
        </svg>
      `;
      varianceDisplay = `-UGX ${window.formatUGX(Math.abs(calc.variance))} (Shortage)`;
    }

    explainerVariance.textContent = varianceDisplay;
    // Color the Final Balancing Result for quick intuitive reading
    if (calc.status === 'shortage') {
      explainerVariance.style.color = '#dc2626'; // red — shortage
      explainerVariance.style.fontWeight = '700';
    } else {
      explainerVariance.style.color = '#16a34a'; // green — surplus or balanced
      explainerVariance.style.fontWeight = '700';
    }

    // Update status badge pill on card
    breakdownStatusPill.className = `balance-status-badge ${badgeClass}`;
    breakdownStatusPill.querySelector('.status-badge-icon').innerHTML = iconSvg;
    breakdownStatusText.textContent = calc.statusText;

    // Update Executive Hero Card
    if (heroStatusPill && heroStatusText) {
      heroStatusPill.className = `balance-status-badge ${badgeClass}`;
      heroStatusPill.querySelector('.status-badge-icon').innerHTML = iconSvg;
      heroStatusText.textContent = calc.statusText;
    }
    if (heroNetCapital) {
      heroNetCapital.textContent = `UGX ${window.formatUGX(calc.netActualCapital)}`;
    }
    if (heroVariance) {
      if (calc.variance > 0) {
        heroVariance.textContent = `+UGX ${window.formatUGX(calc.variance)}`;
        heroVariance.style.color = '#1d4ed8';
      } else if (calc.variance < 0) {
        heroVariance.textContent = `-UGX ${window.formatUGX(Math.abs(calc.variance))}`;
        heroVariance.style.color = '#dc2626';
      } else {
        heroVariance.textContent = 'UGX 0';
        heroVariance.style.color = '#16a34a';
      }
    }

    // Update sticky bottom bar
    stickyStatusBadge.className = `balance-status-badge ${badgeClass}`;
    stickyStatusBadge.querySelector('.status-badge-icon').innerHTML = iconSvg;
    stickyStatusText.textContent = calc.statusText;
    stickyTargetCapital.textContent = `UGX ${window.formatUGX(calc.targetCapital)}`;
    stickyNetCapital.textContent = `UGX ${window.formatUGX(calc.netActualCapital)}`;

    if (calc.variance > 0) {
      stickyVariance.textContent = `+UGX ${window.formatUGX(calc.variance)}`;
      stickyVariance.style.color = '#1d4ed8';
    } else if (calc.variance < 0) {
      stickyVariance.textContent = `-UGX ${window.formatUGX(Math.abs(calc.variance))}`;
      stickyVariance.style.color = '#dc2626';
    } else {
      stickyVariance.textContent = 'UGX 0';
      stickyVariance.style.color = '#16a34a';
    }

    // Auto-save form progress to localStorage
    store.saveCurrentForm(store.currentForm);
    historyBadge.textContent = store.history.length;
  }

  // -------------------------------------------------------------
  // TARGET CAPITAL SWITCH & EDIT
  // -------------------------------------------------------------
  btnSwitchCapitalSource.addEventListener('click', () => {
    const lastRec = store.getLastRecord();
    if (store.currentForm.capitalSourceMode === 'last') {
      // Switch to Preset
      store.currentForm.capitalSourceMode = 'preset';
      store.currentForm.targetCapital = store.settings.presetCapital;
      store.currentForm.targetSourceLabel = 'Preset Capital';
      showToast('Target capital switched to Preset Capital', 'info');
    } else {
      // Switch to Last Balancing
      if (lastRec) {
        store.currentForm.capitalSourceMode = 'last';
        store.currentForm.targetCapital = lastRec.netActualCapital;
        store.currentForm.targetSourceLabel = `Last Balancing (${new Date(lastRec.timestamp).toLocaleDateString()})`;
        showToast('Target capital switched to Last Balancing record', 'info');
      } else {
        showToast('No past balancing record found yet. Set via Preset or Save a record first.', 'error');
        return;
      }
    }
    recalculateAndRender();
  });

  btnEditTargetCapital.addEventListener('click', () => {
    modalInputTargetCapital.value = window.formatUGX(store.currentForm.targetCapital);
    modalEditTarget.classList.add('open');
    setTimeout(() => modalInputTargetCapital.select(), 50);
  });

  attachMoneyInputListeners(modalInputTargetCapital, null);

  btnTargetUsePreset.addEventListener('click', () => {
    modalInputTargetCapital.value = window.formatUGX(store.settings.presetCapital);
  });

  btnTargetUseLast.addEventListener('click', () => {
    const lastRec = store.getLastRecord();
    if (lastRec) {
      modalInputTargetCapital.value = window.formatUGX(lastRec.netActualCapital);
    } else {
      showToast('No previous balancing record exists yet', 'error');
    }
  });

  btnApplyTargetCapital.addEventListener('click', () => {
    const newVal = window.parseWholeNumber(modalInputTargetCapital.value);
    store.currentForm.targetCapital = newVal;
    store.currentForm.targetSourceLabel = 'Custom Entered Target';
    modalEditTarget.classList.remove('open');
    recalculateAndRender();
    showToast(`Target Capital updated to UGX ${window.formatUGX(newVal)}`, 'success');
  });

  // -------------------------------------------------------------
  // CASH DENOMINATIONS MODAL
  // -------------------------------------------------------------
  const denomInputs = [
    { el: document.getElementById('denom50k'), multiplier: 50000 },
    { el: document.getElementById('denom20k'), multiplier: 20000 },
    { el: document.getElementById('denom10k'), multiplier: 10000 },
    { el: document.getElementById('denom5k'), multiplier: 5000 },
    { el: document.getElementById('denom2k'), multiplier: 2000 },
    { el: document.getElementById('denom1k'), multiplier: 1000 },
    { el: document.getElementById('denomCoins'), multiplier: 1 }
  ];

  function calculateDenominationsTotal() {
    let total = 0;
    denomInputs.forEach(item => {
      const qty = window.parseWholeNumber(item.el.value);
      total += qty * item.multiplier;
    });
    denomCalculatedTotal.textContent = `UGX ${window.formatUGX(total)}`;
    return total;
  }

  denomInputs.forEach(item => {
    item.el.addEventListener('focus', () => setTimeout(() => item.el.select(), 50));
    item.el.addEventListener('input', () => calculateDenominationsTotal());
    item.el.addEventListener('blur', () => {
      if (!item.el.value.trim()) item.el.value = '0';
      calculateDenominationsTotal();
    });
  });

  btnOpenDenominations.addEventListener('click', () => {
    modalDenominations.classList.add('open');
    calculateDenominationsTotal();
  });

  btnApplyDenominations.addEventListener('click', () => {
    const total = calculateDenominationsTotal();
    inputCash.value = window.formatUGX(total);
    store.currentForm.cash = total;
    modalDenominations.classList.remove('open');
    recalculateAndRender();
    showToast(`Applied UGX ${window.formatUGX(total)} to Physical Cash`, 'success');
  });

  // -------------------------------------------------------------
  // SAVE BALANCING SESSION
  // -------------------------------------------------------------
  function saveCurrentBalancing() {
    const calc = window.calculateBalancing(store.currentForm);
    const confirmed = confirm(
      `Confirm Saving Balancing Session:\n\n` +
      `Target Capital: UGX ${window.formatUGX(calc.targetCapital)}\n` +
      `Net Actual Capital: UGX ${window.formatUGX(calc.netActualCapital)}\n` +
      `Result: ${calc.statusText}\n\n` +
      `This will record the session to History and update the Last Balancing capital.`
    );
    if (!confirmed) return;

    const saved = store.saveBalancingSession(store.currentForm, sessionNotes.value);
    showToast(`Session successfully saved! Result: ${saved.statusText}`, 'success');
    renderFormFields();
    recalculateAndRender();
  }

  btnSaveBalancingPrimary.addEventListener('click', saveCurrentBalancing);
  btnStickySave.addEventListener('click', saveCurrentBalancing);
  if (btnHeroSave) btnHeroSave.addEventListener('click', saveCurrentBalancing);

  // -------------------------------------------------------------
  // SHARE TO WHATSAPP & CLIPBOARD (No Emojis)
  // -------------------------------------------------------------
  function shareReport(record = null) {
    const dataToShare = record || {
      timestamp: Date.now(),
      notes: sessionNotes.value,
      ...store.currentForm
    };
    const shareText = window.generateShareText(dataToShare, store.settings);

    // Copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('Balancing report copied to clipboard!', 'success');
    }).catch(err => {
      console.warn('Clipboard write error:', err);
    });

    // Launch WhatsApp
    const encoded = encodeURIComponent(shareText);
    const waUrl = `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  }

  btnShareWhatsApp.addEventListener('click', () => shareReport());
  btnStickyShare.addEventListener('click', () => shareReport());
  if (btnHeroShare) btnHeroShare.addEventListener('click', () => shareReport());

  btnPrintSlip.addEventListener('click', () => {
    window.print();
  });

  // -------------------------------------------------------------
  // QUICK RESET
  // -------------------------------------------------------------
  quickResetBtn.addEventListener('click', () => {
    const ok = confirm('Reset all inputs on the current balancing form back to zero?');
    if (!ok) return;
    store.resetCurrentForm();
    renderFormFields();
    recalculateAndRender();
    showToast('Current form cleared to zero', 'info');
  });

  // -------------------------------------------------------------
  // HISTORY LIST RENDERING (Assets & SVGs)
  // -------------------------------------------------------------
  function renderHistoryList() {
    const searchTerm = (historySearch.value || '').toLowerCase().trim();
    const filterStatus = historyFilterStatus.value;

    let filtered = store.history.filter(item => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (searchTerm) {
        const dateStr = new Date(item.timestamp).toLocaleString().toLowerCase();
        const notesStr = (item.notes || '').toLowerCase();
        return dateStr.includes(searchTerm) || notesStr.includes(searchTerm);
      }
      return true;
    });

    historyListContainer.innerHTML = '';
    if (filtered.length === 0) {
      historyListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <img src="assets/history.png?v=20261013-4" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;" alt="">
          <p style="font-size: 1rem; font-weight: 600;">No balancing records found</p>
          <p style="font-size: 0.85rem; margin-top: 4px;">Complete and save a balancing session to see it archived here.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const dateFormatted = new Date(item.timestamp).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let badgeClass = 'status-balanced';
      if (item.status === 'surplus') badgeClass = 'status-surplus';
      if (item.status === 'shortage') badgeClass = 'status-shortage';

      const card = document.createElement('div');
      card.className = 'history-item';
      card.innerHTML = `
        <div class="history-item-header">
          <div>
            <span class="history-time">${dateFormatted}</span>
            ${item.notes ? `<p style="font-size: 0.82rem; font-weight: 500; margin-top: 2px;">"${item.notes}"</p>` : ''}
          </div>
          <span class="balance-status-badge ${badgeClass}" style="padding: 4px 12px; font-size: 0.82rem;">
            ${item.statusText}
          </span>
        </div>

        <div class="history-grid">
          <div class="history-stat">
            <span class="history-stat-label">Target Capital</span>
            <span class="history-stat-val">UGX ${window.formatUGX(item.targetCapital)}</span>
          </div>
          <div class="history-stat">
            <span class="history-stat-label">Net Actual Capital</span>
            <span class="history-stat-val">UGX ${window.formatUGX(item.netActualCapital)}</span>
          </div>
          <div class="history-stat">
            <span class="history-stat-label">Float Counted</span>
            <span class="history-stat-val">UGX ${window.formatUGX(item.floatTotal)}</span>
          </div>
          <div class="history-stat">
            <span class="history-stat-label">Physical Cash</span>
            <span class="history-stat-val">UGX ${window.formatUGX(item.cash)}</span>
          </div>
          <div class="history-stat">
            <span class="history-stat-label">Agent Phones</span>
            <span class="history-stat-val">UGX ${window.formatUGX(item.agentPhonesTotal)}</span>
          </div>
          <div class="history-stat">
            <span class="history-stat-label">Stakeholders Net</span>
            <span class="history-stat-val">+${window.formatUGX(item.stakeholderOutTotal)} / -${window.formatUGX(item.stakeholderInTotal)}</span>
          </div>
        </div>

        <div class="history-actions">
          <button class="btn btn-secondary btn-sm btn-view-details" data-id="${item.id}">
            <img src="assets/view-breakdown.png?v=20261013-4" class="btn-icon-img" alt="">
            <span>View Breakdown</span>
          </button>
          <button class="btn btn-outline btn-sm btn-use-target" data-id="${item.id}">
            <img src="assets/target.png?v=20261013-4" class="btn-icon-img" alt="">
            <span>Use as Target</span>
          </button>
          <button class="btn btn-secondary btn-sm btn-share-history" data-id="${item.id}">
            <img src="assets/share.png?v=20261013-4" class="btn-icon-img" alt="">
            <span>WhatsApp</span>
          </button>
          <button class="btn btn-danger btn-sm btn-delete-history" data-id="${item.id}" title="Delete Record">
            <img src="assets/bin.png?v=20261013-4" class="btn-icon-img" alt="Delete">
          </button>
        </div>
      `;
      historyListContainer.appendChild(card);
    });

    // Attach card action listeners
    historyListContainer.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const session = store.history.find(h => h.id === id);
        if (session) openHistoryDetailsModal(session);
      });
    });

    historyListContainer.querySelectorAll('.btn-use-target').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const session = store.history.find(h => h.id === id);
        if (session) {
          store.currentForm.targetCapital = session.netActualCapital;
          store.currentForm.targetSourceLabel = `Loaded from Session (${new Date(session.timestamp).toLocaleDateString()})`;
          recalculateAndRender();
          showToast(`Target Capital set to UGX ${window.formatUGX(session.netActualCapital)}`, 'success');
          // Switch tab to balancing
          document.querySelector('.nav-tab[data-tab="balancing"]').click();
        }
      });
    });

    historyListContainer.querySelectorAll('.btn-share-history').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const session = store.history.find(h => h.id === id);
        if (session) shareReport(session);
      });
    });

    historyListContainer.querySelectorAll('.btn-delete-history').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this historical balancing record?')) {
          store.deleteHistoryRecord(id);
          renderHistoryList();
          showToast('Record deleted', 'info');
        }
      });
    });
  }

  historySearch.addEventListener('input', renderHistoryList);
  historyFilterStatus.addEventListener('change', renderHistoryList);

  btnClearHistory.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete ALL balancing records in history? This action cannot be undone.')) {
      store.clearAllHistory();
      renderHistoryList();
      showToast('All history records cleared', 'info');
    }
  });

  // Export CSV
  btnExportCSV.addEventListener('click', () => {
    if (store.history.length === 0) {
      showToast('No records to export', 'error');
      return;
    }
    const headers = [
      'Date', 'Target Capital', 'Net Actual Capital', 'Variance', 'Status',
      'Float Total', 'Physical Cash', 'Agent Phones Total', 'Commissions Total',
      'Stakeholder Out Total', 'Stakeholder In Total', 'Notes'
    ];
    const rows = store.history.map(rec => [
      `"${new Date(rec.timestamp).toISOString()}"`,
      rec.targetCapital,
      rec.netActualCapital,
      rec.variance,
      `"${rec.status}"`,
      rec.floatTotal,
      rec.cash,
      rec.agentPhonesTotal,
      rec.commissionTotal,
      rec.stakeholderOutTotal,
      rec.stakeholderInTotal,
      `"${(rec.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `balancer_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file', 'success');
  });

  // -------------------------------------------------------------
  // HISTORY DETAILS MODAL (Clean assets)
  // -------------------------------------------------------------
  function openHistoryDetailsModal(session) {
    activeModalSession = session;
    const dateFormatted = new Date(session.timestamp).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let floatItemsHtml = '';
    store.settings.floatAccounts.forEach(acc => {
      const val = (session.float && session.float[acc.id]) || 0;
      if (val > 0) {
        floatItemsHtml += `<div class="calc-row"><span>${acc.name}:</span><span class="calc-val">UGX ${window.formatUGX(val)}</span></div>`;
      }
    });

    let agentItemsHtml = '';
    store.settings.agents.forEach(ag => {
      const val = (session.agentPhones && session.agentPhones[ag.id]) || 0;
      const name = (session.agentsSnapshot && session.agentsSnapshot[ag.id]) || ag.name;
      if (val > 0) {
        agentItemsHtml += `<div class="calc-row"><span>${name}:</span><span class="calc-val">UGX ${window.formatUGX(val)}</span></div>`;
      }
    });

    let commItemsHtml = '';
    if (session.enableCommission) {
      store.settings.commissionAccounts.forEach(comm => {
        const val = (session.commissions && session.commissions[comm.id]) || 0;
        if (val > 0) {
          commItemsHtml += `<div class="calc-row"><span>${comm.name}:</span><span class="calc-val">-UGX ${window.formatUGX(val)}</span></div>`;
        }
      });
    }

    let shOutHtml = '';
    if (session.stakeholderOutTotal > 0) {
      store.settings.stakeholders.forEach(sh => {
        const val = (session.stakeholderOut && session.stakeholderOut[sh.id]) || 0;
        const name = (session.stakeholdersSnapshot && session.stakeholdersSnapshot[sh.id]) || sh.name;
        if (val > 0) {
          shOutHtml += `<div class="calc-row"><span>${name}:</span><span class="calc-val">+UGX ${window.formatUGX(val)}</span></div>`;
        }
      });
    }

    let shInHtml = '';
    if (session.stakeholderInTotal > 0) {
      store.settings.stakeholders.forEach(sh => {
        const val = (session.stakeholderIn && session.stakeholderIn[sh.id]) || 0;
        const name = (session.stakeholdersSnapshot && session.stakeholdersSnapshot[sh.id]) || sh.name;
        if (val > 0) {
          shInHtml += `<div class="calc-row"><span>${name}:</span><span class="calc-val">-UGX ${window.formatUGX(val)}</span></div>`;
        }
      });
    }

    modalHistoryContent.innerHTML = `
      <div style="margin-bottom: 16px;">
        <p style="font-size: 0.85rem; color: var(--text-muted);">Session Date: <strong>${dateFormatted}</strong></p>
        ${session.notes ? `<p style="font-size: 0.85rem; margin-top: 4px;">Notes: <em>${session.notes}</em></p>` : ''}
      </div>

      <div class="calculation-explainer" style="margin-bottom: 16px;">
        <div class="calc-row"><span>Target Capital:</span><span class="calc-val">UGX ${window.formatUGX(session.targetCapital)}</span></div>
        <div class="calc-row highlight"><span>Net Actual Capital:</span><span class="calc-val">UGX ${window.formatUGX(session.netActualCapital)}</span></div>
        <div class="calc-row highlight"><span>Result:</span><span class="calc-val">${session.statusText}</span></div>
      </div>

      <h4 style="font-size: 0.9rem; margin: 12px 0 6px 0; color: var(--primary); display: flex; align-items: center; gap: 6px;">
        <img src="assets/capital.png?v=20261013-4" class="btn-icon-img" alt="">
        <span>Counted Float (UGX ${window.formatUGX(session.floatTotal)})</span>
      </h4>
      <div style="background: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 12px;">
        ${floatItemsHtml || '<p style="font-size: 0.8rem; color: var(--text-muted);">No float balances recorded</p>'}
      </div>

      <h4 style="font-size: 0.9rem; margin: 12px 0 6px 0; color: var(--primary); display: flex; align-items: center; gap: 6px;">
        <img src="assets/physical-money.png?v=20261013-4" class="btn-icon-img" alt="">
        <span>Physical Cash: UGX ${window.formatUGX(session.cash)}</span>
      </h4>

      <h4 style="font-size: 0.9rem; margin: 12px 0 6px 0; color: var(--primary); display: flex; align-items: center; gap: 6px;">
        <img src="assets/money-on-phone.png?v=20261013-4" class="btn-icon-img" alt="">
        <span>Personal Phones (UGX ${window.formatUGX(session.agentPhonesTotal)})</span>
      </h4>
      <div style="background: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 12px;">
        ${agentItemsHtml || '<p style="font-size: 0.8rem; color: var(--text-muted);">No phone balances recorded</p>'}
      </div>

      ${session.enableCommission ? `
        <h4 style="font-size: 0.9rem; margin: 12px 0 6px 0; color: var(--warning); display: flex; align-items: center; gap: 6px;">
          <span>Commissions (Deducted: -UGX ${window.formatUGX(session.commissionTotal)})</span>
        </h4>
        <div style="background: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 12px;">
          ${commItemsHtml || '<p style="font-size: 0.8rem; color: var(--text-muted);">No commissions recorded</p>'}
        </div>
      ` : ''}

      ${session.stakeholderOutTotal > 0 ? `
        <h4 style="font-size: 0.9rem; margin: 12px 0 6px 0; color: var(--info); display: flex; align-items: center; gap: 6px;">
          <img src="assets/money-flow-money-out-and-money-in.png?v=20261013-4" class="btn-icon-img" alt="">
          <span>Money Taken Out by Stakeholders (+UGX ${window.formatUGX(session.stakeholderOutTotal)})</span>
        </h4>
        <div style="background: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 12px;">
          ${shOutHtml}
        </div>
      ` : ''}

      ${session.stakeholderInTotal > 0 ? `
        <h4 style="font-size: 0.9rem; margin: 12px 0 6px 0; color: var(--warning); display: flex; align-items: center; gap: 6px;">
          <img src="assets/money-flow-money-out-and-money-in.png?v=20261013-4" class="btn-icon-img" alt="">
          <span>Money Added by Stakeholders (-UGX ${window.formatUGX(session.stakeholderInTotal)})</span>
        </h4>
        <div style="background: var(--bg-subtle); padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 12px;">
          ${shInHtml}
        </div>
      ` : ''}
    `;

    modalHistoryDetails.classList.add('open');
  }

  btnModalShareWhatsApp.addEventListener('click', () => {
    if (activeModalSession) shareReport(activeModalSession);
  });

  btnModalPrintSlip.addEventListener('click', () => {
    window.print();
  });

  // -------------------------------------------------------------
  // LEDGERS RENDERING
  // -------------------------------------------------------------
  function renderLedgers() {
    // 1. Stakeholders Ledger
    const shLedger = store.getStakeholderLedger();
    stakeholderLedgerTableBody.innerHTML = '';
    Object.values(shLedger).forEach(item => {
      let statusBadge = '<span style="color: var(--text-muted);">Clear (0)</span>';
      if (item.netBalance > 0) {
        statusBadge = `<span style="color: var(--info); font-weight: 700;">Owes Business: UGX ${window.formatUGX(item.netBalance)}</span>`;
      } else if (item.netBalance < 0) {
        statusBadge = `<span style="color: var(--warning); font-weight: 700;">Business Owes: UGX ${window.formatUGX(Math.abs(item.netBalance))}</span>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.name}</strong></td>
        <td style="font-family: var(--font-mono); color: var(--info);">+UGX ${window.formatUGX(item.totalOut)}</td>
        <td style="font-family: var(--font-mono); color: var(--warning);">-UGX ${window.formatUGX(item.totalIn)}</td>
        <td style="font-family: var(--font-mono); font-weight: 700;">UGX ${window.formatUGX(item.netBalance)}</td>
        <td>${statusBadge}</td>
      `;
      stakeholderLedgerTableBody.appendChild(tr);
    });

    // 2. Agents Ledger
    const agentLedger = store.getAgentLedger();
    agentLedgerTableBody.innerHTML = '';
    Object.values(agentLedger).forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.name}</strong></td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">UGX ${window.formatUGX(item.latestAmount)}</td>
        <td>${item.history.length} session(s)</td>
      `;
      agentLedgerTableBody.appendChild(tr);
    });
  }

  // -------------------------------------------------------------
  // SETTINGS RENDERING & SAVING
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // SETTINGS RENDERING & MANAGEMENT (DYNAMIC PARAMETERS & ENTITIES)
  // -------------------------------------------------------------
  function renderSettings() {
    // 1. Float Accounts
    if (settingsFloatAccountsGrid) {
      settingsFloatAccountsGrid.innerHTML = '';
      const activeCount = store.settings.floatAccounts.filter(a => a.enabled !== false).length;
      if (floatCountBadge) {
        floatCountBadge.textContent = `${activeCount} Active (${store.settings.floatAccounts.length} Total)`;
      }

      store.settings.floatAccounts.forEach(acc => {
        const card = document.createElement('div');
        card.className = `parameter-item-card ${acc.enabled === false ? 'disabled' : ''}`;
        card.innerHTML = `
          <div class="parameter-item-left">
            <input 
              type="checkbox" 
              class="parameter-checkbox" 
              ${acc.enabled !== false ? 'checked' : ''} 
              title="Toggle active in balancing form"
            >
            <input 
              type="text" 
              class="parameter-name-input" 
              value="${acc.name}" 
              title="Click to rename parameter"
            >
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="provider-pill provider-${acc.provider}">${acc.provider || acc.category}</span>
            <button class="btn-remove-item" title="Remove parameter">
              <img src="assets/bin.png?v=20261013-4" class="btn-icon-img" alt="Delete">
            </button>
          </div>
        `;
        settingsFloatAccountsGrid.appendChild(card);

        const chk = card.querySelector('.parameter-checkbox');
        chk.addEventListener('change', () => {
          store.toggleFloatAccount(acc.id, chk.checked);
          renderSettings();
          renderFormFields();
          recalculateAndRender();
        });

        const nameInput = card.querySelector('.parameter-name-input');
        nameInput.addEventListener('change', () => {
          const val = nameInput.value.trim();
          if (val) {
            acc.name = val;
            store.saveSettings(store.settings);
            renderFormFields();
            recalculateAndRender();
          }
        });

        const btnRemove = card.querySelector('.btn-remove-item');
        btnRemove.addEventListener('click', () => {
          store.removeFloatAccount(acc.id);
          renderSettings();
          renderFormFields();
          recalculateAndRender();
          showToast(`Removed float account "${acc.name}"`, 'info');
        });
      });
    }

    // 2. Stakeholders
    if (settingsStakeholdersGrid) {
      settingsStakeholdersGrid.innerHTML = '';
      const activeCount = store.settings.stakeholders.filter(s => s.enabled !== false).length;
      if (stakeholdersCountBadge) {
        stakeholdersCountBadge.textContent = `${activeCount} Active (${store.settings.stakeholders.length} Total)`;
      }

      store.settings.stakeholders.forEach(sh => {
        const card = document.createElement('div');
        card.className = `parameter-item-card ${sh.enabled === false ? 'disabled' : ''}`;
        card.innerHTML = `
          <div class="parameter-item-left">
            <input 
              type="checkbox" 
              class="parameter-checkbox" 
              ${sh.enabled !== false ? 'checked' : ''} 
              title="Toggle active"
            >
            <input 
              type="text" 
              class="parameter-name-input" 
              value="${sh.name}" 
              title="Click to rename stakeholder"
            >
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="btn-remove-item" title="Remove stakeholder">
              <img src="assets/bin.png?v=20261013-4" class="btn-icon-img" alt="Delete">
            </button>
          </div>
        `;
        settingsStakeholdersGrid.appendChild(card);

        const chk = card.querySelector('.parameter-checkbox');
        chk.addEventListener('change', () => {
          store.toggleStakeholder(sh.id, chk.checked);
          renderSettings();
          renderFormFields();
          recalculateAndRender();
          renderLedgers();
        });

        const nameInput = card.querySelector('.parameter-name-input');
        nameInput.addEventListener('change', () => {
          const val = nameInput.value.trim();
          if (val) {
            sh.name = val;
            store.saveSettings(store.settings);
            renderFormFields();
            recalculateAndRender();
            renderLedgers();
          }
        });

        const btnRemove = card.querySelector('.btn-remove-item');
        btnRemove.addEventListener('click', () => {
          store.removeStakeholder(sh.id);
          renderSettings();
          renderFormFields();
          recalculateAndRender();
          renderLedgers();
          showToast(`Removed stakeholder "${sh.name}"`, 'info');
        });
      });
    }

    // 3. Agents
    if (settingsAgentsGrid) {
      settingsAgentsGrid.innerHTML = '';
      const activeCount = store.settings.agents.filter(a => a.enabled !== false).length;
      if (agentsCountBadge) {
        agentsCountBadge.textContent = `${activeCount} Active (${store.settings.agents.length} Total)`;
      }

      store.settings.agents.forEach(ag => {
        const card = document.createElement('div');
        card.className = `parameter-item-card ${ag.enabled === false ? 'disabled' : ''}`;
        card.innerHTML = `
          <div class="parameter-item-left">
            <input 
              type="checkbox" 
              class="parameter-checkbox" 
              ${ag.enabled !== false ? 'checked' : ''} 
              title="Toggle active"
            >
            <input 
              type="text" 
              class="parameter-name-input" 
              value="${ag.name}" 
              title="Click to rename agent"
            >
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="btn-remove-item" title="Remove agent">
              <img src="assets/bin.png?v=20261013-4" class="btn-icon-img" alt="Delete">
            </button>
          </div>
        `;
        settingsAgentsGrid.appendChild(card);

        const chk = card.querySelector('.parameter-checkbox');
        chk.addEventListener('change', () => {
          store.toggleAgent(ag.id, chk.checked);
          renderSettings();
          renderFormFields();
          recalculateAndRender();
          renderLedgers();
        });

        const nameInput = card.querySelector('.parameter-name-input');
        nameInput.addEventListener('change', () => {
          const val = nameInput.value.trim();
          if (val) {
            ag.name = val;
            store.saveSettings(store.settings);
            renderFormFields();
            recalculateAndRender();
            renderLedgers();
          }
        });

        const btnRemove = card.querySelector('.btn-remove-item');
        btnRemove.addEventListener('click', () => {
          store.removeAgent(ag.id);
          renderSettings();
          renderFormFields();
          recalculateAndRender();
          renderLedgers();
          showToast(`Removed agent "${ag.name}"`, 'info');
        });
      });
    }

    // 4. Commission Accounts
    if (settingsCommissionsGrid) {
      settingsCommissionsGrid.innerHTML = '';
      const activeCount = store.settings.commissionAccounts.filter(c => c.enabled !== false).length;
      if (commissionsCountBadge) {
        commissionsCountBadge.textContent = `${activeCount} Active (${store.settings.commissionAccounts.length} Total)`;
      }

      store.settings.commissionAccounts.forEach(comm => {
        const card = document.createElement('div');
        card.className = `parameter-item-card ${comm.enabled === false ? 'disabled' : ''}`;
        card.innerHTML = `
          <div class="parameter-item-left">
            <input 
              type="checkbox" 
              class="parameter-checkbox" 
              ${comm.enabled !== false ? 'checked' : ''} 
              title="Toggle active"
            >
            <input 
              type="text" 
              class="parameter-name-input" 
              value="${comm.name}" 
              title="Click to rename commission line"
            >
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="provider-pill provider-${comm.provider}">${comm.provider}</span>
            <button class="btn-remove-item" title="Remove commission line">
              <img src="assets/bin.png?v=20261013-4" class="btn-icon-img" alt="Delete">
            </button>
          </div>
        `;
        settingsCommissionsGrid.appendChild(card);

        const chk = card.querySelector('.parameter-checkbox');
        chk.addEventListener('change', () => {
          store.toggleCommissionAccount(comm.id, chk.checked);
          renderSettings();
          renderFormFields();
          recalculateAndRender();
        });

        const nameInput = card.querySelector('.parameter-name-input');
        nameInput.addEventListener('change', () => {
          const val = nameInput.value.trim();
          if (val) {
            comm.name = val;
            store.saveSettings(store.settings);
            renderFormFields();
            recalculateAndRender();
          }
        });

        const btnRemove = card.querySelector('.btn-remove-item');
        btnRemove.addEventListener('click', () => {
          store.removeCommissionAccount(comm.id);
          renderSettings();
          renderFormFields();
          recalculateAndRender();
          showToast(`Removed commission line "${comm.name}"`, 'info');
        });
      });
    }

    // 5. Baseline Settings
    settingPresetCapital.value = window.formatUGX(store.settings.presetCapital);
    attachMoneyInputListeners(settingPresetCapital, null);

    const radios = document.querySelectorAll('input[name="settingCapitalSource"]');
    radios.forEach(r => {
      r.checked = r.value === store.settings.capitalSource;
    });
  }

  // --- Parameter Creation Event Handlers ---
  if (btnAddFloatAccount) {
    btnAddFloatAccount.addEventListener('click', () => {
      const name = (newFloatName && newFloatName.value.trim()) || '';
      if (!name) {
        showToast('Please enter an account name (e.g. MTN 4, ABSA Bank)', 'warning');
        return;
      }
      const category = (newFloatCategory && newFloatCategory.value) || 'telecom';
      store.addFloatAccount(name, category, null);
      if (newFloatName) newFloatName.value = '';
      renderSettings();
      renderFormFields();
      recalculateAndRender();
      showToast(`Float account "${name}" created!`, 'success');
    });
  }

  if (btnAddStakeholder) {
    btnAddStakeholder.addEventListener('click', () => {
      const name = (newStakeholderName && newStakeholderName.value.trim()) || '';
      if (!name) {
        showToast('Please enter a stakeholder name (e.g. Director Paul)', 'warning');
        return;
      }
      store.addStakeholder(name);
      if (newStakeholderName) newStakeholderName.value = '';
      renderSettings();
      renderFormFields();
      recalculateAndRender();
      renderLedgers();
      showToast(`Stakeholder "${name}" created!`, 'success');
    });
  }

  if (btnAddAgent) {
    btnAddAgent.addEventListener('click', () => {
      const name = (newAgentName && newAgentName.value.trim()) || '';
      if (!name) {
        showToast('Please enter an agent name (e.g. Amina, Peter)', 'warning');
        return;
      }
      store.addAgent(name);
      if (newAgentName) newAgentName.value = '';
      renderSettings();
      renderFormFields();
      recalculateAndRender();
      renderLedgers();
      showToast(`Agent "${name}" created!`, 'success');
    });
  }

  if (btnAddCommissionAccount) {
    btnAddCommissionAccount.addEventListener('click', () => {
      const name = (newCommissionName && newCommissionName.value.trim()) || '';
      if (!name) {
        showToast('Please enter a commission line name (e.g. MTN 4 Commission)', 'warning');
        return;
      }
      const provider = (newCommissionProvider && newCommissionProvider.value) || 'mtn';
      store.addCommissionAccount(name, provider);
      if (newCommissionName) newCommissionName.value = '';
      renderSettings();
      renderFormFields();
      recalculateAndRender();
      showToast(`Commission line "${name}" created!`, 'success');
    });
  }

  // --- Reset to Defaults Event Handlers ---
  if (btnResetFloatDefaults) {
    btnResetFloatDefaults.addEventListener('click', () => {
      store.resetFloatAccountsToDefault();
      renderSettings();
      renderFormFields();
      recalculateAndRender();
      showToast('Float accounts restored to original 13 defaults', 'success');
    });
  }

  if (btnResetStakeholdersDefaults) {
    btnResetStakeholdersDefaults.addEventListener('click', () => {
      store.resetStakeholdersToDefault();
      renderSettings();
      renderFormFields();
      recalculateAndRender();
      renderLedgers();
      showToast('Stakeholders restored to original 4 defaults', 'success');
    });
  }

  if (btnResetAgentsDefaults) {
    btnResetAgentsDefaults.addEventListener('click', () => {
      store.resetAgentsToDefault();
      renderSettings();
      renderFormFields();
      recalculateAndRender();
      renderLedgers();
      showToast('Agents restored to original 3 defaults', 'success');
    });
  }

  if (btnResetCommissionsDefaults) {
    btnResetCommissionsDefaults.addEventListener('click', () => {
      store.resetCommissionAccountsToDefault();
      renderSettings();
      renderFormFields();
      recalculateAndRender();
      showToast('Commission lines restored to original 5 defaults', 'success');
    });
  }

  if (btnResetAllDefaults) {
    btnResetAllDefaults.addEventListener('click', () => {
      if (confirm('Restore all float parameters, stakeholders, agents, and default capital back to original defaults?')) {
        store.resetAllToDefault();
        renderSettings();
        renderFormFields();
        recalculateAndRender();
        renderLedgers();
        showToast('All parameters and settings restored to original defaults', 'success');
      }
    });
  }

  btnSaveSettings.addEventListener('click', () => {
    // Collect baseline capital
    store.settings.presetCapital = window.parseWholeNumber(settingPresetCapital.value);

    // Collect source choice
    const selectedSource = document.querySelector('input[name="settingCapitalSource"]:checked');
    if (selectedSource) {
      store.settings.capitalSource = selectedSource.value;
    }

    store.saveSettings(store.settings);

    // Refresh forms and recalculate
    renderFormFields();
    recalculateAndRender();
    renderSettings();
    showToast('Settings successfully updated!', 'success');
  });

  // Demo Data loader
  btnLoadDemoData.addEventListener('click', () => {
    if (confirm('Load sample demonstration records and agent/stakeholder names?')) {
      store.loadDemoData();
      renderFormFields();
      renderSettings();
      recalculateAndRender();
      showToast('Sample demonstration data loaded!', 'success');
    }
  });

  // Export JSON Backup
  btnExportJSON.addEventListener('click', () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: store.settings,
      history: store.history,
      currentForm: store.currentForm
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balancer_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Backup JSON file exported', 'success');
  });

  // Restore from Backup
  btnImportJSON.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.settings) store.saveSettings(parsed.settings);
        if (Array.isArray(parsed.history)) {
          store.history = parsed.history;
          store.saveHistory();
        }
        if (parsed.currentForm) store.saveCurrentForm(parsed.currentForm);
        renderFormFields();
        renderSettings();
        recalculateAndRender();
        showToast('Backup data successfully restored!', 'success');
      } catch (err) {
        showToast('Invalid backup JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // -------------------------------------------------------------
  // CLOSE MODALS HANDLER
  // -------------------------------------------------------------
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('open');
      }
    });
  });

  // -------------------------------------------------------------
  // INITIALIZE APP
  // -------------------------------------------------------------
  renderFormFields();
  recalculateAndRender();
});
