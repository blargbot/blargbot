import { inspect } from 'node:util';

import { BBTagEngine, createTagVariableScopeFactory, subtags, templates, VariablesProvider } from '@blargbot/bbtag';
import type { ClusterOptions } from '@blargbot/cluster';
import type { Configuration } from '@blargbot/config';
import type { ImageChannel } from '@blargbot/contracts';
import { getImageChannel } from '@blargbot/contracts';
import type { EvalResult } from '@blargbot/core';
import { BaseClient, BaseService, ModuleLoader, snowflake } from '@blargbot/core';
import { TagVariableType } from '@blargbot/domain';
import type { Logger } from '@blargbot/logger';
import { memoize, ResetValue, sleep } from '@blargbot/util';
import { GatewayIntentBits } from 'discord-api-types/v9';
import moment from 'moment-timezone';

import { ClusterBBTagUtilities, ClusterSubtagConstructorArgs } from './ClusterBBTagUtilities.js';
import { ClusterUtilities } from './ClusterUtilities.js';
import type { ClusterWorker } from './ClusterWorker.js';
import { CommandDocumentationManager } from './managers/documentation/CommandDocumentationManager.js';
import { AggregateCommandManager, AnnouncementManager, AutoresponseManager, AwaiterManager, BotStaffManager, ContributorManager, CustomCommandManager, DefaultCommandManager, DomainManager, GreetingManager, GuildManager, IntervalManager, ModerationManager, PollManager, PrefixManager, RolemeManager, TimeoutManager, VersionStateManager } from './managers/index.js';

export class Cluster extends BaseClient {
    readonly #images = new ResetValue<ImageChannel>();

    public readonly id: number;
    public readonly createdAt: moment.Moment;
    public readonly worker: ClusterWorker;
    public readonly services: ModuleLoader<BaseService>;
    public readonly util: ClusterUtilities;
    public readonly timeouts: TimeoutManager;
    public readonly autoresponses: AutoresponseManager;
    public readonly contributors: ContributorManager;
    public readonly bbtag: BBTagEngine;
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
    public readonly announcements: AnnouncementManager;
    public readonly bbtagVariables: VariablesProvider;

    public get images(): ImageChannel {
        return this.#images.value;
    }

    public constructor(
        worker: ClusterWorker,
        logger: Logger,
        config: Configuration,
        fetch: typeof globalThis.fetch,
        options: ClusterOptions
    ) {
        super({
            logger,
            config,
            fetch,
            discordConfig: {
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
            }
        });

        this.id = options.id;
        this.worker = worker;
        this.createdAt = Object.freeze(moment());
        this.guilds = new GuildManager(this);
        this.domains = new DomainManager(this.database.vars);
        this.prefixes = new PrefixManager(this.config.discord.defaultPrefix, this.database.guilds, this.database.users, this.discord);
        this.commands = new AggregateCommandManager(this, {
            custom: new CustomCommandManager(this),
            default: new DefaultCommandManager(`${import.meta.dirname}/dcommands`, this)
        });
        this.events = new ModuleLoader(`${import.meta.dirname}/events`, BaseService, [this], this.logger, e => e.name);
        this.services = new ModuleLoader(`${import.meta.dirname}/services`, BaseService, [this, options], this.logger, e => e.name);
        this.util = new ClusterUtilities(this);
        this.timeouts = new TimeoutManager(this);
        this.autoresponses = new AutoresponseManager(this);
        this.contributors = new ContributorManager(this);
        this.polls = new PollManager(this);
        this.botStaff = new BotStaffManager(this);
        this.moderation = new ModerationManager(this);
        this.greetings = new GreetingManager(this);
        this.bbtagVariables = new VariablesProvider(
            createTagVariableScopeFactory(
                {
                    get: (scope, name) => this.database.tagVariables.get(name, scope),
                    upsert: (scope, entries) => this.database.tagVariables.upsert(entries, scope)
                },
                [
                    {
                        name: templates.subtag.variables.server.name,
                        prefix: '_',
                        description: templates.subtag.variables.server.description,
                        bind: ctx => ({
                            type: ctx.root.tagVars ? TagVariableType.GUILD_TAG : TagVariableType.GUILD_CC,
                            guildId: ctx.root.guildId
                        })
                    },
                    {
                        name: templates.subtag.variables.author.name,
                        prefix: '@',
                        description: templates.subtag.variables.author.description,
                        bind: ctx => ctx.root.authorId === undefined
                            ? { type: TagVariableType.TEMP, id: snowflake.create().toString() }
                            : { type: TagVariableType.AUTHOR, authorId: ctx.root.authorId }
                    },
                    {
                        name: templates.subtag.variables.global.name,
                        prefix: '*',
                        description: templates.subtag.variables.global.description,
                        bind: () => ({ type: TagVariableType.GLOBAL })
                    },
                    {
                        name: templates.subtag.variables.temporary.name,
                        prefix: '~',
                        description: templates.subtag.variables.temporary.description,
                        bind: () => ({ type: TagVariableType.TEMP, id: snowflake.create().toString() })
                    },
                    {
                        name: templates.subtag.variables.local.name,
                        prefix: '',
                        description: templates.subtag.variables.local.description,
                        bind: ctx => !ctx.root.tagVars
                            ? { type: TagVariableType.LOCAL_CC, guildId: ctx.root.guildId, name: ctx.root.tagName }
                            : { type: TagVariableType.LOCAL_TAG, name: ctx.root.tagName }
                    }
                ]
            ),
            {
                commitStarted: (context) => {
                    const execRunning = context.execTimer.running;
                    if (execRunning)
                        context.execTimer.end();
                    context.dbTimer.resume();
                    return {
                        [Symbol.dispose]: memoize(() => {
                            context.dbTimer.end();
                            if (execRunning)
                                context.execTimer.resume();
                        })
                    };
                },
                commitBatch: (_, size, scope) => {
                    this.logger.bbtag('Committing', size, 'objects to the', scope.prefix, 'pool.');
                    const start = performance.now();
                    return {
                        [Symbol.dispose]: memoize(() => {
                            const elapsed = performance.now() - start;
                            this.logger[elapsed > 3000 ? 'info' : 'bbtag']('Commited', size, 'objects to the', scope.prefix, 'pool in', elapsed, 'ms.');
                        })
                    };
                },
                getFailed: (_, error, varName, scope) => {
                    this.logger.error(error, { varName, scope: scope.scope });
                }
            }
        );
        const subtagArgs = new ClusterSubtagConstructorArgs(this);
        this.bbtag = new BBTagEngine({
            discord: this.discord,
            logger: this.logger,
            util: new ClusterBBTagUtilities(this),
            subtags: Object.values(subtags).map(subtag => new subtag(subtagArgs)),
            variables: this.bbtagVariables,
            sleep
        });
        this.intervals = new IntervalManager(this, moment.duration(10, 's'));
        this.rolemes = new RolemeManager(this);
        this.help = new CommandDocumentationManager(this);
        this.awaiter = new AwaiterManager(this.logger);
        this.version = new VersionStateManager(this.database.vars);
        this.announcements = new AnnouncementManager(this.database.guilds, this.util, this.commands.default);

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
            this.commands.load(),
            this.#connectImageChannel()
        ]);

        await this.services.init();
    }

    async #connectImageChannel(): Promise<void> {
        this.#images.resolve(await getImageChannel(this.amqp));
        this.logger.init('Image connection ready.');
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
