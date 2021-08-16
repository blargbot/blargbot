import { CommandBaseOptions, CommandSignature, FlagDefinition } from '@cluster/types';
import { CommandType } from '@cluster/utils';

import { CommandContext } from './CommandContext';

export abstract class BaseCommand implements CommandBaseOptions {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: CommandType;
    public readonly cannotDisable: boolean;
    public readonly description: string | null;
    public readonly flags: readonly FlagDefinition[];
    public readonly onlyOn: string | null;
    public readonly signatures: readonly CommandSignature[];
    public readonly hidden: boolean;

    public get names(): readonly string[] { return [this.name, ...this.aliases]; }

    protected constructor(
        options: CommandBaseOptions
    ) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.cannotDisable = options.cannotDisable ?? true;
        this.description = options.description ?? null;
        this.flags = options.flags ?? [];
        this.onlyOn = options.onlyOn ?? null;
        this.signatures = options.signatures;
        this.hidden = options.hidden ?? false;
    }

    public abstract checkContext(context: CommandContext): boolean;
    public abstract execute(context: CommandContext): Promise<void>;

    public error(message: string): string {
        return `❌ ${message}`;
    }

    public warning(message: string, ...reasons: string[]): string {
        return `⚠️ ${message}${reasons.map(r => `\n⛔ ${r}`).join('')}`;
    }

    public success(message: string): string {
        return `✅ ${message}`;
    }

    public info(message: string): string {
        return `ℹ️ ${message}`;
    }

    public congrats(message: string): string {
        return `🎉 ${message}`;
    }

    public question(message: string): string {
        return `❓ ${message}`;
    }
}
