<template>
    <div>
        <section>
            <h1 class="center">SubTags</h1>
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

        let res = await app.$axios.$get('/subtags');
        for (const re of Object.values(res)) {
            re.el = re.el.map(c => {
                let out = [];
                // console.meta({ depth: 5 }).log(c);
                if (c.usage) out.push(`**Arguments**: \`${c.usage}\``);
                out.push(c.desc);

                if (c.exampleCode)
                    out.push(
                        `**Example Code**:\n> ${c.exampleCode.replace(
                            /\n/g,
                            '\n> '
                        )}\n`
                    );
                if (c.exampleIn)
                    out.push(
                        `**Example Input**:\n> ${c.exampleIn.replace(
                            /\n/g,
                            '\n> '
                        )}\n`
                    );
                if (c.exampleOut)
                    out.push(
                        `**Example Output**:\n> ${c.exampleOut.replace(
                            /\n/g,
                            '\n> '
                        )}\n`
                    );

                if (c.limits.length > 0) {
                    out.push('<div class=\'subtag-limit-wrapper\'>');

                    for (const limit of c.limits) {
                        out.push(
                            `<div class='subtag-limit'><strong>Limits for ${
                                limit.type
                            }s</strong><blockquote>${limit.text.replace(
                                /\n/g,
                                '<br>'
                            )}</blockquote></div>`
                        );
                    }
                    out.push('</div>');
                }
                return {
                    key: c.key,
                    title: c.name,
                    category: { name: re.name },
                    keywords: [c.name],
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
