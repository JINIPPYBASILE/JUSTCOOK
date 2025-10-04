// Load the RecipeGenerator class
const RecipeGenerator = require('./RecipeGenerator');

// Test function
async function run() {
    // Example ingredients (you can change these)
    const ingredients = [
        "chicken breast",
        "broccoli",
        "garlic",
        "olive oil",
        "rice"
    ];

    // Create a new instance of the RecipeGenerator
    const generator = new RecipeGenerator(ingredients);

    console.log("🔹 Requesting recipes from OpenAI...");
    
    // Generate the recipes
    const recipes = await generator.getRecipes();

    // Log the results
    console.log("\n🍽️ Generated Recipes:\n");
    console.log(JSON.stringify(recipes, null, 2));
}

// Run the test
run();
