import assert from 'node:assert/strict';

import { BBTagRuntimeError, SubtagStackOverflowError } from '@blargbot/bbtag/errors/index.js';
import { ExecTagSubtag } from '@blargbot/bbtag/subtags/bot/execTag.js';
import { JsonSubtag } from '@blargbot/bbtag/subtags/json/json.js';
import { BBTagRuntimeState } from '@blargbot/bbtag/types.js';

import { AssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ExecTagSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{exec;otherSubtag}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.notEqual(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'otherSubtag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 7);
                assert.equal(ctx.inputRaw, '');
                assert.deepEqual(ctx.input, []);
                assert.notEqual(ctx.scopes.local, ctx.scopes.root);
                assert.notEqual(ctx.scopes.tag, ctx.scopes.root);
                assert.equal(ctx.data.stackSize, 101);
                ctx.data.embeds = [{ title: 'abc' }];
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.tags['otherSubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    name: 'otherSubtag',
                    lastmodified: new Date(),
                    uses: 0,
                    cooldown: 7
                };
            },
            assert(ctx) {
                assert.equal(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'test tag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 4);
                assert.equal(ctx.inputRaw, 'This is some input text');
                assert.equal(ctx.scopes.local, ctx.scopes.root);
                assert.equal(ctx.scopes.tag, ctx.scopes.root);
                assert.equal(ctx.data.stackSize, 100);
                assert.deepEqual(ctx.data.embeds, [{ title: 'abc' }]);
            }
        },
        {
            code: '{exec;otherSubtag;}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.notEqual(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'otherSubtag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 0);
                assert.equal(ctx.inputRaw, '');
                assert.deepEqual(ctx.input, []);
                assert.notEqual(ctx.scopes.local, ctx.scopes.root);
                assert.notEqual(ctx.scopes.tag, ctx.scopes.root);
                assert.equal(ctx.data.stackSize, 101);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.tags['otherSubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    name: 'otherSubtag',
                    lastmodified: new Date(),
                    uses: 0
                };
            },
            assert(ctx) {
                assert.equal(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'test tag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 4);
                assert.equal(ctx.inputRaw, 'This is some input text');
                assert.equal(ctx.scopes.local, ctx.scopes.root);
                assert.equal(ctx.scopes.tag, ctx.scopes.root);
                assert.equal(ctx.data.stackSize, 100);
            }
        },
        {
            code: '{exec;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.notEqual(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'otherSubtag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 7);
                assert.equal(ctx.inputRaw, 'abc \\\\\\"def\\\\\\" ghi');
                assert.deepEqual(ctx.input, ['abc', '\\"def\\"', 'ghi']);
                assert.notEqual(ctx.scopes.local, ctx.scopes.root);
                assert.notEqual(ctx.scopes.tag, ctx.scopes.root);
                assert.equal(ctx.data.stackSize, 101);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.tags['otherSubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    name: 'otherSubtag',
                    lastmodified: new Date(),
                    uses: 0,
                    cooldown: 7
                };
            },
            assert(ctx) {
                assert.equal(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'test tag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 4);
                assert.equal(ctx.inputRaw, 'This is some input text');
                assert.equal(ctx.scopes.local, ctx.scopes.root);
                assert.equal(ctx.scopes.tag, ctx.scopes.root);
                assert.equal(ctx.data.stackSize, 100);
            }
        },
        {
            code: '{exec;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.notEqual(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'otherSubtag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 7);
                assert.equal(ctx.inputRaw, 'abc {\\"def\\":123}');
                assert.deepEqual(ctx.input, ['abc', '{"def":123}']);
                assert.notEqual(ctx.scopes.local, ctx.scopes.root);
                assert.notEqual(ctx.scopes.tag, ctx.scopes.root);
                assert.equal(ctx.data.stackSize, 101);
                return 'Success!';
            }), new JsonSubtag()],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.tags['otherSubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    name: 'otherSubtag',
                    lastmodified: new Date(),
                    uses: 0,
                    cooldown: 7
                };
            },
            assert(ctx) {
                assert.equal(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'test tag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 4);
                assert.equal(ctx.inputRaw, 'This is some input text');
                assert.equal(ctx.scopes.local, ctx.scopes.root);
                assert.equal(ctx.scopes.tag, ctx.scopes.root);
                assert.equal(ctx.data.stackSize, 100);
            }
        },
        {
            code: '{exec;abc}',
            expected: '`Tag not found: abc`',
            errors: [
                { start: 0, end: 10, error: new BBTagRuntimeError('Tag not found: abc') }
            ]
        },
        {
            code: '{exec;otherSubtag}',
            expected: '`Terminated recursive tag after 200 execs.`',
            errors: [
                { start: 0, end: 18, error: new SubtagStackOverflowError(200) }
            ],
            setup(ctx) {
                ctx.options.data = { stackSize: 200 };
                ctx.tags['otherSubtag'] = {
                    author: '212097368371683623',
                    content: '{fail}',
                    name: 'otherSubtag',
                    lastmodified: new Date(),
                    uses: 0,
                    cooldown: 7
                };
            },
            assert(ctx) {
                assert.equal(ctx.data.stackSize, 200);
                assert.equal(ctx.data.state, BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{exec;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.notEqual(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'otherSubtag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 7);
                assert.equal(ctx.inputRaw, 'arg1 arg2 "-f flag value"');
                assert.deepEqual(ctx.input, ['arg1', 'arg2', '-f flag value']);
                assert.equal(ctx.flaggedInput.f?.merge().raw, 'flag value');
                assert.equal(ctx.flaggedInput._.merge().raw, 'arg1 arg2');
                assert.equal(ctx.data.stackSize, 101);
                assert.notEqual(ctx.scopes.local, ctx.scopes.root);
                assert.notEqual(ctx.scopes.tag, ctx.scopes.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.tags['otherSubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    name: 'otherSubtag',
                    lastmodified: new Date(),
                    uses: 0,
                    cooldown: 7
                };
            },
            assert(ctx) {
                assert.equal(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'test tag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 4);
                assert.equal(ctx.inputRaw, 'This is some input text');
                assert.equal(ctx.flaggedInput.f?.merge().raw, undefined);
                assert.equal(ctx.flaggedInput._.merge().raw, 'This is some input text');
                assert.equal(ctx.data.stackSize, 100);
                assert.equal(ctx.scopes.local, ctx.scopes.root);
                assert.equal(ctx.scopes.tag, ctx.scopes.root);
            }
        },
        {
            code: '{exec;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.notEqual(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'otherSubtag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 7);
                assert.equal(ctx.inputRaw, 'arg1 arg2 -f flag value');
                assert.deepEqual(ctx.input, ['arg1', 'arg2', '-f', 'flag', 'value']);
                assert.equal(ctx.flaggedInput.f?.merge().raw, 'flag value');
                assert.equal(ctx.flaggedInput._.merge().raw, 'arg1 arg2');
                assert.equal(ctx.data.stackSize, 101);
                assert.notEqual(ctx.scopes.local, ctx.scopes.root);
                assert.notEqual(ctx.scopes.tag, ctx.scopes.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.tags['otherSubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    name: 'otherSubtag',
                    lastmodified: new Date(),
                    uses: 0,
                    cooldown: 7
                };
            },
            assert(ctx) {
                assert.equal(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'test tag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 4);
                assert.equal(ctx.inputRaw, 'This is some input text');
                assert.equal(ctx.flaggedInput.f?.merge().raw, undefined);
                assert.equal(ctx.flaggedInput._.merge().raw, 'This is some input text');
                assert.equal(ctx.data.stackSize, 100);
                assert.equal(ctx.scopes.local, ctx.scopes.root);
                assert.equal(ctx.scopes.tag, ctx.scopes.root);
            }
        },
        {
            code: '{exec;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                assert.notEqual(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'otherSubtag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 7);
                assert.equal(ctx.inputRaw, 'arg1 arg2 \\-f flag value');
                assert.deepEqual(ctx.input, ['arg1', 'arg2', '-f', 'flag', 'value']);
                assert.equal(ctx.flaggedInput.f?.merge().raw, undefined);
                assert.equal(ctx.flaggedInput._.merge().raw, 'arg1 arg2 \\-f flag value');
                assert.equal(ctx.data.stackSize, 101);
                assert.notEqual(ctx.scopes.local, ctx.scopes.root);
                assert.notEqual(ctx.scopes.tag, ctx.scopes.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.tags['otherSubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    name: 'otherSubtag',
                    lastmodified: new Date(),
                    uses: 0,
                    cooldown: 7
                };
            },
            assert(ctx) {
                assert.equal(ctx.parent, undefined);
                assert.equal(ctx.tagName, 'test tag');
                assert.equal(ctx.rootTagName, 'test tag');
                assert.equal(ctx.cooldown, 4);
                assert.equal(ctx.inputRaw, 'This is some input text');
                assert.equal(ctx.flaggedInput.f?.merge().raw, undefined);
                assert.equal(ctx.flaggedInput._.merge().raw, 'This is some input text');
                assert.equal(ctx.data.stackSize, 100);
                assert.equal(ctx.scopes.local, ctx.scopes.root);
                assert.equal(ctx.scopes.tag, ctx.scopes.root);
            }
        }
    ]
});
