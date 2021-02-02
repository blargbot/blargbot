/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:22
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-14 09:36:17
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const { Constants } = require('eris');

bu.CAT_ID = config.discord.users.owner;

bu.avatarColours = [
    0x2df952, 0x2df9eb, 0x2d6ef9, 0x852df9, 0xf92dd3, 0xf92d3b, 0xf9b82d, 0xa0f92d
];

bu.defaultStaff = Constants.Permissions.kickMembers +
    Constants.Permissions.banMembers +
    Constants.Permissions.administrator +
    Constants.Permissions.manageChannels +
    Constants.Permissions.manageGuild +
    Constants.Permissions.manageMessages;

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