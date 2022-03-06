import { BBTagRuntimeError, SubtagStackOverflowError } from '@cluster/bbtag/errors';
import { ExecSubtag } from '@cluster/subtags/bot/exec';
import { RuntimeReturnState } from '@cluster/types';
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
                expect(ctx.tagName).to.equal('othersubtag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(7);
                expect(ctx.inputRaw).to.equal('');
                expect(ctx.input).to.deep.equal([]);
                expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                expect(ctx.state.stackSize).to.equal(101);
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
                ctx.options.state = { stackSize: 100 };
                ctx.tags['othersubtag'] = {
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
                expect(ctx.state.stackSize).to.equal(100);
            }
        },
        {
            code: '{exec;otherSubtag;}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                expect(ctx.parent).to.not.be.undefined;
                expect(ctx.tagName).to.equal('othersubtag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(0);
                expect(ctx.inputRaw).to.equal('""');
                expect(ctx.input).to.deep.equal(['']);
                expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                expect(ctx.state.stackSize).to.equal(101);
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
                ctx.options.state = { stackSize: 100 };
                ctx.tags['othersubtag'] = {
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
                expect(ctx.state.stackSize).to.equal(100);
            }
        },
        {
            code: '{exec;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                expect(ctx.parent).to.not.be.undefined;
                expect(ctx.tagName).to.equal('othersubtag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(7);
                expect(ctx.inputRaw).to.equal('abc \\\\\\"def\\\\\\" ghi');
                expect(ctx.input).to.deep.equal(['abc', '\\"def\\"', 'ghi']);
                expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                expect(ctx.state.stackSize).to.equal(101);
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
                ctx.options.state = { stackSize: 100 };
                ctx.tags['othersubtag'] = {
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
                expect(ctx.state.stackSize).to.equal(100);
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
                ctx.options.state = { stackSize: 200 };
                ctx.tags['othersubtag'] = {
                    author: '212097368371683623',
                    content: '{fail}',
                    name: 'otherSubtag',
                    lastmodified: new Date(),
                    uses: 0,
                    cooldown: 7
                };
            },
            assert(ctx) {
                expect(ctx.state.stackSize).to.equal(200);
                expect(ctx.state.return).to.equal(RuntimeReturnState.ALL);
            }
        }
    ]
});
