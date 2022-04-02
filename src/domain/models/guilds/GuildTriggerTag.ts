import { GuildTagBase } from './GuildTagBase';

export interface GuildTriggerTag extends GuildTagBase {
    readonly content: string;
}
