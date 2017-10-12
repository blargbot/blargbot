const router = require('express').Router();
const moment = require('moment');
const superagent = require('superagent');

class ApiRoute {
    constructor(website) {
        this.website = website;
        this.router = router;
        this.info = { cat: '', tags: {}, commands: {} };
        this.lastTime = { cat: '', tags: '', commands: '' };

        this.tags = {};
        this.commands = {};

        router.get('/catfact', (req, res) => {
            this.getCatFact().then(res.end);
        });

        router.get('/subtags', async (req, res) => {
            console.log('aaa');
            let tags = await this.getInfo('subtags', 'tagList');
            res.end(JSON.stringify(tags));
        });
    }

    async getCatFact() {
        if (this.info.cat === '' || this.lastTime.cat !== moment().format('DDD-HH')) {
            this.lastTime.cat = moment().format('DDD-HH');
            const res = await superagent.get('https://catfact.ninja/fact');
            this.info.cat = res.body.fact;
        }
        return this.info.cat;
    }
    async getInfo(name, code) {
        if (this.info[name] === '' || this.lastTime[name] !== moment().format('DDD-HH')) {
            this.lastTime[name] = moment().format('DDD-HH');

            this.info[name] = await this.website.awaitMessage(code);
        }
        return this.info[name];
    }
}

module.exports = ApiRoute;