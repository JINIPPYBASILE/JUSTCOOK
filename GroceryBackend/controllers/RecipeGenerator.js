require('dotenv').config();
const axios = require('axios');

class RecipeGenerator {
    constructor(ingredients) {
        this.ingredients = ingredients;
    }

    async getRecipes() {
        // Prompt for OpenAI
        let prompt = `You are a recipe assistant. 
        Given these ingredients: ${this.ingredients.join(", ")}, 
        generate 3 recipes I could make. 

        Return ONLY a valid JSON array in the following format:

        [
            {
                "title": "Recipe Name",
                "ingredients": ["ingredient1", "ingredient2", ...],
                "instructions": "Step by step instructions here."
            }
        ]

        Do not include any extra text, explanations, or markdown formatting. Only return JSON.`;

        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-4o", // you can also try "gpt-4o-mini" if you want cheaper calls
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 600
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            let content = response.data.choices[0].message.content;
            console.log('Raw OpenAI Response:', content);

            // Remove any ```json code blocks just in case
            content = content.replace(/```json|```/g, '').trim();

            // Parse the JSON response into a JS object
            const recipes = JSON.parse(content);
            console.log('Generated Recipes:', recipes);

            return recipes;
        } catch (error) {
            console.error(
                'Error generating or parsing recipes from OpenAI:',
                error.response?.data || error.message
            );
            return null;
        }
    }
}

module.exports = RecipeGenerator;