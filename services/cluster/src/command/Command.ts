import { ClusterUtilities } from '@blargbot/cluster/ClusterUtilities.js';
import { CommandBaseOptions, CommandResult, CommandSignature } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import { FlagDefinition } from '@blargbot/domain/models/index.js';
import { IFormattable } from '@blargbot/formatting';
import Eris from 'eris';

import { CommandContext } from './CommandContext.js';

export abstract class Command implements CommandBaseOptions, IMiddleware<CommandContext, CommandResult> {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: CommandType;
    public readonly cannotDisable: boolean;
    public readonly description: IFormattable<string> | undefined;
    public readonly flags: ReadonlyArray<FlagDefinition<IFormattable<string>>>;
    public readonly signatures: ReadonlyArray<CommandSignature<IFormattable<string>>>;
    public readonly hidden: boolean;

    public get names(): readonly string[] { return [this.name, ...this.aliases]; }

    public constructor(
        options: CommandBaseOptions
    ) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.cannotDisable = options.cannotDisable ?? false;
        this.description = options.description;
        this.flags = options.flags ?? [];
        this.signatures = options.signatures;
        this.hidden = options.hidden ?? false;
    }

    public abstract isVisible(util: ClusterUtilities, location?: Eris.Guild | Eris.KnownTextableChannel, user?: Eris.User): Promise<boolean> | boolean;
    public abstract execute(context: CommandContext, next: NextMiddleware<CommandResult>): Awaitable<CommandResult>;
}
