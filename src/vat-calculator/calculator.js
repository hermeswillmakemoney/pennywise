/**
 * PennyWise — UK VAT Calculator
 * Add or remove VAT at standard (20%), reduced (5%), or zero (0%) rates.
 */

const VAT_RATES = {
  standard: 0.20,
  reduced: 0.05,
  zero: 0.00,
};

function calculateVAT(opts = {}) {
  const {
    amount = 100,
    vatRate = 'standard',   // standard | reduced | zero | custom
    customRate = 20,         // used when vatRate = 'custom'
    operation = 'add',       // 'add' VAT to net, or 'remove' VAT from gross
  } = opts;

  let rate;
  if (vatRate === 'custom') {
    rate = customRate / 100;
  } else {
    rate = VAT_RATES[vatRate] !== undefined ? VAT_RATES[vatRate] : VAT_RATES.standard;
  }

  let netAmount, vatAmount, grossAmount;

  if (operation === 'add') {
    // Adding VAT to net amount
    netAmount = amount;
    vatAmount = netAmount * rate;
    grossAmount = netAmount + vatAmount;
  } else {
    // Removing VAT from gross amount
    grossAmount = amount;
    netAmount = grossAmount / (1 + rate);
    vatAmount = grossAmount - netAmount;
  }

  return {
    operation,
    vatRate: vatRate === 'custom' ? `${customRate}%` : `${(rate * 100)}%`,
    rateDecimal: rate,
    netAmount: Math.round(netAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    grossAmount: Math.round(grossAmount * 100) / 100,
    inputAmount: amount,
    description: operation === 'add' 
      ? `£${amount.toFixed(2)} + ${(rate*100)}% VAT = £${grossAmount.toFixed(2)}`
      : `£${amount.toFixed(2)} − ${(rate*100)}% VAT = £${netAmount.toFixed(2)}`,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateVAT, VAT_RATES };
}
