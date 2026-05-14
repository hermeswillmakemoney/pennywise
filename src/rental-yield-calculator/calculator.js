/**
 * PennyWise — UK Rental Yield Calculator
 * Gross yield, net yield, and ROI for buy-to-let properties.
 */

function calculateRentalYield(opts = {}) {
  const {
    propertyPrice = 250000,
    monthlyRent = 1100,
    annualCosts = 0,         // If not itemized
    // Itemized annual costs
    mortgageInterest = 0,    // Annual interest-only mortgage cost
    lettingAgentFee = 0,     // Annual (typically 10-15% of rent)
    insurance = 0,           // Annual landlord insurance
    maintenance = 0,         // Annual repairs/maintenance
    serviceCharge = 0,       // Annual (leasehold)
    groundRent = 0,          // Annual (leasehold)
    voidPeriods = 0,         // Weeks vacant per year
    otherCosts = 0,          // Annual other
    // Tax
    taxRate = 20,            // Marginal tax rate for rental income
  } = opts;

  const annualRent = monthlyRent * 12;
  
  // Void period adjustment
  const voidWeeks = Math.min(voidPeriods, 52);
  const voidDeduction = (annualRent / 52) * voidWeeks;
  const effectiveRent = annualRent - voidDeduction;

  // Gross yield
  const grossYield = propertyPrice > 0 ? (annualRent / propertyPrice) * 100 : 0;

  // Calculate total costs
  let totalCosts;
  if (annualCosts > 0 && mortgageInterest === 0) {
    totalCosts = annualCosts;
  } else {
    // Itemized mode with sensible defaults
    const agentFee = lettingAgentFee > 0 ? lettingAgentFee : 0; // many self-manage
    const ins = insurance > 0 ? insurance : 300;
    const maint = maintenance > 0 ? maintenance : propertyPrice * 0.005;
    const svcCharge = serviceCharge || 0;
    const gRent = groundRent || 0;
    const other = otherCosts || 0;
    const mortInt = mortgageInterest > 0 ? mortgageInterest : (propertyPrice * 0.75 * 0.045);

    totalCosts = mortInt + agentFee + ins + maint + svcCharge + gRent + other;
    // Store for breakdown later
    var _costDefaults = {
      mortgageInterest: mortInt,
      lettingAgentFee: Math.round(agentFee * 100) / 100,
      insurance: ins,
      maintenance: Math.round(maint * 100) / 100,
      serviceCharge: svcCharge,
      groundRent: gRent,
      otherCosts: other,
    };
  }

  const netIncome = effectiveRent - totalCosts;
  const netYield = propertyPrice > 0 ? (netIncome / propertyPrice) * 100 : 0;

  // Tax on rental income (simplified: tax rate on net income)
  const taxableIncome = Math.max(0, netIncome); // Can't be negative for this calc
  const taxDue = (taxableIncome * taxRate) / 100;
  const netAfterTax = netIncome - taxDue;
  const netYieldAfterTax = propertyPrice > 0 ? (netAfterTax / propertyPrice) * 100 : 0;

  // ROI including deposit
  const deposit = propertyPrice * 0.25; // Typical BTL deposit
  const roi = deposit > 0 ? (netAfterTax / deposit) * 100 : 0;

  const breakdown = _costDefaults ? {
    annualRent,
    voidDeduction: Math.round(voidDeduction * 100) / 100,
    effectiveRent: Math.round(effectiveRent * 100) / 100,
    costs: _costDefaults,
    totalCosts: Math.round(totalCosts * 100) / 100,
  } : {
    annualRent,
    voidDeduction: Math.round(voidDeduction * 100) / 100,
    effectiveRent: Math.round(effectiveRent * 100) / 100,
    totalCosts: Math.round(totalCosts * 100) / 100,
  };

  return {
    propertyPrice,
    monthlyRent,
    deposit,
    grossYield: Math.round(grossYield * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    taxDue: Math.round(taxDue * 100) / 100,
    netAfterTax: Math.round(netAfterTax * 100) / 100,
    netYieldAfterTax: Math.round(netYieldAfterTax * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    breakdown,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateRentalYield };
}
