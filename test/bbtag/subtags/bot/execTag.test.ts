import assert from 'node:assert/strict';

import { BBTagRuntimeError, BBTagRuntimeState, SubtagStackOverflowError } from '@blargbot/bbtag';
import type { GetTagFeature, ParseInputFeature, TagCooldownFeature } from '@blargbot/bbtag/subtags';
import { ExecTagSubtag, JsonSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { AssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetTagFeature & TagCooldownFeature & ParseInputFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ExecTagSubtag(features.instance),
    argCountBounds: { min: 1, max: Infinity },
    names: ['execTag', 'exec'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{exec;otherSubtag}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
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
                features.setup(m => m.getTag('otherSubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'otherSubtag',
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
            code: '{exec;otherSubtag;}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
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
                features.setup(m => m.getTag('otherSubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'otherSubtag',
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
            code: '{exec;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
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
                features.setup(m => m.getTag('otherSubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'otherSubtag',
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
            code: '{exec;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
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
                features.setup(m => m.getTag('otherSubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'otherSubtag',
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
            code: '{exec;abc}',
            expected: '`Tag not found: abc`',
            errors: [
                { error: new BBTagRuntimeError('Tag not found: abc') }
            ],
            setup() {
                features.setup(m => m.getTag('abc')).resolves(undefined).mustHappen(1);
            }
        },
        {
            code: '{exec;otherSubtag}',
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
                features.setup(m => m.getTag('otherSubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'otherSubtag',
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
            code: '{exec;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
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
                features.setup(m => m.getTag('otherSubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'otherSubtag',
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
            code: '{exec;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
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
                features.setup(m => m.getTag('otherSubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'otherSubtag',
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
            code: '{exec;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
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
                features.setup(m => m.getTag('otherSubtag')).resolves(otherSubtag).mustHappen(1);
                features.setup((m, $) => m.assertTagCooldown($({
                    guildId: ctx.guildId,
                    userId: ctx.userId,
                    tagName: 'otherSubtag',
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
