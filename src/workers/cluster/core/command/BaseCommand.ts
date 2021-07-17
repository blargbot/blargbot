import { CommandBaseOptions, CommandSignature, FlagDefinition } from '../types';
import { CommandType } from '@cluster/core';
import { CommandContext } from './CommandContext';

export abstract class BaseCommand implements CommandBaseOptions {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: CommandType;
    public readonly cannotDisable: boolean;
    public readonly description: string;
    public readonly flags: readonly FlagDefinition[];
    public readonly onlyOn: string | undefined;
    public readonly signatures: readonly CommandSignature[];

    public get names(): readonly string[] { return [this.name, ...this.aliases]; }

    protected constructor(
        options: CommandBaseOptions
    ) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.cannotDisable = options.cannotDisable ?? true;
        this.description = options.description ?? 'WIP';
        this.flags = options.flags ?? [];
        this.onlyOn = options.onlyOn;
        this.signatures = options.signatures;
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
}
