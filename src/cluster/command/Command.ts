import { ClusterUtilities } from '@blargbot/cluster/ClusterUtilities';
import { CommandBaseOptions, CommandResult, CommandSignature } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { FlagDefinition } from '@blargbot/domain/models';
import { Guild, KnownTextableChannel, User } from 'eris';

import { CommandContext } from './CommandContext';

export abstract class Command implements CommandBaseOptions, IMiddleware<CommandContext, CommandResult> {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: CommandType;
    public readonly cannotDisable: boolean;
    public readonly description: string | undefined;
    public readonly flags: readonly FlagDefinition[];
    public readonly signatures: readonly CommandSignature[];
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

    public abstract isVisible(util: ClusterUtilities, location?: Guild | KnownTextableChannel, user?: User): Promise<boolean> | boolean;
    public abstract execute(context: CommandContext, next: NextMiddleware<CommandResult>): Awaitable<CommandResult>;

    public error<T extends string>(message: T): `❌ ${T}` {
        return `❌ ${message}`;
    }

    public warning<T extends string>(message: T): `⚠️ ${T}`
    public warning<T extends string>(message: T, ...reasons: string[]): `⚠️ ${T}${string}`
    public warning(message: string, ...reasons: string[]): string {
        return `⚠️ ${message}${reasons.map(r => `\n⛔ ${r}`).join('')}`;
    }

    public success<T extends string>(message: T): `✅ ${T}` {
        return `✅ ${message}`;
    }

    public info<T extends string>(message: T): `ℹ️ ${T}` {
        return `ℹ️ ${message}`;
    }

    public congrats<T extends string>(message: T): `🎉 ${T}` {
        return `🎉 ${message}`;
    }

    public question<T extends string>(message: T): `❓ ${T}` {
        return `❓ ${message}`;
    }
}
