import { Subtag } from '@blargbot/bbtag';
import { MessageTypeSubtag } from '@blargbot/bbtag/subtags/message/messageType.js';
import { snowflake } from '@blargbot/discord-util';
import Discord from 'discord-api-types/v10';

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
    ['AutoModerationAction']: Discord.MessageType.AutoModerationAction,
    ['RoleSubscriptionPurchase']: Discord.MessageType.RoleSubscriptionPurchase,
    ['InteractionPremiumUpsell']: Discord.MessageType.InteractionPremiumUpsell,
    ['StageStart']: Discord.MessageType.StageStart,
    ['StageEnd']: Discord.MessageType.StageEnd,
    ['StageSpeaker']: Discord.MessageType.StageSpeaker,
    ['StageRaiseHand']: Discord.MessageType.StageRaiseHand,
    ['StageTopic']: Discord.MessageType.StageTopic,
    ['GuildApplicationPremiumSubscription']: Discord.MessageType.GuildApplicationPremiumSubscription
};

const createSnowflake = snowflake.nextFactory();
runSubtagTests({
    subtag: Subtag.getDescriptor(MessageTypeSubtag),
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
                    message.mentions.push(SubtagTestContext.createUser({ id: createSnowflake() }));
                    Object.defineProperty(message, 'call', { value: {} });
                }
            }))
        })
    ]
});
