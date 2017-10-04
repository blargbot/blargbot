import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const _730255bb = () => import('../Frontend/renders/wrapper.vue' /* webpackChunkName: "" */).then(m => m.default || m)
const _2fb2867a = () => import('../Frontend/renders/index.vue' /* webpackChunkName: "" */).then(m => m.default || m)
const _9fb91568 = () => import('../Frontend/renders/bbtag/subtags.vue' /* webpackChunkName: "" */).then(m => m.default || m)
const _6ce13bf6 = () => import('../Frontend/renders/bbtag/index.vue' /* webpackChunkName: "" */).then(m => m.default || m)
const _05e8c9e0 = () => import('../Frontend/renders/commands.vue' /* webpackChunkName: "" */).then(m => m.default || m)



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
			component: _730255bb,
			children: [
				{
					path: "/",
					component: _2fb2867a,
					name: "blargbot"
				},
				{
					path: "/bbtag",
					component: _730255bb,
					name: "BBTag",
					children: [
						{
							path: "/bbtag/subtags",
							component: _9fb91568,
							name: "SubTags"
						},
						{
							path: "/bbtag",
							component: _6ce13bf6,
							name: "Docs"
						}
					]
				},
				{
					path: "/commands",
					component: _05e8c9e0,
					name: "Commands"
				}
			]
		}
    ],
    fallback: false
  })
}
