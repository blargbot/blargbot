import { CommandPropertiesSet } from '@blargbot/cluster/types';
import { guard } from '@blargbot/cluster/utils';
import { Guild } from 'eris';

import templates from '../../text';
import { defaultStaff } from './defaultStaff';

export enum CommandType {
    CUSTOM,
    GENERAL,
    OWNER,
    NSFW,
    IMAGE,
    ADMIN,
    SOCIAL,
    DEVELOPER,
    STAFF,
    SUPPORT,
}

export const commandTypeDetails: CommandPropertiesSet = {
    [CommandType.CUSTOM]: {
        id: 'Custom',
        name: templates.commands.categories.custom.name,
        isVisible: () => true,
        description: templates.commands.categories.custom.description,
        color: 0x7289da,
        defaultPerms: 0n
    },
    [CommandType.GENERAL]: {
        id: 'General',
        name: templates.commands.categories.general.name,
        isVisible: () => true,
        description: templates.commands.categories.general.description,
        color: 0xefff00,
        defaultPerms: 0n
    },
    [CommandType.NSFW]: {
        id: 'NSFW',
        name: templates.commands.categories.nsfw.name,
        isVisible(...[, location]) {
            if (location instanceof Guild || location === undefined || guard.isPrivateChannel(location))
                return true;

            if ('nsfw' in location)
                return location.nsfw;

            return false;
        },
        description: templates.commands.categories.nsfw.description,
        color: 0x010101,
        defaultPerms: 0n
    },
    [CommandType.IMAGE]: {
        id: 'Image',
        name: templates.commands.categories.image.name,
        isVisible: () => true,
        description: templates.commands.categories.image.description,
        color: 0xefff00,
        defaultPerms: 0n
    },
    [CommandType.ADMIN]: {
        id: 'Admin',
        name: templates.commands.categories.admin.name,
        isVisible: () => true,
        defaultPerms: defaultStaff,
        description: templates.commands.categories.admin.description,
        color: 0xff0000
    },
    [CommandType.SOCIAL]: {
        id: 'Social',
        name: templates.commands.categories.social.name,
        async isVisible(util, location) {
            if (location instanceof Guild)
                return await util.database.guilds.getSetting(location.id, 'social') ?? false;

            if (location === undefined || !guard.isGuildChannel(location))
                return true;

            return await util.database.guilds.getSetting(location.guild.id, 'social') ?? false;
        },
        description: templates.commands.categories.social.description,
        color: 0xefff00,
        defaultPerms: 0n
    },
    [CommandType.OWNER]: {
        id: 'Blargbot Owner',
        name: templates.commands.categories.owner.name,
        isVisible(...[util, , author]) {
            return author !== undefined && util.isBotOwner(author.id);
        },
        description: templates.commands.categories.owner.description,
        color: 0xff0000,
        defaultPerms: 0n
    },
    [CommandType.DEVELOPER]: {
        id: 'Blargbot Developer',
        name: templates.commands.categories.developer.name,
        isVisible(...[util, , author]) {
            return author !== undefined && util.isBotDeveloper(author.id);
        },
        description: templates.commands.categories.developer.description,
        color: 0xff0000,
        defaultPerms: 0n
    },
    [CommandType.STAFF]: {
        id: 'Blargbot Staff',
        name: templates.commands.categories.staff.name,
        isVisible(...[util, , author]) {
            return author !== undefined && util.isBotStaff(author.id);
        },
        description: templates.commands.categories.staff.description,
        color: 0xff0000,
        defaultPerms: 0n
    },
    [CommandType.SUPPORT]: {
        id: 'Blargbot Support',
        name: templates.commands.categories.support.name,
        isVisible(...[util, , author]) {
            return author !== undefined && util.isBotSupport(author.id);
        },
        description: templates.commands.categories.support.description,
        color: 0xff0000,
        defaultPerms: 0n
    }
};
