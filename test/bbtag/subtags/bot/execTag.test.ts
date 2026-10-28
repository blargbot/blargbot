import assert from 'node:assert/strict';

import { BBTagRuntimeError, BBTagRuntimeState, SubtagStackOverflowError } from '@blargbot/bbtag';
import type { GetTagFeature } from '@blargbot/bbtag/subtags';
import { ExecTagSubtag, JsonSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { AssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetTagFeature>({ id: 'features' });

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
                assert.equal(ctx.local.cooldown, 7);
                assert.equal(ctx.local.input.raw, '');
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
                ctx.cooldownMs = 4;
                ctx.tagName = 'test tag';
                ctx.input = 'This is some input text';
                features.setup(m => m.getTag('otherSubtag')).resolves({
                    content: '{assert}{eval}',
                    cooldown: 7
                }).mustHappen(1);
            },
            postSetup(ctx) {
                ctx.root.recursion.depth = 100;
            },
            assert(ctx) {
                assert.equal(ctx.local.tagName, 'test tag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 4);
                assert.equal(ctx.local.input.raw, 'This is some input text');
                assert.equal(ctx.local, ctx.root);
                assert.equal(ctx.root.recursion.depth, 100);
                assert.deepEqual(ctx.root.output.embeds, [{ title: 'abc' }]);
            }
        },
        {
            code: '{exec;otherSubtag;}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 0);
                assert.equal(ctx.local.input.raw, '');
                assert.deepEqual(ctx.local.input.array, []);
                assert.notEqual(ctx.local, ctx.root);
                assert.equal(ctx.root.recursion.depth, 101);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.cooldownMs = 4;
                ctx.tagName = 'test tag';
                ctx.input = 'This is some input text';
                features.setup(m => m.getTag('otherSubtag')).resolves({
                    content: '{assert}{eval}'
                }).mustHappen(1);
            },
            postSetup(ctx) {
                ctx.root.recursion.depth = 100;
            },
            assert(ctx) {
                assert.equal(ctx.local.tagName, 'test tag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 4);
                assert.equal(ctx.local.input.raw, 'This is some input text');
                assert.equal(ctx.local, ctx.root);
                assert.equal(ctx.root.recursion.depth, 100);
            }
        },
        {
            code: '{exec;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 7);
                assert.equal(ctx.local.input.raw, 'abc \\\\\\"def\\\\\\" ghi');
                assert.deepEqual(ctx.local.input.array, ['abc', '\\"def\\"', 'ghi']);
                assert.notEqual(ctx.local, ctx.root);
                assert.equal(ctx.root.recursion.depth, 101);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.cooldownMs = 4;
                ctx.tagName = 'test tag';
                ctx.input = 'This is some input text';
                features.setup(m => m.getTag('otherSubtag')).resolves({
                    content: '{assert}{eval}',
                    cooldown: 7
                }).mustHappen(1);
            },
            postSetup(ctx) {
                ctx.root.recursion.depth = 100;
            },
            assert(ctx) {
                assert.equal(ctx.local.tagName, 'test tag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 4);
                assert.equal(ctx.local.input.raw, 'This is some input text');
                assert.equal(ctx.local, ctx.root);
                assert.equal(ctx.root.recursion.depth, 100);
            }
        },
        {
            code: '{exec;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 7);
                assert.equal(ctx.local.input.raw, 'abc {\\"def\\":123}');
                assert.deepEqual(ctx.local.input.array, ['abc', '{"def":123}']);
                assert.notEqual(ctx.local, ctx.root);
                assert.equal(ctx.root.recursion.depth, 101);
                return 'Success!';
            }), new JsonSubtag()],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.cooldownMs = 4;
                ctx.tagName = 'test tag';
                ctx.input = 'This is some input text';
                features.setup(m => m.getTag('otherSubtag')).resolves({
                    content: '{assert}{eval}',
                    cooldown: 7
                }).mustHappen(1);
            },
            postSetup(ctx) {
                ctx.root.recursion.depth = 100;
            },
            assert(ctx) {
                assert.equal(ctx.local.tagName, 'test tag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 4);
                assert.equal(ctx.local.input.raw, 'This is some input text');
                assert.equal(ctx.local, ctx.root);
                assert.equal(ctx.root.recursion.depth, 100);
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
            setup() {
                features.setup(m => m.getTag('otherSubtag')).resolves({
                    content: '{fail}',
                    cooldown: 7
                }).mustHappen(1);
            },
            postSetup(ctx) {
                ctx.root.recursion.depth = 200;
            },
            assert(ctx) {
                assert.equal(ctx.root.recursion.depth, 200);
                assert.equal(ctx.state, BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{exec;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 7);
                assert.equal(ctx.local.input.raw, 'arg1 arg2 "-f flag value"');
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
                ctx.cooldownMs = 4;
                ctx.tagName = 'test tag';
                ctx.input = 'This is some input text';
                features.setup(m => m.getTag('otherSubtag')).resolves({
                    content: '{assert}{eval}',
                    cooldown: 7
                }).mustHappen(1);
            },
            postSetup(ctx) {
                ctx.root.recursion.depth = 100;
            },
            assert(ctx) {
                assert.equal(ctx.local.tagName, 'test tag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 4);
                assert.equal(ctx.local.input.raw, 'This is some input text');
                assert.equal(ctx.local.input.flags.f, undefined);
                assert.equal(ctx.local.input.flags._, 'This is some input text');
                assert.equal(ctx.root.recursion.depth, 100);
                assert.equal(ctx.local, ctx.root);
            }
        },
        {
            code: '{exec;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 7);
                assert.equal(ctx.local.input.raw, 'arg1 arg2 -f flag value');
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
                ctx.cooldownMs = 4;
                ctx.tagName = 'test tag';
                ctx.input = 'This is some input text';
                features.setup(m => m.getTag('otherSubtag')).resolves({
                    content: '{assert}{eval}',
                    cooldown: 7
                }).mustHappen(1);
            },
            postSetup(ctx) {
                ctx.root.recursion.depth = 100;
            },
            assert(ctx) {
                assert.equal(ctx.local.tagName, 'test tag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 4);
                assert.equal(ctx.local.input.raw, 'This is some input text');
                assert.equal(ctx.local.input.flags.f, undefined);
                assert.equal(ctx.local.input.flags._, 'This is some input text');
                assert.equal(ctx.root.recursion.depth, 100);
                assert.equal(ctx.local, ctx.root);
            }
        },
        {
            code: '{exec;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'otherSubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 7);
                assert.equal(ctx.local.input.raw, 'arg1 arg2 \\-f flag value');
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
                ctx.cooldownMs = 4;
                ctx.tagName = 'test tag';
                ctx.input = 'This is some input text';
                features.setup(m => m.getTag('otherSubtag')).resolves({
                    content: '{assert}{eval}',
                    cooldown: 7
                }).mustHappen(1);
            },
            postSetup(ctx) {
                ctx.root.recursion.depth = 100;
            },
            assert(ctx) {
                assert.equal(ctx.local.tagName, 'test tag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 4);
                assert.equal(ctx.local.input.raw, 'This is some input text');
                assert.equal(ctx.local.input.flags.f, undefined);
                assert.equal(ctx.local.input.flags._, 'This is some input text');
                assert.equal(ctx.root.recursion.depth, 100);
                assert.equal(ctx.local, ctx.root);
            }
        }
    ]
});
