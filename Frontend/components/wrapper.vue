<template>
    <div id='app'>
        <main>
            <slot name="content"></slot>
        </main>
        <pagefooter></pagefooter>
    </div>
</template>

<script>
import footer from '../components/footer.vue';

export default {
    data: () => ({
    }),
    components: { pagefooter: footer }
};
</script>

<style scoped>

</style>