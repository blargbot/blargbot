import { Cluster } from '@cluster';
import { CustomCommandLimit } from '@cluster/bbtag';
import { guard, sleep, snowflake } from '@cluster/utils';
import { CronService } from '@core/serviceTypes';
import { Collection, Guild } from 'discord.js';
import moment from 'moment';

export class CustomCommandIntervalCron extends CronService {
    public readonly type = 'bbtag';
    public constructor(
        public readonly cluster: Cluster
    ) {
        super({ cronTime: '*/15 * * * *' }, cluster.logger);
    }

    protected async execute(): Promise<void> {
        const nonce = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0').toUpperCase();

        const guilds = (await this.cluster.database.guilds.withIntervalCommand())
            .map(guildId => this.cluster.discord.guilds.cache.get(guildId))
            .filter(guard.hasValue);

        this.logger.info(`[${nonce}] Running intervals on ${guilds.length} guilds`);

        let count = 0;
        let failures = 0;
        const promises: Array<Promise<Guild | undefined>> = [];
        for (const guild of guilds) {
            this.logger.debug(`[${nonce}] Performing interval on ${guild.id}`);
            const interval = await this.cluster.database.guilds.getCommand(guild.id, '_interval');
            if (interval === undefined || guard.isGuildImportedCommandTag(interval))
                continue;

            try {
                const id = interval.authorizer ?? interval.author;
                if (id.length === 0) continue;
                const m = await this.cluster.util.getMember(guild, id);
                if (m === undefined) continue;
                const u = await this.cluster.util.getUser(id);
                if (u === undefined) continue;
                const c = guild.channels.cache.find(guard.isTextableChannel);
                if (c === undefined) continue;

                const promise = this.cluster.bbtag.execute(interval.content, {
                    message: {
                        channel: c,
                        author: u,
                        member: m,
                        createdTimestamp: moment.now(),
                        attachments: new Collection(),
                        embeds: [],
                        content: '',
                        id: snowflake.create().toString()
                    },
                    limit: new CustomCommandLimit(),
                    inputRaw: '',
                    isCC: true,
                    rootTagName: '_interval',
                    author: interval.author,
                    authorizer: interval.authorizer,
                    silent: true
                }).then(
                    () => {
                        count++;
                        return undefined;
                    },
                    err => {
                        this.logger.error('Issue with interval:', guild, err);
                        failures++;
                        return undefined;
                    });

                promises.push(Promise.race([promise, sleep(10000).then(() => guild)]));
            } catch (err: unknown) {
                this.logger.error('Issue with interval:', guild, err);
                failures++;
            }
        }

        const resolutions = await Promise.all(promises);
        this.logger.log(resolutions);

        const unresolved = resolutions.filter(guard.hasValue);

        this.logger.info(`[${nonce}] Intervals complete. ${count} success | ${failures} fail | ${unresolved.length} unresolved`);
        if (unresolved.length > 0) {
            this.logger.info(`[${nonce}] Unresolved in:\n${unresolved.map(m => '- ' + m.id).join('\n')}`);
        }
    }
}
