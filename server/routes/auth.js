const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [email]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(401).json({ error: "User already exists" });
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, bcryptPassword]
    );

    const jwtToken = jwt.sign(
      { user: newUser.rows[0].id },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    res.json({ 
      token: jwtToken, 
      user: { 
        id: newUser.rows[0].id, 
        email: newUser.rows[0].email 
      } 
    });

  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const jwtToken = jwt.sign(
      { user: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;