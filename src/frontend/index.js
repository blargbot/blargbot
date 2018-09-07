const Koa = require('koa');
const Router = require('koa-router');
const { Nuxt, Builder } = require('nuxt');
const config = require('../../config.json');
const bodyParser = require('koa-bodyparser');

module.exports = class Frontend {
    constructor(client) {
        this.client = client;

        this.app = new Koa();
        this.router = new Router();

        let conf = require('../../nuxt.config.js');
        conf.dev = config.general.isbeta === true;
        this.nuxt = new Nuxt(conf);
        if (this.nuxt.options.dev) {
            new Builder(this.nuxt).build();
        }
        this.app.use(bodyParser());

        const ApiRoute = require('./routes/api');
        new ApiRoute(this);

        this.app.use(async (ctx, next) => {
            ctx.status = 200;
            if (!ctx.path.startsWith('/api'))
                return await (new Promise((resolve, reject) => {
                    ctx.res.on('close', resolve);
                    ctx.res.on('finish', resolve);

                    this.nuxt.render(ctx.req, ctx.res, promise => {
                        promise.then(resolve).catch(reject)
                    });
                }))
        });

        this._server = this.app.listen(8086);
        console.website('NEW SITE Listening on port', 8086);
    }

    stop() {
        return new Promise(res => {
            this.nuxt.close(() => {
                console.website('New site:nuxt is down.');
                this._server.close(() => {
                    console.website('New site is down.');
                    res();
                });
            });
        });
    }
}