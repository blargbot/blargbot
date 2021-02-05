import { Cluster } from '../../cluster';

export class CommandHandler {
    /**
     * @param {import('../../cluster').Cluster} cluster
     */
    constructor(
        public readonly cluster: Cluster
    ) {
    }

    async execute(code: string, data: any) {
        switch (code) {
            case 'await':
                return await this.getReply(data.message, data);
            // case 'discordMessage':
            //     let { message, attachment } = data;
            //     if (attachment)
            //         await this.cluster.util.send(this.cluster.config.discord.channel, message, attachment);
            //     else
            //         await this.cluster.util.send(this.cluster.config.discord.channel, message);
            //     break;
            // case 'discordTopic':
            //     let { topic } = data;
            //     await this.cluster.discord.editChannel(this.cluster.config.discord.channel, {
            //         topic: topic
            //     });
            //     break;
            case 'killShard':
                let { id } = data;
                this.cluster.logger.shardi('Killing shard', id, 'without a reconnect.');
                let shard = this.cluster.discord.shards.get(id);
                if (shard) {
                    shard.disconnect({
                        reconnect: false
                    });
                }
                break;
        }
    }

    async getReply(code: string, data: any): Promise<JToken> {
        switch (code) {
            case 'metrics':
                this.cluster.metrics.userGauge.set(this.cluster.discord.users.size);
                return JSON.stringify(this.cluster.metrics.aggregated.getMetricsAsJSON());
            case 'lookupChannel':
                let chan = this.cluster.discord.getChannel(data.id);
                return chan && 'guild' in chan ? JSON.stringify({ channel: chan.name, guild: chan.guild.name }) : "null";
            case 'eval':
                let response = await this.cluster.eval({ author: { id: this.cluster.config.discord.users.owner } }, data.code, false);
                return response !== undefined ? { result: response.result, shard: this.cluster.id } : undefined;
            case 'retrieveUser':
                return { user: this.cluster.discord.users.get(data.id)?.id };
            case 'getStaffGuilds':
                let { user, guilds } = data;
                let res = [];
                for (const g of guilds) {
                    if (this.cluster.discord.guilds.get(g.id)) {
                        if (await this.cluster.util.isUserStaff(user, g.id))
                            res.push(g);
                    }
                }
                return JSON.stringify(res);
            case 'tagList':
                let tags: { [key: string]: Partial<object> } = {};
                for (const t of this.cluster.tags.list()) {
                    if (t.isTag) {
                        tags[t.name] = {
                            key: t.name,
                            category: t.category,
                            name: t.name,
                            args: t.args,
                            // usage: t.usage,
                            desc: t.desc,
                            exampleCode: t.exampleCode,
                            exampleIn: t.exampleIn,
                            exampleOut: t.exampleOut,
                            deprecated: t.deprecated,
                            // returns: t.returns,
                            // errors: t.errors,
                            staff: t.staff,
                            aliases: t.aliases
                        };
                    }
                }
                return JSON.stringify(tags);
            case 'commandList':
                let commands: { [key: string]: Partial<object> } = {};
                for (const c of this.cluster.commands.list()) {
                    if (c.isCommand && !c.hidden) {
                        commands[c.name] = {
                            key: c.name,
                            name: c.name,
                            usage: c.usage,
                            info: c.info,
                            longinfo: c.longinfo,
                            category: c.category,
                            aliases: c.aliases,
                            flags: c.flags,
                            onlyOn: c.onlyOn
                        };
                    }
                }
                return JSON.stringify(commands);
        }
    }
}