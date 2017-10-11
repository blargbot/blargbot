<template>
    <div>
        <vue-markdown :source='$t("bbtag.arrays.desc")' class='markdown'>
        </vue-markdown>
    </div>
</template>

<script>
import VueMarkdown from 'vue-markdown';
import card from '../../components/card.vue';

export default {
    data: () => ({

    }),
    components: {
        card, VueMarkdown
    }
};
</script>

<style scoped>

</style>