import { Cluster } from '@blargbot/cluster';
import { CommandGetResult, CommandManagers, ICommandManager } from '@blargbot/cluster/types.js';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import { MessageIdQueue } from '@blargbot/core/MessageIdQueue.js';
import { guard } from '@blargbot/core/utils/index.js';
import { CommandPermissions, NamedGuildCommandTag } from '@blargbot/domain/models/index.js';
import * as Eris from 'eris';

import { Command } from '../../command/index.js';
import templates from '../../text.js';

export class AggregateCommandManager implements ICommandManager, CommandManagers {
    public readonly messages: MessageIdQueue;
    public readonly custom: ICommandManager<NamedGuildCommandTag>;
    public readonly default: ICommandManager<Command>;
    readonly #managersArr: Array<CommandManagers[keyof CommandManagers]>;
    readonly #cluster: Cluster;

    public get size(): number { return this.#managersArr.reduce((p, c) => p + c.size, 0); }

    public constructor(
        cluster: Cluster,
        managers: CommandManagers
    ) {
        this.#cluster = cluster;
        cluster.discord.deleteMessage = (...args) => {
            this.messages.remove(args[0], args[1]);
            return Eris.Client.prototype.deleteMessage.call(cluster.discord, ...args);
        };
        cluster.discord.deleteMessages = (...args) => {
            for (const messageId of args[1])
                this.messages.remove(args[0], messageId);
            return Eris.Client.prototype.deleteMessages.call(cluster.discord, ...args);
        };

        this.messages = new MessageIdQueue(100);
        this.#managersArr = [
            this.custom = managers.custom,
            this.default = managers.default
        ];
    }

    public async load(commands?: Iterable<string> | boolean): Promise<void> {
        await Promise.all(this.#managersArr.map(m => m.load(commands)));
    }

    public async get(name: string, location?: Eris.Guild | Eris.KnownTextableChannel, user?: Eris.User): Promise<CommandGetResult> {
        let result: CommandGetResult;
        for (const manager of this.#managersArr) {
            result = await manager.get(name, location, user);
            if (result.state !== 'NOT_FOUND')
                return result;
        }
        return { state: 'NOT_FOUND' };
    }

    public async *list(location?: Eris.Guild | Eris.KnownTextableChannel, user?: Eris.User): AsyncGenerator<CommandGetResult> {
        const results = new Map<string, CommandGetResult[]>();

        for (const manager of this.#managersArr) {
            for await (const command of manager.list(location, user)) {
                switch (command.state) {
                    case 'DISABLED':
                    case 'MISSING_PERMISSIONS':
                    case 'MISSING_ROLE':
                    case 'ALLOWED': {
                        for (const name of [command.detail.command.name, ...command.detail.command.aliases].map(s => s.toLowerCase())) {
                            let res = results.get(name);
                            if (res === undefined)
                                results.set(name, res = []);
                            res.push(command);
                        }
                        break;
                    }
                    case 'NOT_IN_GUILD':
                    case 'BLACKLISTED':
                    case 'NOT_FOUND':
                        break;
                }
            }
        }

        const yielded = new Set<CommandGetResult>();
        for (const result of results.values()) {
            const toYield = result.find(x => x.state === 'ALLOWED') ?? result[0];
            if (yielded.size < yielded.add(toYield).size)
                yield toYield;
        }
    }

    public async configure(user: Eris.User, names: readonly string[], guild: Eris.Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]> {
        let remaining = [...names];
        const result = [];
        for (const manager of this.#managersArr) {
            const success = new Set(await manager.configure(user, remaining, guild, permissions));
            remaining = remaining.filter(n => !success.has(n));
            result.push(...success);
        }
        return result;
    }

    public async messageDeleted(message: Eris.PossiblyUncachedMessage): Promise<void> {
        if (!guard.isGuildMessage(message))
            return;
        if (!this.messages.has(message.channel.guild.id, message.id)
            || await this.#cluster.database.guilds.getSetting(message.channel.guild.id, 'deletenotif') !== true) {
            return;
        }

        let author: { username: string; discriminator: string; } | undefined;
        if ('author' in message)
            author = message.author;
        else {
            const chatlog = await this.#cluster.database.chatlogs.getByMessageId(message.id);
            if (chatlog !== undefined) {
                author = await this.#cluster.util.getUser(chatlog.userid);
            }
        }

        if (author !== undefined)
            await this.#cluster.util.send(message.channel.id, new FormattableMessageContent({
                content: templates.commands.$errors.messageDeleted({ user: author })
            }));
    }
}
