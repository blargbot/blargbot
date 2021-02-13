import { ModuleLoader } from '../core/ModuleLoader';
import { ClusterUtilities } from './ClusterUtilities';
import { BaseClient } from '../core/BaseClient';
import { BaseDCommand } from '../structures/BaseDCommand';
import { BaseSubtagHandler } from '../structures/BaseSubtagHandler';
import moment, { Moment } from 'moment-timezone';
import { EventManager } from '../structures/EventManager';
import { commandTypes, tagTypes } from '../utils';
import { BBEngine } from '../structures/BBEngine';
import { ClusterWorker } from '../workers/ClusterWorker';
import { ImageConnection } from '../workers/ImageConnection';
import { BaseService } from '../structures/BaseService';

export interface ClusterOptions {
    id: number,
    worker: ClusterWorker,
    shardCount: number,
    firstShardId: number,
    lastShardId: number
}

export class Cluster extends BaseClient {
    public readonly id: number;
    public readonly createdAt: Moment;
    public readonly worker: ClusterWorker;
    public readonly commands: ModuleLoader<BaseDCommand>;
    public readonly subtags: ModuleLoader<BaseSubtagHandler>;
    public readonly services: ModuleLoader<BaseService>;
    public readonly util: ClusterUtilities;
    public readonly triggers: EventManager;
    public readonly bbtag: BBEngine;
    public readonly images: ImageConnection;
    public readonly eventHandlers: ModuleLoader<BaseService>;

    public constructor(
        logger: CatLogger,
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
                TYPING_START: true,
                VOICE_STATE_UPDATE: true
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
        this.commands = new ModuleLoader('dcommands', BaseDCommand, [this], this.logger, c => [c.name, ...c.aliases]);
        this.subtags = new ModuleLoader('tags', BaseSubtagHandler, [this], this.logger, t => [t.name, ...t.aliases]);
        this.eventHandlers = new ModuleLoader('cluster/events', BaseService, [this], this.logger, e => e.name);
        this.services = new ModuleLoader('cluster/services', BaseService, [this], this.logger, e => e.name);
        this.util = new ClusterUtilities(this);
        this.triggers = new EventManager(this);
        this.bbtag = new BBEngine(this);
        this.images = new ImageConnection(1, this.logger);

        this.services.on('add', (module: BaseService) => void module.start());
        this.services.on('remove', (module: BaseService) => void module.stop());
        this.eventHandlers.on('add', (module: BaseService) => void module.start());
        this.eventHandlers.on('remove', (module: BaseService) => void module.stop());
    }

    public async start(): Promise<void> {
        await this.eventHandlers.init();
        this.logger.init(this.moduleStats(this.eventHandlers, 'Events', ev => ev.type));

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

    public async eval(author: string, text: string): Promise<{ success: boolean, result: unknown }> {
        if (author !== this.config.discord.users.owner)
            throw new Error(`User ${author} does not have permission to run eval`);

        try {
            const func: () => Promise<unknown>
                = eval(text.split('\n').length === 1
                    ? `async () => ${text}`
                    : `async () => { ${text} }`);
            return { success: true, result: await func.call(this) };
        } catch (err) {
            return { success: false, result: err };
        }
    }
}