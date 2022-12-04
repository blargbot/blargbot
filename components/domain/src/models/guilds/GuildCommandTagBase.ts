import type { CommandPermissions } from './CommandPermissions.js';
import type { GuildTagBase } from './GuildTagBase.js';

export interface GuildCommandTagBase extends GuildTagBase, CommandPermissions {
    readonly id: string;
    readonly help?: string;
    readonly cooldown?: number;
}
