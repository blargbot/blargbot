import { StoredGuildSettings } from '../../core/database';

type GuildSettingTypeName<T> =
    T extends string ? 'string' | 'channel' | 'role' :
    T extends number ? 'int' :
    T extends boolean ? 'bool' : never

export type GuildSettingDescriptor<T extends keyof StoredGuildSettings = keyof StoredGuildSettings> = {
    key: T;
    name: string;
    desc: string;
    type: GuildSettingTypeName<StoredGuildSettings[T]>
}

export const guildSettings: { [P in keyof StoredGuildSettings]?: GuildSettingDescriptor<P> } = {
    makelogs: {
        key: 'makelogs',
        name: 'Make Chatlogs',
        desc: 'Whether to record chat logs or not.',
        type: 'bool'
    },
    // cahnsfw: {
    //     name: 'Is CAH NSFW',
    //     desc: `Whether 'cah' can only be done in nsfw channels or not.`,
    //     type: 'bool'
    // },
    deletenotif: {
        key: 'deletenotif',
        name: 'Delete Notifications',
        desc: 'If enabled, notifies you if a user deleted their command.',
        type: 'bool'
    },
    greeting: {
        key: 'greeting',
        name: 'Greeting Message',
        desc: 'What to say to new users when they join. You can also use the <code>greet</code> command',
        type: 'string'
    },
    farewell: {
        key: 'farewell',
        name: 'Farewell Message',
        desc: 'What to say when a user leaves. You can also use the <code>farewell</code> command',
        type: 'string'
    },
    modlog: {
        key: 'modlog',
        name: 'Modlog Channel',
        desc: 'The id of the modlog channel. You can also use the <code>modlog</code> command',
        type: 'channel'
    },
    mutedrole: {
        key: 'mutedrole',
        name: 'Muted Role',
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
        name: 'Anti-Mention',
        desc: 'The number of unique mentions required to warrant a ban (for anti-mention spam). Set to \'0\' to disable. Recommended: 25',
        type: 'int'
    },
    dmhelp: {
        key: 'dmhelp',
        name: 'DM Help',
        desc: 'Whether or not to dm help messages or output them in channels',
        type: 'bool'
    },
    permoverride: {
        key: 'permoverride',
        name: 'Permission Override',
        desc: 'Whether or not specific permissions override role requirement',
        type: 'bool'
    },
    staffperms: {
        key: 'staffperms',
        name: 'Staff Permissions',
        desc: 'The numeric value of permissions that designate a staff member. If a user has any of the permissions and permoverride is enabled, allows them to execute any command regardless of role. See <a href=https://discordapi.com/permissions.html>here</a> for a permission calculator.',
        type: 'int'
    },
    kickoverride: {
        key: 'kickoverride',
        name: 'Kick Override',
        desc: 'Same as staffperms, but allows users to use the kick command regardless of permissions',
        type: 'int'
    },
    banoverride: {
        key: 'banoverride',
        name: 'Ban Override',
        desc: 'Same as staffperms, but allows users to use the ban/hackban/unban commands regardless of permissions',
        type: 'int'
    },
    banat: {
        key: 'banat',
        name: 'Ban At',
        desc: 'The number of warnings before a ban. Set to 0 or below to disable.',
        type: 'int'
    },
    kickat: {
        key: 'kickat',
        name: 'Kick At',
        desc: 'The number of warnings before a kick. Set to 0 or below to disable.',
        type: 'int'
    },
    adminrole: {
        key: 'adminrole',
        name: 'Admin Role Name',
        desc: 'The name of the Admin role.',
        type: 'role'
    },
    nocleverbot: {
        key: 'nocleverbot',
        name: 'No Cleverbot',
        desc: 'Disables cleverbot functionality',
        type: 'bool'
    },
    disableeveryone: {
        key: 'disableeveryone',
        name: 'Disable Everyone Pings',
        desc: 'Disables everyone pings in custom commands.',
        type: 'bool'
    },
    disablenoperms: {
        key: 'disablenoperms',
        name: 'Disable No Perms',
        desc: 'Disables the \'You need the role to use this command\' message.',
        type: 'bool'
    },
    social: {
        key: 'social',
        name: 'Enable Social Commands',
        desc: 'Enables social commands.',
        type: 'bool'
    }
};