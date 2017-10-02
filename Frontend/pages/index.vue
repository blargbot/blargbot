<template>
    <div slot="content">
        <p>
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
                <div slot='content' v-html="$t('website.index.suggestions.desc')">
                </div>
            </card>
        </div>
    </div>
</template>

<script>
import card from '../components/card.vue';

export default {
    data: () => ({
    }),
    components: {
        card
    },
    fetch({ store, params }) {
        // return axios.get('/api/catfact')
        //     .then(res => {
        //         console.log(res.data);
        //         store.commit('SET_FACT', res.data);
        //     })
    }
};
</script>

<style scoped>

</style>