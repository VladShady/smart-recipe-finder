const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running. API is ready.');
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await pool.query(
      'SELECT DISTINCT description FROM recipes WHERE description IS NOT NULL ORDER BY description'
    );
    res.json(categories.rows.map(row => row.description));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/api/ingredients', async (req, res) => {
  try {
    const allIngredients = await pool.query('SELECT * FROM ingredients');
    res.json(allIngredients.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

const STAPLES = ['%water%', '%salt%', '%oil%', '%sugar%', '%pepper%', '%flour%'];

app.post('/api/recipes/search', async (req, res) => {
  try {
    const { ingredientIds, category, maxTime } = req.body;
    
    if (!ingredientIds || ingredientIds.length === 0) return res.json([]);

    const query = `
      WITH recipe_stats AS (
        SELECT 
          r.id,
          COUNT(ri.ingredient_id) FILTER (
            WHERE i.name NOT ILIKE ANY($2)
          ) as essential_total,
          COUNT(ri.ingredient_id) FILTER (
            WHERE ri.ingredient_id = ANY($1) 
            AND i.name NOT ILIKE ANY($2)
          ) as essential_match
        FROM recipes r
        JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        JOIN ingredients i ON ri.ingredient_id = i.id
        GROUP BY r.id
      )
      SELECT 
        r.id, 
        r.title, 
        r.time_minutes, 
        r.description, 
        r.image_url, 
        r.instructions,
        rs.essential_total,
        rs.essential_match,
        (rs.essential_total - rs.essential_match) as missing_count,
        array_agg(ri.quantity || ' ' || i.name) as ingredients_list
      FROM recipes r
      JOIN recipe_stats rs ON r.id = rs.id
      JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE rs.essential_match > 0 
      AND ($3::text IS NULL OR r.description = $3)
      AND ($4::int IS NULL OR r.time_minutes <= $4)
      GROUP BY 
        r.id, r.title, r.time_minutes, r.description, r.image_url, r.instructions,
        rs.essential_total, rs.essential_match
      ORDER BY missing_count ASC, essential_match DESC
      LIMIT 50;
    `;

    const result = await pool.query(query, [
      ingredientIds, 
      STAPLES, 
      category || null,
      maxTime || null
    ]);
    
    res.json(result.rows);
  } catch (err) {
    console.error("SQL Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories/available', async (req, res) => {
  try {
    const { ingredientIds } = req.body;
    
    if (!ingredientIds || ingredientIds.length === 0) {
      return res.json([]);
    }

    const query = `
      SELECT DISTINCT r.description as category
      FROM recipes r
      JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      WHERE ri.ingredient_id = ANY($1)
      AND r.description IS NOT NULL
      ORDER BY r.description
    `;

    const result = await pool.query(query, [ingredientIds]);
    res.json(result.rows.map(row => row.category));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/api/ingredients/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);
    const result = await pool.query(
      "SELECT * FROM ingredients WHERE name ILIKE $1 LIMIT 10", 
      [`%${query}%`] 
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- НОВИЙ МАРШРУТ: Популярні (випадкові) рецепти ---
app.get('/api/recipes/popular', async (req, res) => {
  try {
    const query = `
      SELECT id, title, time_minutes, description, image_url 
      FROM recipes 
      WHERE image_url IS NOT NULL
      ORDER BY RANDOM() 
      LIMIT 6;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Отримуємо рецепт (тепер витягуємо і ai_instructions)
    const query = `
      SELECT r.id, r.title, r.time_minutes, r.description, r.image_url, r.instructions, r.youtube_url, r.ai_instructions,
             array_agg(ri.quantity || ' ' || i.name) as ingredients_list
      FROM recipes r
      JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE r.id = $1
      GROUP BY r.id
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    let recipe = result.rows[0];

    // 2. ЛОГІКА ШІ: Якщо в базі ще немає розбитих кроків (ai_instructions = null)
    if (!recipe.ai_instructions && process.env.GEMINI_API_KEY) {
      try {
        console.log(`[AI] Форматуємо інструкції для рецепту ${id}...`);
        
        // Викликаємо ШІ
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Промпт (завдання для ШІ): просимо повернути тільки чистий JSON масив
        const prompt = `
          Analyze the following cooking instructions and break them down into a logical step-by-step array of strings. 
          Remove any existing step numbers (like "1.", "Step 2:").
          Make each step clear and concise.
          Return ONLY a valid JSON array of strings, without any markdown formatting like \`\`\`json.
          
          Instructions to process:
          ${recipe.instructions}
        `;

        const aiResponse = await model.generateContent(prompt);
        let aiText = aiResponse.response.text().trim();
        
        // Очищаємо від можливих маркдаун-тегів (якщо ШІ все ж таки їх додасть)
        if (aiText.startsWith('```json')) aiText = aiText.replace(/```json/g, '');
        if (aiText.startsWith('```')) aiText = aiText.replace(/```/g, '');
        
        const structuredSteps = JSON.parse(aiText.trim());

        // 3. Зберігаємо результат в БД, щоб наступного разу не чекати!
        await pool.query(
          "UPDATE recipes SET ai_instructions = $1 WHERE id = $2",
          [JSON.stringify(structuredSteps), id]
        );

        // Оновлюємо поточний об'єкт рецепту для фронтенду
        recipe.ai_instructions = structuredSteps;
        console.log(`[AI] Успішно збережено для ${id}`);

      } catch (aiError) {
        console.error("[AI Error]:", aiError.message);
        // Якщо ШІ впав, ми нічого не ламаємо, просто віддаємо старий суцільний текст
      }
    }

    res.json(recipe);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});