const express = require('express');
const pool = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const STAPLES = ['%water%', '%salt%', '%oil%', '%sugar%', '%pepper%', '%flour%'];
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
let popularCache = { data: null, timestamp: 0 };

router.post('/search', async (req, res) => {
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
      AND (rs.essential_total - rs.essential_match) <= 3
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

router.get('/popular', async (req, res) => {
  try {
    const now = Date.now();

    if (popularCache.data && (now - popularCache.timestamp < CACHE_DURATION)) {
      return res.json(popularCache.data);
    }

    const query = `
      SELECT id, title, time_minutes, description, image_url 
      FROM recipes 
      WHERE image_url IS NOT NULL
      ORDER BY RANDOM() 
      LIMIT 6;
    `;
    const result = await pool.query(query);
    
    popularCache = { data: result.rows, timestamp: now };
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT r.id, r.title, r.time_minutes, r.description, r.image_url, r.instructions, r.youtube_url, r.ai_instructions,
             array_agg(ri.quantity || ' ' || i.name) as ingredients_list,
             array_agg(i.name) as ingredient_names
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get('/:id/ai-instructions', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query("SELECT instructions, ai_instructions FROM recipes WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Recipe not found" });
    
    const recipe = result.rows[0];

    if (recipe.ai_instructions) {
      return res.json({ ai_instructions: recipe.ai_instructions });
    }

    if (process.env.GEMINI_API_KEY) {
        console.log(`Formatting instructions in background for recipe ${id}...`);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `
          Analyze the following cooking instructions and format them into a logical, comprehensive, and sequential array of steps.
          Rules:
          1. Combine alternative methods or substitute ingredients into a single logical step (e.g., if it says "Bake for 10 mins. Alternatively, microwave for 2 mins", keep that as one single step).
          2. Make each step a complete, actionable instruction. Keep the flow chronological.
          3. Remove any existing step numbers (like "1.", "Step 2:").
          Return ONLY a valid JSON array of strings, without any markdown formatting.
          Instructions to process: ${recipe.instructions}
        `;

        const aiResponse = await model.generateContent(prompt);
        let aiText = aiResponse.response.text().trim();
      
      if (aiText.startsWith('```json')) aiText = aiText.replace(/```json/g, '');
      if (aiText.startsWith('```')) aiText = aiText.replace(/```/g, '');
      
      const structuredSteps = JSON.parse(aiText.trim());

      await pool.query("UPDATE recipes SET ai_instructions = $1 WHERE id = $2", [JSON.stringify(structuredSteps), id]);

      return res.json({ ai_instructions: structuredSteps });
    } else {
      res.status(400).json({ message: "API key is missing" });
    }
  } catch (err) {
    console.error("[AI Error]:", err.message);
    res.status(500).send("AI Generation Failed");
  }
});

module.exports = router;