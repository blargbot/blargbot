import { GuildTextableChannel } from 'eris';
import { StoredGuild } from '../../core/RethinkDb';
import { guard, sleep } from '../../utils';
import { CronService } from '../../structures/CronService';
import { Cluster } from '../Cluster';

export class CustomCommandIntervalCron extends CronService {
    public readonly type = 'bbtag';
    public constructor(
        public readonly cluster: Cluster
    ) {
        super({ cronTime: '*/15 * * * *' }, cluster.logger);
    }

    protected async execute(): Promise<void> {
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