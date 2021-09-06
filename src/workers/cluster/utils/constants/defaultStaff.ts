import { Permissions } from 'discord.js';

export const defaultStaff = new Permissions([
    'KICK_MEMBERS',
    'BAN_MEMBERS',
    'ADMINISTRATOR',
    'MANAGE_CHANNELS',
    'MANAGE_GUILD',
    'MANAGE_MESSAGES'
]).bitfield;
