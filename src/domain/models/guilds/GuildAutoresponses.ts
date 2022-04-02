import { GuildFilteredAutoresponse } from './GuildFilteredAutoresponse';
import { GuildTriggerTag } from './GuildTriggerTag';

export interface GuildAutoresponses {
    readonly everything?: GuildTriggerTag;
    readonly filtered?: { readonly [key: string]: GuildFilteredAutoresponse | undefined; };
}
