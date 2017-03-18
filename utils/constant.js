bu.CAT_ID = '103347843934212096';

// A special character for tag injections
bu.specialCharBegin = '\uE001';
bu.specialCharDiv = '\uE002';
bu.specialCharEnd = '\uE003';
bu.tagDiv = '\uE004';

bu.avatarColours = [
    0x2df952, 0x2df9eb, 0x2d6ef9, 0x852df9, 0xf92dd3, 0xf92d3b, 0xf9b82d, 0xa0f92d
];

bu.defaultStaff = dep.Eris.Constants.Permissions.kickMembers +
    dep.Eris.Constants.Permissions.banMembers +
    dep.Eris.Constants.Permissions.administrator +
    dep.Eris.Constants.Permissions.manageChannels +
    dep.Eris.Constants.Permissions.manageGuild +
    dep.Eris.Constants.Permissions.manageMessages;

bu.TagType = {
    SIMPLE: 1,
    COMPLEX: 2,
    ARRAY: 3,
    CCOMMAND: 4,
    properties: {
        1: {
            name: 'Simple'
        },
        2: {
            name: 'General',
            desc: 'General purpose functions.'
        },
        3: {
            name: 'Array',
            desc: 'Functions designed specifically for arrays.'
        },
        4: {
            name: 'Custom Command',
            desc: 'Functions that only work in custom commands (not tags).'
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
    KICK: 0xdb7b1c,
    UNMUTE: 0xd80f66,
    MUTE: 0x1cdb68,
    WARN: 0xd1be79,
    PARDON: 0x79d196
};