// This code will be injected before initializing the root App
import Vue from 'vue';
/* global window, EventEmitter */

class VueWebsocket extends EventEmitter {
    constructor() {
        super();
        this.url = process.env.isbeta ? 'ws://localhost:8085' : 'wss://blargbot.xyz';
        this.ws = new window.WebSocket(this.url);
    }

    install(Vue, options) {
        Vue.ws = this;
    }
}

const options = {};

// Activate plugin
Vue.use(new VueWebsocket(), options);

export default async ({ app }) => {
};