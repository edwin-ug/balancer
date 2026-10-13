/**
 * Balancer - Core Mathematics & Financial Calculations
 */

// Format integer to UGX string with commas (no decimals)
function formatUGX(value) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  const integerVal = Math.round(Number(value));
  return integerVal.toLocaleString('en-US');
}

// Parse string or number to a non-negative whole integer
function parseWholeNumber(value) {
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return 0;
    return Math.max(0, Math.round(value));
  }
  if (!value) return 0;
  // Remove all non-digit characters
  const cleanStr = String(value).replace(/[^0-9]/g, '');
  if (!cleanStr) return 0;
  const num = parseInt(cleanStr, 10);
  return isNaN(num) ? 0 : num;
}

// Compute all balancing aggregates
// Note: Commission earned is NOT considered money that belongs to the business,
// so when included, it is removed/deducted from counted assets to determine true business capital.
function calculateBalancing(state, settings = null) {
  const floatItems = state.float || {};
  let floatTotal = 0;
  if (settings && Array.isArray(settings.floatAccounts)) {
    const activeIds = new Set(
      settings.floatAccounts
        .filter(a => a.enabled !== false)
        .map(a => a.id)
    );
    floatTotal = Object.entries(floatItems).reduce((sum, [id, val]) => {
      return activeIds.has(id) ? sum + parseWholeNumber(val) : sum;
    }, 0);
  } else {
    floatTotal = Object.values(floatItems).reduce(
      (sum, val) => sum + parseWholeNumber(val),
      0
    );
  }

  const cashTotal = parseWholeNumber(state.cash || 0);

  const agentPhones = state.agentPhones || {};
  let agentPhonesTotal = 0;
  if (settings && Array.isArray(settings.agents)) {
    const activeIds = new Set(
      settings.agents
        .filter(a => a.enabled !== false)
        .map(a => a.id)
    );
    agentPhonesTotal = Object.entries(agentPhones).reduce((sum, [id, val]) => {
      return activeIds.has(id) ? sum + parseWholeNumber(val) : sum;
    }, 0);
  } else {
    agentPhonesTotal = Object.values(agentPhones).reduce(
      (sum, val) => sum + parseWholeNumber(val),
      0
    );
  }

  const isCommissionEnabled = Boolean(state.enableCommission);
  const commissionItems = state.commissions || {};
  let commissionTotal = 0;
  if (isCommissionEnabled) {
    if (settings && Array.isArray(settings.commissionAccounts)) {
      const activeIds = new Set(
        settings.commissionAccounts
          .filter(c => c.enabled !== false)
          .map(c => c.id)
      );
      commissionTotal = Object.entries(commissionItems).reduce((sum, [id, val]) => {
        return activeIds.has(id) ? sum + parseWholeNumber(val) : sum;
      }, 0);
    } else {
      commissionTotal = Object.values(commissionItems).reduce(
        (sum, val) => sum + parseWholeNumber(val),
        0
      );
    }
  }

  const isStakeholderOutEnabled = state.enableStakeholderOut !== false;
  const stakeholderOutItems = state.stakeholderOut || {};
  let stakeholderOutTotal = 0;
  if (isStakeholderOutEnabled) {
    if (settings && Array.isArray(settings.stakeholders)) {
      const activeIds = new Set(
        settings.stakeholders
          .filter(s => s.enabled !== false)
          .map(s => s.id)
      );
      stakeholderOutTotal = Object.entries(stakeholderOutItems).reduce((sum, [id, val]) => {
        return activeIds.has(id) ? sum + parseWholeNumber(val) : sum;
      }, 0);
    } else {
      stakeholderOutTotal = Object.values(stakeholderOutItems).reduce(
        (sum, val) => sum + parseWholeNumber(val),
        0
      );
    }
  }

  const isStakeholderInEnabled = state.enableStakeholderIn !== false;
  const stakeholderInItems = state.stakeholderIn || {};
  let stakeholderInTotal = 0;
  if (isStakeholderInEnabled) {
    if (settings && Array.isArray(settings.stakeholders)) {
      const activeIds = new Set(
        settings.stakeholders
          .filter(s => s.enabled !== false)
          .map(s => s.id)
      );
      stakeholderInTotal = Object.entries(stakeholderInItems).reduce((sum, [id, val]) => {
        return activeIds.has(id) ? sum + parseWholeNumber(val) : sum;
      }, 0);
    } else {
      stakeholderInTotal = Object.values(stakeholderInItems).reduce(
        (sum, val) => sum + parseWholeNumber(val),
        0
      );
    }
  }

  // Total counted float, cash, and personal phone lines in hand
  const totalCountedAssets = floatTotal + cashTotal + agentPhonesTotal;

  // Money taken out by stakeholders is business money temporarily withdrawn (receivable / added back)
  const grossCapital = totalCountedAssets + stakeholderOutTotal;

  // Money that should NOT be in business capital (deducted):
  // 1. Temporary stakeholder injections (liability)
  // 2. Commission earned (does not belong to the business)
  const deductions = stakeholderInTotal + commissionTotal;

  // Net actual business capital
  const netActualCapital = grossCapital - deductions;

  const targetCapital = parseWholeNumber(state.targetCapital || 0);
  const variance = netActualCapital - targetCapital;

  let status = 'balanced';
  let statusText = 'Balanced';
  if (variance > 0) {
    status = 'surplus';
    statusText = `Surplus (+UGX ${formatUGX(variance)})`;
  } else if (variance < 0) {
    status = 'shortage';
    statusText = `Shortage (-UGX ${formatUGX(Math.abs(variance))})`;
  } else {
    statusText = 'Balanced (UGX 0)';
  }

  return {
    floatTotal,
    cashTotal,
    agentPhonesTotal,
    commissionTotal,
    isCommissionEnabled,
    stakeholderOutTotal,
    isStakeholderOutEnabled,
    stakeholderInTotal,
    isStakeholderInEnabled,
    totalCountedAssets,
    grossCapital,
    deductions,
    netActualCapital,
    targetCapital,
    variance,
    status,
    statusText
  };
}

// Generate formatted text summary for sharing via WhatsApp or SMS (no emojis)
function generateShareText(record, settings = null) {
  const calc = calculateBalancing(record, settings);
  const dateStr = record.timestamp
    ? new Date(record.timestamp).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleString('en-GB');

  let text = `[BALANCER REPORT - ${dateStr}]\n`;
  text += `------------------------------------\n`;
  text += `Target Capital: UGX ${formatUGX(calc.targetCapital)}\n`;
  text += `Total Float: UGX ${formatUGX(calc.floatTotal)}\n`;
  text += `Physical Cash: UGX ${formatUGX(calc.cashTotal)}\n`;
  text += `Personal Phones: UGX ${formatUGX(calc.agentPhonesTotal)}\n`;

  if (calc.isCommissionEnabled && calc.commissionTotal > 0) {
    text += `Commission (Not Business Money): -UGX ${formatUGX(calc.commissionTotal)}\n`;
  }

  if (calc.stakeholderOutTotal > 0) {
    text += `Stakeholders Out (Drawings): +UGX ${formatUGX(calc.stakeholderOutTotal)}\n`;
  }

  if (calc.stakeholderInTotal > 0) {
    text += `Stakeholders In (Injections): -UGX ${formatUGX(calc.stakeholderInTotal)}\n`;
  }

  text += `------------------------------------\n`;
  text += `Net Actual Capital: UGX ${formatUGX(calc.netActualCapital)}\n`;
  
  if (calc.status === 'balanced') {
    text += `RESULT: BALANCED (UGX 0)\n`;
  } else if (calc.status === 'surplus') {
    text += `RESULT: SURPLUS +UGX ${formatUGX(calc.variance)}\n`;
  } else {
    text += `RESULT: SHORTAGE -UGX ${formatUGX(Math.abs(calc.variance))}\n`;
  }

  if (record.notes && record.notes.trim()) {
    text += `Notes: ${record.notes.trim()}\n`;
  }

  text += `------------------------------------\n`;
  text += `Generated by Balancer Agent Banking`;
  return text;
}

// Export for node or browser environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatUGX,
    parseWholeNumber,
    calculateBalancing,
    generateShareText
  };
}
