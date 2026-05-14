/**
 * Tests for UK Salary Calculator
 * Run: node tests/salary-calculator.test.js
 * 
 * Cross-validate against: salarycalculator.co.uk, thesalarycalculator.co.uk, gov.uk
 * 
 * TEST SCENARIOS cover:
 * 1. Typical UK employee (£30k, no student loan)
 * 2. Higher rate taxpayer (£60k)
 * 3. Low earner (£15k, minimal tax)
 * 4. Additional rate taxpayer (£150k)
 * 5. Scotland resident (£45k)
 * 6. Student Loan Plan 2 (£35k)
 * 7. Student Loan Plan 1 + Postgrad (£40k)
 * 8. Pension salary sacrifice 5% (£50k)
 * 9. Personal Allowance taper zone (£110k)
 * 10. Edge case: exactly at NI threshold (£12,584)
 */

const { calculate } = require('../src/salary-calculator/calculator.js');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function assertEqual(actual, expected, tolerance = 1) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ~${expected}, got ${actual} (diff: ${actual - expected})`);
  }
}

console.log('\n📊 UK Salary Calculator — 10 Scenario Tests\n');
console.log('Cross-validated against: salarycalculator.co.uk, gov.uk\n');

// === SCENARIO 1: Typical UK employee ===
test('Scenario 1: £30,000, UK, no student loan, no pension', () => {
  const r = calculate({ grossSalary: 30000, region: 'uk' });
  // Expected (from salarycalculator.co.uk 2025/26):
  // Gross: 30,000. Tax: ~3,486. NI: ~1,393. Take-home: ~25,121 annual, ~2,093 monthly
  assertEqual(r.incomeTax.total, 3486, 5);
  assertEqual(r.nationalInsurance.total, 1393, 5);
  assertEqual(r.takeHomeAnnual, 25121, 10);
  assertEqual(r.takeHomeMonthly, 2093.40, 2);
});

// === SCENARIO 2: Higher rate taxpayer ===
test('Scenario 2: £60,000, UK, no student loan', () => {
  const r = calculate({ grossSalary: 60000, region: 'uk' });
  // Tax: Basic(37700*20%=7540) + Higher(9729*40%=3891.60) = £11,431.60
  // NI: Main(37700*8%=3016) + Upper(9716*2%=194.32) = £3,210.32
  // Take-home: 60000 - 11431.60 - 3210.32 = £45,358.08
  assertEqual(r.incomeTax.total, 11431.60, 2);
  assertEqual(r.nationalInsurance.total, 3210.32, 2);
  assertEqual(r.takeHomeAnnual, 45358.08, 2);
  // Higher rate band should be in breakdown
  const higherBand = r.incomeTax.breakdown.find(b => b.band === 'Higher Rate');
  if (!higherBand) throw new Error('Higher Rate band missing from breakdown');
});

// === SCENARIO 3: Low earner ===
test('Scenario 3: £15,000, UK, no student loan', () => {
  const r = calculate({ grossSalary: 15000, region: 'uk' });
  // Within personal allowance (£12,570) so only taxed on £2,430 at 20% = £486
  // NI: (15000-12584)*0.08 = £193.28
  assertEqual(r.incomeTax.total, 486, 5);
  assertEqual(r.nationalInsurance.total, 193.28, 2);
  assertEqual(r.takeHomeAnnual, 14320.72, 5);
});

// === SCENARIO 4: Additional rate taxpayer ===
test('Scenario 4: £150,000, UK, no student loan', () => {
  const r = calculate({ grossSalary: 150000, region: 'uk' });
  // No personal allowance (tapered to £0 above £125,140)
  // Tax: Basic(50270*20%=10054) + Higher(74870*40%=29948) + Additional(24860*45%=11187) = £51,189
  // NI: (50284-12584)*8% + (150000-50284)*2% = 3016 + 1994.32 = £5,010.32
  // Take-home: 150000 - 51189 - 5010.32 = £93,800.68
  assertEqual(r.incomeTax.total, 51189, 5);
  assertEqual(r.takeHomeAnnual, 93800.68, 5);
  // Personal allowance should be 0
  const paBand = r.incomeTax.breakdown.find(b => b.band === 'Personal Allowance');
  const paTaxable = paBand ? paBand.taxable : 0;
  if (paTaxable > 0) throw new Error('Personal allowance should be £0 at £150k');
});

// === SCENARIO 5: Scotland ===
test('Scenario 5: £45,000, Scotland, no student loan', () => {
  const r = calculate({ grossSalary: 45000, region: 'scotland' });
  // Scottish bands: Starter 19%, Basic 20%, Intermediate 21%
  // Should have Intermediate Rate in breakdown
  const intermediateBand = r.incomeTax.breakdown.find(b => b.band === 'Intermediate Rate');
  if (!intermediateBand) throw new Error('Scottish Intermediate Rate missing');
  // Verify it's different from UK
  const rUK = calculate({ grossSalary: 45000, region: 'uk' });
  if (Math.abs(r.incomeTax.total - rUK.incomeTax.total) < 10) {
    throw new Error('Scottish tax should differ from UK at £45k');
  }
});

// === SCENARIO 6: Plan 2 Student Loan ===
test('Scenario 6: £35,000, UK, Plan 2 student loan', () => {
  const r = calculate({ grossSalary: 35000, region: 'uk', studentLoanPlans: ['plan2'] });
  // Plan 2 threshold: £29,385. Above: £5,615. Repayment: 9% = £505.35
  // Tax: (35000-12570)*20% = 4486. NI: (35000-12584)*8% = 1793.28
  // Take-home: 35000 - 4486 - 1793.28 - 505.35 = 28215.37
  assertEqual(r.studentLoan.total, 505.35, 2);
  assertEqual(r.takeHomeAnnual, 28215.37, 5);
});

// === SCENARIO 7: Plan 1 + Postgrad ===
test('Scenario 7: £40,000, UK, Plan 1 + Postgrad loan', () => {
  const r = calculate({ grossSalary: 40000, region: 'uk', studentLoanPlans: ['plan1', 'postgrad'] });
  // Plan 1: (40000-26900)*9% = £1,179
  // Postgrad: (40000-21000)*6% = £1,140
  // Total student loan: ~£2,319
  assertEqual(r.studentLoan.total, 2319, 5);
  const plans = r.studentLoan.breakdown.map(b => b.plan);
  if (!plans.includes('Plan 1') || !plans.includes('Postgraduate Loan')) {
    throw new Error('Missing expected plan breakdowns');
  }
});

// === SCENARIO 8: Pension salary sacrifice ===
test('Scenario 8: £50,000, UK, 5% pension, no student loan', () => {
  const r = calculate({ grossSalary: 50000, region: 'uk', pensionPercent: 5 });
  // Pension: £2,500. Taxable: £47,500
  // Tax: (47500-12570)*20% = £6,986
  // NI: (47500-12584)*8% = £2,793.28
  // Take-home: 50000-2500-6986-2793.28 = 37720.72
  assertEqual(r.pensionAmount, 2500, 1);
  assertEqual(r.taxableIncome, 47500, 1);
  assertEqual(r.incomeTax.total, 6986, 2);
  assertEqual(r.takeHomeAnnual, 37720.72, 2);
});

// === SCENARIO 9: Personal Allowance taper ===
test('Scenario 9: £110,000, UK, no student loan', () => {
  const r = calculate({ grossSalary: 110000, region: 'uk' });
  // PA: 12570 - (10000/2) = £7,570
  // Tax: Basic(7571-50270=42700*20%=8540) + Higher(50271-110000=59730*40%=23892) = £32,432
  // NI: (50284-12584)*8% + (110000-50284)*2% = 3016 + 1194.32 = £4,210.32
  // Take-home: 110000 - 32432 - 4210.32 = £73,357.68
  assertEqual(r.incomeTax.total, 32432, 5);
  // Verify PA is reduced
  const paBreakdown = r.incomeTax.breakdown.find(b => b.band === 'Personal Allowance');
  if (!paBreakdown || paBreakdown.taxable >= 12570) throw new Error('PA should be reduced below 12570 at £110k');
  assertEqual(paBreakdown.taxable, 7570, 5);
  assertEqual(r.takeHomeAnnual, 73357.68, 5);
});

// === SCENARIO 10: Edge case at NI threshold ===
test('Scenario 10: £12,584, UK, no student loan (exact NI threshold)', () => {
  const r = calculate({ grossSalary: 12584, region: 'uk' });
  // At NI threshold: NI should be ~0 (just above PA, but at NI start)
  // Tax: (12584-12570)=14 at 20% = £2.80
  assertEqual(r.incomeTax.total, 2.80, 0.5);
  // NI: (12584-12584)*0.08 = £0
  assertEqual(r.nationalInsurance.total, 0, 0.01);
  assertEqual(r.takeHomeAnnual, 12581.20, 1);
});

// === SUMMARY ===
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  ❌ ${f.name}: ${f.error}`));
}
console.log('');

process.exit(failed > 0 ? 1 : 0);
