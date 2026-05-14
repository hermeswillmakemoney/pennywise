/**
 * PennyWise — 50/30/20 Budget Calculator
 * Splits after-tax income into Needs, Wants, and Savings.
 */

function calculateBudget(opts = {}) {
  const {
    monthlyTakeHome = 2500,
    customSplit = null,  // e.g., { needs: 50, wants: 30, savings: 20 }
  } = opts;

  const split = customSplit || { needs: 50, wants: 30, savings: 20 };
  const totalPercent = split.needs + split.wants + split.savings;

  if (Math.abs(totalPercent - 100) > 0.01) {
    return { error: 'Split percentages must total 100%' };
  }

  const needs = (monthlyTakeHome * split.needs) / 100;
  const wants = (monthlyTakeHome * split.wants) / 100;
  const savings = (monthlyTakeHome * split.savings) / 100;

  // UK-specific guidance for each category
  const guidance = {
    needs: [
      'Rent or mortgage payments',
      'Council tax',
      'Utility bills (gas, electric, water)',
      'Groceries and essential food',
      'Buildings and contents insurance',
      'Minimum debt repayments',
      'Commuting costs (car, train, bus)',
    ],
    wants: [
      'Eating out and takeaways',
      'Entertainment and streaming subscriptions',
      'Holidays and weekends away',
      'Shopping and non-essential clothes',
      'Hobbies, gym, and fitness',
      'Gifts and celebrations',
    ],
    savings: [
      'Emergency fund (aim for 3-6 months of needs)',
      'Pension top-ups beyond workplace scheme',
      'ISA and investment contributions',
      'Overpaying mortgage or debts',
      'Saving for a house deposit',
      'Life insurance and income protection',
    ],
  };

  return {
    monthlyTakeHome,
    annualTakeHome: monthlyTakeHome * 12,
    split,
    needs: Math.round(needs * 100) / 100,
    wants: Math.round(wants * 100) / 100,
    savings: Math.round(savings * 100) / 100,
    needsAnnual: Math.round(needs * 12 * 100) / 100,
    wantsAnnual: Math.round(wants * 12 * 100) / 100,
    savingsAnnual: Math.round(savings * 12 * 100) / 100,
    guidance,
    rule: `${split.needs}/${split.wants}/${split.savings}`,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateBudget };
}
