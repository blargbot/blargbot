import { GuildTagBase } from './GuildTagBase.js';

export interface GuildTriggerTag extends GuildTagBase {
    readonly content: string;
}
