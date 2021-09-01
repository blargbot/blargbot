// const cp = require('cookieparser');

// export const state = () => ({
//     user: null,
//     token: null,
//     privacyVersion: 0
// });

// export const mutations = {
//     setUser(state, user) {
//         state.user = user;
//     },
//     setUserPrivacy(state, accept) {
//         state.user.privacyAccept = accept;
//     },
//     setToken(state, token) {
//         state.token = token;
//     },
//     setPrivacyVersion(state, ver) {
//         state.privacyVersion = ver;
//     }
// };

// export const actions = {
//     async nuxtServerInit({ commit }, { app, req, store }) {
//         if (req.headers.cookie) {
//             try {
//                 let p = cp(req.headers.cookie);
//                 if (p.token) {
//                     let user = await app.$axios.$get('/users/@me', {
//                         headers: {
//                             Authorization: p.token
//                         }
//                     });
//                     store.commit("setUser", user);
//                     app.$axios.setToken(p.token);
//                 }
//             } catch (err) {

//             }
//         }
//     }
// };
