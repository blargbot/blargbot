<template>
    <div>
        <h1>SubTags</h1>
        <p>{{$t('website.subtags.referdocs')}}</p>
        <div v-if='Object.keys(subtags).length === 0'>
            <div class='center loading'>
                <h1>{{$t('website.generic.loading')}}</h1>
                <spinner></spinner>
            </div>
        </div>
        <div v-else>
            <div class='row'>
                <div class='col s12 m12'>
                    <div class='row'>
                        <div class='input-field col s12'>
                            <input id='search' type='text' class='validate' v-model='filter'>
                            <label for='search'>{{$t('website.generic.search')}}</label>
                        </div>
                        <div class='col s12 m6'>
                            <button class='waves-effect waves-light btn full' v-on:click='expandAll()'>
                                {{$t('website.generic.expand')}}
                            </button>
                        </div>
                        <div class='col s12 m6'>
                            <button class='waves-effect waves-light btn full' v-on:click='collapseAll()'>
                                {{$t('website.generic.collapse')}}
                            </button>
                        </div>
                    </div>
                    <div v-if='filter !== ""'>
                        <p v-if='totalCount === 0' class='flow-text center'>
                            {{$t('website.generic.noresults')}}
                        </p>
                        <p v-else class='flow-text center'>
                            {{$t('website.generic.resultsfound') + ' ' + totalCount}}
                        </p>
                    </div>
                    <ul>
                        <li v-for='key in keys' :key='key'>
                            <div v-if='filteredSubtags(key).length > 0'>
                                <h3>{{key}}</h3>
                                <ul class='collapse'>
                                    <li v-for='(subtag, index) in filteredSubtags(key)' :key='subtag.name' :id='key + "." + subtag.name' :class='subtag.active ? "active" : ""'>
                                        <div class='collapse-header' v-on:click='toggle(key, index)'>{{subtag.name}}</div>
                                        <div class='collapse-body'>
                                            <vue-markdown :linkify='false' :source='format(subtag)'></vue-markdown>
                                        </div>
                                    </li>
                                </ul>
                            </div>
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
        subtags: {},
        keys: [],
        filter: ''
    }),
    methods: {
        filteredSubtags(key) {
            return this.subtags[key].filter(s => {
                if (this.filter === '') return true;
                return `${key}.${s.name}`.includes(this.filter.toLowerCase());
            });
        },
        collapseAll() {
            for (const key in this.subtags) {
                let filtered = this.filteredSubtags(key);
                for (const index in filtered) {
                    let subtag = filtered[index];
                    if (subtag.active) {
                        subtag.active = false;
                        let body = document.getElementById(`${key}.${subtag.name}`).children[1];
                        $(body).slideUp();
                        this.$set(this.subtags[key], this.subtags[key].indexOf(subtag), subtag)
                    }
                }
            }
        },
        expandAll() {
            for (const key in this.subtags) {
                let filtered = this.filteredSubtags(key);
                for (const index in filtered) {
                    let subtag = filtered[index];
                    if (!subtag.active) {
                        subtag.active = true;
                        let body = document.getElementById(`${key}.${subtag.name}`).children[1];
                        $(body).slideDown();
                        this.$set(this.subtags[key], this.subtags[key].indexOf(subtag), subtag)
                    }
                }
            }
        },
        toggle(key, index) {
            let subtag = this.filteredSubtags(key)[index];
            let element = document.getElementById(`${key}.${subtag.name}`);
            let body = element.children[1];

            if (subtag.active) {
                $(body).slideUp();
                subtag.active = false;
            } else {
                $(body).slideDown();
                subtag.active = true;
            }
            this.$set(this.subtags[key], this.subtags[key].indexOf(subtag), subtag);
        },
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
        card, VueMarkdown, spinner
    },
    computed: {
        totalCount() {
            return this.keys.reduce((a, c) => {
                return a + this.filteredSubtags(c).length;
            }, 0);
        }
    },
    mounted() {
        this.filter = this.$route.params.name;
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
                subtags[key].sort();
            }
            this.subtags = subtags;
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