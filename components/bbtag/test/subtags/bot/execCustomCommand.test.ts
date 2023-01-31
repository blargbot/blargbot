import { BBTagRuntimeError, BBTagRuntimeState, Subtag, SubtagStackOverflowError } from '@blargbot/bbtag';
import { ExecCustomCommandSubtag, JsonSubtag } from '@blargbot/bbtag/subtags';
import chai from 'chai';

import { AssertSubtag, createDescriptor, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ExecCustomCommandSubtag),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{execcc;otherSubtag}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag((ctx) => {
                chai.expect(ctx.parent).to.not.be.undefined;
                chai.expect(ctx.tagName).to.equal('othersubtag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('');
                chai.expect(ctx.input).to.deep.equal([]);
                chai.expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                chai.expect(ctx.data.stackSize).to.equal(101);
                ctx.data.embeds = [{ title: 'abc' }];
                return 'Success!';
            }))],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.ccommands['othersubtag'] = {
                    id: '0',
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            assert(ctx) {
                chai.expect(ctx.parent).to.be.undefined;
                chai.expect(ctx.tagName).to.equal('test tag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                chai.expect(ctx.data.stackSize).to.equal(100);
                chai.expect(ctx.data.embeds).to.deep.equal([{ title: 'abc' }]);
                chai.expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
            }
        },
        {
            code: '{execcc;otherSubtag;}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag((ctx) => {
                chai.expect(ctx.parent).to.not.be.undefined;
                chai.expect(ctx.tagName).to.equal('othersubtag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(0);
                chai.expect(ctx.inputRaw).to.equal('');
                chai.expect(ctx.input).to.deep.equal([]);
                chai.expect(ctx.data.stackSize).to.equal(101);
                chai.expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                return 'Success!';
            }))],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.ccommands['othersubtag'] = {
                    id: '0',
                    author: '212097368371683623',
                    content: '{assert}{eval}'
                };
            },
            assert(ctx) {
                chai.expect(ctx.parent).to.be.undefined;
                chai.expect(ctx.tagName).to.equal('test tag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.data.stackSize).to.equal(100);
                chai.expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
            }
        },
        {
            code: '{execcc;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag((ctx) => {
                chai.expect(ctx.parent).to.not.be.undefined;
                chai.expect(ctx.tagName).to.equal('othersubtag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('abc \\\\\\"def\\\\\\" ghi');
                chai.expect(ctx.input).to.deep.equal(['abc', '\\"def\\"', 'ghi']);
                chai.expect(ctx.data.stackSize).to.equal(101);
                chai.expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                return 'Success!';
            }))],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.ccommands['othersubtag'] = {
                    id: '0',
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            assert(ctx) {
                chai.expect(ctx.parent).to.be.undefined;
                chai.expect(ctx.tagName).to.equal('test tag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.data.stackSize).to.equal(100);
                chai.expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
            }
        },
        {
            code: '{execcc;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag((ctx) => {
                chai.expect(ctx.parent).to.not.be.undefined;
                chai.expect(ctx.tagName).to.equal('othersubtag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('abc {\\"def\\":123}');
                chai.expect(ctx.input).to.deep.equal(['abc', '{"def":123}']);
                chai.expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                chai.expect(ctx.data.stackSize).to.equal(101);
                return 'Success!';
            })), Subtag.getDescriptor(JsonSubtag)],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.ccommands['othersubtag'] = {
                    id: '0',
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            assert(ctx) {
                chai.expect(ctx.parent).to.be.undefined;
                chai.expect(ctx.tagName).to.equal('test tag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.data.stackSize).to.equal(100);
                chai.expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
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
                    id: '0',
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
                    id: '0',
                    author: '212097368371683623',
                    content: '{fail}',
                    cooldown: 7
                };
            },
            assert(ctx) {
                chai.expect(ctx.data.stackSize).to.equal(200);
                chai.expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag((ctx) => {
                chai.expect(ctx.parent).to.not.be.undefined;
                chai.expect(ctx.tagName).to.equal('othersubtag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('arg1 arg2 "-f flag value"');
                chai.expect(ctx.input).to.deep.equal(['arg1', 'arg2', '-f flag value']);
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.equal('flag value');
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('arg1 arg2');
                chai.expect(ctx.data.stackSize).to.equal(101);
                chai.expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                return 'Success!';
            }))],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.ccommands['othersubtag'] = {
                    id: '0',
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            assert(ctx) {
                chai.expect(ctx.parent).to.be.undefined;
                chai.expect(ctx.tagName).to.equal('test tag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('This is some input text');
                chai.expect(ctx.data.stackSize).to.equal(100);
                chai.expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag((ctx) => {
                chai.expect(ctx.parent).to.not.be.undefined;
                chai.expect(ctx.tagName).to.equal('othersubtag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('arg1 arg2 -f flag value');
                chai.expect(ctx.input).to.deep.equal(['arg1', 'arg2', '-f', 'flag', 'value']);
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.equal('flag value');
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('arg1 arg2');
                chai.expect(ctx.data.stackSize).to.equal(101);
                chai.expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                return 'Success!';
            }))],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.ccommands['othersubtag'] = {
                    id: '0',
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            assert(ctx) {
                chai.expect(ctx.parent).to.be.undefined;
                chai.expect(ctx.tagName).to.equal('test tag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('This is some input text');
                chai.expect(ctx.data.stackSize).to.equal(100);
                chai.expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag((ctx) => {
                chai.expect(ctx.parent).to.not.be.undefined;
                chai.expect(ctx.tagName).to.equal('othersubtag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('arg1 arg2 \\-f flag value');
                chai.expect(ctx.input).to.deep.equal(['arg1', 'arg2', '-f', 'flag', 'value']);
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('arg1 arg2 \\-f flag value');
                chai.expect(ctx.data.stackSize).to.equal(101);
                chai.expect(ctx.scopes.local).to.not.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.not.equal(ctx.scopes.root);
                return 'Success!';
            }))],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.options.cooldown = 4;
                ctx.options.tagName = 'test tag';
                ctx.options.rootTagName = 'test tag';
                ctx.options.inputRaw = 'This is some input text';
                ctx.options.data = { stackSize: 100 };
                ctx.ccommands['othersubtag'] = {
                    id: '0',
                    author: '212097368371683623',
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            assert(ctx) {
                chai.expect(ctx.parent).to.be.undefined;
                chai.expect(ctx.tagName).to.equal('test tag');
                chai.expect(ctx.rootTagName).to.equal('test tag');
                chai.expect(ctx.cooldown).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('This is some input text');
                chai.expect(ctx.data.stackSize).to.equal(100);
                chai.expect(ctx.scopes.local).to.equal(ctx.scopes.root);
                chai.expect(ctx.scopes.tag).to.equal(ctx.scopes.root);
            }
        }
    ]
});
