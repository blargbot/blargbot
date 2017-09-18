const path = require('path');
const express = require('express');
const expressVue = require('express-vue');
const sassMiddleware = require('node-sass-middleware');

class Website {
    constructor(port = 8078) {
        this.port = port;
        this.app = express();

        this.app.set('views', path.join(__dirname, 'views'));

        let vueEngine = expressVue.init(this.options);
        this.app.use(vueEngine);

        this.app.use(sassMiddleware({
            src: path.join(__dirname, 'scss'),
            dest: path.join(__dirname, 'public', 'css'),
            prefix: '/css/'
        }));

        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use('/', require('./routes/main'));
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('Website listening on port', this.port);
        });
    }

    get options() {
        return {
            rootPath: path.join(__dirname, 'views'),
            vue: {
                head: {
                    meta: [
                        { script: 'https://unpkg.com/vue/dist/vue.js' },
                        { style: '/css/materialize.css' },
                        { style: '/css/style.css' },
                        {
                            name: 'viewport',
                            content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                        },
                        { script: 'https://code.jquery.com/jquery-3.2.1.min.js' },
                        { script: '/js/materialize.min.js' }
                    ]
                }
            }
        };
    }
}

module.exports = Website;