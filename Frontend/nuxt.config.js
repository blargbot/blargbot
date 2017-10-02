module.exports = {
    srcDir: 'Frontend/',
    build: {
        vendor: ['vue-i18n']
    },
    css: [
        '@/public/scss/materialize.scss',
        '@/public/scss/style.scss'
    ],
    router: {
        middleware: 'i18n'
    },
    plugins: ['~/plugins/i18n.js'],
    head: {
        meta: [{
            name: 'viewport',
            content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        }],
        script: [
            { src: 'https://code.jquery.com/jquery-3.2.1.min.js' },
            { src: '/js/materialize.min.js' },
            { src: 'https://unpkg.com/axios/dist/axios.min.js' }
        ]
    }
};