<template>
    <header>
        <nav>
            <div class='container'>
                <div class='nav-wrapper'>
                    <a class='brand-logo' href='/'>blargbot</a>
                    <ul id='nav-mobile' class='right hide-on-med-and-down'>
                        <li>
                            <a href='#'>Commands</a>
                        </li>
                        <li>
                            <a href='#'>Subtags</a>
                        </li>
                        <li class='login'>
                            <div v-if='user === false'>
                                <a href='/login' class='waves-effect waves-light btn allcaps'>Login</a>
                            </div>
                            <div v-else>
                                <a href='/logout' class='waves-effect waves-light btn allcaps'>Logout</a>
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
        user: false
    }),
    created() {
        this.user = this.$root.$data.user;
    }
};
</script>

<style scoped>

</style>