import { CommandPermissions } from './CommandPermissions';
import { GuildTagBase } from './GuildTagBase';

export interface GuildCommandTagBase extends GuildTagBase, CommandPermissions {
    readonly id: string;
    readonly help?: string;
    readonly cooldown?: number;
}
