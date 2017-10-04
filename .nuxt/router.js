import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const _f4024f3e = () => import('../Frontend/pages/index.vue' /* webpackChunkName: "pages/index" */).then(m => m.default || m)
const _1ef45bb8 = () => import('../Frontend/pages/index/index.vue' /* webpackChunkName: "pages/index/index" */).then(m => m.default || m)
const _173c73a2 = () => import('../Frontend/pages/index/bbtag/index.vue' /* webpackChunkName: "pages/index/bbtag/index" */).then(m => m.default || m)
const _49bdb726 = () => import('../Frontend/pages/index/commands.vue' /* webpackChunkName: "pages/index/commands" */).then(m => m.default || m)
const _6fed76f6 = () => import('../Frontend/pages/index/bbtag/subtags.vue' /* webpackChunkName: "pages/index/bbtag/subtags" */).then(m => m.default || m)



const scrollBehavior = (to, from, savedPosition) => {
  // SavedPosition is only available for popstate navigations.
  if (savedPosition) {
    return savedPosition
  } else {
    let position = {}
    // If no children detected
    if (to.matched.length < 2) {
      // Scroll to the top of the page
      position = { x: 0, y: 0 }
    }
    else if (to.matched.some((r) => r.components.default.options.scrollToTop)) {
      // If one of the children has scrollToTop option set to true
      position = { x: 0, y: 0 }
    }
    // If link has anchor, scroll to anchor by returning the selector
    if (to.hash) {
      position = { selector: to.hash }
    }
    return position
  }
}


export function createRouter () {
  return new Router({
    mode: 'history',
    base: '/',
    linkActiveClass: 'nuxt-link-active',
    linkExactActiveClass: 'nuxt-link-exact-active',
    scrollBehavior,
    routes: [
		{
			path: "/",
			component: _f4024f3e,
			children: [
				{
					path: "",
					component: _1ef45bb8,
					name: "index"
				},
				{
					path: "bbtag",
					component: _173c73a2,
					name: "index-bbtag"
				},
				{
					path: "commands",
					component: _49bdb726,
					name: "index-commands"
				},
				{
					path: "bbtag/subtags",
					component: _6fed76f6,
					name: "index-bbtag-subtags"
				}
			]
		}
    ],
    fallback: false
  })
}
