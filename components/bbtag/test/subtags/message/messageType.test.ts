import { MessageTypeSubtag } from '@blargbot/bbtag/subtags/message/messageType.js';
import { snowflake } from '@blargbot/core/utils/index.js';
import Discord from 'discord-api-types/v9';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

const messageTypes: { [P in string & keyof typeof Discord.MessageType]: typeof Discord.MessageType[P] } = {
    ['Default']: Discord.MessageType.Default,
    ['RecipientAdd']: Discord.MessageType.RecipientAdd,
    ['RecipientRemove']: Discord.MessageType.RecipientRemove,
    ['Call']: Discord.MessageType.Call,
    ['ChannelNameChange']: Discord.MessageType.ChannelNameChange,
    ['ChannelIconChange']: Discord.MessageType.ChannelIconChange,
    ['ChannelPinnedMessage']: Discord.MessageType.ChannelPinnedMessage,
    ['ChannelFollowAdd']: Discord.MessageType.ChannelFollowAdd,
    ['GuildDiscoveryDisqualified']: Discord.MessageType.GuildDiscoveryDisqualified,
    ['GuildDiscoveryRequalified']: Discord.MessageType.GuildDiscoveryRequalified,
    ['GuildDiscoveryGracePeriodInitialWarning']: Discord.MessageType.GuildDiscoveryGracePeriodInitialWarning,
    ['GuildDiscoveryGracePeriodFinalWarning']: Discord.MessageType.GuildDiscoveryGracePeriodFinalWarning,
    ['ThreadCreated']: Discord.MessageType.ThreadCreated,
    ['Reply']: Discord.MessageType.Reply,
    ['ChatInputCommand']: Discord.MessageType.ChatInputCommand,
    ['ThreadStarterMessage']: Discord.MessageType.ThreadStarterMessage,
    ['GuildInviteReminder']: Discord.MessageType.GuildInviteReminder,
    ['ContextMenuCommand']: Discord.MessageType.ContextMenuCommand,
    ['UserJoin']: Discord.MessageType.UserJoin,
    ['GuildBoost']: Discord.MessageType.GuildBoost,
    ['GuildBoostTier1']: Discord.MessageType.GuildBoostTier1,
    ['GuildBoostTier2']: Discord.MessageType.GuildBoostTier2,
    ['GuildBoostTier3']: Discord.MessageType.GuildBoostTier3,
    ['AutoModerationAction']: Discord.MessageType.AutoModerationAction
};

runSubtagTests({
    subtag: new MessageTypeSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['messagetype', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: Object.entries(messageTypes).map(([key, value]) => ({
                title: `When the message is of type ${key}`,
                expected: value.toString(),
                setup(_, message) {
                    message.type = value;
                    message.mentions.push(SubtagTestContext.createApiUser({ id: snowflake.create().toString() }));
                    Object.defineProperty(message, 'call', { value: {} });
                }
            }))
        })
    ]
});
