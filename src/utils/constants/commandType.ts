import { Message } from 'eris';
import { Cluster } from '../../cluster';
import { isGuildMessage } from '../guard/isGuildMessage';

type CommandPropertiesSet = {
    [key in Type]: CommandProperties;
}

export interface CommandProperties {
    readonly name: string;
    readonly description: string;
    readonly perm?: string;
    readonly requirement: (client: Cluster, message: Message) => boolean | Promise<boolean>;
    readonly color: number;
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
        requirement: async (client: Cluster, msg: Message): Promise<boolean> => {
            if (!isGuildMessage(msg))
                return false;
            return await client.database.guilds.getSetting(msg.channel.guild.id, 'social') ?? false;
        },
        description: 'Social commands for interacting with other people',
        color: 0xefff00
    }
};