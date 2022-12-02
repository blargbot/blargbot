import { GuildFilteredAutoresponse } from './GuildFilteredAutoresponse.js';
import { GuildTriggerTag } from './GuildTriggerTag.js';

export interface GuildAutoresponses {
    readonly everything?: GuildTriggerTag | null;
    readonly filtered?: { readonly [key: string]: GuildFilteredAutoresponse | undefined | null; };
}
