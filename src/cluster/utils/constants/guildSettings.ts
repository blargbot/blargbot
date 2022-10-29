import { GuildSettingDocs } from '@blargbot/domain/models';

import templates from '../../text';

export const guildSettings: GuildSettingDocs = {
    makelogs: {
        key: 'makelogs',
        name: templates.settings.makelogs.name,
        desc: templates.settings.makelogs.description,
        type: 'bool'
    },
    cahnsfw: {
        key: 'cahnsfw',
        name: templates.settings.cahnsfw.name,
        desc: templates.settings.cahnsfw.description,
        type: 'bool'
    },
    deletenotif: {
        key: 'deletenotif',
        name: templates.settings.deletenotif.name,
        desc: templates.settings.deletenotif.description,
        type: 'bool'
    },
    modlog: {
        key: 'modlog',
        name: templates.settings.modlog.name,
        desc: templates.settings.modlog.description,
        type: 'channel'
    },
    mutedrole: {
        key: 'mutedrole',
        name: templates.settings.mutedrole.name,
        desc: templates.settings.mutedrole.description,
        type: 'role'
    },
    tableflip: {
        key: 'tableflip',
        name: templates.settings.tableflip.name,
        desc: templates.settings.tableflip.description,
        type: 'bool'
    },
    antimention: {
        key: 'antimention',
        name: templates.settings.antimention.name,
        desc: templates.settings.antimention.description,
        type: 'int'
    },
    dmhelp: {
        key: 'dmhelp',
        name: templates.settings.dmhelp.name,
        desc: templates.settings.dmhelp.description,
        type: 'bool'
    },
    staffperms: {
        key: 'staffperms',
        name: templates.settings.staffperms.name,
        desc: templates.settings.staffperms.description,
        type: 'permission'
    },
    timeoutoverride: {
        key: 'timeoutoverride',
        name: templates.settings.timeoutoverride.name,
        desc: templates.settings.timeoutoverride.description,
        type: 'permission'
    },
    kickoverride: {
        key: 'kickoverride',
        name: templates.settings.kickoverride.name,
        desc: templates.settings.kickoverride.description,
        type: 'permission'
    },
    banoverride: {
        key: 'banoverride',
        name: templates.settings.banoverride.name,
        desc: templates.settings.banoverride.description,
        type: 'permission'
    },
    banat: {
        key: 'banat',
        name: templates.settings.banat.name,
        desc: templates.settings.banat.description,
        type: 'int'
    },
    kickat: {
        key: 'kickat',
        name: templates.settings.kickat.name,
        desc: templates.settings.kickat.description,
        type: 'int'
    },
    timeoutat: {
        key: 'timeoutat',
        name: templates.settings.timeoutat.name,
        desc: templates.settings.timeoutat.description,
        type: 'int'
    },
    actonlimitsonly: {
        key: 'actonlimitsonly',
        name: templates.settings.actonlimitsonly.name,
        desc: templates.settings.actonlimitsonly.description,
        type: 'bool'
    },
    adminrole: {
        key: 'adminrole',
        name: templates.settings.adminrole.name,
        desc: templates.settings.adminrole.description,
        type: 'role'
    },
    nocleverbot: {
        key: 'nocleverbot',
        name: templates.settings.nocleverbot.name,
        desc: templates.settings.nocleverbot.description,
        type: 'bool'
    },
    disableeveryone: {
        key: 'disableeveryone',
        name: templates.settings.disableeveryone.name,
        desc: templates.settings.disableeveryone.description,
        type: 'bool'
    },
    disablenoperms: {
        key: 'disablenoperms',
        name: templates.settings.disablenoperms.name,
        desc: templates.settings.disablenoperms.description,
        type: 'bool'
    },
    social: {
        key: 'social',
        name: templates.settings.social.name,
        desc: templates.settings.social.description,
        type: 'bool'
    },
    farewellchan: {
        key: 'farewellchan',
        name: templates.settings.farewellchan.name,
        desc: templates.settings.farewellchan.description,
        type: 'channel'
    },
    greetchan: {
        key: 'greetchan',
        name: templates.settings.greetchan.name,
        desc: templates.settings.greetchan.description,
        type: 'channel'
    },
    language: {
        key: 'language',
        name: templates.settings.language.name,
        desc: templates.settings.language.description,
        type: 'locale'
    }
};
