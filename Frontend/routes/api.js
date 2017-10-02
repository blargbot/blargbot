const router = require('express').Router();
const moment = require('moment');
const superagent = require('superagent');

router.get('/catfact', (req, res) => {
    getCatFact().then(res.end);
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