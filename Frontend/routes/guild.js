const router = require('express').Router();
const moment = require('moment');
const superagent = require('superagent');
const path = require('path');

class GuildApiRoute {
    constructor(website) {
        this.website = website;
        this.router = router;

        router.get('/settings/:id', async (req, res) => {
            if (!req.user) {
                res.end(JSON.stringify({ error: '400', message: 'No user specified.' }));
            } else {
                let storedUser = website.models.User.find({ where: { 'userId': req.user.id } });
                let output = {};
                let keys = ['locale', 'dmErrors', 'prefixes'];
                for (const key of keys)
                    output[key] = await storedUser.get(key);
                res.end(JSON.stringify(output));
            }
        });
        router.post('/settings', async (req, res) => {
            console.log(req.user, req.body);
            res.end('no');
        });
    }
}

module.exports = GuildApiRoute;