import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { MessageTypeSubtag } from '@cluster/subtags/message/messagetype';
import { snowflake } from '@cluster/utils';
import { MessageType } from 'discord-api-types';

import { MarkerError, runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';
import { createGetMessagePropTestCases } from './_getMessagePropTest';

const messageTypes: { [P in string & keyof typeof MessageType]: typeof MessageType[P] } = {
    ['Default']: MessageType.Default,
    ['RecipientAdd']: MessageType.RecipientAdd,
    ['RecipientRemove']: MessageType.RecipientRemove,
    ['Call']: MessageType.Call,
    ['ChannelNameChange']: MessageType.ChannelNameChange,
    ['ChannelIconChange']: MessageType.ChannelIconChange,
    ['ChannelPinnedMessage']: MessageType.ChannelPinnedMessage,
    ['GuildMemberJoin']: MessageType.GuildMemberJoin,
    ['UserPremiumGuildSubscription']: MessageType.UserPremiumGuildSubscription,
    ['UserPremiumGuildSubscriptionTier1']: MessageType.UserPremiumGuildSubscriptionTier1,
    ['UserPremiumGuildSubscriptionTier2']: MessageType.UserPremiumGuildSubscriptionTier2,
    ['UserPremiumGuildSubscriptionTier3']: MessageType.UserPremiumGuildSubscriptionTier3,
    ['ChannelFollowAdd']: MessageType.ChannelFollowAdd,
    ['GuildDiscoveryDisqualified']: MessageType.GuildDiscoveryDisqualified,
    ['GuildDiscoveryRequalified']: MessageType.GuildDiscoveryRequalified,
    ['GuildDiscoveryGracePeriodInitialWarning']: MessageType.GuildDiscoveryGracePeriodInitialWarning,
    ['GuildDiscoveryGracePeriodFinalWarning']: MessageType.GuildDiscoveryGracePeriodFinalWarning,
    ['ThreadCreated']: MessageType.ThreadCreated,
    ['Reply']: MessageType.Reply,
    ['ChatInputCommand']: MessageType.ChatInputCommand,
    ['ThreadStarterMessage']: MessageType.ThreadStarterMessage,
    ['GuildInviteReminder']: MessageType.GuildInviteReminder,
    ['ContextMenuCommand']: MessageType.ContextMenuCommand
};

runSubtagTests({
    subtag: new MessageTypeSubtag(),
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoMessageId: true,
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
        }),
        {
            code: '{messagetype;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 20, end: 26, error: new MarkerError('eval', 20) },
                { start: 27, end: 33, error: new MarkerError('eval', 27) },
                { start: 0, end: 34, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
