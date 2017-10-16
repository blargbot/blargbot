<template>
    <div>
        <vue-markdown :source='$t("website.bbtag.main")' class='markdown'>
        </vue-markdown>
        <div class='row'>
            <ul class='tabs col s12 tabs-fixed-width'>
                <li class='tab' v-for='page in pages' :key='page'>
                    <router-link :to='{name: "BBTag", params: {name: page}}' :class='page === type ? "active" : ""'>
                        {{$t(`website.bbtag.${page}.title`)}}
                    </router-link>
                </li>
            </ul>
            <div class='col s12' v-for='page in pages' :key='page' v-if='type === page'>
                <vue-markdown :source='$t(`website.bbtag.${page}.desc`)' class='markdown'></vue-markdown>
            
            </div>
        </div>
    </div>
</template>

<script>
import VueMarkdown from 'vue-markdown';
import card from '../../components/card.vue';

export default {
    data: () => ({
        pages: ['subtags', 'variables', 'arrays']
    }),
    components: {
        card, VueMarkdown
    },
    computed: {
        type() {
            if (this.$route.params.name)
                return this.$route.params.name.toLowerCase();
            return 'subtags';
        }
    },
    mounted() {
        $(document).ready(() => {
            $('ul.tabs').tabs();
        });
    }
};
</script>

<style scoped>

</style>