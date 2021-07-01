import { MessageFile } from 'eris';
import { CommandType, FlagDefinition, FlagResult } from '../../utils';
import { SendPayload } from '../BaseUtilities';
import { CommandContext } from './CommandContext';

export interface CommandOptions {
    readonly name: string;
    readonly aliases?: readonly string[];
    readonly category: CommandType;
    readonly cannotDisable?: boolean;
    readonly hidden?: boolean;
    readonly info?: string;
    readonly flags?: readonly FlagDefinition[];
    readonly onlyOn?: string | null;
    readonly cooldown?: number;
    readonly definition: CommandDefinition;
}

export type CommandResult =
    | SendPayload
    | MessageFile
    | MessageFile[]
    | { readonly content: SendPayload, readonly files: MessageFile | MessageFile[] }
    | string
    | void;

export type CommandDefinition =
    | CommandHandlerDefinition
    | SubcommandDefinitionHolder
    | CommandHandlerDefinition & SubcommandDefinitionHolder;


export type CommandParameter =
    | CommandVariableParameter
    | CommandLiteralParameter;

interface CommandHandlerDefinitionBase<TContext extends CommandContext> {
    readonly description: string;
    readonly parameters?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly execute: (context: TContext, args: readonly any[], flags: FlagResult) => Promise<CommandResult> | CommandResult
    readonly allowOverflow?: boolean;
    readonly dontBind?: boolean;
    readonly useFlags?: boolean;
    readonly strictFlags?: boolean;

}

export type CommandHandlerDefinition = CommandHandlerDefinitionBase<CommandContext>;

export interface ScopedCommandHandlerDefinition<TContext extends CommandContext> extends CommandHandlerDefinitionBase<TContext> {
    readonly checkContext: (context: CommandContext) => context is TContext;
}

export interface SubcommandDefinitionHolder {
    readonly subcommands: { readonly [name: string]: CommandDefinition }
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

export interface CommandHandler {
    readonly signatures: ReadonlyArray<readonly CommandParameter[]>;
    readonly execute: (context: CommandContext) => Promise<CommandResult> | CommandResult;
}

export interface CommandSignatureHandler {
    readonly description: string;
    readonly parameters: readonly CommandParameter[];
    readonly execute: (context: CommandContext, args: readonly string[]) => Promise<CommandResult> | CommandResult;
}