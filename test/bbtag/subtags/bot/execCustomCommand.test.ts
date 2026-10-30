import assert from 'node:assert/strict';

import { BBTagRuntimeError, BBTagRuntimeState, SubtagStackOverflowError } from '@blargbot/bbtag-engine';
import type { GetCustomCommandFeature, ParseInputFeature, TagCooldownFeature } from '@blargbot/bbtag-engine/subtags';
import { ExecCustomCommandSubtag, JsonSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { AssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetCustomCommandFeature & TagCooldownFeature & ParseInputFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ExecCustomCommandSubtag(features.instance),
    argCountBounds: { min: 1, max: Infinity },
    names: ['execCustomCommand', 'execCC'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{execcc;otherSubtag}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.deepEqual(ctx.local.input.array, []);
                assert.notEqual(ctx.local, ctx.root);
                assert.equal(ctx.root.recursion.depth, 101);
                ctx.root.output.embeds = [{ title: 'abc' }];
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.tagName = 'test tag';
                ctx.bbtag.root.recursion.depth = 100;
                ctx.input.array = ['This', 'is', 'some', 'input', 'text'];
                const otherSubtag = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
                features.setup(m => m.getCustomCommand(ctx.guildId, 'othersubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'othersubtag',
                    cooldownMs: 7,
                    isCC: ctx.isCC
                }))).resolves().mustHappen(1);
                features.setup(m => m.parseInput(ctx.bbtag, '')).returns({
                    array: [],
                    flags: { _: '' }
                }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.local.tagName, 'test tag');
                assert.equal(ctx.bbtag.root.tagName, 'test tag');
                assert.deepEqual(ctx.bbtag.local.input.array, ['This', 'is', 'some', 'input', 'text']);
                assert.equal(ctx.bbtag.local, ctx.bbtag.root);
                assert.equal(ctx.bbtag.root.recursion.depth, 100);
            }
        },
        {
            code: '{execcc;otherSubtag;}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.deepEqual(ctx.local.input.array, []);
                assert.equal(ctx.root.recursion.depth, 101);
                assert.notEqual(ctx.local, ctx.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.tagName = 'test tag';
                ctx.bbtag.root.recursion.depth = 100;
                ctx.input.array = ['This', 'is', 'some', 'input', 'text'];
                const otherSubtag = {
                    content: '{assert}{eval}'
                };
                features.setup(m => m.getCustomCommand(ctx.guildId, 'othersubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'othersubtag',
                    cooldownMs: 0,
                    isCC: ctx.isCC
                }))).resolves().mustHappen(1);
                features.setup(m => m.parseInput(ctx.bbtag, '')).returns({
                    array: [],
                    flags: { _: '' }
                }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.local.tagName, 'test tag');
                assert.equal(ctx.bbtag.root.tagName, 'test tag');
                assert.deepEqual(ctx.bbtag.local.input.array, ['This', 'is', 'some', 'input', 'text']);
                assert.equal(ctx.bbtag.root.recursion.depth, 100);
                assert.equal(ctx.bbtag.local, ctx.bbtag.root);
            }
        },
        {
            code: '{execcc;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.deepEqual(ctx.local.input.array, ['abc', '\\"def\\"', 'ghi']);
                assert.equal(ctx.root.recursion.depth, 101);
                assert.notEqual(ctx.local, ctx.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.tagName = 'test tag';
                ctx.bbtag.root.recursion.depth = 100;
                ctx.input.array = ['This', 'is', 'some', 'input', 'text'];
                const otherSubtag = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
                features.setup(m => m.getCustomCommand(ctx.guildId, 'othersubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'othersubtag',
                    cooldownMs: 7,
                    isCC: ctx.isCC
                }))).resolves().mustHappen(1);
                features.setup((m, $) => m.parseInput(ctx.bbtag, $(['abc', '\\"def\\"', 'ghi']))).returns({
                    array: ['abc', '\\"def\\"', 'ghi'],
                    flags: { _: '' }
                }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.local.tagName, 'test tag');
                assert.equal(ctx.bbtag.root.tagName, 'test tag');
                assert.deepEqual(ctx.bbtag.local.input.array, ['This', 'is', 'some', 'input', 'text']);
                assert.equal(ctx.bbtag.root.recursion.depth, 100);
                assert.equal(ctx.bbtag.local, ctx.bbtag.root);
            }
        },
        {
            code: '{execcc;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.deepEqual(ctx.local.input.array, ['abc', '{"def":123}']);
                assert.notEqual(ctx.local, ctx.root);
                assert.equal(ctx.root.recursion.depth, 101);
                return 'Success!';
            }), new JsonSubtag()],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.tagName = 'test tag';
                ctx.bbtag.root.recursion.depth = 100;
                ctx.input.array = ['This', 'is', 'some', 'input', 'text'];
                const otherSubtag = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
                features.setup(m => m.getCustomCommand(ctx.guildId, 'othersubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'othersubtag',
                    cooldownMs: 7,
                    isCC: ctx.isCC
                }))).resolves().mustHappen(1);
                features.setup((m, $) => m.parseInput(ctx.bbtag, $(['abc', '{"def":123}']))).returns({
                    array: ['abc', '{"def":123}'],
                    flags: { _: '' }
                }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.local.tagName, 'test tag');
                assert.equal(ctx.bbtag.root.tagName, 'test tag');
                assert.deepEqual(ctx.bbtag.local.input.array, ['This', 'is', 'some', 'input', 'text']);
                assert.equal(ctx.bbtag.root.recursion.depth, 100);
                assert.equal(ctx.bbtag.local, ctx.bbtag.root);
            }
        },
        {
            code: '{execcc;abc}',
            expected: '`CCommand not found: abc`',
            errors: [
                { error: new BBTagRuntimeError('CCommand not found: abc') }
            ],
            setup(ctx) {
                features.setup(m => m.getCustomCommand(ctx.guildId, 'abc')).resolves(undefined).mustHappen(1);
            }
        },
        {
            code: '{execcc;othersubtag}',
            expected: '`Cannot execcc imported tag: othersubtag`',
            errors: [
                { error: new BBTagRuntimeError('Cannot execcc imported tag: othersubtag') }
            ],
            setup(ctx) {
                features.setup(m => m.getCustomCommand(ctx.guildId, 'othersubtag')).resolves('alias').mustHappen(1);
            }
        },
        {
            code: '{execcc;otherSubtag}',
            expected: '`Terminated recursive tag after 200 execs.`',
            errors: [
                { error: new SubtagStackOverflowError(200) }
            ],
            setup(ctx) {
                ctx.bbtag.root.recursion.depth = 200;
                const otherSubtag = {
                    content: '{fail}',
                    cooldown: 7
                };
                features.setup(m => m.getCustomCommand(ctx.guildId, 'othersubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'othersubtag',
                    cooldownMs: 7,
                    isCC: ctx.isCC
                }))).resolves().mustHappen(1);
                features.setup(m => m.parseInput(ctx.bbtag, '')).returns({
                    array: [],
                    flags: { _: '' }
                }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.recursion.depth, 200);
                assert.equal(ctx.bbtag.state, BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.deepEqual(ctx.local.input.array, ['arg1', 'arg2', '-f flag value']);
                assert.equal(ctx.local.input.flags.f, 'flag value');
                assert.equal(ctx.local.input.flags._, 'arg1 arg2');
                assert.equal(ctx.root.recursion.depth, 101);
                assert.notEqual(ctx.local, ctx.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.tagName = 'test tag';
                ctx.bbtag.root.recursion.depth = 100;
                ctx.input.array = ['This', 'is', 'some', 'input', 'text'];
                ctx.input.flags = { _: 'This is some input text' };
                const otherSubtag = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
                features.setup(m => m.getCustomCommand(ctx.guildId, 'othersubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'othersubtag',
                    cooldownMs: 7,
                    isCC: ctx.isCC
                }))).resolves().mustHappen(1);
                features.setup((m, $) => m.parseInput(ctx.bbtag, $(['arg1', 'arg2', '-f flag value']))).returns({
                    array: ['arg1', 'arg2', '-f flag value'],
                    flags: { _: 'arg1 arg2', f: 'flag value' }
                }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.local.tagName, 'test tag');
                assert.equal(ctx.bbtag.root.tagName, 'test tag');
                assert.deepEqual(ctx.bbtag.local.input.array, ['This', 'is', 'some', 'input', 'text']);
                assert.equal(ctx.bbtag.local.input.flags.f, undefined);
                assert.equal(ctx.bbtag.local.input.flags._, 'This is some input text');
                assert.equal(ctx.bbtag.root.recursion.depth, 100);
                assert.equal(ctx.bbtag.local, ctx.bbtag.root);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.deepEqual(ctx.local.input.array, ['arg1', 'arg2', '-f', 'flag', 'value']);
                assert.equal(ctx.local.input.flags.f, 'flag value');
                assert.equal(ctx.local.input.flags._, 'arg1 arg2');
                assert.equal(ctx.root.recursion.depth, 101);
                assert.notEqual(ctx.local, ctx.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.tagName = 'test tag';
                ctx.bbtag.root.recursion.depth = 100;
                ctx.input.array = ['This', 'is', 'some', 'input', 'text'];
                ctx.input.flags = { _: 'This is some input text' };
                const otherSubtag = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
                features.setup(m => m.getCustomCommand(ctx.guildId, 'othersubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'othersubtag',
                    cooldownMs: 7,
                    isCC: ctx.isCC
                }))).resolves().mustHappen(1);
                features.setup(m => m.parseInput(ctx.bbtag, 'arg1 arg2 -f flag value')).returns({
                    array: ['arg1', 'arg2', '-f', 'flag', 'value'],
                    flags: { _: 'arg1 arg2', f: 'flag value' }
                }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.local.tagName, 'test tag');
                assert.equal(ctx.bbtag.root.tagName, 'test tag');
                assert.deepEqual(ctx.bbtag.local.input.array, ['This', 'is', 'some', 'input', 'text']);
                assert.equal(ctx.bbtag.local.input.flags.f, undefined);
                assert.equal(ctx.bbtag.local.input.flags._, 'This is some input text');
                assert.equal(ctx.bbtag.root.recursion.depth, 100);
                assert.equal(ctx.bbtag.local, ctx.bbtag.root);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.deepEqual(ctx.local.input.array, ['arg1', 'arg2', '-f', 'flag', 'value']);
                assert.equal(ctx.local.input.flags.f, undefined);
                assert.equal(ctx.local.input.flags._, 'arg1 arg2 -f flag value');
                assert.equal(ctx.root.recursion.depth, 101);
                assert.notEqual(ctx.local, ctx.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.tagName = 'test tag';
                ctx.bbtag.root.recursion.depth = 100;
                ctx.input.array = ['This', 'is', 'some', 'input', 'text'];
                ctx.input.flags = { _: 'This is some input text' };
                const otherSubtag = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
                features.setup(m => m.getCustomCommand(ctx.guildId, 'othersubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'othersubtag',
                    cooldownMs: 7,
                    isCC: ctx.isCC
                }))).resolves().mustHappen(1);
                features.setup(m => m.parseInput(ctx.bbtag, 'arg1 arg2 \\-f flag value')).returns({
                    array: ['arg1', 'arg2', '-f', 'flag', 'value'],
                    flags: { _: 'arg1 arg2 -f flag value' }
                }).mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.local.tagName, 'test tag');
                assert.equal(ctx.bbtag.root.tagName, 'test tag');
                assert.deepEqual(ctx.bbtag.local.input.array, ['This', 'is', 'some', 'input', 'text']);
                assert.equal(ctx.bbtag.local.input.flags.f, undefined);
                assert.equal(ctx.bbtag.local.input.flags._, 'This is some input text');
                assert.equal(ctx.bbtag.root.recursion.depth, 100);
                assert.equal(ctx.bbtag.local, ctx.bbtag.root);
            }
        }
    ]
});
