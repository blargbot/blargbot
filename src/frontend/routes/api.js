const Router = require('koa-router');

module.exports = class ApiRoute {
    constructor(frontend) {
        let router = this.router = new Router({
            prefix: '/api'
        });

        router.get('/', async (ctx, next) => {
            ctx.body = 'Hello, world!';
        })

        frontend.app.use(this.router.routes())
            .use(this.router.allowedMethods());
    }
}