import type { GuildFilteredAutoresponse } from './GuildFilteredAutoresponse.js';
import type { GuildTriggerTag } from './GuildTriggerTag.js';

export interface GuildAutoresponses {
    readonly everything?: GuildTriggerTag | null;
    readonly filtered?: { readonly [key: string]: GuildFilteredAutoresponse | undefined | null; };
}
