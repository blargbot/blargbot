<template>
    <div>
        <div v-if='Object.keys(subtags).length === 0'>
            <div class='center loading'>
                <h1>{{$t('website.generic.loading')}}</h1>
                <spinner></spinner>
            </div>
        </div>
        <div v-else>
            <div class='row'>
                <div class='col s12 m10 offset-m1'>
                    <ul>
                        <li v-for='(value, key) in subtags' :key='key'>
                            <h2>{{key}}</h2>
                            <ul class='collapse' data-collapsible='accordion'>
                                <li v-for='(subtag, name) in value' :key='subtag.name' :class='subtag.active ? "active" : ""'>
                                    <div class='collapse-header' v-on:click='toggle(key, name)' :class='subtag.active ? "active" : ""'>{{subtag.name}}</div>
                                    <div class='collapse-body'>
                                        <vue-markdown :source='format(subtag)'></vue-markdown>
                                    </div>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import VueMarkdown from 'vue-markdown';
import axios from 'axios';
import card from '../components/card.vue';
import spinner from '../components/spinner.vue';

export default {
    data: () => ({
        subtags: {}
    }),
    methods: {
        toggle(key, name) {
            let subtag = this.subtags[key][name];
            if (subtag.active)
                subtag.active = false;
            else subtag.active = true;
            this.$set(this.subtags[key], name, subtag);
        },
        format(subtag) {
            let output = [];
            if (subtag.args)
                output.push(`> ${this.$t('website.subtags.components.argument')} \`${subtag.args}\``);
            if (subtag.named)
                output.push(`> ${this.$t('website.subtags.components.named')}`);
            if (subtag.array)
                output.push(`> ${this.$t('website.subtags.components.array')}`);
            if (subtag.requiresStaff)
                output.push(`> ${this.$t('website.subtags.components.staff')}`);
            if (!subtag.implicit)
                output.push(`> ${this.$t('website.subtags.components.noimplicit')}`);

            output.push('\n', this.$t(subtag.desc));

            return output.join('\n');
        }
    },
    components: {
        card, VueMarkdown, spinner
    },
    mounted() {
        axios.get('/api/subtags').then(res => {
            this.subtags = res.data;
        }).catch(err => {
            console.error(err);
        });
    }
};
</script>

<style scoped>
.loading {
    padding: 30px;
}
</style>