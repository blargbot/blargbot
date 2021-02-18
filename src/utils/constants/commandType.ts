import { Message } from 'eris';
import { Cluster } from '../../cluster';
import { guard } from '../utils';

type CommandPropertiesSet = {
    [key in Type]: CommandProperties;
}

export interface CommandProperties {
    readonly name: string;
    readonly description: string;
    readonly perm?: string;
    readonly requirement: (client: Cluster, message: Message) => boolean | Promise<boolean>
}

export enum Type {
    GENERAL = 1,
    CAT,
    NSFW,
    IMAGE,
    MUSIC,
    ADMIN,
    SOCIAL
}

export const properties: CommandPropertiesSet = {
    [Type.GENERAL]: {
        name: 'General',
        requirement: () => true,
        description: 'General commands.'
    },
    [Type.CAT]: {
        name: 'CATZ MEOW MEOW',
        requirement: (client, message) => message.author.id == client.config.discord.users.owner,
        description: 'MREOW MEOWWWOW! **purr**'
    },
    [Type.NSFW]: {
        name: 'NSFW',
        requirement: () => true,
        description: 'Commands that can only be executed in NSFW channels.'
    },
    [Type.IMAGE]: {
        name: 'Image',
        requirement: () => true,
        description: 'Commands that generate or display images.'
    },
    [Type.MUSIC]: {
        name: 'Music',
        requirement: () => false,
        description: ''
    },
    [Type.ADMIN]: {
        name: 'Admin',
        requirement: () => true,
        perm: 'Admin',
        description: 'Powerful commands that require an `admin` role or special permissions.'
    },
    [Type.SOCIAL]: {
        name: 'Social',
        requirement: async (client: Cluster, msg: Message): Promise<boolean> => {
            if (!guard.isGuildMessage(msg))
                return false;
            const guild = await client.database.getGuild(msg.channel.guild.id);
            return guild?.settings?.social ?? false;
        },
        description: 'Social commands for interacting with other people'
    }
};