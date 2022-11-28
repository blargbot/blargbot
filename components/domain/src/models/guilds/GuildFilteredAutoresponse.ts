import { MessageFilter } from '../MessageFilter';
import { GuildTriggerTag } from './GuildTriggerTag';

export interface GuildFilteredAutoresponse extends GuildTriggerTag, MessageFilter {
}
