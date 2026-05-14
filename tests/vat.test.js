const { calculateVAT } = require('../src/vat-calculator/calculator.js');
let p=0,f=0,fl=[];
function t(n,fn){try{fn();p++;console.log('  ✅ '+n)}catch(e){f++;fl.push({n,e:e.message});console.log('  ❌ '+n+': '+e.message)}}
function ae(a,e,t=0.02){if(Math.abs(a-e)>t)throw new Error(`Expected ~${e}, got ${a}`)}

console.log('\n🧾 PennyWise — VAT Calculator Tests\n');

t('Add 20% VAT to £100',()=>{
  const r=calculateVAT({amount:100,vatRate:'standard',operation:'add'});
  ae(r.netAmount,100,0.01);
  ae(r.vatAmount,20,0.01);
  ae(r.grossAmount,120,0.01);
});

t('Remove 20% VAT from £120',()=>{
  const r=calculateVAT({amount:120,vatRate:'standard',operation:'remove'});
  ae(r.netAmount,100,0.01);
  ae(r.vatAmount,20,0.01);
  ae(r.grossAmount,120,0.01);
});

t('Add reduced 5% VAT to £200',()=>{
  const r=calculateVAT({amount:200,vatRate:'reduced',operation:'add'});
  ae(r.netAmount,200,0.01);
  ae(r.vatAmount,10,0.01);
  ae(r.grossAmount,210,0.01);
});

t('Remove reduced 5% VAT from £210',()=>{
  const r=calculateVAT({amount:210,vatRate:'reduced',operation:'remove'});
  ae(r.netAmount,200,0.01);
  ae(r.vatAmount,10,0.01);
  ae(r.grossAmount,210,0.01);
});

t('Zero-rated: add 0% to £500',()=>{
  const r=calculateVAT({amount:500,vatRate:'zero',operation:'add'});
  ae(r.vatAmount,0,0);
  ae(r.grossAmount,500,0.01);
});

t('Remove 20% from £85 (odd number)',()=>{
  const r=calculateVAT({amount:85,vatRate:'standard',operation:'remove'});
  // Net = 85 / 1.2 = 70.83, VAT = 14.17
  ae(r.netAmount,70.83,0.02);
  ae(r.vatAmount,14.17,0.02);
  ae(r.grossAmount,85,0.01);
});

t('Add 20% to large amount £50,000',()=>{
  const r=calculateVAT({amount:50000,vatRate:'standard',operation:'add'});
  ae(r.vatAmount,10000,0.01);
  ae(r.grossAmount,60000,0.01);
});

t('Custom rate 12.5% add to £200',()=>{
  const r=calculateVAT({amount:200,vatRate:'custom',customRate:12.5,operation:'add'});
  ae(r.vatAmount,25,0.01);
  ae(r.grossAmount,225,0.01);
});

t('Remove 20% from £1,000',()=>{
  const r=calculateVAT({amount:1000,vatRate:'standard',operation:'remove'});
  ae(r.netAmount,833.33,0.02);
  ae(r.vatAmount,166.67,0.02);
});

t('Add 20% to exactly £0',()=>{
  const r=calculateVAT({amount:0,vatRate:'standard',operation:'add'});
  ae(r.vatAmount,0,0);
  ae(r.grossAmount,0,0);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${p} passed, ${f} failed`);
if(f){fl.forEach(x=>console.log('  ❌ '+x.n+': '+x.e))}
process.exit(f>0?1:0);
