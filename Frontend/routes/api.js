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
        this.info = { cat: '', subtags: {}, commands: {} };
        this.lastTime = { cat: '', tags: '', commands: '' };
        setTimeout(() => {
            this.getCatFact();
            this.getInfo('subtags', 'tagList');
            this.getInfo('commands', 'commandList');

        }, 1000);
        setInterval(this.getCatFact.bind(this), 60 * 1000);
        setInterval(this.getInfo.bind(this), 15 * 60 * 1000, 'subtags', 'tagList');
        setInterval(this.getInfo.bind(this), 15 * 60 * 1000, 'commands', 'commandList');

        this.tags = {};
        this.commands = {};

        router.get('/catfact', (req, res) => {
            res.end(this.info.cat);
        });
        router.use('/user', new (require('./user'))(this.website).router);

        router.get('/subtags', async (req, res) => {
            let tags = await this.getInfo('subtags', 'tagList');
            res.end(JSON.stringify(this.info.subtags));
        });
        router.get('/commands', async (req, res) => {
            let tags = await this.getInfo('commands', 'commandList');
            res.end(JSON.stringify(this.info.commands));
        });
        router.get('/poem', async (req, res) => {
            let names = ['monika', 'sayori', 'yuri', 'natsuki'];
            let name = '';
            if (req.query.name && typeof req.query.name === 'string' && names.includes(req.query.name.toLowerCase()))
                name = req.query.name.toLowerCase();
            else name = 'monika';
            let content = req.query.text;
            if (req.query.base64 !== undefined) {
                content = Buffer.from(content, 'base64').toString();
            }
            let poem = await getImage('poem', { text: content || 'Just Monika.', name, yuri: req.query.yuri });
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
        this.info[name] = await this.website.awaitMessage(code);
    }
}

module.exports = ApiRoute;