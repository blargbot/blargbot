const Router = require('koa-router');
const Security = require('../security');

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

        frontend.app.use(this.router.routes())
            .use(this.router.allowedMethods());
    }
}