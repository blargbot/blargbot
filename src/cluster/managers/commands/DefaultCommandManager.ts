import { Cluster } from '@blargbot/cluster';
import { BaseCommand, CommandContext } from '@blargbot/cluster/command';
import { CommandGetCoreResult, CommandParameter, CommandResult, CommandSignature, ICommand } from '@blargbot/cluster/types';
import { commandTypeDetails, guard } from '@blargbot/cluster/utils';
import { metrics } from '@blargbot/core/Metrics';
import { ModuleLoader } from '@blargbot/core/modules';
import { Timer } from '@blargbot/core/Timer';
import { CommandPermissions, FlagDefinition, NextMiddleware } from '@blargbot/core/types';
import { Guild, KnownTextableChannel, User } from 'eris';

import { BaseCommandManager } from './BaseCommandManager';

export class DefaultCommandManager extends BaseCommandManager<BaseCommand> {
    public readonly modules: ModuleLoader<BaseCommand>;

    public get size(): number { return this.modules.size; }

    public constructor(source: string, cluster: Cluster) {
        super(cluster);
        this.modules = new ModuleLoader(source, BaseCommand, [cluster], cluster.logger, command => [command.name, ...command.aliases]);
    }

    public async load(commands?: Iterable<string> | boolean): Promise<void> {
        if (commands === undefined || typeof commands === 'boolean')
            await this.modules.reload(commands ?? true);
        else
            this.modules.reload(this.modules.source(commands));
    }

    protected async getCore(name: string, location?: Guild | KnownTextableChannel, user?: User): Promise<CommandGetCoreResult<BaseCommand>> {
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

    public async execute(context: CommandContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        const timer = new Timer().start();
        try {
            return await this.implementation.execute(context, next);
        } catch (err: unknown) {
            metrics.commandError.labels(this.name).inc();
            throw err;
        } finally {
            timer.end();
            metrics.commandLatency.labels(this.name, commandTypeDetails[this.implementation.category].name.toLowerCase()).observe(timer.elapsed);
            metrics.commandCounter.labels(this.name, commandTypeDetails[this.implementation.category].name.toLowerCase()).inc();
        }
    }
}
