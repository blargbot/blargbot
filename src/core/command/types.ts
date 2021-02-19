import { Message } from 'eris';
import { CommandType, FlagDefinition } from '../../utils';
import { SendPayload } from '../BaseUtilities';

export interface CommandOptions {
    name: string;
    aliases?: string[];
    category: CommandType;
    cannotDisable?: boolean;
    hidden?: boolean;
    info: string;
    flags?: FlagDefinition[];
    onlyOn?: string | null;
}
export type CommandHandler<This> = (this: This, message: Message, args: string[], raw: string) => Promise<SendPayload | void> | SendPayload | void;

export type CommandHandlerTree<This> = {
    [key: string]: CommandHandlerTree<This> | CommandHandler<This> | undefined;
    _run?: CommandHandler<This>;
};