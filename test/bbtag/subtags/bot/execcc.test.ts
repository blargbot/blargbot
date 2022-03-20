import { BBTagRuntimeError, SubtagStackOverflowError } from '@blargbot/bbtag/errors';
import { ExecccSubtag } from '@blargbot/bbtag/subtags/bot/execcc';
import { BBTagRuntimeState } from '@blargbot/bbtag/types';
import { expect } from 'chai';

import { AssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ExecccSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{execcc;otherSubtag}',
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
                ctx.ccommands['othersubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}',
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
            }
        },
        {
            code: '{execcc;otherSubtag;}',
            expected: 'Success!',
            subtags: [new AssertSubtag((ctx) => {
                expect(ctx.parent).to.not.be.undefined;
                expect(ctx.tagName).to.equal('othersubtag');
                expect(ctx.rootTagName).to.equal('test tag');
                expect(ctx.cooldown).to.equal(0);
                expect(ctx.inputRaw).to.equal('');
                expect(ctx.input).to.deep.equal([]);
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
                ctx.ccommands['othersubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}'
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
            }
        },
        {
            code: '{execcc;otherSubtag;abc;\\"def\\";ghi}',
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
                ctx.ccommands['othersubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}',
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
            }
        },
        {
            code: '{execcc;abc}',
            expected: '`CCommand not found: abc`',
            errors: [
                { start: 0, end: 12, error: new BBTagRuntimeError('CCommand not found: abc') }
            ]
        },
        {
            code: '{execcc;othersubtag}',
            expected: '`Cannot execcc imported tag: othersubtag`',
            errors: [
                { start: 0, end: 20, error: new BBTagRuntimeError('Cannot execcc imported tag: othersubtag') }
            ],
            setup(ctx) {
                ctx.ccommands['othersubtag'] = {
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    alias: 'otherSubtag',
                    cooldown: 7
                };
            }
        },
        {
            code: '{execcc;otherSubtag}',
            expected: '`Terminated recursive tag after 200 execs.`',
            errors: [
                { start: 0, end: 20, error: new SubtagStackOverflowError(200) }
            ],
            setup(ctx) {
                ctx.options.data = { stackSize: 200 };
                ctx.ccommands['othersubtag'] = {
                    author: '212097368371683623',
                    content: '{fail}',
                    cooldown: 7
                };
            },
            assert(ctx) {
                expect(ctx.data.stackSize).to.equal(200);
                expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        }
    ]
});
