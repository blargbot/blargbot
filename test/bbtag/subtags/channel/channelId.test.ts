import assert from 'node:assert/strict';

import { ChannelNotFoundError } from '@blargbot/bbtag';
import type { CheckChannelExistsThunk, FindChannelThunk, QueryChannelThunk } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const checkChannelExists = new Mock<CheckChannelExistsThunk>({ id: 'checkChannelExists', callable: true });
const findChannel = new Mock<FindChannelThunk>({ id: 'findChannel', callable: true });
const queryChannel = new Mock<QueryChannelThunk>({ id: 'queryChannel', callable: true });

await runSubtagTests({
    subtag: new ChannelIdSubtag({
        checkChannelExists: checkChannelExists.instance,
        findChannel: findChannel.instance,
        queryChannel: queryChannel.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelId', 'categoryId'],
    setup(ctx) {
        ctx.adoptMock(checkChannelExists);
        ctx.adoptMock(findChannel);
        ctx.adoptMock(queryChannel);
    },
    cases: [
        {
            code: '{channelid}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.channels.command.id = '983798372948729434';
                ctx.message.channel_id = '983798372948729434';
            }
        },
        {
            code: '{channelid;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.channels.command.id = '983798372948729434';
                ctx.message.channel_id = '983798372948729434';
            }
        },
        {
            code: '{channelid;;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.channels.command.id = '983798372948729434';
                ctx.message.channel_id = '983798372948729434';
            }
        },
        {
            code: '{channelid;;q}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.channels.command.id = '983798372948729434';
                ctx.message.channel_id = '983798372948729434';
            }
        },
        {
            title: 'Current channel',
            code: '{channelid;983798372948729434}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.channels.command.id = '983798372948729434';
                ctx.message.channel_id = '983798372948729434';
            }
        },
        {
            code: '{channelid;In Cache}',
            expected: '983798372948729434',
            postSetup(bbctx) {
                bbctx.root.queryCache.channel.set('in cache', '983798372948729434');
            }
        },
        {
            code: '{channelid;In Cache;}',
            expected: '983798372948729434',
            postSetup(bbctx) {
                bbctx.root.queryCache.channel.set('in cache', '983798372948729434');
            }
        },
        {
            code: '{channelid;In Cache;q}',
            expected: '983798372948729434',
            postSetup(bbctx) {
                bbctx.root.queryCache.channel.set('in cache', '983798372948729434');
            }
        },
        {
            title: 'Not the current channel, but is a valid channel id',
            code: '{channelid;983798372948729434}',
            expected: '983798372948729434',
            setup(ctx) {
                checkChannelExists.setup(m => m(ctx.guild.id, '983798372948729434')).resolves(true);
            }
        },
        {
            title: 'Query from a tag',
            code: '{channelid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.input.isCC = false;
                ctx.input.tagName = 'MyCoolTag';
                queryChannel.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    channelId: ctx.channels.command.id,
                    userId: ctx.users.command.id,
                    searchText: 'General',
                    source: 'tag `MyCoolTag`'
                }))).resolves({ success: true, channelId: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.root.queryCache.failedQueries, 0);
                assert.equal(ctx.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a cc',
            code: '{channelid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.input.isCC = true;
                ctx.input.tagName = 'MyCoolTag';
                queryChannel.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    channelId: ctx.channels.command.id,
                    userId: ctx.users.command.id,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: true, channelId: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.root.queryCache.failedQueries, 0);
                assert.equal(ctx.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Suppress errors',
            code: '{channelid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.input.isCC = true;
                ctx.input.tagName = 'MyCoolTag';
                queryChannel.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    channelId: ctx.channels.command.id,
                    userId: ctx.users.command.id,
                    searchText: 'General',
                    source: undefined
                }))).resolves({ success: true, channelId: '983798372948729434' }).mustHappen(1);
            },
            postSetup(bbctx) {
                bbctx.root.noLookupErrors = true;
            },
            assert(ctx) {
                assert.equal(ctx.root.queryCache.failedQueries, 0);
                assert.equal(ctx.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a tag',
            code: '{channelid;General;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.input.isCC = false;
                ctx.input.tagName = 'MyCoolTag';
                queryChannel.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    channelId: ctx.channels.command.id,
                    userId: ctx.users.command.id,
                    searchText: 'General',
                    source: 'tag `MyCoolTag`'
                }))).resolves({ success: true, channelId: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.root.queryCache.failedQueries, 0);
                assert.equal(ctx.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a cc',
            code: '{channelid;General;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.input.isCC = true;
                ctx.input.tagName = 'MyCoolTag';
                queryChannel.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    channelId: ctx.channels.command.id,
                    userId: ctx.users.command.id,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: true, channelId: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.root.queryCache.failedQueries, 0);
                assert.equal(ctx.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            code: '{channelid;General;q}',
            expected: '983798372948729434',
            setup(ctx) {
                findChannel.setup(m => m(ctx.guild.id, 'General')).resolves('983798372948729434').mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.root.queryCache.failedQueries, 0);
                assert.equal(ctx.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            code: '{channelid;General}',
            expected: '`No channel found`',
            errors: [
                { error: new ChannelNotFoundError('General') }
            ],
            setup(ctx) {
                ctx.input.isCC = true;
                ctx.input.tagName = 'MyCoolTag';
                queryChannel.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    channelId: ctx.channels.command.id,
                    userId: ctx.users.command.id,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: false, cause: 'notFound' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.root.queryCache.failedQueries, 1);
                assert.equal(ctx.root.queryCache.channel.get('general'), undefined);
            }
        },
        {
            code: '{channelid;General}',
            expected: '`No channel found`',
            errors: [
                { error: new ChannelNotFoundError('General') }
            ],
            setup(ctx) {
                ctx.input.isCC = true;
                ctx.input.tagName = 'MyCoolTag';
                queryChannel.setup((m, $) => m($({
                    guildId: ctx.guild.id,
                    channelId: ctx.channels.command.id,
                    userId: ctx.users.command.id,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: false, cause: 'aborted' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.root.queryCache.failedQueries, Infinity);
                assert.equal(ctx.root.queryCache.channel.get('general'), undefined);
            }
        },
        {
            code: '{channelid;General;q}',
            expected: '',
            errors: [
                { error: new ChannelNotFoundError('General').withDisplay('') }
            ],
            setup(ctx) {
                findChannel.setup(m => m(ctx.guild.id, 'General')).resolves(undefined).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.root.queryCache.failedQueries, 0);
                assert.equal(ctx.root.queryCache.channel.get('general'), undefined);
            }
        }
    ]
});
