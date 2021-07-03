<template>
    <div>
        <section>
            <h1 class="center">Commands</h1>
        </section>
        <section>
            <collapse-page :collapseData="data" />
        </section>
    </div>
</template>

<script>
import CollapsePage from '~/components/CollapsePage.vue';

export default {
    components: { CollapsePage },
    async asyncData({ app }) {
        let retObj = {};

        let res = await app.$axios.$get('/commands');
        for (const key in res) {
            res[key].el = res[key].el.map(c => {
                let out = [];
                out.push(`**Usage**: \`${c.usage}\``);
                if (c.aliases.length > 0) {
                    out.push(`**Aliases**: ${c.aliases.join(' | ')}`);
                }
                out.push('');
                out.push(`${c.info}`);

                if (c.flags && c.flags.length > 0) {
                    out.push('\n**Flags**:');
                    for (const flag of c.flags) {
                        out.push(
                            `- \`-${flag.flag}\`/\`--${flag.word}\` - ${flag.desc}`
                        );
                    }
                }

                return {
                    key: c.key,
                    title: c.name,
                    category: { name: res[key].name },
                    keywords: [c.name, ...c.aliases],
                    message: out.join('\n')
                };
            });
        }
        retObj.data = res;

        return retObj;
    },
    mounted() {}
};
</script>
