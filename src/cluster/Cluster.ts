
import { ClusterModuleLoader } from '../core/ClusterModuleLoader';
import { ClusterStats } from './ClusterStats';
import { ClusterUtilities } from './ClusterUtilities';
import { BaseClient } from '../core/BaseClient';
import { BaseEventHandler } from '../structures/BaseEventHandler';
import { BaseDCommand } from '../structures/BaseDCommand';
import { BaseTagHandler } from '../structures/BaseTagHandler';
import moment, { Moment } from 'moment-timezone';
import { EventManager } from '../structures/EventManager';
import { commandTypes, tagTypes } from '../newbu';
import { Sender } from '../structures/Sender';
import { BBEngine } from '../structures/BBEngine';

export interface ClusterOptions {
    id: string,
    sender: Sender,
    shardCount: number,
    firstShardId: number,
    lastShardId: number
}

export class Cluster extends BaseClient {
    public readonly id: string;
    public readonly createdAt: Moment;
    public readonly sender: Sender;
    public readonly commands: ClusterModuleLoader<BaseDCommand>;
    public readonly tags: ClusterModuleLoader<BaseTagHandler>;
    public readonly events: ClusterModuleLoader<BaseEventHandler>;
    public readonly stats: ClusterStats;
    public readonly util: ClusterUtilities;
    public readonly triggers: EventManager;
    public readonly bbtag: BBEngine;

    constructor(
        public readonly logger: CatLogger,
        public readonly config: Configuration,
        options: ClusterOptions,
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
        this.sender = options.sender;
        this.commands = new ClusterModuleLoader(this, 'dcommands', BaseDCommand, c => [c.name, ...c.aliases]);
        this.tags = new ClusterModuleLoader(this, 'tags', BaseTagHandler, t => [t.name, ...t.aliases]);
        this.events = new ClusterModuleLoader(this, 'events', BaseEventHandler, e => e.name);
        this.stats = new ClusterStats(this);
        this.util = new ClusterUtilities(this);
        this.triggers = new EventManager(this);
        this.bbtag = new BBEngine(this);

        this.events.on('add', (module: BaseEventHandler) => module.install());
        this.events.on('remove', (module: BaseEventHandler) => module.uninstall());
    }

    async start() {
        this.logger.init(`Starting cluster ${this.id}`);
        await Promise.all([
            super.start(),
            this.events.init().then(() => this.logger.init(moduleStats(this.events, 'Events', ev => ev.type))),
            this.commands.init().then(() => this.logger.init(moduleStats(this.commands, 'Commands', c => c.category, c => commandTypes.properties[c].name))),
            this.tags.init().then(() => this.logger.init(moduleStats(this.tags, 'Tags', c => c.category, c => tagTypes.properties[c].name))),
        ]);
        this.logger.init(`Cluster ${this.id} started`);
    }

    async eval(message: { author: { id: string } }, text: string, send: false): Promise<{ resultString: string, result: any } | undefined>;
    async eval(message: { author: { id: string }, channel: { id: string } }, text: string, send?: true): Promise<undefined>;
    async eval(message: { author: { id: string }, channel: { id: string } }, text: string, send = true) {
        if (message.author.id !== this.config.discord.users.owner)
            return;

        let resultString, result;
        var commandToProcess = text.replace('eval ', '');
        if (commandToProcess.startsWith('```js') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(6, commandToProcess.length - 3);
        else if (commandToProcess.startsWith('```') && commandToProcess.endsWith('```'))
            commandToProcess = commandToProcess.substring(4, commandToProcess.length - 3);
        try {
            let func;
            if (commandToProcess.split('\n').length === 1) {
                func = eval(`async () => ${commandToProcess}`);
            } else {
                func = eval(`async () => { ${commandToProcess} }`);
            }
            func.bind(this);
            let res = await func();
            result = res;
            resultString = `Input:
\`\`\`js
${commandToProcess}
\`\`\`
Output:
\`\`\`js
${res}
\`\`\``;
        } catch (err) {
            result = err;
            resultString = `An error occured!
\`\`\`js
${err.stack}
\`\`\``;
        }
        if (send)
            this.util.send(message.channel.id, resultString);
        else
            return { resultString, result };
    }
}

function moduleStats<TModule, TKey extends string | number>(
    loader: ClusterModuleLoader<TModule>,
    type: string,
    getKey: (module: TModule) => TKey,
    friendlyKey: (key: TKey) => string = k => k.toString()
) {
    const items = [...loader.list()];
    const groups = new Map<TKey, number>();
    const result = [`${type}: ${items.length}`];
    for (const item of items) {
        const key = getKey(item);
        groups.set(key, (groups.get(key) || 0) + 1);
    }
    for (const [key, count] of groups)
        result.push(`${friendlyKey(key)}: ${count}`);
    return result.join(' | ');
}