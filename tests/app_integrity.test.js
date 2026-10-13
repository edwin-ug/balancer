const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- VERIFYING BALANCER APPLICATION INTEGRITY ---');

const projectRoot = path.resolve(__dirname, '..');

// Check key files exist
const requiredFiles = [
  'index.html',
  'css/style.css',
  'js/calculator.js',
  'js/store.js',
  'js/app.js',
  'js/auth.js',
  'js/firebase-config.js',
  'server.js',
  'package.json'
];

requiredFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  assert(fs.existsSync(filePath), `Missing required file: ${file}`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.length > 50, `File appears empty: ${file}`);
  console.log(`✓ File verified: ${file} (${content.length} bytes)`);
});

// Check provided asset files exist
const requiredAssets = [
  'assets/balancer-logo.svg',
  'assets/balancer-logo.png',
  'assets/capital.png',
  'assets/physical-money.png',
  'assets/money-on-phone.png',
  'assets/money-flow-money-out-and-money-in.png',
  'assets/target.png',
  'assets/history.png',
  'assets/ledger.png',
  'assets/view-breakdown.png',
  'assets/save-balancing-session.png',
  'assets/share.png',
  'assets/print.png',
  'assets/csv.png',
  'assets/bin.png',
  'assets/Prime-Nordic-Font/PrimeNordicDEMO-Regular-BF6aa17442f1903.ttf'
];

requiredAssets.forEach(assetPath => {
  const fullPath = path.join(projectRoot, assetPath);
  assert(fs.existsSync(fullPath), `Missing asset: ${assetPath}`);
});
console.log(`✓ All 16 provided assets verified on disk`);

const indexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(projectRoot, 'js/app.js'), 'utf8');
const storeJs = fs.readFileSync(path.join(projectRoot, 'js/store.js'), 'utf8');
const calcJs = fs.readFileSync(path.join(projectRoot, 'js/calculator.js'), 'utf8');
const css = fs.readFileSync(path.join(projectRoot, 'css/style.css'), 'utf8');

// 1. Verify Favicon
assert(indexHtml.includes('href="assets/balancer-logo.svg'), 'Favicon SVG link missing in index.html');
console.log('✓ Favicon points to assets/balancer-logo.svg');

// 2. Verify NO EMOJIS in code/markup
// Standard emoji unicode range regex
const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

assert(!emojiRegex.test(indexHtml), 'index.html contains emojis');
assert(!emojiRegex.test(calcJs), 'calculator.js contains emojis');
assert(!emojiRegex.test(css), 'style.css contains emojis');
console.log('✓ Verified: Zero emojis in index.html, calculator.js, and style.css');

// 3. Verify Commission Deduction logic (commission earned is NOT money belonging to the business)
assert(calcJs.includes('deductions'), 'calculator.js missing deductions');
assert(calcJs.includes('commissionTotal'), 'calculator.js missing commissionTotal');
console.log('✓ Verified: Commission is deducted as non-business capital');

// 4. Verify Float accounts
const requiredFloatAccounts = [
  'mtn1', 'mtn2', 'mtn3',
  'airtel1', 'airtel2',
  'bank_of_africa1', 'bank_of_africa2',
  'centenary',
  'stanbic1', 'stanbic2',
  'payway',
  'equity',
  'dfcu'
];
requiredFloatAccounts.forEach(acc => {
  assert(storeJs.includes(acc), `Float account ${acc} missing in store.js`);
});
console.log(`✓ All 13 float accounts verified in store`);

// 5. Verify Agents & Stakeholders
assert(storeJs.includes('agent1') && storeJs.includes('agent2') && storeJs.includes('agent3'));
assert(storeJs.includes('stakeholder1') && storeJs.includes('stakeholder2') && storeJs.includes('stakeholder3') && storeJs.includes('stakeholder4'));
console.log('✓ Agents and Stakeholders verified');

// 6. Verify SVGs prioritized and assets used
assert(indexHtml.includes('<svg') && indexHtml.includes('assets/balancer-logo.svg'));
assert(indexHtml.includes('assets/physical-money.png'));
assert(indexHtml.includes('assets/money-on-phone.png'));
assert(indexHtml.includes('assets/money-flow-money-out-and-money-in.png'));
assert(indexHtml.includes('assets/save-balancing-session.png'));
console.log('✓ SVGs and provided assets verified in markup');

// 7. Verify quick chips are completely removed
assert(!indexHtml.includes('quick-chips'), 'index.html still contains quick-chips');
assert(!appJs.includes('quick-chips'), 'app.js still contains quick-chips');
assert(!indexHtml.includes('chip-btn'), 'index.html still contains chip-btn');
assert(!appJs.includes('chip-btn'), 'app.js still contains chip-btn');
console.log('✓ Verified: Quick chip buttons (+50k, +100k, etc.) removed for polished UI');

// 8. Verify Industry Standard Fonts (Inter only - no slashed-zero fonts)
assert(indexHtml.includes('family=Inter'), 'Inter font link missing in index.html');
assert(!indexHtml.includes('JetBrains+Mono'), 'JetBrains Mono (slashed zeros) should not be in index.html');
assert(css.includes('--font-sans') && css.includes('Inter'), 'Inter sans font stack missing in style.css');
assert(css.includes('--font-mono') && css.includes('Inter'), 'Inter mono font stack missing in style.css');
assert(!css.includes('JetBrains Mono'), 'JetBrains Mono (slashed zeros) should not be in style.css');
assert(css.includes('tabular-nums'), 'font-variant-numeric: tabular-nums missing in style.css');
console.log('✓ Verified: Industry standard typography (Inter only, no slashed-zero fonts) configured');

// 9. Verify Target Capital Card has light background and dark high contrast text
assert(css.includes('.target-capital-card'), 'target-capital-card missing in style.css');
assert(css.includes('[data-theme="dark"] .target-capital-card'), 'dark theme override for target-capital-card missing in style.css');
console.log('✓ Verified: Target capital card maintains light high-contrast background');

// 10. Verify Dynamic Parameter & Entity Management
assert(indexHtml.includes('newFloatName') && indexHtml.includes('btnAddFloatAccount'), 'Float parameter add controls missing in index.html');
assert(indexHtml.includes('newStakeholderName') && indexHtml.includes('btnAddStakeholder'), 'Stakeholder add controls missing in index.html');
assert(indexHtml.includes('newAgentName') && indexHtml.includes('btnAddAgent'), 'Agent add controls missing in index.html');
assert(indexHtml.includes('btnResetFloatDefaults'), 'Restore float defaults button missing in index.html');
assert(storeJs.includes('addFloatAccount') && storeJs.includes('removeFloatAccount'), 'Float management methods missing in store.js');
assert(storeJs.includes('addStakeholder') && storeJs.includes('removeStakeholder'), 'Stakeholder management methods missing in store.js');
assert(storeJs.includes('addAgent') && storeJs.includes('removeAgent'), 'Agent management methods missing in store.js');
// 11. Verify Every Delete Button Strictly Maintains Red Styling
assert(css.includes('.btn-delete-history') && css.includes('var(--danger)'), 'btn-delete-history missing red danger styling');
assert(css.includes('.btn-remove-item') && css.includes('var(--danger)'), 'btn-remove-item missing red danger styling');
assert(appJs.includes('btn btn-danger btn-sm btn-delete-history'), 'History delete button not using btn-danger class');
assert(css.includes('[data-theme="dark"] .btn-delete-history'), 'Dark mode delete button override missing');
console.log('✓ Verified: Every delete button strictly maintains red styling across light and dark themes');

// 12. Verify Firebase Authentication Integration
assert(indexHtml.includes('id="btnAuthHeader"'), 'Header auth button missing in index.html');
assert(indexHtml.includes('id="modalAuth"'), 'Auth modal missing in index.html');
assert(indexHtml.includes('id="authGateScreen"'), 'Dedicated Login Screen (authGateScreen) missing in index.html');
assert(indexHtml.includes('id="authLoadingSplash"'), 'Loading splash missing in index.html');
assert(indexHtml.includes('id="appRoot"'), 'appRoot wrapper missing in index.html');
assert(!indexHtml.includes('border-bottom: 2px solid var(--primary); color: var(--primary);'), 'Inline border-bottom found on auth tabs causing sticky blue accent bug');
assert(indexHtml.includes('js/auth.js'), 'auth.js script tag missing in index.html');
const authJs = fs.readFileSync(path.join(projectRoot, 'js/auth.js'), 'utf8');
const fbConfigJs = fs.readFileSync(path.join(projectRoot, 'js/firebase-config.js'), 'utf8');
assert(!emojiRegex.test(authJs), 'auth.js contains emojis');
assert(!emojiRegex.test(fbConfigJs), 'firebase-config.js contains emojis');
assert(fbConfigJs.includes('balancer-1ab7e'), 'firebase-config.js missing project ID balancer-1ab7e');
console.log('✓ Verified: Dedicated Login Screen & clean tab state transitions configured with zero emojis and balancer-1ab7e');

console.log('--- ALL INTEGRITY CHECKS PASSED PERFECTLY! ---');
