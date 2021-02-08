import { ClusterModuleLoader } from '../core/ClusterModuleLoader';
import { ClusterUtilities } from './ClusterUtilities';
import { BaseClient } from '../core/BaseClient';
import { BaseEventHandler } from '../structures/BaseEventHandler';
import { BaseDCommand } from '../structures/BaseDCommand';
import { BaseSubtagHandler } from '../structures/BaseSubtagHandler';
import moment, { Moment } from 'moment-timezone';
import { EventManager } from '../structures/EventManager';
import { commandTypes, tagTypes } from '../newbu';
import { BBEngine } from '../structures/BBEngine';
import { ClusterWorker } from '../workers/ClusterWorker';
import { ImageConnection } from '../workers/ImageConnection';

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
    public readonly commands: ClusterModuleLoader<BaseDCommand>;
    public readonly subtags: ClusterModuleLoader<BaseSubtagHandler>;
    public readonly events: ClusterModuleLoader<BaseEventHandler>;
    public readonly util: ClusterUtilities;
    public readonly triggers: EventManager;
    public readonly bbtag: BBEngine;
    public readonly images: ImageConnection;

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
        this.commands = new ClusterModuleLoader('dcommands', this, BaseDCommand, c => [c.name, ...c.aliases]);
        this.subtags = new ClusterModuleLoader('tags', this, BaseSubtagHandler, t => [t.name, ...t.aliases]);
        this.events = new ClusterModuleLoader('events', this, BaseEventHandler, e => e.name);
        this.util = new ClusterUtilities(this);
        this.triggers = new EventManager(this);
        this.bbtag = new BBEngine(this);
        this.images = new ImageConnection(1, this.logger);

        this.events.on('add', (module: BaseEventHandler) => module.install());
        this.events.on('remove', (module: BaseEventHandler) => module.uninstall());
    }

    public async start(): Promise<void> {
        await Promise.all([
            super.start(),
            this.events.init(),
            this.commands.init(),
            this.subtags.init(),
            this.images.connect(20000)
        ]);

        this.logger.init(moduleStats(this.events, 'Events', ev => ev.type));
        this.logger.init(moduleStats(this.commands, 'Commands', c => c.category, c => commandTypes.properties[c].name));
        this.logger.init(moduleStats(this.subtags, 'Tags', c => c.category, c => tagTypes.properties[c].name));
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

function moduleStats<TModule, TKey extends string | number>(
    loader: ClusterModuleLoader<TModule>,
    type: string,
    getKey: (module: TModule) => TKey,
    friendlyKey: (key: TKey) => string = k => k.toString()
): string {
    const items = [...loader.list()];
    const groups = new Map<TKey, number>();
    const result = [];
    for (const item of items) {
        const key = getKey(item);
        groups.set(key, (groups.get(key) || 0) + 1);
    }
    for (const [key, count] of groups)
        result.push(`${friendlyKey(key)}: ${count}`);
    return `${type}: ${items.length} [${result.join(' | ')}]`;
}