<template>
    <div>
        <collapse :collapse-data='subtags' :keys='keys'>
            <h1 slot='heading'>SubTags</h1>
            <vue-markdown :source='$t("website.subtags.referdocs")'></vue-markdown>
        </collapse>
    </div>
</template>

<script>
import VueMarkdown from 'vue-markdown';
import axios from 'axios';
import card from '../components/card.vue';
import spinner from '../components/spinner.vue';
import collapse from '../components/collapse.vue';

export default {
    data: () => ({
        subtags: {},
        keys: [],
    }),
    methods: {
        format(subtag) {
            let output = [];
            if (subtag.category === 'general') {
                output.push(`#### ${subtag.name}`)
            } else {
                output.push(`#### ${subtag.category}.${subtag.name}`)
            }
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
        card, VueMarkdown, spinner, collapse
    },

    mounted() {
        axios.get('/api/subtags').then(res => {
            let keys = Object.keys(res.data);
            let order = ['general', 'array', 'math', 'logic'].reverse();
            keys.sort((a, b) => {
                let c = 0;
                if (order.includes(a)) {
                    let index = order.indexOf(a) + 2;
                    c += 10 ** index;
                }
                if (order.includes(b)) {
                    let index = order.indexOf(b) + 2;
                    c -= 10 ** index;
                }
                if (c === 0) c = a < b ? 1 : -1;
                return c;
            });
            keys = keys.reverse();
            this.keys = keys;
            let subtags = res.data;
            for (const key of this.keys) {
                subtags[key].sort((a, b) => {
                    return a.name > b.name ? 1 : -1
                });
                for (const subtag of subtags[key]) {
                    subtag.id = `${key}.${subtag.name}`;
                    subtag.data = this.format(subtag);
                }
            }
            this.subtags = subtags;
        }).catch(err => {
            console.error(err);
        });
    }
};
</script>

<style scoped>

</style>