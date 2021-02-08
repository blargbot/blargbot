import { Cluster } from '../cluster';
import { BaseWorker } from './core/BaseWorker';
import { CommandType, cpuLoad, fafo, FlagDefinition, guard, sleep, snowflake, SubtagType } from '../newbu';
import { StoredGuild } from '../core/RethinkDb';
import { GuildTextableChannel, Shard } from 'eris';
import { CronJob } from 'cron';
import { SubtagArgument } from '../structures/BaseSubtagHandler';
import { Moment } from 'moment-timezone';
import moment from 'moment';

export interface LookupChannelResult {
    channel: string;
    guild: string
}

export interface GetStaffGuildsRequest {
    user: string;
    guilds: string[];
}

export interface TagListResult {
    [tagName: string]: TagResult | undefined;
}

export interface TagResult {
    category: SubtagType;
    name: string;
    args: SubtagArgument[];
    desc: string;
    exampleCode: string | null;
    exampleIn: string | null;
    exampleOut: string | null;
    deprecated: boolean;
    staff: boolean;
    aliases: string[];
}

export interface CommandListResult {
    [commandName: string]: CommandResult | undefined;
}

export interface CommandResult {
    name: string;
    usage: string;
    info: string;
    longinfo: string | null;
    category: CommandType;
    aliases: string[];
    flags: FlagDefinition[];
    onlyOn: string | null;
}

export interface ClusterStats {
    id: number;
    time: number;
    readyTime: number;
    guilds: number;
    rss: number;
    userCpu: number;
    systemCpu: number;
    shardCount: number;
    shards: ShardStats[]
}

export interface ShardStats {
    id: number;
    status: Shard['status'];
    latency: number;
    guilds: number;
    cluster: number;
    time: number;
}

export class ClusterWorker extends BaseWorker {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #intervalCron: CronJob;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #lastReady: Map<number, Moment>;
    public readonly cluster: Cluster;

    public constructor(
        logger: CatLogger,
        public readonly config: Configuration
    ) {
        super(logger);
        const clusterId = envNumber(this.env, 'CLUSTER_ID');

        this.logger.init(`CLUSTER ${clusterId} (pid ${this.id}) PROCESS INITIALIZED`);

        this.#intervalCron = new CronJob('*/15 * * * *', () => void this.customCommandInterval());
        this.#lastReady = new Map();
        this.cluster = new Cluster(logger, config, {
            id: clusterId,
            worker: this,
            shardCount: envNumber(this.env, 'SHARDS_MAX'),
            firstShardId: envNumber(this.env, 'SHARDS_FIRST'),
            lastShardId: envNumber(this.env, 'SHARDS_LAST')
        });
    }


    protected getLastReady(shardId: number): Moment {
        if (this.cluster.discord.shards.get(shardId)?.status === 'ready')
            this.#lastReady.set(shardId, moment());

        return this.#lastReady.get(shardId)
            ?? this.cluster.createdAt;
    }

    public async start(): Promise<void> {
        this.installListeners();
        await this.cluster.start();
        super.start();
        this.#intervalCron.start();
        setInterval(() => {
            this.send('shardStats', snowflake.create(), <ClusterStats>{
                id: this.cluster.id,
                time: Date.now().valueOf(),
                readyTime: this.cluster.createdAt.valueOf(),
                guilds: this.cluster.discord.guilds.size,
                rss: this.memoryUsage.rss,
                ...cpuLoad(),
                shardCount: this.cluster.discord.shards.size,
                shards: this.cluster.discord.shards.map(s => ({
                    id: s.id,
                    status: s.status,
                    latency: s.latency,
                    guilds: this.cluster.discord.guilds.filter(g => g.shard.id === s.id).length,
                    cluster: this.cluster.id,
                    time: this.getLastReady(s.id).valueOf()
                }))
            });
        }, 10000);
    }

    protected installListeners(): void {
        this.on('killshard', (id: string) => {
            this.cluster.logger.shardi('Killing shard', id, 'without a reconnect.');
            this.cluster.discord.shards
                .get(id)
                ?.disconnect({ reconnect: false });
        });

        this.on('metrics', (_, reply) => {
            this.cluster.metrics.userGauge.set(this.cluster.discord.users.size);
            reply(this.cluster.metrics.aggregated.getMetricsAsJSON());
        });

        this.on('lookupChannel', (id: string, reply) => {
            const chan = this.cluster.discord.getChannel(id);
            reply(guard.isGuildChannel(chan) ? <LookupChannelResult>{ channel: chan.name, guild: chan.guild.name } : null);
        });

        this.on('retrieveUser', (id: string, reply) => {
            reply(this.cluster.discord.users.get(id) ?? null);
        });

        this.on('getStaffGuilds', fafo(async ({ user, guilds }: GetStaffGuildsRequest, reply) => {
            const res = [];
            for (const guild of guilds) {
                if (this.cluster.discord.guilds.get(guild)) {
                    if (await this.cluster.util.isUserStaff(user, guild))
                        res.push(guild);
                }
            }
            reply(res);
        }));

        this.on('tagList', (_, reply) => {
            const tags: TagListResult = {};
            for (const t of this.cluster.subtags.list()) {
                if (t.isTag) {
                    tags[t.name] = {
                        category: t.category,
                        name: t.name,
                        args: t.args,
                        desc: t.desc,
                        exampleCode: t.exampleCode,
                        exampleIn: t.exampleIn,
                        exampleOut: t.exampleOut,
                        deprecated: t.deprecated,
                        staff: t.staff,
                        aliases: t.aliases
                    };
                }
            }
            reply(tags);
        });

        this.on('commandList', (_, reply) => {
            const commands: CommandListResult = {};
            for (const c of this.cluster.commands.list()) {
                if (c.isCommand && !c.hidden) {
                    commands[c.name] = {
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
            reply(commands);
        });

        super.installListeners();
    }

    private async customCommandInterval(): Promise<void> {
        const nonce = (Math.floor(Math.random() * 0xffffffff)).toString(16).padStart(8, '0').toUpperCase();

        let guilds = await this.cluster.rethinkdb.queryAll<StoredGuild>(r => r.table('guild').getAll('interval'));
        guilds = guilds.filter(g => this.cluster.discord.guilds.get(g.guildid));
        this.logger.info('[%s] Running intervals on %i guilds', nonce, guilds.length);

        let count = 0;
        let failures = 0;
        const promises: Array<Promise<string | null>> = [];
        for (const guild of guilds) {
            this.logger.debug('[%s] Performing interval on %s', nonce, guild.guildid);
            const interval = guild.ccommands?._interval;
            if (!interval)
                continue;

            try {
                const g = this.cluster.discord.guilds.get(guild.guildid);
                if (!g) continue;
                const id = interval.authorizer || interval.author;
                if (!id) continue;
                const m = g.members.get(id);
                if (!m) continue;
                const u = this.cluster.discord.users.get(id) ?? await this.cluster.discord.getRESTUser(id);
                if (!u) continue;
                const c = g.channels.find(guard.isGuildTextableChannel) as GuildTextableChannel;
                if (!c) continue;

                const promise = this.cluster.bbtag.execute({
                    context: {
                        channel: c,
                        author: u,
                        member: m
                    },
                    limits: 'autoresponse_everything',
                    source: interval.content,
                    input: '',
                    isCC: true,
                    name: '_interval',
                    author: interval.author,
                    authorizer: interval.authorizer,
                    silent: true
                }).then(
                    () => { count++; return null; },
                    err => {
                        this.logger.error('Issue with interval:', guild.guildid, err);
                        failures++;
                        return null;
                    });

                promises.push(Promise.race([promise, sleep(10000).then(() => guild.guildid)]));
            } catch (err) {
                this.logger.error('Issue with interval:', guild.guildid, err);
                failures++;
            }
        }

        const resolutions = await Promise.all(promises);
        this.logger.log(resolutions);

        const unresolved = resolutions.filter(guard.hasValue);

        this.logger.info('[%s] Intervals complete. %i success | %i fail | %i unresolved', nonce, count, failures, unresolved.length);
        if (unresolved.length > 0) {
            this.logger.info('[%s] Unresolved in:\n%s', nonce, unresolved.map(m => '- ' + m).join('\n'));
        }
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