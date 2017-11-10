const router = require('express').Router();
const moment = require('moment');
const superagent = require('superagent');
const childProcess = require('child_process');
const path = require('path');

function getImage(name, args) {
    return new Promise((res, rej) => {
        let env = {
            IMAGE_TYPE: name,
            IMAGE_ARGS: JSON.stringify(args),
            DESTINATION: 'api'
        };

        let cp = childProcess.fork(path.join(__dirname, '..', '..', 'Core', 'Image', 'index.js'), [], {
            env
        });

        cp.on('message', (msg) => {
            res(msg);
        });
    });

}

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
            let tags = await this.getInfo('subtags', 'tagList');
            res.end(JSON.stringify(tags));
        });
        router.get('/commands', async (req, res) => {
            let tags = await this.getInfo('commands', 'commandList');
            res.end(JSON.stringify(tags));
        });
        router.post('/poem', async (req, res) => {
            let names = ['monika', 'sayori', 'yuri', 'natsuki'];
            let name = '';
            if (req.body.name && typeof req.body.name === 'string' && names.includes(req.body.name.toLowerCase()))
                name = req.body.name.toLowerCase();
            else name = 'monika';
            let poem = await getImage('poem', { text: req.body.text || 'Just Monika.', name, yuri: req.body.yuri });
            res.set('Content-Type', 'image/png');
            res.send(new Buffer.from(poem, 'base64'));
        });
        router.get('/poem', async (req, res) => {
            let names = ['monika', 'sayori', 'yuri', 'natsuki'];
            let name = '';
            if (req.query.name && typeof req.query.name === 'string' && names.includes(req.query.name.toLowerCase()))
                name = req.query.name.toLowerCase();
            else name = 'monika';
            let poem = await getImage('poem', { text: req.query.text || 'Just Monika.', name, yuri: req.query.yuri });
            res.set('Content-Type', 'image/png');
            res.send(new Buffer.from(poem, 'base64'));
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