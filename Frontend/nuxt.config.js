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
                    }, {
                        name: 'BBTag', path: '/bbtag/:name?',
                        component: resolve(__dirname, 'renders/bbtag/index.vue')
                    }, {
                        name: 'Commands', path: '/commands/:name?',
                        component: resolve(__dirname, 'renders/commands.vue')
                    }, {
                        name: 'Escaper', path: '/escaper',
                        component: resolve(__dirname, 'renders/escape.vue')
                    }, {
                        name: 'Embeds', path: '/embeds',
                        component: resolve(__dirname, 'renders/embeds.vue')
                    }, {
                        name: 'V1Escaper', path: '/v1escaper',
                        component: resolve(__dirname, 'renders/v1escaper.vue')
                    }, {
                        name: 'SubTags', path: '/subtags/:name?',
                        component: resolve(__dirname, 'renders/subtags.vue')
                    }, {
                        name: 'Dashboard', path: '/dashboard/',
                        component: resolve(__dirname, 'renders/dashboard/index.vue'),
                        children: [
                            {
                                name: 'User Settings',
                                path: 'user',
                                component: resolve(__dirname, 'renders/dashboard/user/index.vue')
                            },
                            {
                                name: 'Guild Settings',
                                path: 'guild/:id?',
                                component: resolve(__dirname, 'renders/dashboard/guild/index.vue'),
                                children: [
                                    {
                                        name: 'General Guild Settings', path: 'general',
                                        component: resolve(__dirname, 'renders/dashboard/guild/general.vue')
                                    }
                                ]
                            }
                        ]
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
            { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
            { rel: 'shortcut icon', type: 'image/png', href: '/img/favicon.png' }
        ]
    }
};