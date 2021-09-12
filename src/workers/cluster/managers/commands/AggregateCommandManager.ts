import { Cluster } from '@cluster';
import { BaseCommand } from '@cluster/command';
import { CommandGetResult, CommandManagers, ICommand, ICommandManager } from '@cluster/types';
import { MessageIdQueue } from '@core/MessageIdQueue';
import { CommandPermissions, NamedGuildCommandTag } from '@core/types';
import { guard, humanize } from '@core/utils';
import { Guild, Message, PartialMessage, TextBasedChannels, User } from 'discord.js';

export class AggregateCommandManager implements ICommandManager, CommandManagers {
    public readonly messages: MessageIdQueue;
    public readonly custom: ICommandManager<NamedGuildCommandTag>;
    public readonly default: ICommandManager<BaseCommand>;
    private readonly managersArr: Array<CommandManagers[keyof CommandManagers]>;

    public get size(): number { return this.managersArr.reduce((p, c) => p + c.size, 0); }

    public constructor(
        private readonly cluster: Cluster,
        managers: CommandManagers
    ) {
        this.messages = new MessageIdQueue(100);
        this.managersArr = [
            this.custom = managers.custom,
            this.default = managers.default
        ];
    }

    public async load(commands?: Iterable<string> | boolean): Promise<void> {
        await Promise.all(this.managersArr.map(m => m.load(commands)));
    }

    public async get(name: string, location?: Guild | TextBasedChannels, user?: User): Promise<CommandGetResult> {
        let result: CommandGetResult;
        for (const manager of this.managersArr) {
            result = await manager.get(name, location, user);
            if (result.state !== 'NOT_FOUND')
                return result;
        }
        return { state: 'NOT_FOUND' };
    }

    public async *list(location?: Guild | TextBasedChannels, user?: User): AsyncGenerator<ICommand> {
        const commandNames = new Set<string>();
        for (const manager of this.managersArr) {
            for await (const command of manager.list(location, user)) {
                for (const name of [command.name, ...command.aliases]) {
                    if (commandNames.size < commandNames.add(name.toLowerCase()).size) {
                        yield command;
                        break;
                    }
                }
            }
        }
    }

    public async configure(user: User, names: readonly string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]> {
        let remaining = [...names];
        const result = [];
        for (const manager of this.managersArr) {
            const success = new Set(await manager.configure(user, remaining, guild, permissions));
            remaining = remaining.filter(n => !success.has(n));
            result.push(...success);
        }
        return result;
    }

    public async messageDeleted(message: Message | PartialMessage): Promise<void> {
        if (!guard.isGuildMessage(message))
            return;
        if (!this.messages.has(message.channel.guild.id, message.id)
            || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'deletenotif') !== true) {
            return;
        }

        let author: string | undefined;
        if (!message.partial)
            author = humanize.fullName(message.author);
        else {
            const chatlog = await this.cluster.database.chatlogs.getByMessageId(message.id);
            if (chatlog !== undefined) {
                author = (await this.cluster.util.getUser(chatlog.userid))?.username;
            }
        }

        if (author !== undefined)
            await this.cluster.util.send(message.channel.id, `**${author}** deleted their command message.`);
    }
}
