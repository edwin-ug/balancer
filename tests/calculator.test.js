const assert = require('assert');
const {
  formatUGX,
  parseWholeNumber,
  calculateBalancing,
  generateShareText
} = require('../js/calculator.js');

console.log('--- RUNNING BALANCER CALCULATOR TESTS ---');

// Test 1: formatUGX
assert.strictEqual(formatUGX(0), '0');
assert.strictEqual(formatUGX(1000), '1,000');
assert.strictEqual(formatUGX(25450300), '25,450,300');
assert.strictEqual(formatUGX('5000000'), '5,000,000');
assert.strictEqual(formatUGX(null), '0');
console.log('✓ Test 1: formatUGX passed');

// Test 2: parseWholeNumber
assert.strictEqual(parseWholeNumber('0'), 0);
assert.strictEqual(parseWholeNumber('1,000,000'), 1000000);
assert.strictEqual(parseWholeNumber('UGX 250,500'), 250500);
assert.strictEqual(parseWholeNumber(12345.67), 12346); // round to whole number
assert.strictEqual(parseWholeNumber(-500), 0); // non-negative
assert.strictEqual(parseWholeNumber(''), 0);
console.log('✓ Test 2: parseWholeNumber passed');

// Test 3: calculateBalancing - exact match without commission
const testState1 = {
  targetCapital: 10000000,
  float: {
    mtn1: 2000000,
    mtn2: 1000000,
    airtel1: 1500000,
    stanbic1: 2500000
  },
  cash: 2000000,
  agentPhones: {
    agent1: 1000000
  },
  enableCommission: false,
  stakeholderOut: {},
  stakeholderIn: {}
};
const res1 = calculateBalancing(testState1);
assert.strictEqual(res1.floatTotal, 7000000);
assert.strictEqual(res1.cashTotal, 2000000);
assert.strictEqual(res1.agentPhonesTotal, 1000000);
assert.strictEqual(res1.totalCountedAssets, 10000000);
assert.strictEqual(res1.netActualCapital, 10000000);
assert.strictEqual(res1.variance, 0);
assert.strictEqual(res1.status, 'balanced');
console.log('✓ Test 3: exact match balancing passed');

// Test 4: calculateBalancing - with commission deducted (as commission does NOT belong to the business)
const testState2 = {
  targetCapital: 20000000,
  float: {
    mtn1: 5000000,
    airtel1: 5000000,
    dfcu: 2000000
  },
  cash: 5000000,
  agentPhones: {
    agent1: 500000,
    agent2: 500000
  },
  enableCommission: true,
  commissions: {
    mtn1: 150000,
    airtel1: 50000
  }, // Total commission = 200,000 (Deducted)
  stakeholderOut: {
    stakeholder1: 3000000 // taken out temporarily (+ to business capital)
  },
  stakeholderIn: {
    stakeholder2: 1000000 // injected temporarily (- from business capital)
  }
};
// Counted assets = Float (12M) + Cash (5M) + Phones (1M) = 18M
// Gross capital = 18M + 3M (Out) = 21M
// Deductions = 1M (In) + 200k (Commission) = 1.2M
// Net capital = 21M - 1.2M = 19.8M
// Target = 20M
// Variance = 19.8M - 20M = -200,000 (Shortage)
const res2 = calculateBalancing(testState2);
assert.strictEqual(res2.floatTotal, 12000000);
assert.strictEqual(res2.cashTotal, 5000000);
assert.strictEqual(res2.agentPhonesTotal, 1000000);
assert.strictEqual(res2.commissionTotal, 200000);
assert.strictEqual(res2.stakeholderOutTotal, 3000000);
assert.strictEqual(res2.stakeholderInTotal, 1000000);
assert.strictEqual(res2.netActualCapital, 19800000);
assert.strictEqual(res2.variance, -200000);
assert.strictEqual(res2.status, 'shortage');
console.log('✓ Test 4: commission deducted (not business money) passed');

// Test 5: calculateBalancing - exact match when commission deducted
const testStateBalanced = {
  targetCapital: 10000000,
  float: { mtn1: 8000000 },
  cash: 2150000, // Total counted in till & float = 10,150,000
  agentPhones: {},
  enableCommission: true,
  commissions: { mtn1: 150000 }, // 150k is commission earned, not business capital!
  stakeholderOut: {},
  stakeholderIn: {}
};
// Net capital = 10,150,000 - 150,000 = 10,000,000
const resBalanced = calculateBalancing(testStateBalanced);
assert.strictEqual(resBalanced.netActualCapital, 10000000);
assert.strictEqual(resBalanced.variance, 0);
assert.strictEqual(resBalanced.status, 'balanced');
console.log('✓ Test 5: exact match with commission deduction passed');

// Test 6: share text generator (no emojis)
const shareTxt = generateShareText({
  timestamp: Date.now(),
  ...testState2
});
assert(shareTxt.includes('[BALANCER REPORT'));
assert(!shareTxt.includes('⚖️'));
assert(!shareTxt.includes('🎯'));
assert(!shareTxt.includes('🟢'));
console.log('✓ Test 6: share text generation (no emojis) passed');

console.log('--- ALL CALCULATOR TESTS PASSED SUCCESSFULLY! ---');
