// ---------- Config ----------
const COMMON_INGREDIENTS = ["egg","cheese","bread","rice","chicken","pasta","tomato","onion","garlic","spinach","tuna","potato","milk","yogurt","beans"];

const MOCK_RECIPES = [
  { id:1001, title:"5-Minute Egg Fried Rice",
    usedIngredientCount:3, missedIngredientCount:1,
    usedIngredients:[{name:"rice"},{name:"egg"},{name:"onion"}], missedIngredients:[{name:"soy sauce"}] },
  { id:1002, title:"Creamy Tomato Pasta",
    usedIngredientCount:3, missedIngredientCount:1,
    usedIngredients:[{name:"pasta"},{name:"tomato"},{name:"garlic"}], missedIngredients:[{name:"cream"}] },
  { id:1003, title:"Tuna Melt Toastie",
    usedIngredientCount:3, missedIngredientCount:0,
    usedIngredients:[{name:"tuna"},{name:"cheese"},{name:"bread"}], missedIngredients:[] },
];

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const LS = { pantry: "justcook_pantry" };

// ---------- State ----------
let pantry = loadJSON(LS.pantry, []);
let instructionsCache = {};

// ---------- Elements ----------
const elInput = $("#ing-input");
const elAdd = $("#ing-add");
const elClear = $("#ing-clear");
const elChips = $("#chips");
const elSuggested = $("#suggested");
const elBtnSearch = $("#do-search");
const elError = $("#error");
const elResults = $("#results");
const elEmpty = $("#empty");
const elMaxMissing = $("#f-max-missing");
const elMaxMissingVal = $("#f-max-missing-val");
const elMaxTime = $("#f-max-time");
const elMaxCost = $("#f-max-cost");
const elDiet = $("#f-diet");

// ---------- Init ----------
renderChips();
renderSuggestions();
toggleButtons();
elMaxMissing.addEventListener("input", () => elMaxMissingVal.textContent = elMaxMissing.value);

// Add ingredient
elAdd.addEventListener("click", () => addIngredient(elInput.value));
elInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addIngredient(elInput.value); });

// Clear
elClear.addEventListener("click", () => { pantry = []; saveJSON(LS.pantry, pantry); renderChips(); toggleButtons(); });

// Search
elBtnSearch.addEventListener("click", doSearch);

// ---------- Functions ----------
function addIngredient(raw){
  const name = normalizeName(raw);
  if (!name) return;
  if (!pantry.includes(name)) pantry.push(name);
  saveJSON(LS.pantry, pantry);
  elInput.value = "";
  renderChips();
  renderSuggestions();
  toggleButtons();
}

function renderChips(){
  elChips.innerHTML = "";
  pantry.forEach(name => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = name + " ";
    const x = document.createElement("button");
    x.className = "x";
    x.textContent = "×";
    x.title = "Remove";
    x.addEventListener("click", () => {
      pantry = pantry.filter(p => p !== name);
      saveJSON(LS.pantry, pantry);
      renderChips();
      renderSuggestions();
      toggleButtons();
    });
    chip.appendChild(x);
    elChips.appendChild(chip);
  });
}

function renderSuggestions(){
  elSuggested.innerHTML = "";
  COMMON_INGREDIENTS.filter(x => !pantry.includes(x)).forEach(s => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = s;
    chip.addEventListener("click", () => addIngredient(s));
    elSuggested.appendChild(chip);
  });
}

function toggleButtons(){
  const has = pantry.length > 0;
  elBtnSearch.disabled = !has;
  elClear.hidden = !has;
}

async function doSearch(){
  elError.hidden = true;
  elEmpty.style.display = "none";
  elResults.innerHTML = "";

  const params = new URLSearchParams({
    ingredients: pantry.join(","),
    number: "12",
    ranking: "2",
    ignorePantry: "false",
  });

  let base = [];
  try{
    const r = await fetch(`/api/recipes?${params.toString()}`);
    if(!r.ok) throw new Error(String(r.status));
    base = await r.json();
  }catch{
    base = MOCK_RECIPES;
  }

  const enriched = await Promise.all(base.map(async (rec) => {
    try{
      const r = await fetch(`/api/recipe-info?id=${rec.id}&includeNutrition=true`);
      if(!r.ok) throw new Error("info");
      const info = await r.json();
      return {
        ...rec,
        readyInMinutes: info.readyInMinutes ?? 20,
        pricePerServing: toDollars(info.pricePerServing ?? 250),
        servings: info.servings ?? 2,
        diets: info.diets ?? [],
      };
    }catch{
      return { ...rec, readyInMinutes: 20, pricePerServing: 2.5, servings: 2, diets: [] };
    }
  }));

  // Filters
  const maxMissing = parseInt(elMaxMissing.value, 10);
  const maxTime = parseInt(elMaxTime.value, 10);
  const maxCost = parseInt(elMaxCost.value.replace("$",""), 10);
  const diet = elDiet.value.toLowerCase();

  const filtered = enriched.filter(r => {
    const timeOK = (r.readyInMinutes||999) <= maxTime;
    const costOK = (r.pricePerServing||999) <= maxCost;
    const missingOK = (r.missedIngredientCount||0) <= maxMissing;
    const dietOK = !diet || (r.diets||[]).map(d => d.toLowerCase()).includes(diet);
    return timeOK && costOK && missingOK && dietOK;
  });

  filtered.sort((a,b) =>
    (a.missedIngredientCount - b.missedIngredientCount) ||
    (a.readyInMinutes - b.readyInMinutes) ||
    ((a.pricePerServing||0) - (b.pricePerServing||0))
  );

  renderResults(filtered);
}

function renderResults(list){
  if(!list.length){ elEmpty.style.display = "block"; return; }
  elResults.innerHTML = "";
  list.forEach(r => {
    const card = document.createElement("article");
    card.className = "card-recipe";

    const img = document.createElement("img");
    img.src = r.image; img.alt = r.title;
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h4");
    title.className = "card-title";
    title.textContent = r.title;
    body.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <span class="pill">~${r.readyInMinutes} min</span>
      <span class="pill">$${(r.pricePerServing||0).toFixed(2)}/serv</span>
      ${((r.diets||[]).slice(0,2).map(d => `<span class="pill">${escapeHtml(d)}</span>`)).join("")}
      <span class="dot">•</span>
      <span>${r.usedIngredientCount} used</span>
      <span class="dot">/</span>
      <span>${r.missedIngredientCount} missing</span>
    `;
    body.appendChild(meta);

    // Ingredients
    const lists = document.createElement("div");
    lists.className = "list";
    const have = document.createElement("div");
    have.innerHTML = `<p>You have</p><ul>${(r.usedIngredients||[]).slice(0,6).map(i=>`<li>${titleCase(i.name)}</li>`).join("")}</ul>`;
    const miss = document.createElement("div");
    miss.innerHTML = `<p>Missing</p><ul>${(r.missedIngredients||[]).slice(0,6).map(i=>`<li>${titleCase(i.name)}</li>`).join("")}</ul>`;
    lists.appendChild(have); lists.appendChild(miss);
    body.appendChild(lists);

    // Actions
    const actions = document.createElement("div");
    actions.className = "rc-actions";

    const open = document.createElement("a");
    open.className = "link-btn";
    open.href = `https://spoonacular.com/recipes/${encodeURIComponent(r.title)}-${r.id}`;
    open.target = "_blank"; open.rel = "noreferrer";
    open.textContent = "Open on Spoonacular";
    actions.appendChild(open);

    const btn = document.createElement("button");
    btn.className = "btn btn-ghost";
    btn.textContent = "Show steps";
    actions.appendChild(btn);

    body.appendChild(actions);

    const steps = document.createElement("ol");
    steps.className = "steps";
    steps.style.display = "none";
    body.appendChild(steps);

    btn.addEventListener("click", async () => {
      const showing = steps.style.display === "block";
      steps.style.display = showing ? "none" : "block";
      btn.textContent = showing ? "Show steps" : "Hide steps";
      if (!instructionsCache[r.id]) {
        try{
          const res = await fetch(`/api/recipe-steps?id=${r.id}`);
          const data = await res.json();
          const arr = (data?.[0]?.steps||[]).map(x=>x.step);
          instructionsCache[r.id] = arr.length ? arr : mockStepsFor(r.id);
        }catch{
          instructionsCache[r.id] = mockStepsFor(r.id);
        }
      }
      steps.innerHTML = instructionsCache[r.id].map((t,i)=>`<li><b>${i+1}.</b> ${escapeHtml(t)}</li>`).join("");
    });

    card.appendChild(body);
    elResults.appendChild(card);
  });
}

// ---------- Utils ----------
function normalizeName(s){ return (s||"").trim().toLowerCase().replace(/\s+/g," "); }
function titleCase(s){ return String(s).replace(/\b\w/g, m => m.toUpperCase()); }
function toDollars(cents){ return cents > 25 ? Math.round(cents)/100 : Math.round(cents*100)/100; }
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function loadJSON(k, fallback){ try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(fallback)); }catch{ return fallback; } }
function saveJSON(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
function mockStepsFor(id){
  if (id === 1001) return ["Heat oil in a pan on medium-high.","Add chopped onion; stir 1 min.","Push to the side; scramble eggs.","Add cold rice + soy sauce; fry 2–3 min.","Serve hot."];
  if (id === 1002) return ["Boil pasta until al dente.","Sauté garlic, add tomatoes.","Stir in a splash of cream.","Toss pasta; season and serve."];
  return ["Mix tuna with a little mayo.","Top bread with tuna and cheese.","Toast until melted and golden."];
}