import { GuildSettingDocs } from '@blargbot/domain/models';

export const guildSettings: GuildSettingDocs = {
    makelogs: {
        key: 'makelogs',
        name: 'Make ChatLogs',
        desc: 'Whether to record chat logs or not.',
        type: 'bool'
    },
    cahnsfw: {
        key: 'cahnsfw',
        name: 'Is CAH NSFW',
        desc: 'Whether \'cah\' can only be done in nsfw channels or not.',
        type: 'bool'
    },
    deletenotif: {
        key: 'deletenotif',
        name: 'Delete notifications',
        desc: 'If enabled, notifies you if a user deleted their command.',
        type: 'bool'
    },
    modlog: {
        key: 'modlog',
        name: 'Modlog channel',
        desc: 'The id of the modlog channel. You can also use the <code>modlog</code> command',
        type: 'channel'
    },
    mutedrole: {
        key: 'mutedrole',
        name: 'Muted role',
        desc: 'The id of the muted role.',
        type: 'role'
    },
    tableflip: {
        key: 'tableflip',
        name: 'Tableflips',
        desc: 'Whether the bot should respond to tableflips/unflips.',
        type: 'bool'
    },
    antimention: {
        key: 'antimention',
        name: 'Anti-mention',
        desc: 'The number of unique mentions required to warrant a ban (for anti-mention spam). Set to \'0\' to disable. Recommended: 25',
        type: 'int'
    },
    dmhelp: {
        key: 'dmhelp',
        name: 'DM help',
        desc: 'Whether or not to dm help messages or output them in channels',
        type: 'bool'
    },
    staffperms: {
        key: 'staffperms',
        name: 'Staff permissions',
        desc: 'The numeric value of permissions that designate a staff member. If a user has any of the permissions and permoverride is enabled, allows them to execute any command regardless of role. See <a href=https://discordapi.com/permissions.html>here</a> for a permission calculator.',
        type: 'permission'
    },
    kickoverride: {
        key: 'kickoverride',
        name: 'Kick override',
        desc: 'Same as staffperms, but allows users to use the kick command regardless of permissions',
        type: 'permission'
    },
    banoverride: {
        key: 'banoverride',
        name: 'Ban override',
        desc: 'Same as staffperms, but allows users to use the ban/hackban/unban commands regardless of permissions',
        type: 'permission'
    },
    banat: {
        key: 'banat',
        name: 'Ban at',
        desc: 'The number of warnings before a ban. Set to 0 or below to disable.',
        type: 'int'
    },
    kickat: {
        key: 'kickat',
        name: 'Kick at',
        desc: 'The number of warnings before a kick. Set to 0 or below to disable.',
        type: 'int'
    },
    actonlimitsonly: {
        key: 'actonlimitsonly',
        name: 'Act on Limits Only',
        desc: 'Whether to kick/ban on a warning count that is in between the kickat and banat values.',
        type: 'bool'
    },
    adminrole: {
        key: 'adminrole',
        name: 'Admin role',
        desc: 'The Admin role.',
        type: 'role'
    },
    nocleverbot: {
        key: 'nocleverbot',
        name: 'No cleverbot',
        desc: 'Disables cleverbot functionality',
        type: 'bool'
    },
    disableeveryone: {
        key: 'disableeveryone',
        name: 'Disable everyone pings',
        desc: 'Disables everyone pings in custom commands.',
        type: 'bool'
    },
    disablenoperms: {
        key: 'disablenoperms',
        name: 'Disable no perms',
        desc: 'Disables the \'You need the role to use this command\' message.',
        type: 'bool'
    },
    social: {
        key: 'social',
        name: 'Social commands',
        desc: 'Enables social commands.',
        type: 'bool'
    },
    farewellchan: {
        key: 'farewellchan',
        name: 'Farewell channel',
        desc: 'Sets the channel for the farewell message to be sent in',
        type: 'channel'
    },
    greetChan: {
        key: 'greetChan',
        name: 'Greeting channel',
        desc: 'Sets the channel for the greeting message to be sent in',
        type: 'channel'
    }
};
