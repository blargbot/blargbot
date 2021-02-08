import { CronJob } from 'cron';
import { BotActivityType, Client as DiscordClient } from 'eris';
import moment from 'moment';
import { BaseClient } from '../core/BaseClient';
import { ClusterPool } from '../workers/ClusterPool';
import { migrateCassandra } from './migration';
import snekfetch from 'snekfetch';

export interface MasterOptions {
    avatars: string[];
    holidays: Record<string, string>;
}

export class Master extends BaseClient {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #avatarCron: CronJob;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #statusCron: CronJob;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #avatars: string[];
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #holidays: Record<string, string>;
    public readonly discord: DiscordClient;
    public readonly clusters: ClusterPool;

    public constructor(
        logger: CatLogger,
        config: Configuration,
        options: MasterOptions
    ) {
        super(logger, config, {});
        this.#avatars = options.avatars;
        this.#holidays = options.holidays;
        this.clusters = new ClusterPool(this, this.logger);
        this.#avatarCron = new CronJob('*/15 * * * *', () => void this.avatarInterval());
        this.#statusCron = new CronJob('*/15 * * * *', () => void this.statusInterval());
        this.discord = new DiscordClient(this.config.discord.token, {
            restMode: true,
            defaultImageFormat: 'png'
        });
        // TODO Add websites
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.hello(),
            super.start(),
            this.discord.connect()
        ]);
        void migrateCassandra(this.cassandra, this.logger);
        await this.clusters.spawnAll(60000);
        this.#avatarCron.start();
        this.#statusCron.start();
    }

    private async avatarInterval(): Promise<void> {
        this.logger.info('!=! Performing the avatar interval !=!');
        if (this.config.general.isbeta)
            return;
        const time = moment();
        const h = parseInt(time.format('H'));
        // account for any number of possible avatars
        const m = Math.floor((parseInt(time.format('m')) / 15));
        const c = (h * 4) + m;
        const id = c % this.#avatars.length;
        await this.discord.editSelf({
            avatar: this.#avatars[id]
        });
    }

    private statusInterval(): void {
        let name = '';
        let type: BotActivityType = 0;

        const date = moment().format('MM-DD');
        if (this.#holidays[date]) {
            name = this.#holidays[date];
        } else {
            const game = games[Math.floor(Math.random() * games.length)];
            name = game.name;
            if (game.type)
                type = game.type;
        }

        this.discord.editStatus('online', {
            name, type
        });
    }

    private async hello(): Promise<void> {
        try {
            await snekfetch.post(`https://discordapp.com/api/channels/${this.config.discord.channels.botlog}/messages`)
                .set('Authorization', this.config.discord.token)
                .send({ content: 'My master process just initialized ' + moment().format('[on `]MMMM Do, YYYY[` at `]hh:mm:ss.SS[`]') + '.' });
        } catch (err) {
            this.logger.error('Could not post startup message', err);
        }
    }
}

const games: Array<{ name: string, type?: BotActivityType }> = [
    { name: 'with tiny bits of string!' },
    { name: 'with a mouse!' },
    { name: 'with a laser pointer!', type: 3 },
    { name: 'with a ball of yarn!' },
    { name: 'in a box!' },
    { name: 'the pitter-patter of tiny feet.', type: 2 }
];