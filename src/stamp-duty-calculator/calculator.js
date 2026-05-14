/**
 * PennyWise — UK Stamp Duty Calculator Logic
 * 2025/26 Rates (post-October 2024 Budget)
 * All values in GBP.
 */

// === SDLT BANDS (England & Northern Ireland) ===
const SDLT_BANDS = [
  { start: 0, end: 250000, rate: 0 },
  { start: 250001, end: 925000, rate: 0.05 },
  { start: 925001, end: 1500000, rate: 0.10 },
  { start: 1500001, end: Infinity, rate: 0.12 },
];

// First-time buyer relief: 0% up to £425,000
const FTB_THRESHOLD = 425000;

// Additional property surcharge
const ADDITIONAL_SURCHARGE = 0.03;

// Non-UK resident surcharge (on top of everything including additional)
const NONRES_SURCHARGE = 0.02;

/**
 * Calculate Stamp Duty Land Tax.
 * 
 * @param {Object} opts
 * @param {number} opts.propertyPrice - Purchase price in GBP
 * @param {boolean} opts.firstTimeBuyer - Eligible for FTB relief?
 * @param {boolean} opts.additionalProperty - Buy-to-let or second home?
 * @param {boolean} opts.nonUKResident - Non-UK resident for tax purposes?
 * @returns {Object} Full breakdown
 */
function calculateSDLT(opts = {}) {
  const {
    propertyPrice = 300000,
    firstTimeBuyer = false,
    additionalProperty = false,
    nonUKResident = false,
  } = opts;

  let tax = 0;
  const bands = [];
  let remaining = propertyPrice;

  // First-time buyer relief
  if (firstTimeBuyer && propertyPrice <= 625000) {
    // 0% on first £425,000, then standard rates on remainder
    if (propertyPrice <= FTB_THRESHOLD) {
      // Entire price at 0%
      bands.push({
        band: `£0 – £${propertyPrice.toLocaleString()}`,
        rate: 0,
        portion: propertyPrice,
        tax: 0,
      });
      remaining = 0;
    } else {
      // £0 to £425,000 at 0%
      bands.push({
        band: `£0 – £425,000 (FTB relief)`,
        rate: 0,
        portion: FTB_THRESHOLD,
        tax: 0,
      });
      remaining = propertyPrice - FTB_THRESHOLD;
      // Remaining falls into standard bands
      for (const band of SDLT_BANDS) {
        if (remaining <= 0) break;
        if (FTB_THRESHOLD + remaining <= band.start) continue;
        
        const bandStart = Math.max(band.start, FTB_THRESHOLD);
        const bandEnd = band.end;
        const inBand = Math.min(remaining, bandEnd - bandStart + 1);
        if (inBand <= 0) continue;

        // Start counting from FTB_THRESHOLD+1, not band.start
        const actualStart = FTB_THRESHOLD + (remaining - inBand) + 1;
        const bandTax = inBand * band.rate;
        tax += bandTax;
        bands.push({
          band: `£${actualStart.toLocaleString()} – £${(actualStart + inBand - 1).toLocaleString()}`,
          rate: band.rate,
          portion: inBand,
          tax: Math.round(bandTax * 100) / 100,
        });
        remaining -= inBand;
      }
    }
  } else {
    // Standard SDLT calculation
    for (const band of SDLT_BANDS) {
      if (propertyPrice <= band.start) break;

      const inBand = Math.min(propertyPrice, band.end) - band.start;
      if (inBand <= 0) continue;

      const bandTax = inBand * band.rate;
      tax += bandTax;
      bands.push({
        band: `£${band.start.toLocaleString()} – £${Math.min(propertyPrice, band.end).toLocaleString()}`,
        rate: band.rate,
        portion: inBand,
        tax: Math.round(bandTax * 100) / 100,
      });
    }
  }

  // Additional property surcharge (3% on entire price, applied to all bands)
  let additionalTax = 0;
  if (additionalProperty) {
    // 3% surcharge applies from £0 on standard, from £40k for FTB? 
    // Per HMRC: 3% on entire purchase price for additional properties
    // But for properties under £40k, no SDLT at all typically
    if (propertyPrice >= 40000) {
      additionalTax = propertyPrice * ADDITIONAL_SURCHARGE;
    }
  }

  // Non-UK resident surcharge (2% on entire price)
  let nonResTax = 0;
  if (nonUKResident) {
    nonResTax = propertyPrice * NONRES_SURCHARGE;
  }

  const totalTax = Math.round((tax + additionalTax + nonResTax) * 100) / 100;
  const effectiveRate = propertyPrice > 0 ? (totalTax / propertyPrice) * 100 : 0;

  return {
    propertyPrice,
    firstTimeBuyer,
    additionalProperty,
    nonUKResident,
    sdltBands: bands,
    baseTax: Math.round(tax * 100) / 100,
    additionalTax: Math.round(additionalTax * 100) / 100,
    nonResidentTax: Math.round(nonResTax * 100) / 100,
    totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    taxYear: '2025/26',
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateSDLT, SDLT_BANDS, FTB_THRESHOLD };
}
