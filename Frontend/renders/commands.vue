<template>
    <div>
        <collapse :collapse-data='commands' :keys='keys'>
            <h1 slot='heading'>{{$t('website.commands.title')}}</h1>
            <vue-markdown :source='$t("website.commands.desc")'></vue-markdown>
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
        commands: {},
        keys: [],
    }),
    methods: {
        format(command) {
            let output = [];
            output.push(`#### ${command.name}`);
            let usage = this.$t(command.usage);
            if (command.usage !== usage)
                output.push(`> ${this.$t('website.commands.components.usage')} \`${command.name} ${usage}\``)
            if (command.aliases.length > 0)
                output.push(`> ${this.$t('website.commands.components.aliases')} [ ${command.aliases.map(a => '`' + a + '`').join(' | ')} ]`);
            output.push('', this.$t(command.info));
            if (command.flags.length > 0) {
                output.push(`##### ${this.$t('website.commands.components.flags')}`)
                for (const flag of command.flags)
                    output.push(` - \`-${flag.flag} | --${flag.name}\` - ${this.$t(flag.desc)}`);
            }
            if (command.subcommands.length > 0) {
                output.push(`##### ${this.$t('website.commands.components.subcommands')}`)
                for (const sc of command.subcommands) {
                    let sco = [`###### ${sc.name}`];
                    let usage = this.$t(sc.usage);
                    if (sc.usage !== usage)
                        sco.push(`> ${this.$t('website.commands.components.usage')} \`${command.name} ${sc.name} ${usage}\``)
                    if (sc.aliases.length > 0)
                        sco.push(`> ${this.$t('website.commands.components.aliases')} [ ${sc.aliases.map(a => '`' + a + '`').join(' | ')} ]`);
                    sco.push('', this.$t(sc.info));
                    if (sc.flags.length > 0) {
                        sco.push(`**${this.$t('website.commands.components.flags')}**`)
                        for (const flag of sc.flags)
                            sco.push(` - \`-${flag.flag} | --${flag.name}\` - ${this.$t(flag.desc)}`);
                    }
                    output.push(...sco);
                }
            }
            // if (command.args)
            //     output.push(`> ${this.$t('website.commands.components.argument') } \`${command.args}\``);
            // if (command.named)
            //     output.push(`> ${this.$t('website.commands.components.named')}`);
            // else output.push(`> ${this.$t('website.commands.components.unnamed')}`)
            // if (command.array)
            //     output.push(`> ${this.$t('website.commands.components.array')}`);
            // if (command.requiresStaff)
            //     output.push(`> ${this.$t('website.commands.components.staff')}`);
            // if (!command.implicit)
            //     output.push(`> ${this.$t('website.commands.components.noimplicit')}`);

            output.push('\n', this.$t(command.desc));

            return output.join('\n');
        }
    },
    components: {
        card, VueMarkdown, spinner, collapse
    },

    mounted() {
        axios.get('/api/commands').then(res => {
            let keys = Object.keys(res.data);
            let order = ['general'].reverse();
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
            let commands = res.data;
            for (const key of this.keys) {
                commands[key].sort((a, b) => {
                    return a.name > b.name ? 1 : -1
                });
                for (const command of commands[key]) {
                    command.id = `${command.name}`;
                    command.data = this.format(command);
                }
            }
            this.commands = commands;
        }).catch(err => {
            console.error(err);
        });
    }
};
</script>

<style scoped>

</style>