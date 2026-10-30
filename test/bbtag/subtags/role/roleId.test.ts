import assert from 'node:assert/strict';

import { RoleNotFoundError } from '@blargbot/bbtag-engine';
import type { CheckRoleExistsFeature, FindRoleFeature, QueryRoleFeature } from '@blargbot/bbtag-engine/subtags';
import { RoleIdSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CheckRoleExistsFeature & FindRoleFeature & QueryRoleFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new RoleIdSubtag(features.instance),
    argCountBounds: { min: 1, max: 2 },
    names: ['roleId'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{roleid;In Cache}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.bbtag.root.queryCache.role.set('in cache', '983798372948729434');
            }
        },
        {
            code: '{roleid;In Cache;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.bbtag.root.queryCache.role.set('in cache', '983798372948729434');
            }
        },
        {
            code: '{roleid;In Cache;q}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.bbtag.root.queryCache.role.set('in cache', '983798372948729434');
            }
        },
        {
            title: 'A valid role id',
            code: '{roleid;983798372948729434}',
            expected: '983798372948729434',
            setup(ctx) {
                features.setup(m => m.checkRoleExists(ctx.guildId, '983798372948729434')).resolves(true);
            }
        },
        {
            title: 'Query from a tag',
            code: '{roleid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = false;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryRole($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'tag `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.role.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a cc',
            code: '{roleid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryRole($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.role.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Suppress errors',
            code: '{roleid;General}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryRole($({
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
                assert.equal(ctx.bbtag.root.queryCache.role.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a tag',
            code: '{roleid;General;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = false;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryRole($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'tag `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.role.get('general'), '983798372948729434');
            }
        },
        {
            title: 'Query from a cc',
            code: '{roleid;General;}',
            expected: '983798372948729434',
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryRole($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: true, id: '983798372948729434' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.role.get('general'), '983798372948729434');
            }
        },
        {
            code: '{roleid;General;q}',
            expected: '983798372948729434',
            setup(ctx) {
                features.setup(m => m.findRole(ctx.guildId, 'General')).resolves('983798372948729434').mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.role.get('general'), '983798372948729434');
            }
        },
        {
            code: '{roleid;General}',
            expected: '`No role found`',
            errors: [
                { error: new RoleNotFoundError('General') }
            ],
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryRole($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: false, cause: 'notFound' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 1);
                assert.equal(ctx.bbtag.root.queryCache.role.get('general'), undefined);
            }
        },
        {
            code: '{roleid;General}',
            expected: '`No role found`',
            errors: [
                { error: new RoleNotFoundError('General') }
            ],
            setup(ctx) {
                ctx.isCC = true;
                ctx.tagName = 'MyCoolTag';
                features.setup((m, $) => m.queryRole($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    userId: ctx.userId,
                    searchText: 'General',
                    source: 'custom command `MyCoolTag`'
                }))).resolves({ success: false, cause: 'aborted' }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, Infinity);
                assert.equal(ctx.bbtag.root.queryCache.role.get('general'), undefined);
            }
        },
        {
            code: '{roleid;General;q}',
            expected: '',
            errors: [
                { error: new RoleNotFoundError('General').withDisplay('') }
            ],
            setup(ctx) {
                features.setup(m => m.findRole(ctx.guildId, 'General')).resolves(undefined).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.queryCache.failedQueries, 0);
                assert.equal(ctx.bbtag.root.queryCache.role.get('general'), undefined);
            }
        }
    ]
});
