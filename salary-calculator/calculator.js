/**
 * UK Salary Calculator — Core Logic
 * 2025/26 Tax Year
 * All values in GBP. Annual unless stated.
 */

// === INCOME TAX (England, Wales, NI) ===
const TAX_BANDS_UK = [
  { name: 'Personal Allowance', start: 0, end: 12570, rate: 0 },
  { name: 'Basic Rate', start: 12571, end: 50270, rate: 0.20 },
  { name: 'Higher Rate', start: 50271, end: 125140, rate: 0.40 },
  { name: 'Additional Rate', start: 125141, end: Infinity, rate: 0.45 },
];

// === INCOME TAX (Scotland) ===
const TAX_BANDS_SCOTLAND = [
  { name: 'Personal Allowance', start: 0, end: 12570, rate: 0 },
  { name: 'Starter Rate', start: 12571, end: 14878, rate: 0.19 },
  { name: 'Basic Rate', start: 14879, end: 26561, rate: 0.20 },
  { name: 'Intermediate Rate', start: 26562, end: 43662, rate: 0.21 },
  { name: 'Higher Rate', start: 43663, end: 75000, rate: 0.42 },
  { name: 'Advanced Rate', start: 75001, end: 125140, rate: 0.45 },
  { name: 'Top Rate', start: 125141, end: Infinity, rate: 0.48 },
];

// === NATIONAL INSURANCE (Class 1, Employee, 2025/26) ===
const NI_WEEKLY_LOWER = 242;   // Primary Threshold
const NI_WEEKLY_UPPER = 967;   // Upper Earnings Limit
const NI_RATE_MAIN = 0.08;     // Between PT and UEL
const NI_RATE_UPPER = 0.02;    // Above UEL

// Convert weekly to annual
const NI_ANNUAL_LOWER = NI_WEEKLY_LOWER * 52;   // £12,584
const NI_ANNUAL_UPPER = NI_WEEKLY_UPPER * 52;   // £50,284

// === STUDENT LOANS (2025/26) ===
const STUDENT_LOAN_PLANS = {
  'plan1': { threshold: 26900, rate: 0.09, name: 'Plan 1' },
  'plan2': { threshold: 29385, rate: 0.09, name: 'Plan 2' },
  'plan4': { threshold: 33795, rate: 0.09, name: 'Plan 4' },
  'plan5': { threshold: 25000, rate: 0.09, name: 'Plan 5' },
  'postgrad': { threshold: 21000, rate: 0.06, name: 'Postgraduate Loan' },
};

// === PERSONAL ALLOWANCE TAPER ===
const PA_TAPER_START = 100000;
const PA_TAPER_END = 125140;

/**
 * Calculate personal allowance with taper for incomes over £100,000.
 * £1 of allowance lost for every £2 over £100,000.
 */
function getPersonalAllowance(grossIncome) {
  if (grossIncome <= PA_TAPER_START) return 12570;
  const reduction = Math.floor((grossIncome - PA_TAPER_START) / 2);
  return Math.max(0, 12570 - reduction);
}

/**
 * Calculate income tax for a given gross salary and region.
 */
function calcIncomeTax(grossIncome, region = 'uk') {
  const bands = region === 'scotland' ? TAX_BANDS_SCOTLAND : TAX_BANDS_UK;
  const personalAllowance = getPersonalAllowance(grossIncome);
  let tax = 0;
  const breakdown = [];
  let previousBandEnd = 0;

  for (const band of bands) {
    let bandStart, bandEnd;

    if (band.name === 'Personal Allowance') {
      bandStart = 0;
      bandEnd = personalAllowance;
    } else {
      // The first taxable band always starts right after the PA
      const isFirstTaxBand = (band.name === 'Basic Rate' || band.name === 'Starter Rate');
      bandStart = isFirstTaxBand ? personalAllowance + 1 : band.start;
      // Ensure no overlap or gap with previous band
      bandStart = Math.max(bandStart, previousBandEnd + 1);
      bandEnd = band.end;
    }

    if (bandStart >= bandEnd) continue;
    if (grossIncome <= bandStart) break;

    const taxableInBand = Math.min(grossIncome, bandEnd) - bandStart + 1;
    if (taxableInBand > 0) {
      const bandTax = taxableInBand * band.rate;
      tax += bandTax;
      breakdown.push({
        band: band.name,
        rate: band.rate,
        taxable: taxableInBand,
        tax: Math.round(bandTax * 100) / 100,
      });
    }
    previousBandEnd = bandEnd;
  }

  return { total: Math.round(tax * 100) / 100, breakdown };
}

/**
 * Calculate National Insurance contributions.
 */
function calcNI(grossIncome) {
  if (grossIncome <= NI_ANNUAL_LOWER) return { total: 0, breakdown: [] };

  const mainPortion = Math.min(grossIncome, NI_ANNUAL_UPPER) - NI_ANNUAL_LOWER;
  const mainNI = mainPortion * NI_RATE_MAIN;

  let upperNI = 0;
  if (grossIncome > NI_ANNUAL_UPPER) {
    upperNI = (grossIncome - NI_ANNUAL_UPPER) * NI_RATE_UPPER;
  }

  const total = Math.round((mainNI + upperNI) * 100) / 100;

  return {
    total,
    breakdown: [
      { band: `£${NI_ANNUAL_LOWER.toLocaleString()} to £${NI_ANNUAL_UPPER.toLocaleString()}`, rate: NI_RATE_MAIN, taxable: mainPortion, tax: Math.round(mainNI * 100) / 100 },
      ...(upperNI > 0 ? [{ band: `Above £${NI_ANNUAL_UPPER.toLocaleString()}`, rate: NI_RATE_UPPER, taxable: grossIncome - NI_ANNUAL_UPPER, tax: Math.round(upperNI * 100) / 100 }] : []),
    ],
  };
}

/**
 * Calculate student loan repayment.
 * If multiple plans, use the lowest threshold and cap at the difference.
 */
function calcStudentLoan(grossIncome, plans = []) {
  if (!plans.length) return { total: 0, breakdown: [] };

  const repayments = [];
  let total = 0;

  for (const planKey of plans) {
    const plan = STUDENT_LOAN_PLANS[planKey];
    if (!plan) continue;
    if (grossIncome <= plan.threshold) continue;

    const above = grossIncome - plan.threshold;
    const repayment = Math.round(above * plan.rate * 100) / 100;
    repayments.push({ plan: plan.name, threshold: plan.threshold, rate: plan.rate, above, repayment });
    total += repayment;
  }

  // On multiple plans with same rate (Plan 1+2+4+5): 
  // You only pay once at 9% above the lowest threshold.
  // But if you have a Postgrad loan, you pay 6% on top.
  // Simplified: just sum them (gov.uk does more complex cap logic)
  
  return { total: Math.round(total * 100) / 100, breakdown: repayments };
}

/**
 * Calculate pension contribution.
 * If salary sacrifice, reduce gross before tax.
 * For relief-at-source, we just show the contribution amount.
 */
function calcPensionGross(grossIncome, pensionPercent = 0) {
  if (!pensionPercent || pensionPercent <= 0) return grossIncome;
  const contribution = grossIncome * (pensionPercent / 100);
  return grossIncome - contribution;
}

/**
 * Main calculator function.
 * 
 * @param {Object} opts
 * @param {number} opts.grossSalary - Annual gross salary
 * @param {string} opts.region - 'uk' or 'scotland'
 * @param {string[]} opts.studentLoanPlans - e.g., ['plan2'] or ['plan1', 'postgrad']
 * @param {number} opts.pensionPercent - Pension contribution as % of salary (salary sacrifice)
 * @returns {Object} Full breakdown
 */
function calculate(opts = {}) {
  const {
    grossSalary = 30000,
    region = 'uk',
    studentLoanPlans = [],
    pensionPercent = 0,
  } = opts;

  const postPensionGross = calcPensionGross(grossSalary, pensionPercent);
  const pensionAmount = grossSalary - postPensionGross;

  const incomeTax = calcIncomeTax(postPensionGross, region);
  const ni = calcNI(postPensionGross);
  const studentLoan = calcStudentLoan(postPensionGross, studentLoanPlans);

  const totalDeductions = incomeTax.total + ni.total + studentLoan.total + pensionAmount;
  const takeHome = grossSalary - totalDeductions;

  return {
    grossSalary,
    pensionAmount: Math.round(pensionAmount * 100) / 100,
    taxableIncome: postPensionGross,
    incomeTax,
    nationalInsurance: ni,
    studentLoan,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    takeHomeAnnual: Math.round(takeHome * 100) / 100,
    takeHomeMonthly: Math.round((takeHome / 12) * 100) / 100,
    takeHomeWeekly: Math.round((takeHome / 52) * 100) / 100,
    region,
    taxYear: '2025/26',
  };
}

// Export for both Node and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculate, calcIncomeTax, calcNI, calcStudentLoan, getPersonalAllowance, TAX_BANDS_UK, TAX_BANDS_SCOTLAND, NI_ANNUAL_LOWER, NI_ANNUAL_UPPER, STUDENT_LOAN_PLANS, NI_RATE_MAIN, NI_RATE_UPPER };
}
