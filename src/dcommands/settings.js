"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsCommand = void 0;
const command_1 = require("../core/command");
const utils_1 = require("../utils");
class SettingsCommand extends command_1.BaseCommand {
    constructor(cluster) {
        super(cluster, {
            name: 'settings',
            category: utils_1.CommandType.ADMIN,
            info: 'Gets or sets the settings for the current guild. Visit https://blargbot.xyz/commands/settings for key documentation.',
            handler: {
                subcommands: {
                    'list': {
                        parameters: '',
                        execute: message => this.list(message),
                        description: 'Gets the current settings for this guild'
                    },
                    'keys': {
                        parameters: '',
                        description: 'Lists all the setting keys and their types',
                        execute: () => this.keys()
                    },
                    'set': {
                        parameters: '{key} {value*}',
                        description: 'Sets the given setting key to have a certian value. If `value` is omitted, the setting is reverted to its default value',
                        execute: (message, [setting, value]) => this.set(message, setting, value.join(' '))
                    }
                }
            }
        });
    }
    async list(message) {
        if (!utils_1.guard.isGuildMessage(message))
            return '❌ Settings are only available in a guild';
        const storedGuild = await this.database.guilds.get(message.channel.guild.id);
        if (!storedGuild)
            return '❌ Your guild is not correctly configured yet! Please try again later';
        const settings = storedGuild.settings;
        const guild = message.channel.guild;
        return {
            embed: {
                fields: [
                    {
                        name: 'General',
                        value: settingGroup([
                            ['prefix', Array.isArray(settings.prefix) ? settings.prefix[0] : settings.prefix],
                            ['dmhelp', utils_1.parse.boolean(settings.dmhelp, false, true)],
                            ['disablenoperms', settings.disablenoperms ?? false],
                            ['social', settings.social ?? false]
                        ])
                    },
                    {
                        name: 'Messages',
                        value: settingGroup([
                            ['greeting', settings.greeting],
                            ['farewell', settings.farewell],
                            ['tableflip', utils_1.parse.boolean(settings.tableflip, false, true)],
                            ['nocleverbot', settings.nocleverbot ?? false],
                            ['disableeveryone', settings.disableeveryone ?? false]
                        ])
                    },
                    {
                        name: 'Channels',
                        value: settingGroup([
                            ['farewellchan', resolveChannel(guild, settings.farewellchan) ?? 'Default Channel'],
                            ['greetChan', resolveChannel(guild, settings.greetChan) ?? 'Default Channel'],
                            ['modlog', resolveChannel(guild, settings.modlog)]
                        ])
                    },
                    {
                        name: 'Permissions',
                        value: settingGroup([
                            ['permoverride', utils_1.parse.boolean(settings.permoverride, false, true)],
                            ['staffperms', settings.staffperms ?? utils_1.defaultStaff],
                            ['kickoverride', settings.kickoverride],
                            ['banoverride', settings.banoverride]
                        ])
                    },
                    {
                        name: 'Warnings',
                        value: settingGroup([
                            ['kickat', settings.kickat],
                            ['banat', settings.banat]
                        ])
                    },
                    {
                        name: 'Moderation',
                        value: settingGroup([
                            ['makelogs', utils_1.parse.boolean(settings.makelogs, false, true)],
                            ['antimention', settings.antimention],
                            ['mutedrole', resolveRole(guild, settings.mutedrole)],
                            ['deletenotif', utils_1.parse.boolean(settings.deletenotif, false, true)],
                            ['adminrole', resolveRole(guild, settings.adminrole)]
                        ])
                    }
                ]
            }
        };
    }
    async set(message, setting, value) {
        if (!utils_1.guard.isGuildMessage(message))
            return '❌ Settings are only available in a guild';
        const key = setting.toLowerCase();
        if (!utils_1.guard.isGuildSetting(key))
            return '❌ Invalid key!';
        const parsed = await utils_1.parse.guildSetting(message, this.util, key, value);
        if (!parsed.success)
            return `❌ '${value}' is not a ${utils_1.guildSettings[key]?.type}`;
        if (!await this.database.guilds.setSetting(message.channel.guild.id, key, parsed.value))
            return '❌ Failed to set';
        return `✅ ${utils_1.guildSettings[key]?.name} is set to ${parsed.display}`;
    }
    keys() {
        const message = [];
        for (const key in utils_1.guildSettings) {
            if (utils_1.guard.isGuildSetting(key)) {
                const setting = utils_1.guildSettings[key];
                if (setting !== undefined) {
                    message.push(` - **${setting.name}:** \`${setting.key.toUpperCase()}\` (${setting.type})`);
                }
            }
        }
        return 'You can use \`settings set <key> [value]\` to set the following settings. All settings are case insensitive.\n'
            + message.sort().join('\n');
    }
}
exports.SettingsCommand = SettingsCommand;
function resolveChannel(guild, channelId) {
    if (channelId === undefined)
        return undefined;
    const channel = guild.channels.get(channelId)
        ?? guild.channels.find(c => c.name.toLowerCase() === channelId.toLowerCase());
    if (!channel)
        return `Unknown channel (${channelId})`;
    return `${channel.name} (${channel.id})`;
}
function resolveRole(guild, roleId) {
    if (roleId === undefined)
        return undefined;
    const role = guild.roles.get(roleId)
        ?? guild.roles.find(r => r.name.toLowerCase() === roleId.toLowerCase());
    if (!role)
        return `Unknown role (${roleId})`;
    return `${role.name} (${role.id})`;
}
function settingGroup(values) {
    const mapped = values.map(([key, value]) => {
        const setting = utils_1.guildSettings[key];
        return [
            setting?.name ?? key,
            `${value ?? 'Not set'}`.substring(0, 100)
        ];
    });
    const keyLength = Math.max(...mapped.map(([key]) => key.length));
    const content = mapped.map(v => `${v[0].padStart(keyLength, ' ')} : ${v[1]}`)
        .join('\n');
    return utils_1.codeBlock(content, '');
}
//# sourceMappingURL=settings.js.map