<template>
    <header>
        <nav>
            <div class='container'>
                <div class='nav-wrapper'>
                    <router-link class='breadcrumb brand-logo' to='/'>blargbot</router-link>
                    <router-link class='breadcrumb' v-for='crumb in $route.matched.slice(1)' :key='crumb.name' :to='crumb.path'>{{crumb.name}}</router-link>

                    <ul id='nav-mobile' class='right hide-on-med-and-down'>
                        <li>
                            <router-link to='/commands'>{{$t('website.header.commands')}}</router-link>
                        </li>
                        <li>
                            <router-link to='/bbtag'>{{$t('website.header.bbtag')}}</router-link>
                        </li>
                        <li>
                            <router-link to='/subtags'>{{$t('website.header.subtags')}}</router-link>
                        </li>
                        <li class='login'>
                            <div v-if='$store.state.user == undefined'>
                                <a href='/login' class='waves-effect waves-light btn allcaps'>{{$t('website.header.login')}}</a>
                            </div>
                            <div v-else>
                                <div class='logged-in'>
                                    <div class='username'>
                                        <img :src="`https://cdn.discordapp.com/avatars/${$store.state.user.id}/${$store.state.user.avatar}.${$store.state.user.avatar.startsWith('a_') ? 'gif' : 'png'}`">
                                        <span>{{$store.state.user.username}}#{{$store.state.user.discriminator}}</span>
                                    </div>
                                    <a href='/logout' class='waves-effect waves-light btn allcaps btn-small'>{{$t('website.header.logout')}}</a>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>
</template>

<script>
export default {
    data: () => ({
    }),
    created() {
    }
};
</script>

<style scoped>
.brand-logo {
    position: unset;
    transform: none;
}

.breadcrumb {
    display: inline-block;
    vertical-align: top;
}
</style>