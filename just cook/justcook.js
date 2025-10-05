/* =====================================================================
   JustCook – Pantry → Meal in seconds (stand-alone demo)
   - Works with the HTML IDs used in the last version I sent.
   - Fully client-side; stores pantry in localStorage.
   - Includes Quick Add, filters, mock recipes with kcal/protein, steps.
===================================================================== */
(() => {
  'use strict';

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // ------- Grab elements (fail fast if any critical element is missing) -------
    const elInput   = byId("ing-input");
    const elAdd     = byId("ing-add");
    const elClear   = byId("ing-clear");
    const elChips   = byId("chips");
    const elGrid    = byId("grid");
    const elEmpty   = byId("empty");
    const elCount   = byId("count");
    const elTime    = byId("f-time");
    const elTimeV   = byId("f-time-v");
    const elDiet    = byId("f-diet");
    const elMiss    = byId("f-miss");
    const elBtnFind = byId("btnFind");
    const elTheme   = byId("btnDark");
    const elReset   = byId("resetEverything");
    const elQAGrid  = byId("qa-grid"); // may be null if Quick Add not in HTML

    const required = { elInput, elAdd, elChips, elGrid, elEmpty, elCount, elTime, elTimeV, elDiet, elMiss, elBtnFind };
    for (const [k, v] of Object.entries(required)) {
      if (!v) { console.error(`[JustCook] Missing DOM element: ${k}`); return; }
    }

    // ------- State -------
    let pantry = loadPantry(); // array of strings
    let customRecipes = JSON.parse(localStorage.getItem("justcook.customRecipes") || "[]");
let favourites = JSON.parse(localStorage.getItem("justcook.favourites") || "[]");
    // ------- Quick Add (optional if container exists) -------
    const QUICK_ADD = [
      "egg","milk","bread","butter","cheese","yogurt",
      "chicken","beef","tuna","shrimp",
      "rice","pasta","noodles","tortilla",
      "tomato","onion","garlic","spinach","broccoli","carrot","potato","avocado",
      "olive oil","soy sauce","ketchup","mayo","peanut butter","oats","banana","lemon"
    ];
    if (elQAGrid) renderQuickAdd();

    function renderQuickAdd(){
      elQAGrid.innerHTML = "";
      QUICK_ADD.forEach(name=>{
        const b = document.createElement("button");
        b.className = "qa";
        b.type = "button";
        b.textContent = name;
        b.addEventListener("click", () => addIngredient(name));
        elQAGrid.appendChild(b);
      });
    }

    // ------- Pantry chips -------
    function renderChips(){
      elChips.innerHTML = "";
      pantry.forEach((name, i) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.innerHTML = `<span>${escapeHtml(name)}</span>
          <button class="x" aria-label="Remove ${escapeHtml(name)}" title="Remove">&times;</button>`;
        chip.querySelector(".x").onclick = () => {
          pantry.splice(i,1);
          savePantry();
          renderChips();
        };
        elChips.appendChild(chip);
      });
      elClear.hidden = pantry.length === 0;
    }

    function addIngredient(nameFromQuick){
      const v = ((nameFromQuick ?? elInput.value) || "").trim().toLowerCase();
      if(!v) return;
      if(!pantry.includes(v)) {
        pantry.push(v);
        savePantry();
        renderChips();
      }
      if(!nameFromQuick) elInput.value = "";
    }

    elAdd.addEventListener("click", () => addIngredient());
    elInput.addEventListener("keydown", (e) => { if(e.key === "Enter") addIngredient(); });
    elClear.addEventListener("click", () => { pantry = []; savePantry(); renderChips(); });
    renderChips();

    // ------- Filters UI -------
    elTime.addEventListener("input", () => elTimeV.textContent = elTime.value);

    // ------- Theme toggle -------
    if (elTheme) {
      elTheme.addEventListener("click", () => {
        const on = !document.body.classList.contains("dark-mode");
        document.body.classList.toggle("dark-mode", on);
        elTheme.setAttribute("aria-pressed", String(on));
      });
    }

    // ------- Reset -------
    if (elReset) {
      elReset.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        location.reload();
      });
    }

    // ------- Demo images (SVG data URI so it works offline) -------
    const IMG_PLACEHOLDER = 'data:image/svg+xml;utf8,' +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E8F5E9"/><stop offset="1" stop-color="#FFF8E1"/></linearGradient></defs>
      <rect width="640" height="360" fill="url(#g)"/>
      <g fill="#2E7D32" opacity="0.9">
        <circle cx="90" cy="80" r="30"/><rect x="140" y="60" rx="10" width="120" height="40"/>
        <rect x="300" y="140" rx="16" width="260" height="120"/>
      </g>
    </svg>`);

    // ------- Demo recipes -------
    const RECIPES = [
      {
        id: "frittata",
        title: "Spinach Frittata",
        time: 20,
        diet: ["Vegetarian","High-protein"],
        image: IMG_PLACEHOLDER,
        macros: { kcal: 320, protein: 23, carbs: 3, fat: 22 },
        ingredients: [
          { name: "egg", qty: "4 pcs" },
          { name: "spinach", qty: "120 g" },
          { name: "feta", qty: "60 g" },
          { name: "olive oil", qty: "1 tbsp" }
        ],
        steps: [
          "Beat eggs with salt and pepper.",
          "Sauté spinach in olive oil until wilted.",
          "Pour eggs, add feta, cook until set; finish under broiler 1–2 min."
        ]
      },
      {
        id: "garlic-chicken-rice",
        title: "Garlic Chicken Rice Bowl",
        time: 30,
        diet: ["High-protein","Gluten-free"],
        image: IMG_PLACEHOLDER,
        macros: { kcal: 530, protein: 38, carbs: 58, fat: 15 },
        ingredients: [
          { name: "chicken", qty: "300 g" },
          { name: "rice", qty: "1 cup cooked" },
          { name: "garlic", qty: "2 cloves" },
          { name: "soy sauce", qty: "1 tbsp" },
          { name: "green onion", qty: "1 stalk" }
        ],
        steps: [
          "Cook rice or reheat leftover rice.",
          "Pan-sear chicken with garlic; splash soy sauce.",
          "Serve over rice; top with green onion."
        ]
      },
      {
        id: "tomato-cream-pasta",
        title: "Tomato Cream Pasta",
        time: 25,
        diet: [],
        image: IMG_PLACEHOLDER,
        macros: { kcal: 610, protein: 17, carbs: 74, fat: 24 },
        ingredients: [
          { name: "pasta", qty: "150 g" },
          { name: "tomato sauce", qty: "1 cup" },
          { name: "cream", qty: "1/4 cup" },
          { name: "parmesan", qty: "30 g" },
          { name: "garlic", qty: "1 clove" }
        ],
        steps: [
          "Boil pasta in salted water.",
          "Warm tomato sauce with a splash of cream and garlic.",
          "Toss pasta with sauce; finish with parmesan."
        ]
      },
      {
        id: "veg-fried-rice",
        title: "Vegetable Fried Rice",
        time: 15,
        diet: ["Vegetarian"],
        image: IMG_PLACEHOLDER,
        macros: { kcal: 420, protein: 12, carbs: 70, fat: 10 },
        ingredients: [
          { name: "rice", qty: "2 cups cooked" },
          { name: "egg", qty: "2 pcs" },
          { name: "carrot", qty: "1 small" },
          { name: "onion", qty: "1/2" },
          { name: "garlic", qty: "1 clove" },
          { name: "soy sauce", qty: "1 tbsp" }
        ],
        steps: [
          "Scramble eggs; set aside.",
          "Stir-fry onion, carrot, garlic; add rice.",
          "Add soy sauce; fold in eggs."
        ]
      },
      {
        id: "tuna-mayo-toast",
        title: "Tuna Mayo Toast",
        time: 8,
        diet: [],
        image: IMG_PLACEHOLDER,
        macros: { kcal: 390, protein: 25, carbs: 32, fat: 16 },
        ingredients: [
          { name: "tuna", qty: "1 can" },
          { name: "mayo", qty: "1 tbsp" },
          { name: "bread", qty: "2 slices" },
          { name: "lemon", qty: "wedge" }
        ],
        steps: [
          "Mix tuna with mayo, salt, pepper, and lemon.",
          "Toast bread; pile tuna on top."
        ]
      },
      {
        id: "avocado-egg-toast",
        title: "Avocado Egg Toast",
        time: 10,
        diet: ["Vegetarian"],
        image: IMG_PLACEHOLDER,
        macros: { kcal: 350, protein: 14, carbs: 28, fat: 20 },
        ingredients: [
          { name: "bread", qty: "2 slices" },
          { name: "avocado", qty: "1/2" },
          { name: "egg", qty: "1 pc" },
          { name: "lemon", qty: "squeeze" }
        ],
        steps: [
          "Toast bread; mash avocado with lemon, salt, pepper.",
          "Fry or poach egg; place on toast."
        ]
      },
      {
        id: "pb-banana-oats",
        title: "PB Banana Oats",
        time: 7,
        diet: ["Vegetarian"],
        image: IMG_PLACEHOLDER,
        macros: { kcal: 420, protein: 15, carbs: 55, fat: 14 },
        ingredients: [
          { name: "oats", qty: "1/2 cup" },
          { name: "milk", qty: "1 cup" },
          { name: "peanut butter", qty: "1 tbsp" },
          { name: "banana", qty: "1" }
        ],
        steps: [
          "Microwave oats with milk 2–3 minutes.",
          "Top with peanut butter and sliced banana."
        ]
      },
      {
        id: "tomato-egg-stirfry",
        title: "Tomato & Egg Stir-Fry",
        time: 12,
        diet: ["Vegetarian","High-protein"],
        image: IMG_PLACEHOLDER,
        macros: { kcal: 300, protein: 16, carbs: 10, fat: 20 },
        ingredients: [
          { name: "egg", qty: "3 pcs" },
          { name: "tomato", qty: "2" },
          { name: "garlic", qty: "1 clove" },
          { name: "rice", qty: "for serving" }
        ],
        steps: [
          "Scramble eggs softly; set aside.",
          "Sauté garlic and tomatoes until saucy.",
          "Return eggs; season; serve over rice."
        ]
      },
      {
        id: "greek-salad",
        title: "Quick Greek Salad",
        time: 10,
        diet: ["Vegetarian","Gluten-free"],
        image: IMG_PLACEHOLDER,
        macros: { kcal: 260, protein: 7, carbs: 12, fat: 20 },
        ingredients: [
          { name: "tomato", qty: "2" },
          { name: "cucumber", qty: "1/2" },
          { name: "onion", qty: "1/4" },
          { name: "feta", qty: "50 g" },
          { name: "olive oil", qty: "1 tbsp" },
          { name: "lemon", qty: "squeeze" }
        ],
        steps: [
          "Chop veggies; toss with oil and lemon.",
          "Crumble feta on top."
        ]
      },
      {
        id: "chicken-pesto-pasta",
        title: "Chicken Pesto Pasta",
        time: 25,
        diet: ["High-protein"],
        image: IMG_PLACEHOLDER,
        macros: { kcal: 640, protein: 35, carbs: 70, fat: 22 },
        ingredients: [
          { name: "pasta", qty: "160 g" },
          { name: "chicken", qty: "250 g" },
          { name: "pesto", qty: "2 tbsp" },
          { name: "parmesan", qty: "20 g" }
        ],
        steps: [
          "Boil pasta; reserve a ladle of water.",
          "Cook chicken; toss with pesto and pasta, adjusting with pasta water.",
          "Finish with parmesan."
        ]
      }
    ];

    // ------- Matching & filtering -------
    function matchScore(recipe, have){
      // +2 for each ingredient you have, -2 when missing; bonus for faster recipes
      let score = 0;
      const missing = [];
      recipe.ingredients.forEach(ing => {
        const ok = have.some(h => normalize(h) === normalize(ing.name));
        if(ok) score += 2; else { score -= 2; missing.push(ing); }
      });
      score += Math.max(0, (50 - recipe.time) / 10);
      return { score, missing };
    }
    function normalize(s){ return String(s).trim().toLowerCase(); }

    function applyFilters(recipes){
      const tmax = Number(elTime.value);
      const diet = elDiet.value;
      const maxMissing = Number(elMiss.value);

      const have = pantry.map(normalize);
      const out = [];

      recipes.forEach(r => {
        if(r.time > tmax) return;
        if(diet && !r.diet.map(normalize).includes(normalize(diet))) return;

        const { score, missing } = matchScore(r, have);
        if(missing.length > maxMissing) return;
        out.push({ ...r, score, missing });
      });

      out.sort((a,b) => b.score - a.score);
      return out;
    }

    // ------- Render results -------
    function renderResults(){
      const allRecipes = [...RECIPES, ...customRecipes];
const list = applyFilters(allRecipes);

      elCount.textContent = `${list.length} result${list.length!==1?"s":""}`;
      elGrid.innerHTML = "";
      elEmpty.style.display = list.length ? "none" : "block";

      list.forEach(r => {
        const card = document.createElement("article");
        card.className = "card-recipe";

        const img = document.createElement("img");
        img.loading = "lazy";
        img.alt = r.title;
        img.src = r.image;

        const body = document.createElement("div");
        body.className = "card-body ";
        body.innerHTML = `
          <h4 class="card-title">${escapeHtml(r.title)}</h4>
          <div class="meta-row">
            <span class="pill">${r.time} min</span>
            ${r.diet.map(d => `<span class="pill">${escapeHtml(d)}</span>`).join("")}
            <span class="pill">${r.macros.kcal} kcal</span>
            <span class="pill">${r.macros.protein}g protein</span>
          </div>
        `;

        // You have vs missing
        const have = pantry.map(normalize);
        const youHave = r.ingredients.filter(ing => have.includes(normalize(ing.name)));
        const youMiss = r.missing;

        const ingWrap = document.createElement("div");
        ingWrap.className = "ingredients";
        ingWrap.innerHTML = `
          <div>
            <h4>You have</h4>
            <ul>${youHave.map(i => `<li>${escapeHtml(i.name)} <span class="muted small">(${escapeHtml(i.qty)})</span></li>`).join("") || "<li class='muted'>—</li>"}</ul>
          </div>
          <div>
            <h4>Missing</h4>
            ${youMiss.length ? `<ul>${youMiss.map(i => `<li>${escapeHtml(i.name)}</li>`).join("")}</ul>` : "<div class='pill'>All in pantry ✅</div>"}
          </div>
        `;

        const actions = document.createElement("div");
        actions.className = "rc-actions";

        const btnSteps = document.createElement("button");
        btnSteps.className = "btn btn-ghost";
        btnSteps.textContent = "Show steps";
        btnSteps.setAttribute("aria-expanded", "false");

        const steps = document.createElement("div");
        steps.style.display = "none";
        steps.innerHTML = `<ol class="small">${r.steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`;

        btnSteps.addEventListener("click", () => {
          const open = steps.style.display === "block";
          steps.style.display = open ? "none" : "block";
          btnSteps.textContent = open ? "Show steps" : "Hide steps";
          btnSteps.setAttribute("aria-expanded", String(!open));
        });

        const btnCook = document.createElement("button");
        btnCook.className = "btn btn-primary";
        btnCook.textContent = "Cook this";
        btnCook.addEventListener("click", () => {
          alert(`Nice choice! "${r.title}"\n${r.macros.kcal} kcal • ${r.macros.protein}g protein per serving.`);
        });

      const btnFav = document.createElement("button");
btnFav.className = "btn btn-ghost btn-star";
btnFav.innerHTML = favourites.includes(r.id) ? "⭐" : "☆";
btnFav.title = favourites.includes(r.id) ? "Remove from favourites" : "Add to favourites";
btnFav.addEventListener("click", () => {
  if (favourites.includes(r.id)) {
    favourites = favourites.filter(f => f !== r.id);
  } else {
    favourites.push(r.id);
  }
  localStorage.setItem("justcook.favourites", JSON.stringify(favourites));
  renderResults(); // refresh stars
  renderFavouritesList(); // refresh favourites section
});

actions.prepend(btnFav);
actions.append(btnCook, btnSteps);
body.append(ingWrap, actions, steps);

        card.append(img, body);
        elGrid.appendChild(card);
      });
    }
    const elCrForm = byId("custom-form");
const elCrIngredients = byId("cr-ingredients");

if (elCrForm) {
  // Render pantry items as selectable ingredients
  renderCrIngredients();

  // Handle submission
  elCrForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = byId("cr-title").value.trim();
    const steps = byId("cr-steps").value
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
    const kcal = parseInt(byId("cr-kcal").value) || 0;
    const weight = parseInt(byId("cr-weight").value) || 0;
    const diet = byId("cr-diet").value;
   const rawIng = byId("cr-ing").value.trim();
const selected = rawIng
  .split(",")
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

if (!title || selected.length === 0) {
  alert("Please provide a recipe name and at least one ingredient (comma-separated).");
  return;
}

    const newRecipe = {
      id: "user-" + Date.now(),
      title,
      time: 15, // default, you could add a time input later
      diet: diet ? [diet] : [],
      image: IMG_PLACEHOLDER,
      macros: { kcal, protein: 0, carbs: 0, fat: 0, weight },
      ingredients: selected.map(name => ({ name, qty: "to taste" })),
      steps
    };

    customRecipes.push(newRecipe);
    localStorage.setItem("justcook.customRecipes", JSON.stringify(customRecipes));

    alert(`Recipe "${title}" added!`);
    elCrForm.reset();
    renderResults(); // update recipe list with new recipe
  });
}

function renderCrIngredients() {
  if (!elCrIngredients) return;
  elCrIngredients.innerHTML = pantry.length
    ? pantry.map(p =>
        `<label class="me-2 mb-2"><input type="checkbox" value="${escapeHtml(p)}"> ${escapeHtml(p)}</label>`
      ).join("")
    : "<p class='muted'>No ingredients in pantry yet.</p>";
}
const elCrPantry = byId("cr-pantry");
if (elCrPantry) elCrPantry.textContent = pantry.join(", ");
    function renderFavouritesList() {
  const favGrid = byId("fav-grid");
  const favCount = byId("fav-count");
  if (!favGrid) return;

  const favRecipes = RECIPES.filter(r => favourites.includes(r.id));
  favCount.textContent = favRecipes.length;

  if (favRecipes.length === 0) {
    favGrid.innerHTML = "<p class='muted'>No favourites yet — click a star to add one!</p>";
    return;
  }

  favGrid.innerHTML = favRecipes.map(r => `
    <article class="card-recipe small">
      <img src="${r.image}" alt="${escapeHtml(r.title)}"  class="fave-recipe-image" loading="lazy" />
      <div class="card-body col-12">
        <h4>${escapeHtml(r.title)}</h4>
    
      </div>
    </article>
  `).join("");
}

    // ------- Events to refresh results -------
    elBtnFind.addEventListener("click", renderResults);
    ["change","input"].forEach(ev => {
      elTime.addEventListener(ev, renderResults);
      elDiet.addEventListener(ev, renderResults);
      elMiss.addEventListener(ev, renderResults);
    });

    // ------- Helpers -------
    function byId(id){ return document.getElementById(id); }
    function loadPantry(){
      try { return JSON.parse(localStorage.getItem("justcook.pantry") || "[]"); }
      catch { return []; }
    }
    function savePantry(){
      localStorage.setItem("justcook.pantry", JSON.stringify(pantry));
    }
    function escapeHtml(s){
      return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    // Initial render
    elTimeV.textContent = elTime.value;
    renderResults();
renderFavouritesList();
  }
})();
