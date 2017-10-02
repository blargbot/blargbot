<template>
    <header>
        <nav>
            <div class='container'>
                <div class='nav-wrapper'>
                    <a class='brand-logo' href='/'>blargbot</a>
                    <ul id='nav-mobile' class='right hide-on-med-and-down'>
                        <li>
                            <a href='#'>{{$t('website.header.commands')}}</a>
                        </li>
                        <li>
                            <a href='#'>{{$t('website.header.bbtag')}}</a>
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
import locale from '../mixins/locale';

export default {
    mixins: [locale],
    data: () => ({
        locale: {
            website: {
                header: {}
            }
        }
    }),
    created() {
    }
};
</script>

<style scoped>

</style>