import { GuildTriggerTag } from './GuildTriggerTag';

export interface GuildCensorRule {
    readonly deleteMessage?: GuildTriggerTag;
    readonly banMessage?: GuildTriggerTag;
    readonly kickMessage?: GuildTriggerTag;
    readonly timeoutMessage?: GuildTriggerTag;
}
