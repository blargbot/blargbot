<template>
    <header>
        <nav>
            <div class='container'>
                <div class='nav-wrapper'>
                    <a class='brand-logo' href='/'>blargbot</a>
                    <ul id='nav-mobile' class='right hide-on-med-and-down'>
                        <li>
                            <a href='#'>{{locale.website.header.commands}}</a>
                        </li>
                        <li>
                            <a href='#'>{{locale.website.header.bbtag}}</a>
                        </li>
                        <li class='login'>
                            <div v-if='user === false'>
                                <a href='/login' class='waves-effect waves-light btn allcaps'>{{locale.website.header.login}}</a>
                            </div>
                            <div v-else>
                                <div class='logged-in'>
                                    <div class='username'>
                                        <img src='https://cdn.discordapp.com/avatars/103347843934212096/a_aa8ae462e664bee001241c4a82835aab.gif'>
                                        <span>stupid cat#8160</span>
                                    </div>
                                    <a href='/logout' class='waves-effect waves-light btn allcaps btn-small'>{{locale.website.header.logout}}</a>
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
        user: false
    }),
    created() {
        this.user = this.$root.$data.user;
    }
};
</script>

<style scoped>

</style>