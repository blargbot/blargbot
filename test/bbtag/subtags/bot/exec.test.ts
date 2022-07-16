import { BBTagRuntimeError, SubtagStackOverflowError } from '@blargbot/bbtag/errors';
import { ExecSubtag } from '@blargbot/bbtag/subtags/bot/exec';
import { BBTagRuntimeState } from '@blargbot/bbtag/types';
import { expect } from 'chai';

import { AssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ExecSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{exec;otherSubtag}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                expect(ctx.parent).to.not.be.undefined;
                expect(ctx.tagName).to.equal('otherSubtag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(7);
                expect(ctx.inputRaw).to.equal('');
                expect(ctx.input).to.deep.equal([]);
                expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                expect(ctx.data.stackSize).to.equal(101);
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
                expect(ctx.parent).to.be.undefined;
                expect(ctx.tagName).to.equal('test tag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(4);
                expect(ctx.inputRaw).to.equal('This is some input text');
                expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
                expect(ctx.data.stackSize).to.equal(100);
                expect(ctx.data.embeds).to.deep.equal([{ title: 'abc' }]);
            }
        },
        {
            code: '{exec;otherSubtag;}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                expect(ctx.parent).to.not.be.undefined;
                expect(ctx.tagName).to.equal('otherSubtag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(0);
                expect(ctx.inputRaw).to.equal('');
                expect(ctx.input).to.deep.equal([]);
                expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                expect(ctx.data.stackSize).to.equal(101);
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
                expect(ctx.parent).to.be.undefined;
                expect(ctx.tagName).to.equal('test tag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(4);
                expect(ctx.inputRaw).to.equal('This is some input text');
                expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
                expect(ctx.data.stackSize).to.equal(100);
            }
        },
        {
            code: '{exec;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                expect(ctx.parent).to.not.be.undefined;
                expect(ctx.tagName).to.equal('otherSubtag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(7);
                expect(ctx.inputRaw).to.equal('abc \\\\\\"def\\\\\\" ghi');
                expect(ctx.input).to.deep.equal(['abc', '\\"def\\"', 'ghi']);
                expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                expect(ctx.data.stackSize).to.equal(101);
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
                expect(ctx.parent).to.be.undefined;
                expect(ctx.tagName).to.equal('test tag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(4);
                expect(ctx.inputRaw).to.equal('This is some input text');
                expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
                expect(ctx.data.stackSize).to.equal(100);
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
                expect(ctx.data.stackSize).to.equal(200);
                expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{exec;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                expect(ctx.parent).to.not.be.undefined;
                expect(ctx.tagName).to.equal('otherSubtag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(7);
                expect(ctx.inputRaw).to.equal('arg1 arg2 "-f flag value"');
                expect(ctx.input).to.deep.equal(['arg1', 'arg2', '-f flag value']);
                expect(ctx.flaggedInput.f?.merge().raw).to.equal('flag value');
                expect(ctx.flaggedInput._.merge().raw).to.equal('arg1 arg2');
                expect(ctx.data.stackSize).to.equal(101);
                expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
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
                expect(ctx.parent).to.be.undefined;
                expect(ctx.tagName).to.equal('test tag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(4);
                expect(ctx.inputRaw).to.equal('This is some input text');
                expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                expect(ctx.flaggedInput._.merge().raw).to.equal('This is some input text');
                expect(ctx.data.stackSize).to.equal(100);
                expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
            }
        },
        {
            code: '{exec;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                expect(ctx.parent).to.not.be.undefined;
                expect(ctx.tagName).to.equal('otherSubtag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(7);
                expect(ctx.inputRaw).to.equal('arg1 arg2 -f flag value');
                expect(ctx.input).to.deep.equal(['arg1', 'arg2', '-f', 'flag', 'value']);
                expect(ctx.flaggedInput.f?.merge().raw).to.equal('flag value');
                expect(ctx.flaggedInput._.merge().raw).to.equal('arg1 arg2');
                expect(ctx.data.stackSize).to.equal(101);
                expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
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
                expect(ctx.parent).to.be.undefined;
                expect(ctx.tagName).to.equal('test tag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(4);
                expect(ctx.inputRaw).to.equal('This is some input text');
                expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                expect(ctx.flaggedInput._.merge().raw).to.equal('This is some input text');
                expect(ctx.data.stackSize).to.equal(100);
                expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
            }
        },
        {
            code: '{exec;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                expect(ctx.parent).to.not.be.undefined;
                expect(ctx.tagName).to.equal('otherSubtag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(7);
                expect(ctx.inputRaw).to.equal('arg1 arg2 \\-f flag value');
                expect(ctx.input).to.deep.equal(['arg1', 'arg2', '-f', 'flag', 'value']);
                expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                expect(ctx.flaggedInput._.merge().raw).to.equal('arg1 arg2 \\-f flag value');
                expect(ctx.data.stackSize).to.equal(101);
                expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
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
                expect(ctx.parent).to.be.undefined;
                expect(ctx.tagName).to.equal('test tag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(4);
                expect(ctx.inputRaw).to.equal('This is some input text');
                expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                expect(ctx.flaggedInput._.merge().raw).to.equal('This is some input text');
                expect(ctx.data.stackSize).to.equal(100);
                expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
            }
        }
    ]
});
