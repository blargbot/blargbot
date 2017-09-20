const router = require('express').Router();
const superagent = require('superagent');
const moment = require('moment');

async function render(req, res, view, data = {}, vue = {}) {
    data.fact = await getCatFact();
    if (req.isAuthenticated()) {
        data.user = req.user;
        data.user.guilds.map(g => {
            g.iconURL = `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`;
        });
    } else data.user = false;
    req.session.returnTo = req.path;
    return res.renderVue(view, data, vue);
}

async function authenticate(req, res) {
    req.session.returnTo = req.path;
    if (req.isAuthenticated())
        return true;
    res.redirect('/login');
    return false;
}

router.get('/', async (req, res, next) => {
    render(req, res, 'main');
});

router.get('/userinfo', async (req, res) => {
    if (!authenticate(req, res)) return;
    render(req, res, 'userinfo');
});


let fact = '';
let lastTime = '';
async function getCatFact() {
    if (fact === '' || lastTime !== moment().format('DDD-HH')) {
        lastTime = moment().format('DDD-HH');
        const res = await superagent.get('https://catfact.ninja/fact');
        fact = res.body.fact;
    }
    return fact;
}

module.exports = router;