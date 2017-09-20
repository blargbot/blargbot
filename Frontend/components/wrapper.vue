<template>
    <div id='app'>
        <pageheader></pageheader>
        <main>
            <div class='container'>
                <slot name="content"></slot>
            </div>
        </main>
        <pagefooter></pagefooter>
    </div>
</template>

<script>
import footer from '../components/footer.vue';
import header from '../components/header.vue';

export default {
    data: () => ({
    }),
    components: { pagefooter: footer, pageheader: header }
};
</script>

<style scoped>

</style>