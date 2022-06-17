import { FlagDefinition } from '../flags';
import { GuildCommandTagBase } from './GuildCommandTagBase';

export interface GuildSourceCommandTag extends GuildCommandTagBase {
    readonly flags?: readonly FlagDefinition[];
    readonly content: string;
}

export interface NamedGuildSourceCommandTag extends GuildSourceCommandTag {
    readonly name: string;
}
