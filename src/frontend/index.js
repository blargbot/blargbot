const Koa = require('koa');
const Router = require('koa-router');
const { Nuxt, Builder } = require('nuxt');
const config = require('../../config.json');

module.exports = class Frontend {
    constructor(client) {
        this.client = client;

        this.app = new Koa();
        this.router = new Router();

        let conf = require('../../nuxt.config.js');
        conf.dev = config.general.isbeta === true;
        this.nuxt = new Nuxt(conf);
        if (conf.dev) {
            const builder = new Builder(this.nuxt);
            builder.build();
        }

        const ApiRoute = require('./routes/api');
        new ApiRoute(this);

        this.app.use((ctx, next) => {
            if (!ctx.path.startsWith('/api'))
                return new Promise((resolve, reject) => {
                    ctx.res.on('close', resolve);
                    ctx.res.on('finish', resolve);

                    this.nuxt.render(ctx.req, ctx.res, promise => {
                        promise.then(resolve).catch(reject)
                    });
                });
        });

        this.app.listen(8085);
        console.website('Listening on port', 8085);
    }
}