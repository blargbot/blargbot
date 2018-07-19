/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:22
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-10 18:13:16
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const { Constants } = require('eris');

bu.CAT_ID = config.ownerId;

bu.avatarColours = [
    0x2df952, 0x2df9eb, 0x2d6ef9, 0x852df9, 0xf92dd3, 0xf92d3b, 0xf9b82d, 0xa0f92d
];

bu.defaultStaff = Constants.Permissions.kickMembers +
    Constants.Permissions.banMembers +
    Constants.Permissions.administrator +
    Constants.Permissions.manageChannels +
    Constants.Permissions.manageGuild +
    Constants.Permissions.manageMessages;

bu.TagType = {
    SIMPLE: 1,
    COMPLEX: 2,
    ARRAY: 3,
    CCOMMAND: 4,
    API: 5,
    properties: {
        1: {
            name: 'Simple',
            desc: 'Subtags that require no arguments.'
        },
        2: {
            name: 'General',
            desc: 'General purpose subtags.'
        },
        3: {
            name: 'Array',
            desc: 'Subtags designed specifically for arrays.'
        },
        4: {
            name: 'Custom Command',
            desc: 'Subtags that only work in custom commands.'
        },
        5: {
            name: 'API',
            desc: 'Subtags that access the discord API to perform operations'
        }
    }
};

bu.CommandType = {
    GENERAL: 1,
    CAT: 2,
    NSFW: 3,
    IMAGE: 4,
    MUSIC: 5,
    ADMIN: 6,
    properties: {
        1: {
            name: 'General',
            requirement: () => true,
            description: 'General commands.'
        },
        2: {
            name: 'CATZ MEOW MEOW',
            requirement: msg => msg.author.id == bu.CAT_ID,
            description: 'MREOW MEOWWWOW! **purr**'
        },
        3: {
            name: 'NSFW',
            requirement: () => true,
            description: 'Commands that can only be executed in NSFW channels.'
        },
        4: {
            name: 'Image',
            requirement: () => true,
            description: 'Commands that generate or display images.'
        },
        5: {
            name: 'Music',
            requirement: msg => !msg.channel.guild ? false : config.discord.musicGuilds[msg.channel.guild.id]
        },
        6: {
            name: 'Admin',
            requirement: () => true,
            perm: 'Admin',
            description: 'Powerful commands that require an `admin` role or special permissions.'
        }
    }
};

bu.TagVariableType = {
    LOCAL: 1,
    AUTHOR: 2,
    GUILD: 3,
    GLOBAL: 4,
    TAGGUILD: 5,
    GUILDLOCAL: 6,
    properties: {
        1: {
            table: 'tag'
        },
        2: {
            table: 'user'
        },
        3: {
            table: 'guild'
        },
        4: {
            table: 'vars'
        },
        5: {
            table: 'tag'
        },
        6: {
            table: 'guild'
        }
    }
};

bu.ModLogColour = {
    BAN: 0xcc0c1c,
    UNBAN: 0x79add1,
    SOFTBAN: 0xffee02,
    KICK: 0xdb7b1c,
    UNMUTE: 0x1cdb68,
    MUTE: 0xd80f66,
    WARN: 0xd1be79,
    PARDON: 0x79d196
};

bu.Metrics = require('../core/Metrics');