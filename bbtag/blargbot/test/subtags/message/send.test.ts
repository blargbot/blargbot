import { BBTagRuntimeError, ChannelNotFoundError } from '@bbtag/blargbot';
import { EscapeBBTagSubtag, SendSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: SendSubtag,
    argCountBounds: { min: 2, max: 5 },
    cases: [
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`No channel found`',
            errors: [
                { start: 0, end: 30, error: new ChannelNotFoundError('1923681361978632931') }
            ],
            postSetup(bbctx, ctx) {
                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve();
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Test error`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Test error') }
            ],
            setup(ctx) {
                ctx.options.allowMentions = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenReject(new BBTagRuntimeError('Test error'));
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.ownedMessageIds).to.eql(new Set([bbctx.runtime.message.id]));
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Failed to send: Test error`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to send: Test error') }
            ],
            setup(ctx) {
                ctx.options.allowMentions = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve({ error: 'Test error' });
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.ownedMessageIds).to.eql(new Set([bbctx.runtime.message.id]));
            }
        },
        {
            code: '{send;1923681361978632931;abc}',
            expected: '`Failed to send: UNKNOWN`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to send: UNKNOWN') }
            ],
            setup(ctx) {
                ctx.options.allowMentions = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve({ error: 'UNKNOWN' });
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.ownedMessageIds).to.eql(new Set([bbctx.runtime.message.id]));
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc}',
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
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
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
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
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc}',
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: undefined,
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
                    content: undefined,
                    embeds: [{ title: 'New embed!' }],
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
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
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: undefined,
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
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
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{ file: 'bXkgZmlsZSBjb250ZW50', name: 'file.txt' }],
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
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
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
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
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content;test.zip}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
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
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};my file content;test.zip}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
                    content: 'abc',
                    embeds: [{ title: 'New embed!' }],
                    files: [{ file: 'bXkgZmlsZSBjb250ZW50', name: 'test.zip' }],
                    allowed_mentions: {
                        parse: []
                    }
                }))).thenResolve(message);
            },
            assert(bbctx) {
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Custom command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef;test.zip}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = true;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
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
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        },
        {
            title: 'Tag command',
            code: '{send;1923681361978632931;abc;{escapebbtag;{"title":"New embed!"}};buffer:abcdef;test.zip}',
            subtags: [EscapeBBTagSubtag],
            expected: '239476239742340234',
            setup(ctx) {
                ctx.options.allowMentions = false;
            },
            postSetup(bbctx, ctx) {
                const roleMentions = ['56789043764325674', '345678238285862342'];
                const userMentions = ['23946265743358573', '234926342423437987'];
                const message = SubtagTestContext.createMessage({
                    id: '239476239742340234',
                    channel_id: bbctx.runtime.channel.id
                }, ctx.users.command);

                const general = ctx.channels.general;

                bbctx.runtime.outputOptions.allowEveryone = true;
                for (const role of roleMentions)
                    bbctx.runtime.outputOptions.mentionRoles.add(role);
                for (const user of userMentions)
                    bbctx.runtime.outputOptions.mentionUsers.add(user);

                ctx.inject.channels.setup(m => m.querySingle(bbctx.runtime, '1923681361978632931', argument.isDeepEqual({ noLookup: true }))).thenResolve(general);
                ctx.inject.messages.setup(m => m.create(bbctx.runtime, general.id, argument.isDeepEqual({
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
                chai.expect(bbctx.runtime.ownedMessageIds).to.include('239476239742340234');
            }
        }
    ]
});
