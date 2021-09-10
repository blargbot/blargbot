import { Cluster } from '@cluster';
import { BaseCommand, CommandContext, ErrorMiddleware } from '@cluster/command';
import { CommandGetCoreResult, CommandParameter, CommandSignature, FlagDefinition, ICommand } from '@cluster/types';
import { commandTypeDetails, guard } from '@cluster/utils';
import { metrics } from '@core/Metrics';
import { ModuleLoader } from '@core/modules';
import { Timer } from '@core/Timer';
import { CommandPermissions } from '@core/types';
import { Guild, TextBasedChannels, User } from 'discord.js';

import { BaseCommandManager } from './BaseCommandManager';

export class DefaultCommandManager extends BaseCommandManager<BaseCommand> {
    public readonly modules: ModuleLoader<BaseCommand>;

    public get size(): number { return this.modules.size; }

    public constructor(source: string, cluster: Cluster) {
        super('Default', cluster, [
            new ErrorMiddleware()
        ]);
        this.modules = new ModuleLoader(source, BaseCommand, [cluster], cluster.logger, command => [command.name, ...command.aliases]);
    }

    public async load(commands?: Iterable<string> | boolean): Promise<void> {
        await Promise.all([
            super.load(commands),
            commands === undefined || typeof commands === 'boolean'
                ? this.modules.reload(commands ?? true)
                : this.modules.reload(this.modules.source(commands))
        ]);
    }

    protected async getCore(name: string, location?: Guild | TextBasedChannels, user?: User): Promise<CommandGetCoreResult<BaseCommand>> {
        const command = this.modules.get(name);
        if (command === undefined || !await command.isVisible(this.cluster.util, location, user))
            return { state: 'NOT_FOUND' };

        if (location === undefined)
            return { state: 'FOUND', detail: new NormalizedCommand(command, {}) };

        const guild = location instanceof Guild ? location
            : guard.isGuildChannel(location) ? location.guild
                : undefined;

        const permissions = guild === undefined ? {} : { ...await this.cluster.database.guilds.getCommandPerms(guild.id, name) };
        if (command.cannotDisable)
            permissions.disabled = false;

        return { state: 'FOUND', detail: new NormalizedCommand(command, permissions) };
    }

    protected *allCommandNames(): Generator<string> {
        for (const command of this.modules.list())
            yield command.name;
    }

    public async configure(user: User, names: string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]> {
        if (names.length === 0)
            return [];

        const visible = await Promise.all(
            names.map(n => this.modules.get(n))
                .filter(guard.hasValue)
                .map(async m => ({ isVisible: await m.isVisible(this.cluster.util, guild, user), name: m.name }))
        );

        names = visible.filter(x => x.isVisible).map(x => x.name);

        if (names.length === 0)
            return [];

        return await this.cluster.database.guilds.setCommandPerms(guild.id, names, permissions);
    }
}

class NormalizedCommand implements ICommand<BaseCommand> {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly description: string | undefined;
    public readonly signatures: ReadonlyArray<CommandSignature<CommandParameter>>;
    public readonly disabled: boolean;
    public readonly permission: string;
    public readonly roles: readonly string[];
    public readonly hidden: boolean;
    public readonly category: string;
    public readonly flags: readonly FlagDefinition[];

    public constructor(
        public readonly implementation: BaseCommand,
        permissions: CommandPermissions
    ) {
        this.name = implementation.name;
        this.aliases = implementation.aliases;
        this.description = implementation.description ?? undefined;
        this.signatures = implementation.signatures;
        this.disabled = permissions.disabled === true;
        this.permission = permissions.permission ?? commandTypeDetails[implementation.category].defaultPerms.toString();
        this.roles = permissions.roles ?? [];
        this.hidden = permissions.hidden ?? false;
        this.category = commandTypeDetails[implementation.category].name;
        this.flags = implementation.flags;
    }

    public async execute(context: CommandContext): Promise<void> {
        try {
            const timer = new Timer().start();
            await this.implementation.execute(context);
            timer.end();
            metrics.commandLatency.labels(this.name, commandTypeDetails[this.implementation.category].name.toLowerCase()).observe(timer.elapsed);
            metrics.commandCounter.labels(this.name, commandTypeDetails[this.implementation.category].name.toLowerCase()).inc();
        } catch (err: unknown) {
            metrics.commandError.labels(this.name).inc();
            throw err;
        }
    }
}
