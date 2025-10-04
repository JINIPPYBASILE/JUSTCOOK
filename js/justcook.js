
// Simple single-file app: stores pantry in localStorage and computes cost/portion & calories

const sampleDB = {
  // kcal per 100g (or per unit if unit-type)
  "chicken breast": {calsPer100:165, defaultUnit:'g'},
  "rice": {calsPer100:130, defaultUnit:'g'},
  "egg": {calsPer100:155, defaultUnit:'unit'},
  "milk": {calsPer100:42, defaultUnit:'ml'},
  "tomato": {calsPer100:18, defaultUnit:'g'},
  "onion": {calsPer100:40, defaultUnit:'g'},
  "pasta": {calsPer100:131, defaultUnit:'g'},
  "bread": {calsPer100:265, defaultUnit:'g'},
  "cheese": {calsPer100:402, defaultUnit:'g'},
  "potato": {calsPer100:77, defaultUnit:'g'}
};

let pantry = JSON.parse(localStorage.getItem('pantry_v1')||'{}');
let coupons = parseInt(localStorage.getItem('fridge_coupons')||'0',10);
updateCouponUI();

function savePantry(){ localStorage.setItem('pantry_v1', JSON.stringify(pantry)); }

function uid(){ return 'id'+Math.random().toString(36).slice(2,9); }

function formatPrice(n){ const cur = document.getElementById('currency').value||'$'; return cur+Number(n).toFixed(2); }

function addOrUpdateIngredient(){
  const name = document.getElementById('ing-name').value.trim().toLowerCase();
  if(!name) return alert('please give an ingredient name');
  const qty = parseFloat(document.getElementById('ing-qty').value)||0;
  const unit = document.getElementById('ing-unit').value;
  const price = parseFloat(document.getElementById('ing-price').value)||0;
  const cals = parseFloat(document.getElementById('ing-cals').value)||null;

  // find if exists
  let foundKey = Object.keys(pantry).find(k=>k===name);
  if(!foundKey){
    pantry[name] = {id:uid(),name,qty,unit,price,cals};
  } else {
    pantry[foundKey] = {...pantry[foundKey],qty,unit,price,cals};
  }
  savePantry();
  renderPantry();
  clearInputs();
}

function clearInputs(){ document.getElementById('ing-name').value='';document.getElementById('ing-qty').value='';document.getElementById('ing-price').value='';document.getElementById('ing-cals').value=''; }

function loadSample(){
  // put realistic sample pantry
  pantry = {
    'chicken breast':{id:uid(),name:'chicken breast',qty:800,unit:'g',price:9.99,cals:165},
    'rice':{id:uid(),name:'rice',qty:1500,unit:'g',price:5.49,cals:130},
    'egg':{id:uid(),name:'egg',qty:12,unit:'unit',price:3.19,cals:72},
    'tomato':{id:uid(),name:'tomato',qty:600,unit:'g',price:2.49,cals:18},
    'pasta':{id:uid(),name:'pasta',qty:500,unit:'g',price:1.99,cals:131},
    'cheese':{id:uid(),name:'cheese',qty:200,unit:'g',price:4.50,cals:402}
  }
  savePantry(); renderPantry();
}

function exportCSV(){
  const rows = [['name','qty','unit','price','calsPer100']];
  Object.values(pantry).forEach(p=>rows.push([p.name,p.qty,p.unit,p.price,p.cals||'']));
  const csv = rows.map(r=>r.map(c=>JSON.stringify(c)).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='pantry.csv'; a.click(); URL.revokeObjectURL(url);
}

function removeIngredient(name){ delete pantry[name]; savePantry(); renderPantry(); }

function renderPantry(){
  const el = document.getElementById('ingredients-list'); el.innerHTML='';
  const keys = Object.keys(pantry).sort();
  if(keys.length===0){ el.innerHTML='<div class="muted">No ingredients yet — add some.</div>'; renderLogArea(); renderRecipes(); return; }
  keys.forEach(k=>{
    const p = pantry[k];
    const div = document.createElement('div'); div.className='item';
    div.innerHTML = `<div>
      <div style="font-weight:700">${p.name}</div>
      <div class="muted">${p.qty} ${p.unit} • ${formatPrice(p.price)} total</div>
      <div class="muted">Calories: ${p.cals? p.cals+ (p.unit==='g'? ' per 100g' : ' per unit') : 'unknown (you can add)'}</div>
    </div>
    <div style="text-align:right">
      <button class="btn-ghost" data-name="${p.name}" onclick="editIngredient('${p.name}')">Edit</button>
      <div style="height:8px"></div>
      <button class="btn-ghost" onclick="removeIngredient('${p.name}')">Remove</button>
    </div>`;
    el.appendChild(div);
  });
  renderLogArea(); renderRecipes();
}

function editIngredient(name){
  const p = pantry[name]; if(!p) return;
  document.getElementById('ing-name').value = p.name;
  document.getElementById('ing-qty').value = p.qty;
  document.getElementById('ing-unit').value = p.unit;
  document.getElementById('ing-price').value = p.price;
  document.getElementById('ing-cals').value = p.cals||'';
}

function renderLogArea(){
  const area = document.getElementById('log-area'); area.innerHTML='';
  const keys = Object.keys(pantry).sort();
  if(keys.length===0){ area.innerHTML='<div class="muted">Add ingredients to log a meal.</div>'; return; }
  keys.forEach(k=>{
    const p = pantry[k];
    const id = 'chk_'+p.id;
    const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='center'; row.style.marginBottom='6px';
    row.innerHTML = `<input type="checkbox" id="${id}" data-name="${p.name}" />
      <label for="${id}" style="flex:1">${p.name} — have ${p.qty} ${p.unit}</label>
      <input placeholder="qty used" style="width:90px" id="used_${p.id}" />`;
    area.appendChild(row);
  });
}

function findRecipes(){
  // very simple matching: recipes require small sets; score by how many ingredients available
  const recipesDB = [
    {name:'Tomato Pasta',ingredients:['pasta','tomato','cheese'],portions:3,avgRestaurantPrice:12},
    {name:'Chicken & Rice',ingredients:['chicken breast','rice','onion'],portions:4,avgRestaurantPrice:14},
    {name:'Cheesy Omelette',ingredients:['egg','cheese'],portions:1,avgRestaurantPrice:6},
    {name:'Rice Bowl',ingredients:['rice','tomato','onion'],portions:2,avgRestaurantPrice:9}
  ];

  const pantryKeys = Object.keys(pantry).map(k=>k.toLowerCase());
  const search = document.getElementById('recipe-search').value.toLowerCase();
  const maxCost = parseFloat(document.getElementById('max-cost').value)||Infinity;

  const container = document.getElementById('recipes'); container.innerHTML='';
  recipesDB.forEach(r=>{
    const have = r.ingredients.filter(i=>pantryKeys.includes(i));
    const matchRatio = have.length / r.ingredients.length;
    if(search && !r.name.toLowerCase().includes(search)) return;
    if(matchRatio<0.5) return; // require at least half

    // compute cost & calories per portion using available: assume use proportional amounts
    const {costPerPortion, calsPerPortion} = estimateRecipeNutrition(r);
    if(costPerPortion>maxCost) return;

    const card = document.createElement('div'); card.className='recipe';
    card.innerHTML = `<div style="display:flex;justify-content:space-between"><div style="font-weight:700">${r.name}</div><div class="muted">${have.length}/${r.ingredients.length} ingredients</div></div>
      <div class="muted" style="margin-top:6px">Est. cost/portion: <span class="highlight">${formatPrice(costPerPortion)}</span></div>
      <div class="muted">Est. calories/portion: <span class="highlight">${Math.round(calsPerPortion)} kcal</span></div>
      <div style="margin-top:8px;display:flex;gap:8px"><button onclick="prepRecipe('${r.name}')">Use & Log</button><button class="btn-ghost" onclick="showRecipeDetails('${r.name}')">Details</button></div>`;
    container.appendChild(card);
  });

  if(container.innerHTML==='') container.innerHTML='<div class="muted">No good matches. Try adding more ingredients or remove filters.</div>';
}

function estimateRecipeNutrition(recipe){
  // very rough: allocate equal weights for each ingredient; use pantry values where present
  const available = recipe.ingredients.map(i=>pantry[i] || null);
  let totalCostUsed = 0; let totalCals = 0; let totalPortions = recipe.portions||1;
  recipe.ingredients.forEach((ing,idx)=>{
    const p = pantry[ing];
    if(!p) return; // skip
    // decide amount used: for 'g' and 'ml' use 150g per ingredient per portion as baseline, for unit use 1 unit per portion
    const perPortionAmount = (p.unit==='g'||p.unit==='ml')? 150 : 1;
    const amountUsed = perPortionAmount * totalPortions; // total amount for full recipe
    const fractionOfItem = Math.min(1, amountUsed / (p.qty || amountUsed));
    // cost proportional to fraction
    const costUsed = (p.price || 0) * fractionOfItem;
    totalCostUsed += costUsed;

    // calories: if p.cals exists: if unit -> per unit, if g or ml -> per 100g/ml
    if(p.cals){
      if(p.unit==='unit'){
        totalCals += (p.cals) * perPortionAmount * totalPortions / 1; // but p.cals stored per unit so perPortionAmount=1
      } else {
        // p.cals is per 100g
        totalCals += (p.cals/100) * perPortionAmount * totalPortions;
      }
    } else if(sampleDB[ing] && sampleDB[ing].calsPer100){
      totalCals += (sampleDB[ing].calsPer100/100) * perPortionAmount * totalPortions;
    }
  });
  const costPerPortion = totalCostUsed / (totalPortions||1);
  const calsPerPortion = totalCals / (totalPortions||1);
  return {costPerPortion, calsPerPortion};
}

function prepRecipe(name){
  // tiny animation: just prefill log area with used ingredients for that recipe
  const recipesDB = {
    'Tomato Pasta':['pasta','tomato','cheese'],
    'Chicken & Rice':['chicken breast','rice','onion'],
    'Cheesy Omelette':['egg','cheese'],
    'Rice Bowl':['rice','tomato','onion']
  };
  const list = recipesDB[name]||[];
  // check checkboxes in log area
  list.forEach(ing=>{
    const p = pantry[ing]; if(!p) return;
    const input = document.querySelector(`#used_${p.id}`);
    const chk = document.querySelector(`#chk_${p.id}`);
    if(chk) chk.checked = true;
    if(input) input.value = (p.unit==='g' || p.unit==='ml')? Math.min(150,p.qty) : 1;
  });
}

function showRecipeDetails(name){ alert('Recipe details for '+name+' — this demo has simple predefined recipes. You can expand this to include steps, timings, and ingredient weights.'); }

function logMeal(estimateOnly=false){
  const selected = [];
  Object.values(pantry).forEach(p=>{
    const usedEl = document.getElementById('used_'+p.id);
    const chk = document.getElementById('chk_'+p.id);
    if(chk && chk.checked){
      const usedVal = parseFloat(usedEl.value)||0;
      selected.push({name:p.name,used:usedVal,unit:p.unit,price:p.price,qty:p.qty,cals:p.cals});
    }
  });
  if(selected.length===0) return alert('select at least one ingredient and specify qty used');

  // compute cost & calories
  let costTotal = 0; let totalCals = 0;
  selected.forEach(s=>{
    if(s.unit==='unit'){
      const perUnitPrice = (s.price || 0) / (s.qty || 1);
      costTotal += perUnitPrice * s.used;
      totalCals += (s.cals || (sampleDB[s.name] && sampleDB[s.name].calsPer100) || 0) * s.used;
    } else {
      // assume price is total for qty grams or ml
      const perGramPrice = (s.price || 0) / (s.qty || 1);
      costTotal += perGramPrice * s.used;
      const calsPer100 = s.cals || (sampleDB[s.name] && sampleDB[s.name].calsPer100) || 0;
      totalCals += (calsPer100/100) * s.used;
    }
    // deduct used quantity from pantry
    if(!estimateOnly){
      pantry[s.name].qty = Math.max(0, (pantry[s.name].qty||0) - s.used);
      // if qty becomes zero or less, remove? we keep zero entries for now
    }
  });
  if(!estimateOnly){ savePantry(); renderPantry(); }

  // award coupon for logging real meal
  if(!estimateOnly){
    coupons += 1; localStorage.setItem('fridge_coupons', coupons); updateCouponUI();
  }

  const out = document.getElementById('log-result');
  out.innerHTML = `<div class="card" style="padding:10px">Meal recorded — cost: <strong>${formatPrice(costTotal)}</strong> • calories: <strong>${Math.round(totalCals)} kcal</strong> ${estimateOnly?'<div class="muted">(estimate)</div>':''}</div>`;

  // show comparison
  const comp = document.getElementById('comparison');
  const avgRestaurant = averageRestaurantPrice(selected);
  comp.innerHTML = `Your meal cost ${formatPrice(costTotal)} per logged meal. Average similar restaurant price: <strong>${formatPrice(avgRestaurant)}</strong>. Estimated saving: <strong>${formatPrice(Math.max(0, avgRestaurant - costTotal))}</strong>`;
}

function averageRestaurantPrice(selectedIngredients){
  // naive mapping by number of ingredients
  const n = selectedIngredients.length;
  if(n<=1) return 6;
  if(n===2) return 8;
  if(n===3) return 11;
  return 14;
}

function updateCouponUI(){ document.getElementById('coupon-count').innerText = coupons; }

function redeemCoupons(){
  if(coupons<=0) return alert('No coupons to redeem.');
  // pretend to redeem for local partner: generate fake code
  const code = 'SAVE'+Math.random().toString(36).slice(2,8).toUpperCase();
  coupons = 0; localStorage.setItem('fridge_coupons', coupons); updateCouponUI();
  alert('Redeemed coupons for a grocery discount code: '+code+' (demo)');
}

// utilities for recipe estimation from DB for the simplified demo
function estimateRecipeNutrition(r){
  // uses the small recipes list above. We'll compute based on pantry values where possible.
  const recipesLookup = {
    'Tomato Pasta':{ingredients:['pasta','tomato','cheese'],portions:3},
    'Chicken & Rice':{ingredients:['chicken breast','rice','onion'],portions:4},
    'Cheesy Omelette':{ingredients:['egg','cheese'],portions:1},
    'Rice Bowl':{ingredients:['rice','tomato','onion'],portions:2}
  };
  const rec = recipesLookup[r]||{ingredients:[],portions:1};
  return estimateRecipeNutritionByIngredients(rec.ingredients, rec.portions);
}
function estimateRecipeNutritionByIngredients(ings,portions){
  let totalCost=0,totalCals=0;
  ings.forEach(i=>{
    const p = pantry[i]; if(!p) return;
    const perPortionAmt = (p.unit==='g' || p.unit==='ml')?150:1;
    const totalAmt = perPortionAmt * portions;
    const fraction = Math.min(1, totalAmt/(p.qty||totalAmt));
    totalCost += (p.price||0) * fraction;
    if(p.cals){
      if(p.unit==='unit') totalCals += (p.cals||0) * perPortionAmt * portions;
      else totalCals += (p.cals/100) * perPortionAmt * portions;
    } else if(sampleDB[i]){
      totalCals += (sampleDB[i].calsPer100/100) * perPortionAmt * portions;
    }
  });
  return {costPerPortion: totalCost/Math.max(1,portions), calsPerPortion: totalCals/Math.max(1,portions)};
}

// attach events
document.getElementById('add-ing').addEventListener('click', addOrUpdateIngredient);
document.getElementById('load-sample').addEventListener('click', loadSample);
document.getElementById('export-csv').addEventListener('click', exportCSV);
document.getElementById('clear-all').addEventListener('click', ()=>{ if(confirm('Clear pantry?')){pantry={}; savePantry(); renderPantry();}});
document.getElementById('find-recipes').addEventListener('click', findRecipes);
document.getElementById('log-meal').addEventListener('click', ()=>logMeal(false));
document.getElementById('estimate-meal').addEventListener('click', ()=>logMeal(true));
document.getElementById('redeem').addEventListener('click', redeemCoupons);

// initial render
renderPantry(); findRecipes();

