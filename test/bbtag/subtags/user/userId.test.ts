import assert from 'node:assert/strict';

import { UserNotFoundError } from '@blargbot/bbtag';
import type { CheckMemberExistsFeature, CheckUserExistsFeature, FindMemberFeature, QueryMemberFeature } from '@blargbot/bbtag/subtags';
import { UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CheckUserExistsFeature & CheckMemberExistsFeature & FindMemberFeature & QueryMemberFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new UserIdSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['userId'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{userid}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.userId = '983798372948729434';
            }
        },
        {
            code: '{userid;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.userId = '983798372948729434';
            }
        },
        {
            code: '{userid;;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.userId = '983798372948729434';
            }
        },
        {
            code: '{userid;;q}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.userId = '983798372948729434';
            }
        },
        {
            title: 'Current user',
            code: '{userid;983798372948729434}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.userId = '983798372948729434';
            }
        },
        {
            code: '{userid;In Cache}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.bbtag.root.queryCache.user.set('in cache', '983798372948729434');
            }
        },
        {
            code: '{userid;In Cache;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.bbtag.root.queryCache.user.set('in cache', '983798372948729434');
            }
        },
        {
            code: '{userid;In Cache;q}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.bbtag.root.queryCache.user.set('in cache', '983798372948729434');
            }
        },
        {
            title: 'Not the current user, but is a valid user id',
            code: '{userid;983798372948729434}',
            expected: '983798372948729434',
            setup() {
                features.setup(m => m.checkUserExists('983798372948729434')).resolves(true);
            }
        },
        {
            title: 'Query from a tag',
            code: '{userid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = false;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryMember($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'tag `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.user.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a cc',
            code: '{userid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryMember($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.user.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Suppress errors',
            code: '{userid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryMember($({
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
                assert.equal(ctx.bbtag.root.queryCache.user.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a tag',
            code: '{userid;General;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = false;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryMember($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'tag `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.user.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a cc',
            code: '{userid;General;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryMember($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.user.get('general'), '983798372948729434');
            }
        },
        {
            code: '{userid;General;q}',
            expected: '983798372948729434',
            setup(ctx) {
                features.setup(m => m.findMember(ctx.guildId, 'General')).resolves('983798372948729434').mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.user.get('general'), '983798372948729434');
            }
        },
        {
            code: '{userid;General}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('General') }
            ],
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryMember($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: false, cause: 'notFound' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 1);
                assert.equal(ctx.bbtag.root.queryCache.user.get('general'), undefined);
            }
        },
        {
            code: '{userid;General}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('General') }
            ],
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryMember($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: false, cause: 'aborted' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, Infinity);
                assert.equal(ctx.bbtag.root.queryCache.user.get('general'), undefined);
            }
        },
        {
            code: '{userid;General;q}',
            expected: '',
            errors: [
                { error: new UserNotFoundError('General').withDisplay('') }
            ],
            setup(ctx) {
                features.setup(m => m.findMember(ctx.guildId, 'General')).resolves(undefined).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.user.get('general'), undefined);
            }
        }
    ]
});
