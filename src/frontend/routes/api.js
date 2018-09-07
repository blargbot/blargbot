const Router = require('koa-router');
const Security = require('../security');
const argumentFactory = require('../../structures/ArgumentFactory');
const bbtag = require('../../core/bbtag');

module.exports = class ApiRoute {
    constructor(frontend) {
        let router = this.router = new Router({
            prefix: '/api'
        });

        router.get('/', async (ctx, next) => {
            ctx.body = 'Hello, world!';
        });

        router.get('/authenticate', async (ctx, next) => {
            console.log(ctx.req.user);
            ctx.body = 'ok';
        });

        router.get('/users/@me', async (ctx, next) => {
            let id = Security.validateToken(ctx.req.headers.authorization);

        });

        this.commands = {};
        this.subtags = {};
        this.refreshContent();
        this.rInterval = setInterval(this.refreshContent.bind(this), 1000 * 60 * 10);

        router.get('/commands', async (ctx, next) => {
            ctx.body = JSON.stringify(this.commands);
        });

        router.get('/subtags', async (ctx, next) => {
            ctx.body = JSON.stringify(this.subtags);
        });

        frontend.app.use(this.router.routes())
            .use(this.router.allowedMethods());
    }

    async refreshContent() {
        let shard = spawner.shards.get(0);
        let t = await shard.awaitMessage('tagList');
        let st = JSON.parse(t.message);
        for (const key in st) {
            let subtag = st[key];
            subtag.usage = argumentFactory.toString(subtag.args);

            let category = bu.TagType.properties[subtag.category];
            if (!this.subtags[category.name]) this.subtags[category.name] = {
                name: category.name,
                desc: category.desc,
                id: subtag.category,
                el: []
            };;
            subtag.limits = [];
            for (const key of Object.keys(bbtag.limits)) {
                let text = bbtag.limitToSring(key, subtag.name);
                if (text) {
                    subtag.limits.push({
                        type: bbtag.limits[key].instance._name, text: text
                    });
                }
            }

            this.subtags[category.name].el.push(subtag);
        }
        for (const value of Object.values(this.subtags)) {
            value.el.sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
        }

        let c = await shard.awaitMessage('commandList');
        let co = JSON.parse(c.message);
        this.commands = {};
        for (const key in co) {
            let command = co[key];
            if (command.category === bu.CommandType.CAT) continue;
            let category = bu.CommandType.properties[command.category];
            if (!this.commands[category.name]) this.commands[category.name] = {
                name: category.name,
                desc: category.description,
                id: command.category,
                el: []
            };
            this.commands[category.name].el.push(command);
        }
        for (const value of Object.values(this.commands)) {
            value.el.sort((a, b) => a.key > b.key ? 1 : a.key < b.key ? -1 : 0);
        }
    }
}