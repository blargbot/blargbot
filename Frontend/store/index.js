import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

// Polyfill for window.fetch()
require('whatwg-fetch');

const store = () => new Vuex.Store({

    state: {
        user: null,
        locale: 'en',
        locales: ['en'],
        fact: ''
    },

    mutations: {
        SET_USER: function (state, user) {
            state.user = user;
        },
        SET_LANG(state, locale) {
            if (state.locales.indexOf(locale) !== -1) {
                state.locale = locale;
            }
        },
        SET_FACT(state, fact) {
            state.fact = fact;
        }
    },

    actions: {
        nuxtServerInit({ commit }, { req }) {
            if (req.session && req.session.user) {
                commit('SET_USER', req.session.user);
            }
        }
    }

});

export default store;