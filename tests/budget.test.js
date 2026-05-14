const { calculateBudget } = require('../src/budget-calculator/calculator.js');
let p=0,f=0,fl=[];
function t(n,fn){try{fn();p++;console.log('  ✅ '+n)}catch(e){f++;fl.push({n,e:e.message});console.log('  ❌ '+n+': '+e.message)}}
function ae(a,e,t=0.02){if(Math.abs(a-e)>t)throw new Error(`Expected ~${e}, got ${a}`)}

console.log('\n💰 PennyWise — Budget Calculator Tests\n');

t('Standard 50/30/20 on £2,500',()=>{
  const r=calculateBudget({monthlyTakeHome:2500});
  ae(r.needs,1250,0.01);
  ae(r.wants,750,0.01);
  ae(r.savings,500,0.01);
  ae(r.annualTakeHome,30000,0.01);
  ae(r.rule,'50/30/20',0);
});

t('50/30/20 on £3,500 (higher earner)',()=>{
  const r=calculateBudget({monthlyTakeHome:3500});
  ae(r.needs,1750,0.01);
  ae(r.wants,1050,0.01);
  ae(r.savings,700,0.01);
});

t('50/30/20 on £1,800 (lower earner)',()=>{
  const r=calculateBudget({monthlyTakeHome:1800});
  ae(r.needs,900,0.01);
  ae(r.wants,540,0.01);
  ae(r.savings,360,0.01);
});

t('Custom split 60/20/20',()=>{
  const r=calculateBudget({monthlyTakeHome:3000,customSplit:{needs:60,wants:20,savings:20}});
  ae(r.needs,1800,0.01);
  ae(r.wants,600,0.01);
  ae(r.savings,600,0.01);
});

t('Custom split 40/35/25',()=>{
  const r=calculateBudget({monthlyTakeHome:4000,customSplit:{needs:40,wants:35,savings:25}});
  ae(r.needs,1600,0.01);
  ae(r.wants,1400,0.01);
  ae(r.savings,1000,0.01);
});

t('Guidance includes UK-specific items',()=>{
  const r=calculateBudget({monthlyTakeHome:2500});
  if(!r.guidance.needs.includes('Council tax'))throw new Error('Missing council tax');
  if(!r.guidance.wants.some(x=>x.includes('Entertainment')))throw new Error('Missing entertainment');
  if(!r.guidance.savings.some(x=>x.includes('Emergency')))throw new Error('Missing emergency fund');
});

t('Annual amounts correct',()=>{
  const r=calculateBudget({monthlyTakeHome:5000});
  ae(r.needsAnnual,30000,0.01);
  ae(r.wantsAnnual,18000,0.01);
  ae(r.savingsAnnual,12000,0.01);
});

t('Zero income edge case',()=>{
  const r=calculateBudget({monthlyTakeHome:0});
  ae(r.needs,0,0);
  ae(r.wants,0,0);
  ae(r.savings,0,0);
});

t('Large income £10,000/mo',()=>{
  const r=calculateBudget({monthlyTakeHome:10000});
  ae(r.needs,5000,0.01);
  ae(r.wants,3000,0.01);
  ae(r.savings,2000,0.01);
  ae(r.savingsAnnual,24000,0.01);
});

t('Split not totaling 100% returns error',()=>{
  const r=calculateBudget({monthlyTakeHome:3000,customSplit:{needs:50,wants:30,savings:10}});
  if(!r.error)throw new Error('Should return error for non-100% split');
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${p} passed, ${f} failed`);
if(f){fl.forEach(x=>console.log('  ❌ '+x.n+': '+x.e))}
process.exit(f>0?1:0);
