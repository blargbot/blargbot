const conf = require('../config.json');

module.exports = {
    dev: conf.beta,
    srcDir: 'Frontend/',
    build: {
        vendor: ['vue-i18n', 'axios'],
        extractCSS: true
    },
    css: [
        '@/public/scss/materialize.scss',
        '@/public/scss/style.scss'
    ],
    router: {
        middleware: 'i18n',
        extendRoutes(routes, resolve) {
            routes.push({
                path: '/',
                component: resolve(__dirname, 'renders/wrapper.vue'),
                children: [
                    {
                        name: 'blargbot', path: '/',
                        component: resolve(__dirname, 'renders/index.vue')
                    },
                    {
                        name: 'BBTag', path: '/bbtag',
                        component: resolve(__dirname, 'renders/wrapper.vue'),
                        children: [{
                            name: 'SubTags', path: '/bbtag/subtags',
                            component: resolve(__dirname, 'renders/bbtag/subtags.vue')
                        }, {
                            name: 'Docs', path: '/bbtag',
                            component: resolve(__dirname, 'renders/bbtag/index.vue')
                        }]
                    }, {
                        name: 'Commands', path: '/commands',
                        component: resolve(__dirname, 'renders/commands.vue')
                    }, {
                        name: 'Escaper', path: '/escaper',
                        component: resolve(__dirname, 'renders/escape.vue')
                    }
                ]
            });
        }
    },
    plugins: ['~/plugins/i18n.js', 'vue-markdown'],
    head: {
        meta: [{
            name: 'viewport',
            content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        }],
        script: [
            { src: 'https://code.jquery.com/jquery-3.2.1.min.js' },
            { src: '/js/materialize.min.js' }
        ],
        link: [
            { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' }
        ]
    }
};