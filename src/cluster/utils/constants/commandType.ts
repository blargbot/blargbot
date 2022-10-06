import { CommandPropertiesSet } from '@blargbot/cluster/types';
import { guard } from '@blargbot/cluster/utils';
import { Guild } from 'eris';

import { defaultStaff } from './defaultStaff';

export enum CommandType {
    GENERAL = 1,
    OWNER,
    NSFW,
    IMAGE,
    ADMIN,
    SOCIAL,
    DEVELOPER,
    STAFF,
    SUPPORT
}

export const commandTypeDetails: CommandPropertiesSet = {
    [CommandType.GENERAL]: {
        name: `General`,
        isVisible: () => true,
        description: `General commands.`,
        color: 0xefff00,
        defaultPerms: 0n
    },
    [CommandType.NSFW]: {
        name: `NSFW`,
        isVisible(...[, location]) {
            if (location instanceof Guild || location === undefined || guard.isPrivateChannel(location))
                return true;

            if (`nsfw` in location)
                return location.nsfw;

            return false;
        },
        description: `Commands that can only be executed in NSFW channels.`,
        color: 0x010101,
        defaultPerms: 0n
    },
    [CommandType.IMAGE]: {
        name: `Image`,
        isVisible: () => true,
        description: `Commands that generate or display images.`,
        color: 0xefff00,
        defaultPerms: 0n
    },
    [CommandType.ADMIN]: {
        name: `Admin`,
        isVisible: () => true,
        defaultPerms: defaultStaff,
        description: `Powerful commands that require an \`admin\` role or special permissions.`,
        color: 0xff0000
    },
    [CommandType.SOCIAL]: {
        name: `Social`,
        async isVisible(util, location) {
            if (location instanceof Guild)
                return await util.database.guilds.getSetting(location.id, `social`) ?? false;

            if (location === undefined || !guard.isGuildChannel(location))
                return true;

            return await util.database.guilds.getSetting(location.guild.id, `social`) ?? false;
        },
        description: `Social commands for interacting with other people`,
        color: 0xefff00,
        defaultPerms: 0n
    },
    [CommandType.OWNER]: {
        name: `Blargbot Owner`,
        isVisible(...[util, , author]) {
            return author !== undefined && util.isBotOwner(author.id);
        },
        description: `MREOW MEOWWWOW! **purr**`,
        color: 0xff0000,
        defaultPerms: 0n
    },
    [CommandType.DEVELOPER]: {
        name: `Blargbot Developer`,
        isVisible(...[util, , author]) {
            return author !== undefined && util.isBotDeveloper(author.id);
        },
        description: `Commands that can only be executed by blargbot developers.`,
        color: 0xff0000,
        defaultPerms: 0n
    },
    [CommandType.STAFF]: {
        name: `Blargbot Staff`,
        isVisible(...[util, , author]) {
            return author !== undefined && util.isBotStaff(author.id);
        },
        description: `Commands that can only be executed by staff on the official support server.`,
        color: 0xff0000,
        defaultPerms: 0n
    },
    [CommandType.SUPPORT]: {
        name: `Blargbot Support`,
        isVisible(...[util, , author]) {
            return author !== undefined && util.isBotSupport(author.id);
        },
        description: `Commands that can only be executed by support members on the official support server.`,
        color: 0xff0000,
        defaultPerms: 0n
    }
};
