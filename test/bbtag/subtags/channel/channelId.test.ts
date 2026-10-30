import assert from 'node:assert/strict';

import { ChannelNotFoundError } from '@blargbot/bbtag-engine';
import type { CheckChannelExistsFeature, FindChannelFeature, QueryChannelFeature } from '@blargbot/bbtag-engine/subtags';
import { ChannelIdSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CheckChannelExistsFeature & FindChannelFeature & QueryChannelFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelIdSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelId', 'categoryId'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{channelid}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.channelId = '983798372948729434';
                ctx.channelId = '983798372948729434';
            }
        },
        {
            code: '{channelid;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.channelId = '983798372948729434';
                ctx.channelId = '983798372948729434';
            }
        },
        {
            code: '{channelid;;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.channelId = '983798372948729434';
                ctx.channelId = '983798372948729434';
            }
        },
        {
            code: '{channelid;;q}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.channelId = '983798372948729434';
                ctx.channelId = '983798372948729434';
            }
        },
        {
            title: 'Current channel',
            code: '{channelid;983798372948729434}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.channelId = '983798372948729434';
                ctx.channelId = '983798372948729434';
            }
        },
        {
            code: '{channelid;In Cache}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.bbtag.root.queryCache.channel.set('in cache', '983798372948729434');
            }
        },
        {
            code: '{channelid;In Cache;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.bbtag.root.queryCache.channel.set('in cache', '983798372948729434');
            }
        },
        {
            code: '{channelid;In Cache;q}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.bbtag.root.queryCache.channel.set('in cache', '983798372948729434');
            }
        },
        {
            title: 'Not the current channel, but is a valid channel id',
            code: '{channelid;983798372948729434}',
            expected: '983798372948729434',
            setup(ctx) {
                features.setup(m => m.checkChannelExists(ctx.guildId, '983798372948729434')).resolves(true);
            }
        },
        {
            title: 'Query from a tag',
            code: '{channelid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = false;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryChannel($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'tag `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a cc',
            code: '{channelid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryChannel($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Suppress errors',
            code: '{channelid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryChannel($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: undefined
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
                ctx.bbtag.root.noLookupErrors = true;
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a tag',
            code: '{channelid;General;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = false;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryChannel($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'tag `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a cc',
            code: '{channelid;General;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryChannel($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            code: '{channelid;General;q}',
            expected: '983798372948729434',
            setup(ctx) {
                features.setup(m => m.findChannel(ctx.guildId, 'General')).resolves('983798372948729434').mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.channel.get('general'), '983798372948729434');
            }
        },
        {
            code: '{channelid;General}',
            expected: '`No channel found`',
            errors: [
                { error: new ChannelNotFoundError('General') }
            ],
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryChannel($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: false, cause: 'notFound' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 1);
                assert.equal(ctx.bbtag.root.queryCache.channel.get('general'), undefined);
            }
        },
        {
            code: '{channelid;General}',
            expected: '`No channel found`',
            errors: [
                { error: new ChannelNotFoundError('General') }
            ],
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryChannel($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: false, cause: 'aborted' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, Infinity);
                assert.equal(ctx.bbtag.root.queryCache.channel.get('general'), undefined);
            }
        },
        {
            code: '{channelid;General;q}',
            expected: '',
            errors: [
                { error: new ChannelNotFoundError('General').withDisplay('') }
            ],
            setup(ctx) {
                features.setup(m => m.findChannel(ctx.guildId, 'General')).resolves(undefined).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.channel.get('general'), undefined);
            }
        }
    ]
});
