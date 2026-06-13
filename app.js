const grid      = document.getElementById("recipes");
const search    = document.getElementById("search");
const detailPanel   = document.getElementById("details");
const detailTitle   = document.getElementById("detailTitle");
const detailContent = document.getElementById("detailContent");
const closeBtn      = document.getElementById("closeBtn");

let recipes = [];
let meal = "all";
let pref = "all";


/* ── Dietary classification ── */

const MEAT_KEYWORDS = [
  "chicken", "beef", "pork", "sausage", "turkey", "bacon", "ham", "lamb",
  "veal", "duck", "salmon", "tuna", "shrimp", "crab", "lobster", "anchovy",
  "anchovies", "prosciutto", "pancetta", "pepperoni", "salami", "lard",
  "gelatin", "meat", "fish", "seafood"
];

const ANIMAL_KEYWORDS = [
  ...MEAT_KEYWORDS,
  "egg", "eggs", "milk", "butter", "cream", "cheese", "yogurt",
  "honey", "whey", "half-and-half", "half and half", "mozzarella",
  "parmesan", "pecorino", "cheddar", "cream cheese"
];

function getPref(recipe) {
  const ingredients = (recipe.ingredients || []).join(" ").toLowerCase();
  const hasMeat   = MEAT_KEYWORDS.some(k => ingredients.includes(k));
  const hasAnimal = ANIMAL_KEYWORDS.some(k => ingredients.includes(k));
  if (!hasMeat && !hasAnimal) return "vegan";
  if (!hasMeat) return "vegetarian";
  return "none";
}


/* ── Helpers ── */

function getMeals(recipe) {
  const m = recipe.meal;
  if (!m) return [];
  return Array.isArray(m) ? m.map(v => v.toLowerCase()) : [m.toLowerCase()];
}

function buildCard(recipe) {
  const card = document.createElement("article");
  card.className = "card";

  card.dataset.title    = (recipe.title || "").toLowerCase();
  card.dataset.meal     = getMeals(recipe).join(",");
  card.dataset.pref     = getPref(recipe);
  card.dataset.keywords = (
    (recipe.title || "") + " " +
    (recipe.ingredients || []).join(" ") + " " +
    (recipe.steps || []).join(" ")
  ).toLowerCase();

  if (recipe.image) {
    const img = document.createElement("img");
    img.src = recipe.image;
    img.alt = recipe.title || "";
    card.appendChild(img);
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const h2 = document.createElement("h2");
  h2.textContent = recipe.title || "Untitled";

  body.appendChild(h2);
  card.appendChild(body);
  return card;
}


/* ── Rendering ── */

function renderFeatured(allRecipes) {
  const featuredGrid = document.getElementById("featured");
  if (!featuredGrid) return;

  // One recipe per meal category, up to 3
  const seen  = new Set();
  const picks = [];

  for (const recipe of allRecipes) {
    const category = getMeals(recipe)[0] || "other";
    if (!seen.has(category)) {
      seen.add(category);
      picks.push(recipe);
    }
    if (picks.length === 3) break;
  }

  featuredGrid.innerHTML = "";
  picks.forEach(recipe => {
    const card = buildCard(recipe);
    card.classList.add("featured-card");
    featuredGrid.appendChild(card);
  });
}

async function loadRecipes() {
  if (grid) grid.innerHTML = "";

  try {
    const response = await fetch("recipes.json");
    const data     = await response.json();

    recipes = data.recipes || [];

    renderFeatured(recipes);

    if (grid) {
      recipes.forEach(recipe => grid.appendChild(buildCard(recipe)));
    }

  } catch (err) {
    console.error("Failed to load recipes:", err);
  }
}


/* ── Filtering ── */

function filterRecipes() {
  if (!search) return;
  const q = search.value.toLowerCase();

  document.querySelectorAll(".card").forEach(card => {
    const cardMeals = card.dataset.meal ? card.dataset.meal.split(",") : [];

    const prefMatch =
      pref === "all" ||
      pref === card.dataset.pref ||
      (pref === "vegetarian" && card.dataset.pref === "vegan");

    const show =
      card.dataset.title.includes(q) &&
      (meal === "all" || cardMeals.includes(meal)) &&
      prefMatch;

    card.style.display = show ? "" : "none";
  });
}

if (search) search.oninput = filterRecipes;

document.querySelectorAll(".top-meal-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".top-meal-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    meal = btn.dataset.meal || "all";
    filterRecipes();
  };
});

document.querySelectorAll(".top-pref-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".top-pref-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    pref = btn.dataset.pref || "all";
    filterRecipes();
  };
});


/* ── Detail popup ── */

function openDetail(recipe) {
  if (!detailTitle || !detailContent || !detailPanel) return;

  detailTitle.textContent = recipe.title;

  detailContent.innerHTML = `
    <div class="meta">${recipe.meta || ""}</div>

    <h3>Ingredients</h3>
    <ul>
      ${(recipe.ingredients || []).map(i => `<li>${i}</li>`).join("")}
    </ul>

    <h3>Directions</h3>
    <ol>
      ${(recipe.steps || []).map(s => `<li>${s}</li>`).join("")}
    </ol>
  `;

  detailPanel.classList.add("open");
}

document.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (!card) return;

  const recipe = recipes.find(r => (r.title || "").toLowerCase() === card.dataset.title);
  if (recipe) openDetail(recipe);
});

if (closeBtn) {
  closeBtn.onclick = () => detailPanel.classList.remove("open");
}


/* ── Init ── */

loadRecipes();