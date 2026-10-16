import assert from 'node:assert/strict';

import { BBTagRuntimeError, BBTagRuntimeState, SubtagStackOverflowError } from '@blargbot/bbtag';
import type { GetCustomCommandThunk } from '@blargbot/bbtag/subtags';
import { ExecCustomCommandSubtag, JsonSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { AssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const getCustomCommand = new Mock<GetCustomCommandThunk>({ id: 'getCustomCommand', callable: true });

await runSubtagTests({
    subtag: new ExecCustomCommandSubtag({
        getCustomCommand: getCustomCommand.instance
    }),
    argCountBounds: { min: 1, max: Infinity },
    names: ['execCustomCommand', 'execCC'],
    setup(ctx) {
        ctx.addMock(getCustomCommand);
        getCustomCommand.reset();
    },
    cases: [
        {
            code: '{execcc;otherSubtag}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
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
                ctx.input.cooldown = 4;
                ctx.input.tagName = 'test tag';
                ctx.input.input = 'This is some input text';
                getCustomCommand.setup(m => m(ctx.guild.id, 'othersubtag')).resolves({
                    id: '0',
                    author: '212097368371683623',
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
            code: '{execcc;otherSubtag;}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 0);
                assert.equal(ctx.local.input.raw, '');
                assert.deepEqual(ctx.local.input.array, []);
                assert.equal(ctx.root.recursion.depth, 101);
                assert.notEqual(ctx.local, ctx.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.input.cooldown = 4;
                ctx.input.tagName = 'test tag';
                ctx.input.input = 'This is some input text';
                getCustomCommand.setup(m => m(ctx.guild.id, 'othersubtag')).resolves({
                    id: '0',
                    author: '212097368371683623',
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
                assert.equal(ctx.root.recursion.depth, 100);
                assert.equal(ctx.local, ctx.root);
            }
        },
        {
            code: '{execcc;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 7);
                assert.equal(ctx.local.input.raw, 'abc \\\\\\"def\\\\\\" ghi');
                assert.deepEqual(ctx.local.input.array, ['abc', '\\"def\\"', 'ghi']);
                assert.equal(ctx.root.recursion.depth, 101);
                assert.notEqual(ctx.local, ctx.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.input.cooldown = 4;
                ctx.input.tagName = 'test tag';
                ctx.input.input = 'This is some input text';
                getCustomCommand.setup(m => m(ctx.guild.id, 'othersubtag')).resolves({
                    id: '0',
                    author: '212097368371683623',
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
                assert.equal(ctx.root.recursion.depth, 100);
                assert.equal(ctx.local, ctx.root);
            }
        },
        {
            code: '{execcc;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
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
                ctx.input.cooldown = 4;
                ctx.input.tagName = 'test tag';
                ctx.input.input = 'This is some input text';
                getCustomCommand.setup(m => m(ctx.guild.id, 'othersubtag')).resolves({
                    id: '0',
                    author: '212097368371683623',
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
                assert.equal(ctx.root.recursion.depth, 100);
                assert.equal(ctx.local, ctx.root);
            }
        },
        {
            code: '{execcc;abc}',
            expected: '`CCommand not found: abc`',
            errors: [
                { start: 0, end: 12, error: new BBTagRuntimeError('CCommand not found: abc') }
            ],
            setup(ctx) {
                getCustomCommand.setup(m => m(ctx.guild.id, 'abc')).resolves(undefined).mustHappen(1);
            }
        },
        {
            code: '{execcc;othersubtag}',
            expected: '`Cannot execcc imported tag: othersubtag`',
            errors: [
                { start: 0, end: 20, error: new BBTagRuntimeError('Cannot execcc imported tag: othersubtag') }
            ],
            setup(ctx) {
                getCustomCommand.setup(m => m(ctx.guild.id, 'othersubtag')).resolves({
                    id: '0',
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    alias: 'otherSubtag',
                    cooldown: 7
                }).mustHappen(1);
            }
        },
        {
            code: '{execcc;otherSubtag}',
            expected: '`Terminated recursive tag after 200 execs.`',
            errors: [
                { start: 0, end: 20, error: new SubtagStackOverflowError(200) }
            ],
            setup(ctx) {
                getCustomCommand.setup(m => m(ctx.guild.id, 'othersubtag')).resolves({
                    id: '0',
                    author: '212097368371683623',
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
            code: '{execcc;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 7);
                assert.equal(ctx.local.input.raw, 'arg1 arg2 "-f flag value"');
                assert.deepEqual(ctx.local.input.array, ['arg1', 'arg2', '-f flag value']);
                assert.equal(ctx.local.input.flags.f?.merge().raw, 'flag value');
                assert.equal(ctx.local.input.flags._.merge().raw, 'arg1 arg2');
                assert.equal(ctx.root.recursion.depth, 101);
                assert.notEqual(ctx.local, ctx.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.input.cooldown = 4;
                ctx.input.tagName = 'test tag';
                ctx.input.input = 'This is some input text';
                getCustomCommand.setup(m => m(ctx.guild.id, 'othersubtag')).resolves({
                    id: '0',
                    author: '212097368371683623',
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
                assert.equal(ctx.local.input.flags.f?.merge().raw, undefined);
                assert.equal(ctx.local.input.flags._.merge().raw, 'This is some input text');
                assert.equal(ctx.root.recursion.depth, 100);
                assert.equal(ctx.local, ctx.root);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 7);
                assert.equal(ctx.local.input.raw, 'arg1 arg2 -f flag value');
                assert.deepEqual(ctx.local.input.array, ['arg1', 'arg2', '-f', 'flag', 'value']);
                assert.equal(ctx.local.input.flags.f?.merge().raw, 'flag value');
                assert.equal(ctx.local.input.flags._.merge().raw, 'arg1 arg2');
                assert.equal(ctx.root.recursion.depth, 101);
                assert.notEqual(ctx.local, ctx.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.input.cooldown = 4;
                ctx.input.tagName = 'test tag';
                ctx.input.input = 'This is some input text';
                getCustomCommand.setup(m => m(ctx.guild.id, 'othersubtag')).resolves({
                    id: '0',
                    author: '212097368371683623',
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
                assert.equal(ctx.local.input.flags.f?.merge().raw, undefined);
                assert.equal(ctx.local.input.flags._.merge().raw, 'This is some input text');
                assert.equal(ctx.root.recursion.depth, 100);
                assert.equal(ctx.local, ctx.root);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.equal(ctx.local.tagName, 'othersubtag');
                assert.equal(ctx.root.tagName, 'test tag');
                assert.equal(ctx.local.cooldown, 7);
                assert.equal(ctx.local.input.raw, 'arg1 arg2 \\-f flag value');
                assert.deepEqual(ctx.local.input.array, ['arg1', 'arg2', '-f', 'flag', 'value']);
                assert.equal(ctx.local.input.flags.f?.merge().raw, undefined);
                assert.equal(ctx.local.input.flags._.merge().raw, 'arg1 arg2 \\-f flag value');
                assert.equal(ctx.root.recursion.depth, 101);
                assert.notEqual(ctx.local, ctx.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.input.cooldown = 4;
                ctx.input.tagName = 'test tag';
                ctx.input.input = 'This is some input text';
                getCustomCommand.setup(m => m(ctx.guild.id, 'othersubtag')).resolves({
                    id: '0',
                    author: '212097368371683623',
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
                assert.equal(ctx.local.input.flags.f?.merge().raw, undefined);
                assert.equal(ctx.local.input.flags._.merge().raw, 'This is some input text');
                assert.equal(ctx.root.recursion.depth, 100);
                assert.equal(ctx.local, ctx.root);
            }
        }
    ]
});
