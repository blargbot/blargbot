import { Cluster } from '@blargbot/cluster';
import { Command } from '@blargbot/cluster/command';
import { CommandGetResult, CommandManagers, ICommandManager } from '@blargbot/cluster/types';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent';
import { MessageIdQueue } from '@blargbot/core/MessageIdQueue';
import { guard } from '@blargbot/core/utils';
import { CommandPermissions, NamedGuildCommandTag } from '@blargbot/domain/models';
import { Client as Discord, Guild, KnownTextableChannel, PossiblyUncachedMessage, User } from 'eris';

import templates from '../../text';

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
            return Discord.prototype.deleteMessage.call(cluster.discord, ...args);
        };
        cluster.discord.deleteMessages = (...args) => {
            for (const messageId of args[1])
                this.messages.remove(args[0], messageId);
            return Discord.prototype.deleteMessages.call(cluster.discord, ...args);
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

    public async get(name: string, location?: Guild | KnownTextableChannel, user?: User): Promise<CommandGetResult> {
        let result: CommandGetResult;
        for (const manager of this.#managersArr) {
            result = await manager.get(name, location, user);
            if (result.state !== 'NOT_FOUND')
                return result;
        }
        return { state: 'NOT_FOUND' };
    }

    public async *list(location?: Guild | KnownTextableChannel, user?: User): AsyncGenerator<CommandGetResult> {
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

    public async configure(user: User, names: readonly string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]> {
        let remaining = [...names];
        const result = [];
        for (const manager of this.#managersArr) {
            const success = new Set(await manager.configure(user, remaining, guild, permissions));
            remaining = remaining.filter(n => !success.has(n));
            result.push(...success);
        }
        return result;
    }

    public async messageDeleted(message: PossiblyUncachedMessage): Promise<void> {
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
