const { calculateMortgage } = require('../src/mortgage-calculator/calculator.js');
let p=0,f=0,fl=[];
function t(n,fn){try{fn();p++;console.log('  ✅ '+n)}catch(e){f++;fl.push({n,e:e.message});console.log('  ❌ '+n+': '+e.message)}}
function ae(a,e,t=1){if(Math.abs(a-e)>t)throw new Error(`Expected ~${e}, got ${a}`)}

console.log('\n🏠 PennyWise — Mortgage Calculator Tests\n');

t('£300k, 15% deposit, 4.5%, 25yr',()=>{
  const r=calculateMortgage({propertyPrice:300000,deposit:45000,interestRate:4.5,termYears:25});
  // Loan: £255k. Monthly: ~£1,417. Total interest: ~£170k
  ae(r.loanAmount,255000,1);
  ae(r.ltv,85,1);
  if(r.monthlyPayment<1400||r.monthlyPayment>1435)throw new Error(`Monthly ~£1417, got ${r.monthlyPayment}`);
  if(r.totalInterest<168000||r.totalInterest>172000)throw new Error(`Interest ~£170k, got ${r.totalInterest}`);
  ae(r.termYears,25,0);
});

t('£200k, 10% deposit, 5.5%, 30yr',()=>{
  const r=calculateMortgage({propertyPrice:200000,deposit:20000,interestRate:5.5,termYears:30});
  ae(r.loanAmount,180000,1);
  // Monthly ~£1,022
  if(r.monthlyPayment<1000||r.monthlyPayment>1045)throw new Error(`Monthly got ${r.monthlyPayment}`);
  // Longer term = more interest
  if(r.totalInterest<180000)throw new Error(`30yr interest should be high, got ${r.totalInterest}`);
});

t('£500k, 25% deposit, 3%, 20yr',()=>{
  const r=calculateMortgage({propertyPrice:500000,deposit:125000,interestRate:3,termYears:20});
  ae(r.loanAmount,375000,1);
  // Monthly ~£2,080
  if(r.monthlyPayment<2050||r.monthlyPayment>2110)throw new Error(`Monthly got ${r.monthlyPayment}`);
});

t('£150k, 5% deposit, 6%, 25yr',()=>{
  const r=calculateMortgage({propertyPrice:150000,deposit:7500,interestRate:6,termYears:25});
  ae(r.loanAmount,142500,1);
  ae(r.ltv,95,0.5);
  // Monthly ~£918
  if(r.monthlyPayment<900||r.monthlyPayment>940)throw new Error(`Monthly got ${r.monthlyPayment}`);
});

t('Overpayment £200/mo on £255k loan',()=>{
  const r=calculateMortgage({propertyPrice:300000,deposit:45000,interestRate:4.5,termYears:25,overpayment:200});
  // Standard: 300 months. With £200 extra, should save ~5-7 years
  if(r.timeSavedMonths<50||r.timeSavedMonths>100)throw new Error(`Time saved should be ~60-84 months, got ${r.timeSavedMonths}`);
  if(r.interestSaved<40000)throw new Error(`Interest saved should be substantial, got ${r.interestSaved}`);
});

t('£400k, 40% deposit, 2%, 15yr',()=>{
  const r=calculateMortgage({propertyPrice:400000,deposit:160000,interestRate:2,termYears:15});
  ae(r.ltv,60,0.5);
  if(r.totalInterest<35000||r.totalInterest>42000)throw new Error(`Low interest short term, got ${r.totalInterest}`);
});

t('Zero interest (edge case)',()=>{
  const r=calculateMortgage({propertyPrice:100000,deposit:20000,interestRate:0,termYears:10});
  ae(r.loanAmount,80000,1);
  // 0%: monthly just principal/term = 80000/120 = 666.67
  ae(r.monthlyPayment,666.67,0.1);
  ae(r.totalInterest,0,0);
});

t('Small overpayment £50/mo',()=>{
  const r=calculateMortgage({propertyPrice:250000,deposit:50000,interestRate:5,termYears:25,overpayment:50});
  // Should save ~1-2 years
  if(r.timeSavedMonths<8||r.timeSavedMonths>30)throw new Error(`Small overpayment save ${r.timeSavedMonths} months`);
  if(r.interestSaved<5000)throw new Error(`Should save some interest, got ${r.interestSaved}`);
});

t('Large overpayment £1000/mo',()=>{
  const r=calculateMortgage({propertyPrice:300000,deposit:45000,interestRate:4.5,termYears:25,overpayment:1000});
  // Should slash term dramatically
  if(r.timeSavedMonths<150)throw new Error(`Big overpayment should save >150 months, got ${r.timeSavedMonths}`);
  if(r.yearsWithOverpayment>15)throw new Error(`Should be <15 years, got ${r.yearsWithOverpayment}`);
});

t('Minimum deposit scenario',()=>{
  const r=calculateMortgage({propertyPrice:100000,deposit:5000,interestRate:5,termYears:30});
  ae(r.ltv,95,0.5);
  ae(r.loanAmount,95000,1);
  if(r.monthlyPayment<500||r.monthlyPayment>520)throw new Error(`Monthly got ${r.monthlyPayment}`);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${p} passed, ${f} failed`);
if(f){fl.forEach(x=>console.log('  ❌ '+x.n+': '+x.e))}
process.exit(f>0?1:0);
