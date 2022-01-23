import { BBTagRuntimeError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { OutputSubtag } from '@cluster/subtags/message/output';
import { expect } from 'chai';

import { argument } from '../../../../mock';
import { MarkerError, runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new OutputSubtag(),
    cases: [
        {
            title: 'Custom command',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = true;
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'disableeveryone')).thenResolve(false);
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const reactions = ['23906723407', '239864789246', '2349724894'];
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                bbctx.state.embeds = embeds;
                bbctx.state.file = files[0];
                bbctx.state.allowedMentions.everybody = true;
                bbctx.state.allowedMentions.roles = roleMentions;
                bbctx.state.allowedMentions.users = userMentions;
                bbctx.state.reactions = reactions;
                bbctx.state.nsfw = 'This is the nsfw message';

                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual(reactions))).thenResolve({ success: reactions, failed: [] });
                ctx.util.setup(m => m.send(bbctx.message, argument.isDeepEqual({
                    content: '',
                    replyToExecuting: true,
                    embeds: embeds,
                    files: files,
                    nsfw: 'This is the nsfw message',
                    allowedMentions: {
                        everyone: true,
                        repliedUser: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                expect(bbctx.state.outputMessage).to.equal('0987654331234567');
            }
        },
        {
            title: 'Tag command',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const reactions = ['23906723407', '239864789246', '2349724894'];
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                bbctx.state.embeds = embeds;
                bbctx.state.file = files[0];
                bbctx.state.allowedMentions.everybody = true;
                bbctx.state.allowedMentions.roles = roleMentions;
                bbctx.state.allowedMentions.users = userMentions;
                bbctx.state.reactions = reactions;
                bbctx.state.nsfw = 'This is the nsfw message';

                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual(reactions))).thenResolve({ success: reactions, failed: [] });
                ctx.util.setup(m => m.send(bbctx.message, argument.isDeepEqual({
                    content: '',
                    replyToExecuting: true,
                    embeds: embeds,
                    files: files,
                    nsfw: 'This is the nsfw message',
                    allowedMentions: {
                        everyone: false,
                        repliedUser: true
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                expect(bbctx.state.outputMessage).to.equal('0987654331234567');
            }
        },
        {
            title: 'Custom command',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = true;
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'disableeveryone')).thenResolve(false);
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const reactions = ['23906723407', '239864789246', '2349724894'];
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                bbctx.state.embeds = embeds;
                bbctx.state.file = files[0];
                bbctx.state.allowedMentions.everybody = true;
                bbctx.state.allowedMentions.roles = roleMentions;
                bbctx.state.allowedMentions.users = userMentions;
                bbctx.state.reactions = reactions;
                bbctx.state.nsfw = 'This is the nsfw message';

                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual(reactions))).thenResolve({ success: reactions, failed: [] });
                ctx.util.setup(m => m.send(bbctx.message, argument.isDeepEqual({
                    content: 'This is my message content',
                    replyToExecuting: true,
                    embeds: embeds,
                    files: files,
                    nsfw: 'This is the nsfw message',
                    allowedMentions: {
                        everyone: true,
                        repliedUser: true,
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                expect(bbctx.state.outputMessage).to.equal('0987654331234567');
            }
        },
        {
            title: 'Tag command',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const embeds = [{ title: 'abc' }];
                const files = [{ file: 'test content', name: 'test.txt' }];
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const reactions = ['23906723407', '239864789246', '2349724894'];
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                bbctx.state.embeds = embeds;
                bbctx.state.file = files[0];
                bbctx.state.allowedMentions.everybody = true;
                bbctx.state.allowedMentions.roles = roleMentions;
                bbctx.state.allowedMentions.users = userMentions;
                bbctx.state.reactions = reactions;
                bbctx.state.nsfw = 'This is the nsfw message';

                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual(reactions))).thenResolve({ success: reactions, failed: [] });
                ctx.util.setup(m => m.send(bbctx.message, argument.isDeepEqual({
                    content: 'This is my message content',
                    replyToExecuting: true,
                    embeds: embeds,
                    files: files,
                    nsfw: 'This is the nsfw message',
                    allowedMentions: {
                        everyone: false,
                        repliedUser: true
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                expect(bbctx.state.outputMessage).to.equal('0987654331234567');
            }
        },
        {
            title: 'Tag command minimal',
            code: '{output;This is my message content}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    id: '0987654331234567',
                    channel_id: bbctx.channel.id
                }, ctx.users.command));

                bbctx.state.embeds = [];
                bbctx.state.file = undefined;
                bbctx.state.allowedMentions.everybody = false;
                bbctx.state.allowedMentions.roles = [];
                bbctx.state.allowedMentions.users = [];
                bbctx.state.reactions = [];
                bbctx.state.nsfw = undefined;

                ctx.util.setup(m => m.addReactions(message, argument.isDeepEqual([]))).thenResolve({ success: [], failed: [] });
                ctx.util.setup(m => m.send(bbctx.message, argument.isDeepEqual({
                    content: 'This is my message content',
                    replyToExecuting: true,
                    embeds: [],
                    files: undefined,
                    nsfw: undefined,
                    allowedMentions: {
                        everyone: false,
                        repliedUser: true
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                expect(bbctx.state.outputMessage).to.equal('0987654331234567');
            }
        },
        {
            title: 'Output already sent',
            code: '{output}',
            expected: '0987654331234567',
            setup(ctx) {
                ctx.options.state ??= {};
                ctx.options.state.outputMessage = '0987654331234567';
                ctx.options.isCC = false;
            },
            assert(bbctx) {
                expect(bbctx.state.outputMessage).to.equal('0987654331234567');
            }
        },
        {
            title: 'Output already sent',
            code: '{output;This is my message content}',
            expected: '`Cannot send multiple outputs`',
            setup(ctx) {
                ctx.options.state ??= {};
                ctx.options.state.outputMessage = '0987654331234567';
                ctx.options.isCC = false;
            },
            errors: [
                { start: 0, end: 35, error: new BBTagRuntimeError('Cannot send multiple outputs') }
            ],
            assert(bbctx) {
                expect(bbctx.state.outputMessage).to.equal('0987654331234567');
            }
        },
        {
            code: '{output;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) },
                { start: 15, end: 21, error: new MarkerError('eval', 15) },
                { start: 0, end: 22, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
