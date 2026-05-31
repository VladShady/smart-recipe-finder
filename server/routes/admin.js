const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/format-ingredients', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); 

    // Re-link recipe associations to the root singular ingredient ID
    await client.query(`
      UPDATE recipe_ingredients
      SET ingredient_id = subquery.min_id
      FROM (
        SELECT MIN(id) as min_id, REGEXP_REPLACE(LOWER(TRIM(name)), 's$', '') as base_name
        FROM ingredients
        GROUP BY REGEXP_REPLACE(LOWER(TRIM(name)), 's$', '')
      ) AS subquery
      JOIN ingredients i ON REGEXP_REPLACE(LOWER(TRIM(i.name)), 's$', '') = subquery.base_name
      WHERE recipe_ingredients.ingredient_id = i.id
        AND i.id != subquery.min_id;
    `);

    // Purge orphaned plural records
    const deleteResult = await client.query(`
      DELETE FROM ingredients
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM ingredients
        GROUP BY REGEXP_REPLACE(LOWER(TRIM(name)), 's$', '')
      );
    `);

    // Enforce consistent capitalization
    await client.query(`
      UPDATE ingredients
      SET name = INITCAP(TRIM(name));
    `);

    await client.query('COMMIT'); 
    res.send(`Done! Removed ${deleteResult.rowCount} duplicates. All ingredients updated to Title Case.`);
  } catch (err) {
    await client.query('ROLLBACK'); 
    console.error(err.message);
    res.status(500).send("Formatting Error: " + err.message);
  } finally {
    client.release();
  }
});

module.exports = router;