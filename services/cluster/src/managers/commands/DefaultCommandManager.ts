import type { Cluster } from '@blargbot/cluster';
import type { CommandGetCoreResult, CommandParameter, CommandProperties, CommandResult, CommandSignature, ICommand } from '@blargbot/cluster/types.js';
import { commandTypeDetails } from '@blargbot/cluster/utils/index.js';
import { metrics } from '@blargbot/core/Metrics.js';
import type { NextMiddleware } from '@blargbot/core/types.js';
import { isGuildChannel } from '@blargbot/discord-util';
import type { CommandPermissions } from '@blargbot/domain/models/index.js';
import type { IFormattable } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';
import type { FlagDefinition } from '@blargbot/input';
import { ModuleLoader } from '@blargbot/modules';
import { Timer } from '@blargbot/timer';
import * as Eris from 'eris';

import type { CommandContext } from '../../command/index.js';
import { Command } from '../../command/index.js';
import { CommandManager } from './CommandManager.js';

export class DefaultCommandManager extends CommandManager<Command> {
    public readonly modules: ModuleLoader<Command>;

    public get size(): number { return this.modules.size; }

    public constructor(context: ImportMeta, source: string, cluster: Cluster) {
        super(cluster);
        this.modules = new ModuleLoader(context, source, Command, [cluster], cluster.logger, command => [command.name, ...command.aliases]);
    }

    public async load(rediscover = true): Promise<void> {
        await this.modules.reload(rediscover);
    }

    protected async getCore(name: string, location?: Eris.Guild | Eris.KnownTextableChannel, user?: Eris.User): Promise<CommandGetCoreResult<Command>> {
        const command = this.modules.get(name);
        if (command === undefined)
            return { state: 'NOT_FOUND' };

        if (!await command.isVisible(this.cluster.util, location, user))
            return { state: 'DISABLED', detail: { command: new NormalizedCommand(command, { disabled: true }), reason: undefined } };

        const defaultPermission = commandTypeDetails[command.category].defaultPerms.toString();
        if (location === undefined)
            return { state: 'FOUND', detail: new NormalizedCommand(command, { permission: defaultPermission }) };

        const guild = location instanceof Eris.Guild ? location
            : isGuildChannel(location) ? location.guild
                : undefined;

        const permissions = guild === undefined ? {} : { ...await this.cluster.database.guilds.getCommandPerms(guild.id, command.name) };
        if (command.cannotDisable)
            permissions.disabled = false;
        if (permissions.permission === undefined && (permissions.roles?.length ?? 0) === 0)
            permissions.permission = defaultPermission;

        return { state: 'FOUND', detail: new NormalizedCommand(command, permissions) };
    }

    protected *allCommandNames(): Generator<string> {
        for (const command of this.modules.list())
            yield command.name;
    }

    public async configure(user: Eris.User, names: string[], guild: Eris.Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]> {
        if (names.length === 0)
            return [];

        const visible = await Promise.all(
            names.map(n => this.modules.get(n))
                .filter(hasValue)
                .map(async m => ({ isVisible: await m.isVisible(this.cluster.util, guild, user), name: m.name }))
        );

        names = visible.filter(x => x.isVisible).map(x => x.name);

        if (names.length === 0)
            return [];

        return await this.cluster.database.guilds.setCommandPerms(guild.id, names, permissions);
    }
}

class NormalizedCommand implements ICommand<Command> {
    public readonly id: string;
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly description: IFormattable<string> | undefined;
    public readonly signatures: ReadonlyArray<CommandSignature<IFormattable<string>, CommandParameter>>;
    public readonly disabled: boolean;
    public readonly permission: string;
    public readonly roles: readonly string[];
    public readonly hidden: boolean;
    public readonly category: CommandProperties;
    public readonly flags: ReadonlyArray<FlagDefinition<IFormattable<string>>>;
    public readonly isOnWebsite: boolean;

    public constructor(
        public readonly implementation: Command,
        permissions: CommandPermissions
    ) {
        this.id = implementation.name;
        this.name = implementation.name;
        this.aliases = implementation.aliases;
        this.description = implementation.description ?? undefined;
        this.signatures = implementation.signatures;
        this.disabled = permissions.disabled === true;
        this.permission = permissions.permission ?? '0';
        this.roles = permissions.roles ?? [];
        this.hidden = permissions.hidden ?? false;
        this.category = commandTypeDetails[implementation.category];
        this.flags = implementation.flags;
        this.isOnWebsite = !this.hidden;
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
            metrics.commandLatency.labels(this.name, commandTypeDetails[this.implementation.category].id).observe(timer.elapsed);
            metrics.commandCounter.labels(this.name, commandTypeDetails[this.implementation.category].id).inc();
        }
    }
}
