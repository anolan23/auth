const express = require('express');
const db = require('../db');
const { compare, hash } = require('bcrypt');
const cookie = require('cookie');
const { sign } = require('jsonwebtoken');

const router = express.Router();

router.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const saltRounds = 11;
    const hashed = await hash(password, saltRounds);
    const { rows } = await db.query(
      `
        INSERT INTO users(email, password)
        VALUES ($1, $2)
        RETURNING *
          `,
      [email, hashed]
    );
    const [user] = rows;
    const claims = {
      sub: user.id,
    };
    const jwt = sign(claims, 'pebbles', {
      expiresIn: '144h',
    });
    res.setHeader(
      'Set-Cookie',
      cookie.serialize('auth', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 360000,
        path: '/',
      })
    );

    res.send(user);
  } catch (error) {
    res.status(error.status || 500).send({ error: error.message });
  }
});

router.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await db.query(
      `
        SELECT *
        FROM users
        WHERE email = $1
          `,
      [email]
    );
    const [user] = rows;

    //user not found
    if (!user) {
      res.status(401).send({ status: false, message: 'User not found' });
    }

    const isValid = await compare(password, user.password);
    //user exists and passwords match
    if (isValid) {
      const claims = {
        sub: user.id,
      };
      const jwt = sign(claims, 'pebbles', {
        expiresIn: '144h',
      });
      res.setHeader(
        'Set-Cookie',
        cookie.serialize('auth', jwt, {
          httpOnly: true,
          secure: process.env.NODE_ENV !== 'development',
          sameSite: 'strict',
          maxAge: 360000,
          path: '/',
        })
      );
      res.send(user);
    } else {
      res.status(401).send({ status: false, message: 'Invalid password' });
    }
  } catch (error) {
    res.status(error.status || 500).send({ error: error.message });
  }
});

module.exports = router;
