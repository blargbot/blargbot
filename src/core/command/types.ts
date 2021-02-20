import { Message, MessageFile } from 'eris';
import { CommandType, FlagDefinition, FlagResult } from '../../utils';
import { SendPayload } from '../BaseUtilities';

export interface CommandOptions {
    name: string;
    aliases?: string[];
    category: CommandType;
    cannotDisable?: boolean;
    hidden?: boolean;
    info?: string;
    flags?: FlagDefinition[];
    onlyOn?: string | null;
    cooldown?: number;
}

export type HandlerResult = SendPayload | MessageFile | MessageFile[] | { content: SendPayload, files: MessageFile | MessageFile[] } | void;

export type CommandHandler<This> = (this: This, message: Message, args: string[], flags: FlagResult, raw: string) => Promise<HandlerResult> | HandlerResult;

export type CommandHandlerTree<This> = {
    [key: string]: CommandHandlerTree<This> | CommandHandler<This> | undefined;
    _run?: CommandHandler<This>;
};