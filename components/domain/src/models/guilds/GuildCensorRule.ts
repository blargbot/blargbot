import { GuildTriggerTag } from './GuildTriggerTag.js';

export interface GuildCensorRule {
    readonly deleteMessage?: GuildTriggerTag;
    readonly banMessage?: GuildTriggerTag;
    readonly kickMessage?: GuildTriggerTag;
    readonly timeoutMessage?: GuildTriggerTag;
}
