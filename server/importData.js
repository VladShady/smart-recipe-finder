const axios = require('axios');
const pool = require('./db');

const LETTERS_TO_IMPORT = ['a', 'b', 'c', 'e', 'p', 's'];

function estimateCookingTime(category) {
  const randomTime = (min, max) => {
    const time = Math.floor(Math.random() * (max - min + 1) + min);
    return Math.ceil(time / 5) * 5;
  };

  if (!category) return 30;

  const cat = category.toLowerCase();

  if (['beef', 'lamb', 'pork'].includes(cat)) return randomTime(60, 120);
  if (['chicken', 'turkey'].includes(cat)) return randomTime(40, 75);
  if (['pasta', 'seafood', 'starter', 'breakfast'].includes(cat)) return randomTime(15, 35);
  if (['dessert', 'cake'].includes(cat)) return randomTime(30, 90);

  return randomTime(20, 50);
}

async function fetchAndSave() {
  console.log("Starting import with time generation and video links...");
  let client = await pool.connect();

  try {
    for (const letter of LETTERS_TO_IMPORT) {
      console.log(`Loading letter "${letter}"...`);

      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
      const meals = response.data.meals;

      if (!meals) continue;

      for (const meal of meals) {
        const time = estimateCookingTime(meal.strCategory);

        // --- ОНОВЛЕНО: Тепер ми додаємо youtube_url ---
        const recipeRes = await client.query(
          `INSERT INTO recipes (title, description, instructions, time_minutes, image_url, youtube_url) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            meal.strMeal,
            meal.strCategory,
            meal.strInstructions,
            time,
            meal.strMealThumb,
            meal.strYoutube || null // Якщо відео немає, запишемо NULL
          ]
        );
        const recipeId = recipeRes.rows[0].id;

        for (let i = 1; i <= 20; i++) {
          const ingredientName = meal[`strIngredient${i}`];
          const measure = meal[`strMeasure${i}`];

          if (!ingredientName || ingredientName.trim() === "") break;

          const cleanName = ingredientName.trim();
          const cleanMeasure = measure ? measure.trim() : "For serving";

          let ingRes = await client.query("SELECT id FROM ingredients WHERE name = $1", [cleanName]);
          let ingredientId;

          if (ingRes.rows.length > 0) {
            ingredientId = ingRes.rows[0].id;
          } else {
            const newIng = await client.query("INSERT INTO ingredients (name) VALUES ($1) RETURNING id", [cleanName]);
            ingredientId = newIng.rows[0].id;
          }

          await client.query(
            "INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)",
            [recipeId, ingredientId, cleanMeasure]
          );
        }
        console.log(`[${time} min] ${meal.strMeal} (Video: ${meal.strYoutube ? 'Yes' : 'No'})`);
      }
    }
    console.log("Import finished successfully!");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    process.exit();
  }
}

fetchAndSave();