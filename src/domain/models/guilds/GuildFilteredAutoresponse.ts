import type { MessageFilter } from '../MessageFilter.js';
import type { GuildTriggerTag } from './GuildTriggerTag.js';

export interface GuildFilteredAutoresponse extends GuildTriggerTag, MessageFilter {
}
