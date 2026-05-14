/**
 * PennyWise — Stamp Duty Calculator Tests
 * 10 scenarios covering all edge cases
 */

const { calculateSDLT } = require('../src/stamp-duty-calculator/calculator.js');

let passed = 0, failed = 0, failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; failures.push({name, error: e.message}); console.log(`  ❌ ${name}: ${e.message}`); }
}
function assertEqual(a, e, t=1) { if (Math.abs(a-e) > t) throw new Error(`Expected ~${e}, got ${a}`); }

console.log('\n🏠 PennyWise — Stamp Duty Calculator Tests\n');

// 1: Standard purchase £300k
test('£300k standard purchase', () => {
  const r = calculateSDLT({ propertyPrice: 300000 });
  // £0-250k at 0% = £0. £250k-300k at 5% = £50k*5% = £2,500
  assertEqual(r.totalTax, 2500, 1);
  assertEqual(r.effectiveRate, 0.83, 0.1);
  assertEqual(r.additionalTax, 0, 0);
});

// 2: First-time buyer £350k (full relief)
test('£350k first-time buyer (no SDLT)', () => {
  const r = calculateSDLT({ propertyPrice: 350000, firstTimeBuyer: true });
  // £350k < £425k, so 0%
  assertEqual(r.totalTax, 0, 0);
  assertEqual(r.effectiveRate, 0, 0);
});

// 3: First-time buyer £500k
test('£500k first-time buyer', () => {
  const r = calculateSDLT({ propertyPrice: 500000, firstTimeBuyer: true });
  // £0-425k at 0%. £425k-500k at 5% = £75k*5% = £3,750
  assertEqual(r.totalTax, 3750, 5);
  assertEqual(r.effectiveRate, 0.75, 0.1);
});

// 4: Buy-to-let £200k
test('£200k additional property (BTL)', () => {
  const r = calculateSDLT({ propertyPrice: 200000, additionalProperty: true });
  // Base: £0-200k at 0% = £0. Additional: 3% surcharge = £200k*3% = £6,000
  assertEqual(r.totalTax, 6000, 1);
  assertEqual(r.additionalTax, 6000, 1);
});

// 5: High-value £1.2M
test('£1.2M standard purchase', () => {
  const r = calculateSDLT({ propertyPrice: 1200000 });
  // £0-250k: £0. £250k-925k: £675k*5% = £33,750. £925k-1.2M: £275k*10% = £27,500
  // Total: £61,250
  assertEqual(r.totalTax, 61250, 10);
  // Should have 3 bands
  if (r.sdltBands.length < 3) throw new Error('Expected at least 3 bands for £1.2M');
});

// 6: £400k additional + non-resident
test('£400k additional + non-UK resident', () => {
  const r = calculateSDLT({ propertyPrice: 400000, additionalProperty: true, nonUKResident: true });
  // Base: £250k*0% + £150k*5% = £7,500
  // Additional: £400k*3% = £12,000
  // Non-res: £400k*2% = £8,000
  // Total: £27,500
  assertEqual(r.totalTax, 27500, 10);
  assertEqual(r.additionalTax, 12000, 1);
  assertEqual(r.nonResidentTax, 8000, 1);
});

// 7: £150k standard (below threshold)
test('£150k standard (zero SDLT)', () => {
  const r = calculateSDLT({ propertyPrice: 150000 });
  assertEqual(r.totalTax, 0, 0);
});

// 8: FTB £625k (edge of FTB eligibility)
test('£625k first-time buyer (max FTB price)', () => {
  const r = calculateSDLT({ propertyPrice: 625000, firstTimeBuyer: true });
  // £0-425k at 0%. £425k-625k at 5% = £200k*5% = £10,000
  assertEqual(r.totalTax, 10000, 5);
});

// 9: £40k additional property (threshold test)
test('£40k additional property (min threshold)', () => {
  const r = calculateSDLT({ propertyPrice: 40000, additionalProperty: true });
  // At exactly £40k, surcharge applies: £40k*3% = £1,200
  assertEqual(r.additionalTax, 1200, 1);
});

// 10: Very high value £3M
test('£3,000,000 luxury property', () => {
  const r = calculateSDLT({ propertyPrice: 3000000 });
  // £0-250k: £0. £250k-925k: £33,750. £925k-1.5M: £57,500. Above 1.5M: £1.5M*12% = £180,000
  // Total: £271,250
  assertEqual(r.totalTax, 271250, 50);
  assertEqual(r.effectiveRate, 9.04, 0.2);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length) { console.log('\nFailures:'); failures.forEach(f => console.log(`  ❌ ${f.name}: ${f.error}`)); }
process.exit(failed > 0 ? 1 : 0);
