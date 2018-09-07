const config = require('./config.json');

module.exports = {
    srcDir: 'app',
    /*
    ** Headers of the page
    */
    head: {
        title: 'blargbot',
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { hid: 'description', name: 'description', content: 'A multipurpose discord bot, designed to be customized.' }
        ],
        link: [
            { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
        ],
        script: [
            { src: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js', body: true },
            { src: 'https://unpkg.com/eventemitter3@latest/umd/eventemitter3.min.js', body: true }
        ]
    },
    env: {
        beta: config.general.isbeta
    },

    /*
    ** Global CSS
    */
    css: [],
    /*
    ** Customize the progress-bar color
    */
    loading: { color: '#3B8070' },

    modules: [
        ["@nuxtjs/axios", {
            prefix: "/api",
            proxy: true,
            port: 8086
        }]
    ],
    plugins: [{ src: '@/plugins/websocket.js', ssr: false }],
    proxy: {
        "/api/": config.origin || "https://beta.blargbot.xyz"
    },
    css: [{ src: '@/assets/scss/base.scss', type: 'scss' }],
    /*
     ** Build configuration
     */
    build: {
        /*
         ** Run ESLINT on save
         */
        extend(config, ctx) {
            if (ctx.isClient) {
                config.module.rules.push({
                    enforce: 'pre',
                    test: /\.(js|vue)$/,
                    loader: 'eslint-loader',
                    exclude: /(node_modules)/
                });
            }
        },
        vendor: ['axios', 'vue-markdown']
    },
    plugins: ['~/plugins/vue-markdown']
};
