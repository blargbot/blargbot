import { BaseSubtag, BBTagEngine } from '@cluster/bbtag';
import { TimeoutManager } from '@cluster/TimeoutManager';
import { ClusterOptions } from '@cluster/types';
import { getRange } from '@cluster/utils';
import { BaseClient } from '@core/BaseClient';
import { Logger } from '@core/Logger';
import { ModuleLoader } from '@core/modules';
import { BaseService } from '@core/serviceTypes';
import { EvalResult } from '@core/types';
import { ImagePool } from '@image';
import { Options, Util } from 'discord.js';
import moment, { duration, Moment } from 'moment-timezone';

import { ClusterUtilities } from './ClusterUtilities';
import { ClusterWorker } from './ClusterWorker';
import { AggregateCommandManager, AutoresponseManager, BotStaffManager, ContributorManager, CustomCommandManager, DefaultCommandManager, DomainManager, GreetingManager, IntervalManager, MessageAwaitManager, ModerationManager, PollManager, PrefixManager, ReactionAwaitManager, RolemeManager } from './managers';

export class Cluster extends BaseClient {
    public readonly id: number;
    public readonly createdAt: Moment;
    public readonly worker: ClusterWorker;
    public readonly subtags: ModuleLoader<BaseSubtag>;
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
    public readonly await: { reactions: ReactionAwaitManager; messages: MessageAwaitManager; };

    public constructor(
        logger: Logger,
        config: Configuration,
        options: ClusterOptions
    ) {
        super(logger, config, {
            allowedMentions: { parse: [] },
            shardCount: options.shardCount,
            shards: getRange(options.firstShardId, options.lastShardId),
            /* eslint-disable @typescript-eslint/naming-convention */
            makeCache: Options.cacheWithLimits({
                MessageManager: 5,
                ChannelManager: {
                    sweepInterval: 3600,
                    sweepFilter: Util.archivedThreadSweepFilter()
                },
                GuildChannelManager: {
                    sweepInterval: 3600,
                    sweepFilter: Util.archivedThreadSweepFilter()
                },
                ThreadManager: {
                    sweepInterval: 3600,
                    sweepFilter: Util.archivedThreadSweepFilter()
                }
            }),
            /* eslint-enable @typescript-eslint/naming-convention */
            intents: [
                'GUILDS',
                'GUILD_MEMBERS',
                'GUILD_BANS',
                'GUILD_PRESENCES',
                'GUILD_MESSAGES',
                'GUILD_MESSAGE_REACTIONS',
                'GUILD_EMOJIS_AND_STICKERS',
                'DIRECT_MESSAGES',
                'DIRECT_MESSAGE_REACTIONS'
            ],
            partials: ['CHANNEL', 'MESSAGE', 'REACTION']
        });
        this.id = options.id;
        this.createdAt = Object.freeze(moment());
        this.worker = options.worker;
        this.domains = new DomainManager(this.database.vars);
        this.images = new ImagePool(this.id, config.discord.images, this.logger);
        this.prefixes = new PrefixManager(this.config.discord.defaultPrefix, this.database.guilds, this.database.users);
        this.commands = new AggregateCommandManager({
            custom: new CustomCommandManager(this),
            default: new DefaultCommandManager(`${__dirname}/dcommands`, this)
        });
        this.subtags = new ModuleLoader(`${__dirname}/subtags`, BaseSubtag, [this], this.logger, t => [t.name, ...t.aliases]);
        this.events = new ModuleLoader(`${__dirname}/events`, BaseService, [this], this.logger, e => e.name);
        this.services = new ModuleLoader(`${__dirname}/services`, BaseService, [this], this.logger, e => e.name);
        this.util = new ClusterUtilities(this);
        this.timeouts = new TimeoutManager(this);
        this.autoresponses = new AutoresponseManager(this);
        this.contributors = new ContributorManager(this);
        this.polls = new PollManager(this);
        this.botStaff = new BotStaffManager(this);
        this.moderation = new ModerationManager(this);
        this.greetings = new GreetingManager(this);
        this.bbtag = new BBTagEngine(this);
        this.intervals = new IntervalManager(this, duration(10, 's'));
        this.rolemes = new RolemeManager(this);
        this.await = {
            reactions: new ReactionAwaitManager(this),
            messages: new MessageAwaitManager(this)
        };

        this.services.on('add', module => void module.start());
        this.services.on('remove', module => void module.stop());
        this.events.on('add', module => void module.start());
        this.events.on('remove', module => void module.stop());
    }

    public async start(): Promise<void> {
        await this.events.init();

        await Promise.all([
            super.start(),
            this.commands.load(),
            this.subtags.init()
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
            return { success: false, error: err };
        }
    }
}
