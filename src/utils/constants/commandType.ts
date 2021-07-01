import { guard } from '../guard';
import { CommandContext } from '../../core/command';

type CommandPropertiesSet = {
    [key in Type]: CommandProperties;
}

export interface CommandProperties {
    readonly name: string;
    readonly description: string;
    readonly perm?: string;
    readonly requirement: (context: CommandContext) => boolean | Promise<boolean>;
    readonly color: number;
}

export enum Type {
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
    [Type.GENERAL]: {
        name: 'General',
        requirement: () => true,
        description: 'General commands.',
        color: 0xefff00
    },
    [Type.NSFW]: {
        name: 'NSFW',
        requirement: () => true,
        description: 'Commands that can only be executed in NSFW channels.',
        color: 0x010101
    },
    [Type.IMAGE]: {
        name: 'Image',
        requirement: () => true,
        description: 'Commands that generate or display images.',
        color: 0xefff00
    },
    [Type.MUSIC]: {
        name: 'Music',
        requirement: () => false,
        description: '',
        color: 0xefff00
    },
    [Type.ADMIN]: {
        name: 'Admin',
        requirement: () => true,
        perm: 'Admin',
        description: 'Powerful commands that require an `admin` role or special permissions.',
        color: 0xff0000
    },
    [Type.SOCIAL]: {
        name: 'Social',
        async requirement(context: CommandContext): Promise<boolean> {
            if (!guard.isGuildCommandContext(context))
                return false;
            return await context.cluster.database.guilds.getSetting(context.channel.guild.id, 'social') ?? false;
        },
        description: 'Social commands for interacting with other people',
        color: 0xefff00
    },
    [Type.OWNER]: {
        name: 'Blargbot Owner',
        requirement(context: CommandContext): boolean {
            return context.author.id == context.cluster.config.discord.users.owner;
        },
        description: 'MREOW MEOWWWOW! **purr**',
        color: 0xff0000
    },
    [Type.DEVELOPER]: {
        name: 'Blargbot Developer',
        requirement(context: CommandContext): boolean {
            return context.cluster.util.isDeveloper(context.author.id);
        },
        description: 'Commands that can only be executed by blargbot developers.',
        color: 0xff0000
    },
    [Type.STAFF]: {
        name: 'Blargbot Staff',
        async requirement(context: CommandContext): Promise<boolean> {
            return await context.cluster.util.isStaff(context.author.id);
        },
        description: 'Commands that can only be executed by staff on the official support server.',
        color: 0xff0000
    },
    [Type.SUPPORT]: {
        name: 'Blargbot Support',
        async requirement(context: CommandContext): Promise<boolean> {
            return await context.cluster.util.isSupport(context.author.id);
        },
        description: 'Commands that can only be executed by support members on the official support server.',
        color: 0xff0000
    }
};