import { BaseCommand, CommandContext } from '@cluster/command';
import { CommandGetResult, CommandManagers, CommandResult, ICommand, ICommandManager } from '@cluster/types';
import { CommandPermissions, IMiddleware, NamedGuildCommandTag } from '@core/types';
import { Guild, Message, PartialMessage, TextBasedChannels, User } from 'discord.js';

export class AggregateCommandManager implements ICommandManager, CommandManagers {
    public readonly custom: ICommandManager<NamedGuildCommandTag>;
    public readonly default: ICommandManager<BaseCommand>;
    private readonly managersArr: Array<CommandManagers[keyof CommandManagers]>;

    public get size(): number { return this.managersArr.reduce((p, c) => p + c.size, 0); }

    public constructor(managers: CommandManagers) {
        this.managersArr = [
            this.custom = managers.custom,
            this.default = managers.default
        ];
    }

    public async load(commands?: Iterable<string> | boolean): Promise<void> {
        await Promise.all(this.managersArr.map(m => m.load(commands)));
    }

    public async execute(message: Message, prefix: string, middleware?: ReadonlyArray<IMiddleware<CommandContext, CommandResult>>): Promise<boolean> {
        for (const manager of this.managersArr) {
            if (await manager.execute(message, prefix, middleware))
                return true;
        }
        return false;
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

    public async configure(user: User, names: string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]> {
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
        await Promise.all(this.managersArr.map(manager => manager.messageDeleted(message)));
    }
}
