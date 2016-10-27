const express = require('express');
const router = express.Router();
const path = require('path');
const hbs = require('hbs');
const sidebar = require('../sidebar');
//const r = require('../../util/rethink');
var meow = '<p>meow</p>';

hbs.registerHelper('sidebar', function(text, url) {
    return sidebar.render();
});

router.get('/', (req, res) => {
    res.render('index');
});
/*
router.get('/help', async (req, res) => {
  res.locals.commands = await r.raw.db('google').table('commands').run();
  res.render('help');
});

router.get('/logout', (req, res) => {
  res.redirect('/panel/logout');
});

router.get('/login', (req, res) => {
  res.redirect('/panel/login');
});
*/
module.exports = router;