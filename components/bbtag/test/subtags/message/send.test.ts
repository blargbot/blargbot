import { BBTagRuntimeError, ChannelNotFoundError, Subtag } from '@bbtag/blargbot';
import { EscapeBBTagSubtag, SendSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';
import Discord from '@blargbot/discord-types';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(SendSubtag),
    argCountBounds: { min: 2, max: 5 },
    cases: [
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`No channel found`',
            errors: [
                { start: 0, end: 30, error: new ChannelNotFoundError('1923681361978632931') }
            ],
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve();
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Test error`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Test error') }
            ],
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenReject(new BBTagRuntimeError('Test error'));
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.be.empty;
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Failed to send: Test error`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to send: Test error') }
            ],
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve({ error: 'Test error' });
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.be.empty;
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Failed to send: UNKNOWN`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to send: UNKNOWN') }
            ],
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve({ error: 'UNKNOWN' });
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.be.empty;
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc}',
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowed_mentions: {
                        parse: [Discord.AllowedMentionsTypes.Everyone],
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: undefined,
                    embeds: [{ title: 'New embed!' }],
                    files: undefined,
                    allowed_mentions: {
                        parse: [Discord.AllowedMentionsTypes.Everyone],
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc}',
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: undefined,
                    embeds: [{ title: 'New embed!' }],
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: undefined,
                    allowed_mentions: {
                        parse: [Discord.AllowedMentionsTypes.Everyone],
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{ file: 'bXkgZmlsZSBjb250ZW50', name: 'file.txt' }],
                    allowed_mentions: {
                        parse: [Discord.AllowedMentionsTypes.Everyone],
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{ file: 'bXkgZmlsZSBjb250ZW50', name: 'file.txt' }],
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{
                        file: 'abcdef',
                        name: 'file.txt'
                    }],
                    allowed_mentions: {
                        parse: [Discord.AllowedMentionsTypes.Everyone],
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{
                        file: 'abcdef',
                        name: 'file.txt'
                    }],
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content;test.zip}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{ file: 'bXkgZmlsZSBjb250ZW50', name: 'test.zip' }],
                    allowed_mentions: {
                        parse: [Discord.AllowedMentionsTypes.Everyone],
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content;test.zip}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{ file: 'bXkgZmlsZSBjb250ZW50', name: 'test.zip' }],
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef;test.zip}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{
                        file: 'abcdef',
                        name: 'test.zip'
                    }],
                    allowed_mentions: {
                        parse: [Discord.AllowedMentionsTypes.Everyone],
                        roles: roleMentions,
                        users: userMentions
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef;test.zip}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.isCC = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.data.allowedMentions.everybody = true;
                bbctx.data.allowedMentions.roles = roleMentions;
                bbctx.data.allowedMentions.users = userMentions;

                ctx.channelService.setup(m => m.querySingle(bbctx, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.messageService.setup(m => m.create(bbctx, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{
                        file: 'abcdef',
                        name: 'test.zip'
                    }],
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.ownedMsgs).to.include('239476239742340234');
            }
        }
    ]
});
