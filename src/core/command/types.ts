import { MessageFile } from 'eris';
import { CommandType, FlagDefinition, FlagResult } from '../../utils';
import { SendPayload } from '../BaseUtilities';
import { GuildAutoresponse, GuildFilteredAutoresponse, NamedStoredRawGuildCommand } from '../database';
import { CommandContext } from './CommandContext';

export interface CommandOptionsBase {
    readonly name: string;
    readonly aliases?: readonly string[];
    readonly category: CommandType;
    readonly cannotDisable?: boolean;
    readonly info?: string;
    readonly flags?: readonly FlagDefinition[];
    readonly onlyOn?: string | null;
    readonly cooldown?: number;
}

export interface CommandOptions<TContext extends CommandContext> extends CommandOptionsBase {
    readonly definition: CommandDefinition<TContext>;
}

export type CommandResult =
    | SendPayload
    | MessageFile
    | MessageFile[]
    | { readonly content: SendPayload, readonly files: MessageFile | MessageFile[] }
    | string
    | void;

export type CommandDefinition<TContext extends CommandContext> =
    | CommandHandlerDefinition<TContext>
    | SubcommandDefinitionHolder<TContext>
    | CommandHandlerDefinition<TContext> & SubcommandDefinitionHolder<TContext>;


export type CommandParameter =
    | CommandVariableParameter
    | CommandLiteralParameter;

export interface CommandHandlerDefinition<TContext extends CommandContext> {
    readonly description: string;
    readonly parameters?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly execute: (context: TContext, args: readonly any[], flags: FlagResult) => Promise<CommandResult> | CommandResult
    readonly allowOverflow?: boolean;
    readonly dontBind?: boolean;
    readonly useFlags?: boolean;
    readonly strictFlags?: boolean;

}

export interface SubcommandDefinitionHolder<TContext extends CommandContext> {
    readonly subcommands: { readonly [name: string]: CommandDefinition<TContext> }
}

export interface CommandVariableParameter {
    readonly type: 'variable';
    readonly name: string;
    readonly valueType: string;
    readonly required: boolean;
    readonly rest: boolean;
    readonly display: string;
    readonly parse: (value: string) => unknown;
}

export interface CommandLiteralParameter {
    readonly type: 'literal';
    readonly name: string;
    readonly alias: string[];
    readonly required: boolean;
    readonly display: string;
    readonly parse: (value: string) => unknown;
}

export interface CommandHandler<TContext extends CommandContext> {
    readonly signatures: ReadonlyArray<readonly CommandParameter[]>;
    readonly execute: (context: TContext) => Promise<CommandResult> | CommandResult;
}

export interface CommandSignatureHandler<TContext extends CommandContext> {
    readonly description: string;
    readonly parameters: readonly CommandParameter[];
    readonly execute: (context: TContext, args: readonly string[]) => Promise<CommandResult> | CommandResult;
}


export type CustomCommandShrinkwrap = {
    readonly [P in Exclude<keyof NamedStoredRawGuildCommand, 'author' | 'authorizer' | 'name'>]: NamedStoredRawGuildCommand[P]
}

export interface AutoresponseShrinkwrap extends Omit<GuildAutoresponse, 'executes'> {
    readonly executes: CustomCommandShrinkwrap;
}

export interface FilteredAutoresponseShrinkwrap extends AutoresponseShrinkwrap, Omit<GuildFilteredAutoresponse, 'executes'> {
    readonly executes: CustomCommandShrinkwrap;
}

export interface GuildShrinkwrap {
    readonly cc: Record<string, CustomCommandShrinkwrap>;
    readonly ar: FilteredAutoresponseShrinkwrap[];
    are: null | AutoresponseShrinkwrap
}

export interface SignedGuildShrinkwrap {
    readonly signature?: string;
    readonly payload: GuildShrinkwrap
}