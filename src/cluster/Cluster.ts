import { BBTagEngine, subtags } from '@blargbot/bbtag';
import { ClusterOptions } from '@blargbot/cluster/types';
import { Configuration } from '@blargbot/config';
import { BaseClient } from '@blargbot/core/BaseClient';
import { ModuleLoader } from '@blargbot/core/modules';
import { BaseService } from '@blargbot/core/serviceTypes';
import { EvalResult } from '@blargbot/core/types';
import { ImagePool } from '@blargbot/image';
import { Logger } from '@blargbot/logger';
import { GatewayIntentBits } from 'discord-api-types/v9';
import moment, { duration, Moment } from 'moment-timezone';
import { inspect } from 'util';

import { ClusterBBTagUtilities } from './ClusterBBTagUtilities';
import { ClusterUtilities } from './ClusterUtilities';
import { ClusterWorker } from './ClusterWorker';
import { AggregateCommandManager, AutoresponseManager, AwaiterManager, BotStaffManager, ContributorManager, CustomCommandManager, DefaultCommandManager, DomainManager, GreetingManager, GuildManager, IntervalManager, ModerationManager, PollManager, PrefixManager, RolemeManager, TimeoutManager, VersionStateManager } from './managers';
import { CommandDocumentationManager } from './managers/documentation/CommandDocumentationManager';

export class Cluster extends BaseClient {
    public readonly id: number;
    public readonly createdAt: Moment;
    public readonly worker: ClusterWorker;
    public readonly services: ModuleLoader<BaseService>;
    public readonly util: ClusterUtilities;
    public readonly timeouts: TimeoutManager;
    public readonly autoresponses: AutoresponseManager;
    public readonly contributors: ContributorManager;
    public readonly bbtag: BBTagEngine;
    public readonly images: ImagePool;
    public readonly events: ModuleLoader<BaseService>;
    public readonly botStaff: BotStaffManager;
    public readonly moderation: ModerationManager;
    public readonly prefixes: PrefixManager;
    public readonly commands: AggregateCommandManager;
    public readonly domains: DomainManager;
    public readonly greetings: GreetingManager;
    public readonly polls: PollManager;
    public readonly intervals: IntervalManager;
    public readonly rolemes: RolemeManager;
    public readonly help: CommandDocumentationManager;
    public readonly awaiter: AwaiterManager;
    public readonly version: VersionStateManager;
    public readonly guilds: GuildManager;

    public constructor(
        worker: ClusterWorker,
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
                ['TYPING_START']: true,
                ['VOICE_STATE_UPDATE']: true
            },
            maxShards: options.shardCount,
            firstShardID: options.firstShardId,
            lastShardID: options.lastShardId,
            restMode: true,
            defaultImageFormat: 'png',
            defaultImageSize: 512,
            messageLimit: 5,
            intents: GatewayIntentBits.Guilds
                | GatewayIntentBits.GuildMembers
                | GatewayIntentBits.GuildBans
                | GatewayIntentBits.GuildPresences
                | GatewayIntentBits.GuildMessages
                | GatewayIntentBits.GuildMessageReactions
                | GatewayIntentBits.GuildEmojisAndStickers
                | GatewayIntentBits.DirectMessages
                | GatewayIntentBits.DirectMessageReactions
        });

        this.id = options.id;
        this.worker = worker;
        this.createdAt = Object.freeze(moment());
        this.guilds = new GuildManager(this);
        this.domains = new DomainManager(this.database.vars);
        this.images = new ImagePool(this.id, config.discord.images, this.logger);
        this.prefixes = new PrefixManager(this.config.discord.defaultPrefix, this.database.guilds, this.database.users, this.discord);
        this.commands = new AggregateCommandManager(this, {
            custom: new CustomCommandManager(this),
            default: new DefaultCommandManager(`${__dirname}/dcommands`, this)
        });
        this.events = new ModuleLoader(`${__dirname}/events`, BaseService, [this], this.logger, e => e.name);
        this.services = new ModuleLoader(`${__dirname}/services`, BaseService, [this, options], this.logger, e => e.name);
        this.util = new ClusterUtilities(this);
        this.timeouts = new TimeoutManager(this);
        this.autoresponses = new AutoresponseManager(this);
        this.contributors = new ContributorManager(this);
        this.polls = new PollManager(this);
        this.botStaff = new BotStaffManager(this);
        this.moderation = new ModerationManager(this);
        this.greetings = new GreetingManager(this);
        this.bbtag = new BBTagEngine({
            config: this.config,
            database: this.database,
            discord: this.discord,
            logger: this.logger,
            util: new ClusterBBTagUtilities(this),
            subtags: Object.values(subtags.all)
                .map(subtag => new subtag())
        });
        this.intervals = new IntervalManager(this, duration(10, 's'));
        this.rolemes = new RolemeManager(this);
        this.help = new CommandDocumentationManager(this);
        this.awaiter = new AwaiterManager(this.logger);
        this.version = new VersionStateManager(this.database.vars);

        this.services.on('add', module => void module.start());
        this.services.on('remove', module => void module.stop());
        this.events.on('add', module => void module.start());
        this.events.on('remove', module => void module.stop());
        this.discord.on('interactionCreate', i => this.help.handleInteraction(i));
    }

    public async start(): Promise<void> {
        await this.events.init();

        await Promise.all([
            super.start(),
            this.connectDiscordGateway(),
            this.commands.load()
        ]);

        await this.services.init();
    }

    public async eval(this: Cluster, author: string, text: string): Promise<EvalResult> {
        if (this.util.isBotOwner(author) === false)
            throw new Error(`User ${author} does not have permission to run eval`);

        try {
            const code = text.split('\n').length === 1
                ? `async () => (${text})`
                : `async () => { ${text} }`;
            const func = eval(code) as () => Promise<unknown>;
            return { success: true, result: await func.call(this) };
        } catch (err: unknown) {
            return { success: false, error: inspect(err) };
        }
    }
}
