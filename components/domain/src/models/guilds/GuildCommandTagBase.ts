import { CommandPermissions } from './CommandPermissions.js';
import { GuildTagBase } from './GuildTagBase.js';

export interface GuildCommandTagBase extends GuildTagBase, CommandPermissions {
    readonly id: string;
    readonly help?: string;
    readonly cooldown?: number;
}
