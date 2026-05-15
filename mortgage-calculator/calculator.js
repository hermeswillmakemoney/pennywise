/**
 * PennyWise — UK Mortgage Repayment Calculator
 * Standard amortization with overpayment analysis.
 * All values in GBP.
 */

function calculateMortgage(opts = {}) {
  const {
    propertyPrice = 300000,
    deposit = 45000,         // 15% default
    interestRate = 4.5,     // Annual rate %
    termYears = 25,
    overpayment = 0,         // Monthly overpayment
  } = opts;

  const loanAmount = propertyPrice - deposit;
  const monthlyRate = (interestRate / 100) / 12;
  const totalMonths = termYears * 12;
  const ltv = propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0;

  // Standard monthly payment (without overpayment)
  let monthlyPayment = 0;
  if (monthlyRate > 0) {
    monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  } else {
    monthlyPayment = loanAmount / totalMonths;
  }

  // Without overpayment
  const totalPayableStandard = monthlyPayment * totalMonths;
  const totalInterestStandard = totalPayableStandard - loanAmount;

  // With overpayment
  const totalMonthly = monthlyPayment + overpayment;
  let remaining = loanAmount;
  let monthsWithOver = 0;
  let interestWithOver = 0;
  const maxMonths = totalMonths * 2; // safety cap

  for (let m = 0; m < maxMonths && remaining > 0; m++) {
    if (remaining <= 0) break;
    const monthInterest = remaining * monthlyRate;
    interestWithOver += monthInterest;
    const principalPaid = totalMonthly - monthInterest;
    remaining -= principalPaid;
    monthsWithOver++;
    
    if (remaining < 0) {
      // Final partial payment
      interestWithOver += remaining; // correction
      remaining = 0;
      break;
    }
  }

  const yearsWithOver = monthsWithOver / 12;
  const timeSavedMonths = totalMonths - monthsWithOver;
  const interestSaved = totalInterestStandard - interestWithOver;

  return {
    propertyPrice,
    deposit,
    loanAmount,
    ltv: Math.round(ltv * 10) / 10,
    interestRate,
    termYears,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayable: Math.round(totalPayableStandard * 100) / 100,
    totalInterest: Math.round(totalInterestStandard * 100) / 100,
    overpayment: overpayment || 0,
    totalMonthlyWithOver: Math.round(totalMonthly * 100) / 100,
    monthsWithOverpayment: monthsWithOver,
    yearsWithOverpayment: Math.round(yearsWithOver * 10) / 10,
    timeSavedMonths,
    timeSavedYears: Math.round((timeSavedMonths / 12) * 10) / 10,
    interestSaved: Math.round(Math.max(0, interestSaved) * 100) / 100,
    totalPayableWithOver: Math.round(totalMonthly * monthsWithOver * 100) / 100,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateMortgage };
}
