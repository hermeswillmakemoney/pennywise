const { calculateRentalYield } = require('../src/rental-yield-calculator/calculator.js');
let p=0,f=0,fl=[];
function t(n,fn){try{fn();p++;console.log('  ✅ '+n)}catch(e){f++;fl.push({n,e:e.message});console.log('  ❌ '+n+': '+e.message)}}
function ae(a,e,t=1){if(Math.abs(a-e)>t)throw new Error(`Expected ~${e}, got ${a}`)}

console.log('\n🏘️  PennyWise — Rental Yield Calculator Tests\n');

t('Standard BTL £250k, £1,100/mo rent',()=>{
  const r=calculateRentalYield({propertyPrice:250000,monthlyRent:1100});
  ae(r.grossYield,5.28,0.1);
  if(r.netYield>=r.grossYield)throw new Error('Net yield should be lower than gross');
  // UK BTL net yields are 0.5-4% with current rates. 1.29% is realistic.
  if(r.netYield<0||r.netYield>5)throw new Error(`Net yield should be 0-5%, got ${r.netYield}`);
});

t('High yield £100k, £900/mo',()=>{
  const r=calculateRentalYield({propertyPrice:100000,monthlyRent:900});
  // Gross: (10800/100000)*100 = 10.8%
  ae(r.grossYield,10.8,0.2);
  if(r.grossYield<9)throw new Error(`High yield expected, got ${r.grossYield}`);
});

t('Low yield £500k, £1,500/mo',()=>{
  const r=calculateRentalYield({propertyPrice:500000,monthlyRent:1500});
  // Gross: 3.6%
  ae(r.grossYield,3.6,0.1);
  if(r.netYield>3.6)throw new Error('Net should be lower than gross');
});

t('With void periods (4 weeks vacant)',()=>{
  const r=calculateRentalYield({propertyPrice:250000,monthlyRent:1100,voidPeriods:4});
  // Void: 4 weeks = £1,015.38 deduction
  if(r.breakdown.voidDeduction<1000||r.breakdown.voidDeduction>1050)
    throw new Error(`Void deduction ${r.breakdown.voidDeduction}`);
  if(r.breakdown.effectiveRent>=r.breakdown.annualRent)
    throw new Error('Effective rent should be lower with voids');
});

t('With itemized costs',()=>{
  const r=calculateRentalYield({
    propertyPrice:250000,monthlyRent:1100,
    mortgageInterest:6000,insurance:400,maintenance:1500,serviceCharge:1200,groundRent:200
  });
  if(r.netIncome<3000||r.netIncome>5000)throw new Error(`Net income ${r.netIncome}`);
  ae(r.netYield,(r.netIncome/250000)*100,0.1);
});

t('Tax calculation (basic rate)',()=>{
  const r=calculateRentalYield({propertyPrice:250000,monthlyRent:1100,taxRate:20});
  // Tax due should be >0
  if(r.taxDue<=0)throw new Error('Tax should be >0 on positive net income');
  ae(r.netAfterTax,(r.netIncome-r.taxDue),0.5);
});

t('Tax calculation (higher rate 40%)',()=>{
  const r=calculateRentalYield({propertyPrice:250000,monthlyRent:1100,taxRate:40});
  // Higher rate = more tax, less net
  const r20=calculateRentalYield({propertyPrice:250000,monthlyRent:1100,taxRate:20});
  if(r.netAfterTax>=r20.netAfterTax)throw new Error('40% tax should leave less than 20%');
});

t('Full year void (should handle 52 weeks)',()=>{
  const r=calculateRentalYield({propertyPrice:250000,monthlyRent:1100,voidPeriods:52});
  // All rent lost, net should be negative (costs still apply)
  if(r.netIncome>0)throw new Error('Full void should produce negative net income');
});

t('Very expensive property £1M',()=>{
  const r=calculateRentalYield({propertyPrice:1000000,monthlyRent:3500});
  // Gross: 4.2%. Low yield for expensive property
  ae(r.grossYield,4.2,0.1);
  if(r.roi>10)throw new Error('ROI should be modest for low-yield expensive property');
});

t('ROI calculation makes sense',()=>{
  const r=calculateRentalYield({propertyPrice:200000,monthlyRent:1200,taxRate:20});
  // Deposit: £50k (25%). ROI: netAfterTax / 50000
  ae(r.deposit,50000,1);
  const expectedROI=(r.netAfterTax/50000)*100;
  ae(r.roi,expectedROI,0.5);
  if(r.roi<2||r.roi>12)throw new Error(`ROI ${r.roi}% seems unrealistic`);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${p} passed, ${f} failed`);
if(f){fl.forEach(x=>console.log('  ❌ '+x.n+': '+x.e))}
process.exit(f>0?1:0);
