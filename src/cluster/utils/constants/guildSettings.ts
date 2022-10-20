import { TranslatableString } from '@blargbot/domain/messages/index';
import { GuildSettingDocs } from '@blargbot/domain/models';

export const guildSettings: GuildSettingDocs = {
    makelogs: {
        key: 'makelogs',
        name: TranslatableString.create('settings.makelogs.name', 'Make ChatLogs'),
        desc: TranslatableString.create('settings.makelogs.description', 'Whether to record chat logs or not.'),
        type: 'bool'
    },
    cahnsfw: {
        key: 'cahnsfw',
        name: TranslatableString.create('settings.cahnsfw.name', 'Is CAH NSFW'),
        desc: TranslatableString.create('settings.cahnsfw.description', 'Whether \'cah\' can only be done in nsfw channels or not.'),
        type: 'bool'
    },
    deletenotif: {
        key: 'deletenotif',
        name: TranslatableString.create('settings.deletenotif.name', 'Delete notifications'),
        desc: TranslatableString.create('settings.deletenotif.description', 'If enabled, notifies you if a user deleted their command.'),
        type: 'bool'
    },
    modlog: {
        key: 'modlog',
        name: TranslatableString.create('settings.modlog.name', 'Modlog channel'),
        desc: TranslatableString.create('settings.modlog.description', 'The id of the modlog channel. You can also use the <code>modlog</code> command'),
        type: 'channel'
    },
    mutedrole: {
        key: 'mutedrole',
        name: TranslatableString.create('settings.mutedrole.name', 'Muted role'),
        desc: TranslatableString.create('settings.mutedrole.description', 'The id of the muted role.'),
        type: 'role'
    },
    tableflip: {
        key: 'tableflip',
        name: TranslatableString.create('settings.tableflip.name', 'Tableflips'),
        desc: TranslatableString.create('settings.tableflip.description', 'Whether the bot should respond to tableflips/unflips.'),
        type: 'bool'
    },
    antimention: {
        key: 'antimention',
        name: TranslatableString.create('settings.antimention.name', 'Anti-mention'),
        desc: TranslatableString.create('settings.antimention.description', 'The number of unique mentions required to warrant a ban (for anti-mention spam). Set to \'0\' to disable. Recommended: 25'),
        type: 'int'
    },
    dmhelp: {
        key: 'dmhelp',
        name: TranslatableString.create('settings.dmhelp.name', 'DM help'),
        desc: TranslatableString.create('settings.dmhelp.description', 'Whether or not to dm help messages or output them in channels'),
        type: 'bool'
    },
    staffperms: {
        key: 'staffperms',
        name: TranslatableString.create('settings.staffperms.name', 'Staff permissions'),
        desc: TranslatableString.create('settings.staffperms.description', 'The numeric value of permissions that designate a staff member. If a user has any of the permissions and permoverride is enabled, allows them to execute any command regardless of role. See <a href=https://discordapi.com/permissions.html>here</a> for a permission calculator.'),
        type: 'permission'
    },
    timeoutoverride: {
        key: 'timeoutoverride',
        name: TranslatableString.create('settings.timeoutoverride.name', 'Timeout override'),
        desc: TranslatableString.create('settings.timeoutoverride.description', 'Same as staffperms, but allows users to use the timeout command regardless of permissions'),
        type: 'permission'
    },
    kickoverride: {
        key: 'kickoverride',
        name: TranslatableString.create('settings.kickoverride.name', 'Kick override'),
        desc: TranslatableString.create('settings.kickoverride.description', 'Same as staffperms, but allows users to use the kick command regardless of permissions'),
        type: 'permission'
    },
    banoverride: {
        key: 'banoverride',
        name: TranslatableString.create('settings.banoverride.name', 'Ban override'),
        desc: TranslatableString.create('settings.banoverride.description', 'Same as staffperms, but allows users to use the ban/hackban/unban commands regardless of permissions'),
        type: 'permission'
    },
    banat: {
        key: 'banat',
        name: TranslatableString.create('settings.banat.name', 'Ban at'),
        desc: TranslatableString.create('settings.banat.description', 'The number of warnings before a ban. Set to 0 or below to disable.'),
        type: 'int'
    },
    kickat: {
        key: 'kickat',
        name: TranslatableString.create('settings.kickat.name', 'Kick at'),
        desc: TranslatableString.create('settings.kickat.description', 'The number of warnings before a kick. Set to 0 or below to disable.'),
        type: 'int'
    },
    timeoutat: {
        key: 'timeoutat',
        name: TranslatableString.create('settings.timeoutat.name', 'Time Out at'),
        desc: TranslatableString.create('settings.timeoutat.description', 'The number of warnings before a timeout. Set to 0 or below to disable.'),
        type: 'int'
    },
    actonlimitsonly: {
        key: 'actonlimitsonly',
        name: TranslatableString.create('settings.actonlimitsonly.name', 'Act on Limits Only'),
        desc: TranslatableString.create('settings.actonlimitsonly.description', 'Whether to kick/ban on a warning count that is in between the kickat and banat values.'),
        type: 'bool'
    },
    adminrole: {
        key: 'adminrole',
        name: TranslatableString.create('settings.adminrole.name', 'Admin role'),
        desc: TranslatableString.create('settings.adminrole.description', 'The Admin role.'),
        type: 'role'
    },
    nocleverbot: {
        key: 'nocleverbot',
        name: TranslatableString.create('settings.nocleverbot.name', 'No cleverbot'),
        desc: TranslatableString.create('settings.nocleverbot.description', 'Disables cleverbot functionality'),
        type: 'bool'
    },
    disableeveryone: {
        key: 'disableeveryone',
        name: TranslatableString.create('settings.disableeveryone.name', 'Disable everyone pings'),
        desc: TranslatableString.create('settings.disableeveryone.description', 'Disables everyone pings in custom commands.'),
        type: 'bool'
    },
    disablenoperms: {
        key: 'disablenoperms',
        name: TranslatableString.create('settings.disablenoperms.name', 'Disable no perms'),
        desc: TranslatableString.create('settings.disablenoperms.description', 'Disables the \'You need the role to use this command\' message.'),
        type: 'bool'
    },
    social: {
        key: 'social',
        name: TranslatableString.create('settings.social.name', 'Social commands'),
        desc: TranslatableString.create('settings.social.description', 'Enables social commands.'),
        type: 'bool'
    },
    farewellchan: {
        key: 'farewellchan',
        name: TranslatableString.create('settings.farewellchan.name', 'Farewell channel'),
        desc: TranslatableString.create('settings.farewellchan.description', 'Sets the channel for the farewell message to be sent in'),
        type: 'channel'
    },
    greetchan: {
        key: 'greetchan',
        name: TranslatableString.create('settings.greetchan.name', 'Greeting channel'),
        desc: TranslatableString.create('settings.greetchan.description', 'Sets the channel for the greeting message to be sent in'),
        type: 'channel'
    }
};
