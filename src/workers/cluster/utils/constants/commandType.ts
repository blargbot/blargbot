import { CommandPropertiesSet } from '@cluster/types';
import { guard } from '@cluster/utils';
import { Guild } from 'discord.js';

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
        name: 'General',
        requirement: () => true,
        description: 'General commands.',
        color: 0xefff00
    },
    [CommandType.NSFW]: {
        name: 'NSFW',
        requirement({ location }) {
            if (location instanceof Guild || guard.isPrivateChannel(location))
                return true;

            if ('nsfw' in location)
                return location.nsfw;

            return false;
        },
        description: 'Commands that can only be executed in NSFW channels.',
        color: 0x010101
    },
    [CommandType.IMAGE]: {
        name: 'Image',
        requirement: () => true,
        description: 'Commands that generate or display images.',
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
        async requirement({ location, util }) {
            if (location instanceof Guild)
                return await util.database.guilds.getSetting(location.id, 'social') ?? false;

            if (!guard.isGuildChannel(location))
                return true;

            return await util.database.guilds.getSetting(location.guild.id, 'social') ?? false;
        },
        description: 'Social commands for interacting with other people',
        color: 0xefff00
    },
    [CommandType.OWNER]: {
        name: 'Blargbot Owner',
        requirement({ author, util }) {
            return util.isBotOwner(author.id);
        },
        description: 'MREOW MEOWWWOW! **purr**',
        color: 0xff0000
    },
    [CommandType.DEVELOPER]: {
        name: 'Blargbot Developer',
        requirement({ author, util }) {
            return util.isBotDeveloper(author.id);
        },
        description: 'Commands that can only be executed by blargbot developers.',
        color: 0xff0000
    },
    [CommandType.STAFF]: {
        name: 'Blargbot Staff',
        requirement({ author, util }) {
            return util.isBotStaff(author.id);
        },
        description: 'Commands that can only be executed by staff on the official support server.',
        color: 0xff0000
    },
    [CommandType.SUPPORT]: {
        name: 'Blargbot Support',
        requirement({ author, util }) {
            return util.isBotSupport(author.id);
        },
        description: 'Commands that can only be executed by support members on the official support server.',
        color: 0xff0000
    }
};
