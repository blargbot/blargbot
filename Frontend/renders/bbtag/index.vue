<template>
    <div>
        <vue-markdown :source='$t("website.bbtag.main")' class='markdown'>
        </vue-markdown>
        <div class='row'>
            <ul class='tabs col s12'>
                <li class='tab col s4'>
                    <a href='#subtags'>{{$t('website.bbtag.subtags.title')}}</a>
                </li>
                <li class='tab col s4'>
                    <a href='#variables'>{{$t('website.bbtag.variables.title')}}</a>
                </li>
                <li class='tab col s4'>
                    <a href='#arrays'>{{$t('website.bbtag.arrays.title')}}</a>
                </li>
            </ul>

            <div id='subtags' class='col s12'>
                <vue-markdown :source='$t("website.bbtag.subtags.desc")' class='markdown'></vue-markdown>
            </div>
            <div id='variables' class='col s12'>
                <vue-markdown :source='$t("website.bbtag.variables.desc")' class='markdown'></vue-markdown>
            </div>
            <div id='arrays' class='col s12'>
                <vue-markdown :source='$t("website.bbtag.arrays.desc")' class='markdown'></vue-markdown>
            </div>
        </div>
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