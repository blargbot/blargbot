import { Cluster } from '../cluster';
import { BaseWorker } from './BaseWorker';
import { cpuLoad, fafo, guard, snowflake } from '../newbu';

export class ClusterWorker extends BaseWorker {
    public readonly cluster: Cluster;

    public constructor(
        logger: CatLogger,
        public readonly config: Configuration
    ) {
        super(logger);
        const clusterId = this.env.CLUSTER_ID ?? '??';

        this.logger.init(`CLUSTER ${clusterId} (pid ${this.id}) PROCESS INITIALIZED`);

        this.cluster = new Cluster(logger, config, {
            id: clusterId,
            worker: this,
            shardCount: envNumber(this.env, 'SHARDS_MAX'),
            firstShardId: envNumber(this.env, 'SHARDS_FIRST'),
            lastShardId: envNumber(this.env, 'SHARDS_LAST')
        });

        this.on('killshard', ({ data }) => {
            const { id: shardId } = data as { id: string };
            this.cluster.logger.shardi('Killing shard', shardId, 'without a reconnect.');
            this.cluster.discord.shards
                .get(shardId)
                ?.disconnect({ reconnect: false });
        });

        this.on('metrics', ({ id }) => {
            this.cluster.metrics.userGauge.set(this.cluster.discord.users.size);
            this.send('metrics', id, this.cluster.metrics.aggregated.getMetricsAsJSON());
        });

        this.on('lookupChannel', ({ id, data }) => {
            const { id: channelId } = data as { id: string };
            const chan = this.cluster.discord.getChannel(channelId);
            this.send('lookupChannel', id, guard.isGuildChannel(chan)
                ? { channel: chan.name, guild: chan.guild.name }
                : null);
        });

        this.on('retrieveUser', ({ id, data }) => {
            const { id: userId } = data as { id: string };
            this.send('retrieveUser', id, this.cluster.discord.users.get(userId));
        });

        this.on('getStaffGuilds', fafo(async ({ id, data }) => {
            const { user, guilds } = data as { user: string, guilds: Array<{ id: string }> };
            const res = [];
            for (const guild of guilds) {
                const guildId = guild.id;
                if (this.cluster.discord.guilds.get(guildId)) {
                    if (await this.cluster.util.isUserStaff(user, guildId))
                        res.push(guild);
                }
            }
            this.send('getStaffGuilds', id, res);
        }));

        this.on('tagList', ({ id }) => {
            const tags: Record<string, unknown> = {};
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
            this.send('tagList', id, tags);
        });

        this.on('commandList', ({ id }) => {
            const commands: Record<string, unknown> = {};
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
            this.send('commandList', id, commands);
        });
    }

    public async start(): Promise<void> {
        await this.cluster.start();
        super.start();

        setInterval(() => {
            this.send('shardStats', snowflake.create(), {
                ...this.cluster.stats.getCurrent(),
                ...cpuLoad(),
                rss: this.memoryUsage.rss
            });
        }, 10000);
    }
}

function envNumber(env: NodeJS.ProcessEnv, key: string): number {
    const res = env[key];
    switch (typeof res) {
        case 'number': return res;
        case 'string':
            const num = parseInt(res);
            if (Number.isNaN(num))
                throw new Error(`Environment variable ${key} is expected to be a number`);
            return num;
    }

    throw new Error(`Missing reqired environment variable ${key}`);
}