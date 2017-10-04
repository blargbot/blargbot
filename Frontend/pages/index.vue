<template>
    <div slot="content">
        <p class='main-desc'>
            {{$t('website.index.desc')}}
        </p>
        <div class='card-row'>
            <card :title="$t('website.index.commands.title')">
                <div slot='content'>
                    {{$t('website.index.commands.desc')}}
                </div>
            </card>
            <card :title="$t('website.index.bbtag.title')">
                <div slot='content'>
                    {{$t('website.index.bbtag.desc')}}
                </div>
            </card>
            <card :title="$t('website.index.customization.title')">
                <div slot='content'>
                    {{$t('website.index.customization.desc')}}
                </div>
            </card>
            <card :title="$t('website.index.moderation.title')">
                <div slot='content'>
                    {{$t('website.index.moderation.desc')}}
                </div>
            </card>
            <card :title="$t('website.index.opensource.title')">
                <div slot='content'>
                    {{$t('website.index.opensource.desc')}}
                </div>
            </card>
            <card :title="$t('website.index.suggestions.title')">
                <div slot='content'>
                    <vue-markdown :source='$t("website.index.suggestions.desc")'></vue-markdown>
                </div>
            </card>
        </div>
    </div>
</template>

<script>
import VueMarkdown from 'vue-markdown';
import card from '../components/card.vue';

export default {
    data: () => ({
    }),
    components: {
        card, VueMarkdown
    },
    fetch({ store, params }) {
    }
};
</script>

<style scoped>
.main-desc {
    max-width: 600px;
    text-align: center;
    margin: 20px auto;
}
</style>