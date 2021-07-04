/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:20:10
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-10-18 09:25:39
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const router = require('express').Router();

async function getDomains() {
    await spawner.recacheDomains();
    let cache = spawner.domainCache;

    let domains = [];
    for (const key in cache) {
        if (cache[key]) {
            let arr = key.split('.');
            let subdomain = '';
            if (arr.length > 2) subdomain = arr.shift() + '.';
            domains.push([subdomain, arr.join('.')]);
        }
    }
    domains.sort((a, b) => {
        return a[1].localeCompare(b[1]);
    });

    return domains;
}

router.get('/json', async function (req, res) {
    let domains = await getDomains();
    domains = domains.map(e => e.join(''));

    res.type('json');
    res.send(JSON.stringify(domains, null, 2));
});

router.get('/', async function (req, res) {
    res.locals.domains = await getDomains();

    res.render('domains');
});
module.exports = router;
