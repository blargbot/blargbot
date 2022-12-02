import { GuildCommandTagBase } from './GuildCommandTagBase.js';

export interface GuildImportedCommandTag extends GuildCommandTagBase {
    readonly alias: string;
}

export interface NamedGuildImportedCommandTag extends GuildImportedCommandTag {
    readonly name: string;
}
