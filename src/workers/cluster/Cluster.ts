import moment, { Moment } from 'moment-timezone';
import { ImageConnection } from '../image/ImageConnection';
import { ClusterUtilities } from './ClusterUtilities';
import { ClusterWorker } from './ClusterWorker';
import { BaseClient, BaseCommand, BaseService, BaseSubtag, BBTagEngine, ClusterOptions, commandTypes, ModuleLoader, tagTypes, TimeoutManager, Logger } from './core';
import { AutoresponseManager, BotStaffManager } from './managers';

export class Cluster extends BaseClient {
    public readonly id: number;
    public readonly createdAt: Moment;
    public readonly worker: ClusterWorker;
    public readonly commands: ModuleLoader<BaseCommand>;
    public readonly subtags: ModuleLoader<BaseSubtag>;
    public readonly services: ModuleLoader<BaseService>;
    public readonly util: ClusterUtilities;
    public readonly timeouts: TimeoutManager;
    public readonly autoresponses: AutoresponseManager;
    public readonly bbtag: BBTagEngine;
    public readonly images: ImageConnection;
    public readonly events: ModuleLoader<BaseService>;
    public readonly botStaff: BotStaffManager;

    public constructor(
        logger: Logger,
        config: Configuration,
        options: ClusterOptions
    ) {
        super(logger, config, {
            autoreconnect: true,
            allowedMentions: {
                everyone: false,
                roles: false,
                users: false
            },
            getAllUsers: false,
            disableEvents: {
                /* eslint-disable @typescript-eslint/naming-convention */
                TYPING_START: true,
                VOICE_STATE_UPDATE: true
                /* eslint-enable @typescript-eslint/naming-convention */
            },
            maxShards: options.shardCount,
            firstShardID: options.firstShardId,
            lastShardID: options.lastShardId,
            defaultImageSize: 512,
            messageLimit: 5,
            intents: [
                'guilds',
                'guildMembers',
                'guildBans',
                'guildPresences',
                'guildMessages',
                'guildMessageReactions',
                'guildEmojis',
                'directMessages',
                'directmessageReactions'
            ]
        });
        this.id = options.id;
        this.createdAt = moment();
        this.worker = options.worker;
        this.commands = new ModuleLoader(`${__dirname}/dcommands`, BaseCommand, [this], this.logger, c => [c.name, ...c.aliases]);
        this.subtags = new ModuleLoader(`${__dirname}/subtags`, BaseSubtag, [this], this.logger, t => [t.name, ...t.aliases]);
        this.events = new ModuleLoader(`${__dirname}/events`, BaseService, [this], this.logger, e => e.name);
        this.services = new ModuleLoader(`${__dirname}/services`, BaseService, [this], this.logger, e => e.name);
        this.util = new ClusterUtilities(this);
        this.timeouts = new TimeoutManager(this);
        this.autoresponses = new AutoresponseManager(this);
        this.botStaff = new BotStaffManager(this);
        this.bbtag = new BBTagEngine(this);
        this.images = new ImageConnection(1, this.logger);

        this.services.on('add', (module: BaseService) => void module.start());
        this.services.on('remove', (module: BaseService) => void module.stop());
        this.events.on('add', (module: BaseService) => void module.start());
        this.events.on('remove', (module: BaseService) => void module.stop());
    }

    public async start(): Promise<void> {
        await this.events.init();
        this.logger.init(this.moduleStats(this.events, 'Events', ev => ev.type));

        await Promise.all([
            super.start(),
            this.commands.init(),
            this.subtags.init(),
            this.images.connect(20000)
        ]);

        this.logger.init(this.moduleStats(this.commands, 'Commands', c => c.category, c => commandTypes.properties[c].name));
        this.logger.init(this.moduleStats(this.subtags, 'Tags', c => c.category, c => tagTypes.properties[c].name));

        await this.services.init();
        this.logger.init(this.moduleStats(this.services, 'Services', ev => ev.type));
    }

    public async eval(author: string, text: string): Promise<{ success: boolean; result: unknown; }> {
        if (author !== this.config.discord.users.owner)
            throw new Error(`User ${author} does not have permission to run eval`);

        try {
            const code = text.split('\n').length === 1
                ? `async () => ${text}`
                : `async () => { ${text} }`;
            const func = eval(code) as () => Promise<unknown>;
            return { success: true, result: await func.call(this) };
        } catch (err: unknown) {
            return { success: false, result: err };
        }
    }
}
