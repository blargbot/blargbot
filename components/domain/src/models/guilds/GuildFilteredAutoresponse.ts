import { MessageFilter } from '../MessageFilter.js';
import { GuildTriggerTag } from './GuildTriggerTag.js';

export interface GuildFilteredAutoresponse extends GuildTriggerTag, MessageFilter {
}
