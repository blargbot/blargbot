import { defaultStaff } from './defaultStaff';
import { CommandContext } from '../../command';
import { CommandPropertiesSet } from '../../types';
import { guard } from '../guard';

export enum CommandType {
    GENERAL = 1,
    OWNER,
    NSFW,
    IMAGE,
    MUSIC,
    ADMIN,
    SOCIAL,
    DEVELOPER,
    STAFF,
    SUPPORT
}

export const properties: CommandPropertiesSet = {
    [CommandType.GENERAL]: {
        name: 'General',
        requirement: () => true,
        description: 'General commands.',
        color: 0xefff00
    },
    [CommandType.NSFW]: {
        name: 'NSFW',
        requirement: () => true,
        description: 'Commands that can only be executed in NSFW channels.',
        color: 0x010101
    },
    [CommandType.IMAGE]: {
        name: 'Image',
        requirement: () => true,
        description: 'Commands that generate or display images.',
        color: 0xefff00
    },
    [CommandType.MUSIC]: {
        name: 'Music',
        requirement: () => false,
        description: '',
        color: 0xefff00
    },
    [CommandType.ADMIN]: {
        name: 'Admin',
        requirement: () => true,
        defaultPerms: defaultStaff,
        description: 'Powerful commands that require an `admin` role or special permissions.',
        color: 0xff0000
    },
    [CommandType.SOCIAL]: {
        name: 'Social',
        async requirement(context: CommandContext): Promise<boolean> {
            if (!guard.isGuildCommandContext(context))
                return false;
            return await context.cluster.database.guilds.getSetting(context.channel.guild.id, 'social') ?? false;
        },
        description: 'Social commands for interacting with other people',
        color: 0xefff00
    },
    [CommandType.OWNER]: {
        name: 'Blargbot Owner',
        requirement(context: CommandContext): boolean {
            return context.author.id === context.cluster.config.discord.users.owner;
        },
        description: 'MREOW MEOWWWOW! **purr**',
        color: 0xff0000
    },
    [CommandType.DEVELOPER]: {
        name: 'Blargbot Developer',
        requirement(context: CommandContext): boolean {
            return context.cluster.util.isDeveloper(context.author.id);
        },
        description: 'Commands that can only be executed by blargbot developers.',
        color: 0xff0000
    },
    [CommandType.STAFF]: {
        name: 'Blargbot Staff',
        requirement(context: CommandContext): boolean {
            return context.cluster.util.isStaff(context.author.id);
        },
        description: 'Commands that can only be executed by staff on the official support server.',
        color: 0xff0000
    },
    [CommandType.SUPPORT]: {
        name: 'Blargbot Support',
        requirement(context: CommandContext): boolean {
            return context.cluster.util.isSupport(context.author.id);
        },
        description: 'Commands that can only be executed by support members on the official support server.',
        color: 0xff0000
    }
};
