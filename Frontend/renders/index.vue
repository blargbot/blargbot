<template>
    <div>
        <p class='main-desc flow-text'>
            {{$t('index.desc')}}
        </p>
        <div class='card-row'>
            <card :title="$t('index.commands.title')">
                <div slot='content'>
                    {{$t('index.commands.desc')}}
                </div>
            </card>
            <card :title="$t('index.bbtag.title')">
                <div slot='content'>
                    {{$t('index.bbtag.desc')}}
                </div>
            </card>
            <card :title="$t('index.customization.title')">
                <div slot='content'>
                    {{$t('index.customization.desc')}}
                </div>
            </card>
            <card :title="$t('index.moderation.title')">
                <div slot='content'>
                    {{$t('index.moderation.desc')}}
                </div>
            </card>
            <card :title="$t('index.opensource.title')">
                <div slot='content'>
                    {{$t('index.opensource.desc')}}
                </div>
            </card>
            <card :title="$t('index.suggestions.title')">
                <div slot='content'>
                    <vue-markdown :source='$t("index.suggestions.desc")'></vue-markdown>
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