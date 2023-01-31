import { BBTagRuntimeError, Subtag  } from '@blargbot/bbtag';
import { ReactionRemoveAllSubtag } from '@blargbot/bbtag/subtags';
import * as Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetMessagePropTestCases } from './_getMessagePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ReactionRemoveAllSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetMessagePropTestCases({
            quiet: false,
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['reactremoveall', ...args].filter(a => a !== undefined).join(';')}}`;
            },
            cases: [
                {
                    title: 'Bot is missing permissions',
                    expected: '`I need to be able to Manage Messages to remove reactions`',
                    error: new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions'),
                    setup(_, __, ctx) {
                        ctx.roles.bot.permissions = '0';
                    }
                },
                {
                    title: 'User is staff',
                    expected: '',
                    setup(_, __, ctx) {
                        ctx.isStaff = true;
                    },
                    postSetup(channel, message, bbctx, ctx) {
                        ctx.roles.bot.permissions = Discord.PermissionFlagsBits.ManageMessages.toString();
                        ctx.messageService.setup(m => m.removeReactions(bbctx, channel.id, message.id)).thenResolve(undefined);
                    }
                },
                {
                    title: 'User is not staff, but the message is owned',
                    expected: '',
                    setup(_, __, ctx) {
                        ctx.isStaff = false;
                    },
                    postSetup(channel, message, bbctx, ctx) {
                        ctx.roles.bot.permissions = Discord.PermissionFlagsBits.ManageMessages.toString();
                        ctx.messageService.setup(m => m.removeReactions(bbctx, channel.id, message.id)).thenResolve(undefined);
                        bbctx.data.ownedMsgs.push(message.id);
                    }
                },
                {
                    title: 'User is not staff',
                    expected: '`Author must be staff to modify unrelated messages`',
                    error: new BBTagRuntimeError('Author must be staff to modify unrelated messages'),
                    setup(_, __, ctx) {
                        ctx.isStaff = false;
                        ctx.roles.bot.permissions = Discord.PermissionFlagsBits.ManageMessages.toString();
                    }
                }
            ]
        })
    ]
});
