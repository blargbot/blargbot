module.exports = {
    CAT_ID: '103347843934212096',
    ERROR_CHANNEL: '250859956989853696',
    COMMAND_CHANNEL: '243229905360388106',
    TAG_CHANNEL: '230810364164440065',
    BOT_LOG_CHANNEL: '205153826162868225',
    BUG_CHANNEL: '229137183234064384',
    SUGGESTION_CHANNEL: '195716879237644292',
    FEEDBACK_CHANNEL: '268859677326966784',
    YES_TICK: '<:bbYesTick:327817425905254402>',
    NEUTRAL_TICK: '<:bbNeutralTick:327817426353913856>',
    NO_TICK: '<:bbNoTick:327817426194661386>',
    Messages: require('./Messages'),
    Types: require('./Types'),
    TagError: require('./TagError'),
    Permissions: {
        KICK_MEMBERS: "kickMembers",
        BAN_MEMBERS: "banMembers",
        ADMINISTRATOR: "administrator",
        MANAGE_CHANNELS: "manageChannels",
        MANAGE_GUILD: "manageGuild",
        ADD_REACTIONS: "addReactions",
        VIEW_AUDIT_LOGS: "viewAuditLogs",
        READ_MESSAGES: "readMessages",
        SEND_MESSAGES: "sendMessages",
        SEND_TTS_MESSAGES: "sendTTSMessages",
        MANAGE_MESSAGES: "manageMessages",
        EMBED_LINKS: "embedLinks",
        ATTACH_FILES: "attachFiles",
        READ_MESSAGE_HISTORY: "readMessageHistory",
        MENTION_EVERYONE: "mentionEveryone",
        EXTERNAL_EMOJIS: "externalEmojis",
        VOICE_CONNECT: "voiceConnect",
        VOICE_SPEAK: "voiceSpeak",
        VOICE_MUTE_MEMBERS: "voiceMuteMembers",
        VOICE_DEAFEN_MEMBERS: "voiceDeafenMembers",
        VOICE_MOVE_MEMBERS: "voiceMoveMembers",
        VOICE_USE_VAD: "voiceUseVAD",
        CHANGE_NICKNAME: "changeNickname",
        MANAGE_NICKNAMES: "manageNicknames",
        MANAGE_ROLES: "manageRoles",
        MANAGE_WEBHOOKS: "manageWebhooks",
        MANAGE_EMOJIS: "manageEmojis",
        ALL: "all",
        ALL_GUILD: "allGuild",
        ALL_TEXT: "allText",
        ALL_VOICE: "allVoice"
    }
};

const SettingTypes = {
    INT: 1,
    STRING: 2,
    BOOL: 3,
    CHANNEL: 4,
    ROLE: 5
};
module.exports.SettingTypes = SettingTypes;

const Settings = {
    MAKELOGS: { type: SettingTypes.BOOL },
    TABLEFLIP: { type: SettingTypes.BOOL },
    CAHNSFW: { type: SettingTypes.BOOL },
    DMHELP: { type: SettingTypes.BOOL },
    STAFFPERMS: { type: SettingTypes.INT },
    ANTIMENTION: { type: SettingTypes.INT },
    ANTIMENTIONWEIGHT: { type: SettingTypes.INT },
    ANNOUNCEMENTCHANNEL: { type: SettingTypes.CHANNEL },
    ANNOUNCEMENTROLE: { type: SettingTypes.ROLE },
    GREETING: { type: SettingTypes.STRING },
    GREETINGCHANNEL: { type: SettingTypes.CHANNEL },
    FAREWELL: { type: SettingTypes.STRING },
    FAREWELLCHANNEL: { type: SettingTypes.CHANNEL },
    MUTEDROLE: { type: SettingTypes.ROLE },
    MODLOG: { type: SettingTypes.CHANNEL },
    LOCALE: { type: SettingTypes.STRING }
};
for (const key in Settings) {
    Settings[key].desc = `settings.${key.toLowerCase()}`;
}

module.exports.Settings = Settings;