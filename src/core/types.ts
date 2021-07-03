import { AdvancedMessageContent, Channel, ChannelInteraction, EmbedField, EmbedOptions, MessageFile, Textable, UserChannelInteraction } from 'eris';
import { WorkerConnection } from './worker';

export type MalformedEmbed = { fields: [EmbedField]; malformed: boolean; };
export type ModuleResult<TModule> = { names: Iterable<string>; module: TModule; };
export type SendContext = UserChannelInteraction | ChannelInteraction | (Textable & Channel) | string
export type SendEmbed = EmbedOptions & { asString?: string; }
export type SendFiles = MessageFile | MessageFile[]
export interface SendPayloadContent extends AdvancedMessageContent {
    disableEveryone?: boolean;
    embed?: SendEmbed;
    nsfw?: string;
    isHelp?: boolean;
}
export type SendPayload = SendPayloadContent | string | boolean;
export type LogEntry = { text: string; level: string; timestamp: string; }
export type ProcessMessage = { type: string; id: Snowflake; data: unknown; };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProcessMessageHandler = (data: unknown, id: Snowflake, reply: <T = unknown>(data: T) => void) => void;
export type AnyProcessMessageHandler = (event: string, ...args: Parameters<ProcessMessageHandler>) => void;
export type WorkerPoolEventHandler<TWorker extends WorkerConnection> = (worker: TWorker, ...args: Parameters<ProcessMessageHandler>) => void;
export type EvalRequest = { userId: string; code: string; };
export type MasterEvalRequest = EvalRequest & { type: EvalType; };
export type MasterEvalResult<T = unknown> = Record<string, EvalResult<T>>;
export type EvalResult<T = unknown> = { success: false; error: unknown; } | { success: true; result: T; };
export type EvalType = 'master' | 'global' | `cluster${number}`
