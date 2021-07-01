import { guard } from '../guard';
import { Cluster } from '../../cluster';
import { CommandContext } from '../../core/command';

type CommandPropertiesSet = {
    [key in Type]: CommandProperties;
}

export interface CommandProperties {
    readonly name: string;
    readonly description: string;
    readonly perm?: string;
    readonly requirement: (client: Cluster, context: CommandContext) => boolean | Promise<boolean>;
    readonly color: number;
}

export enum Type {
    GENERAL = 1,
    CAT,
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
    [Type.CAT]: {
        name: 'CATZ MEOW MEOW',
        requirement: (client, message) => message.author.id == client.config.discord.users.owner,
        description: 'MREOW MEOWWWOW! **purr**',
        color: 0xff0000
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
        async requirement(cluster: Cluster, context: CommandContext): Promise<boolean> {
            if (!guard.isGuildCommandContext(context))
                return false;
            return await cluster.database.guilds.getSetting(context.channel.guild.id, 'social') ?? false;
        },
        description: 'Social commands for interacting with other people',
        color: 0xefff00
    },
    [Type.DEVELOPER]: {
        name: 'Developer',
        requirement(cluster: Cluster, context: CommandContext): boolean {
            return cluster.util.isDeveloper(context.author.id);
        },
        description: 'Commands that can only be executed by blargbot developers.',
        color: 0xff0000
    },
    [Type.STAFF]: {
        name: 'Bot staff',
        async requirement(cluster: Cluster, context: CommandContext): Promise<boolean> {
            return await cluster.util.isStaff(context.author.id);
        },
        description: 'Commands that can only be executed by staff on the official support server.',
        color: 0xff0000
    },
    [Type.SUPPORT]: {
        name: 'Bot support',
        async requirement(cluster: Cluster, context: CommandContext): Promise<boolean> {
            return await cluster.util.isSupport(context.author.id);
        },
        description: 'Commands that can only be executed by support members on the official support server.',
        color: 0xff0000
    }
};