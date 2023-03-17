import { BBTagRuntimeError, BBTagRuntimeState, BBTagScript, RuntimeModuleOverflowError, UnknownSubtagError } from '@bbtag/blargbot';
import { ExecCustomCommandSubtag, JsonSubtag } from '@bbtag/blargbot/subtags';
import { PromiseCompletionSource } from '@blargbot/async-tools';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { makeAssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: ExecCustomCommandSubtag,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{execcc;otherSubtag}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('othersubtag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('');
                chai.expect(ctx.input).to.deep.equal([]);
                chai.expect(ctx.runtime.scopes.local).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.moduleCount).to.equal(102);
                ctx.runtime.outputOptions.embeds = [{ title: 'abc' }];
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.entrypoint.cooldownMs = 4;
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.inputRaw = 'This is some input text';
                ctx.ccommands['othersubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'othersubtag').value)).thenReturn(new Date(0));
                const neverResolve = new PromiseCompletionSource();
                for (let i = 0; i < 100; i++)
                    void bbctx.runtime.withModule(() => neverResolve);
            },
            assert(ctx) {
                chai.expect(ctx.name).to.equal('test tag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.runtime.scopes.local).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
                chai.expect(ctx.runtime.outputOptions.embeds).to.deep.equal([{ title: 'abc' }]);
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
            }
        },
        {
            code: '{execcc;otherSubtag;}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('othersubtag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(0);
                chai.expect(ctx.inputRaw).to.equal('');
                chai.expect(ctx.input).to.deep.equal([]);
                chai.expect(ctx.runtime.moduleCount).to.equal(102);
                chai.expect(ctx.runtime.scopes.local).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.not.equal(ctx.runtime.scopes.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.entrypoint.cooldownMs = 4;
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.inputRaw = 'This is some input text';
                ctx.ccommands['othersubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 0
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'othersubtag').value)).thenReturn(new Date(0));
                const neverResolve = new PromiseCompletionSource();
                for (let i = 0; i < 100; i++)
                    void bbctx.runtime.withModule(() => neverResolve);
            },
            assert(ctx) {
                chai.expect(ctx.name).to.equal('test tag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
                chai.expect(ctx.runtime.scopes.local).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
            }
        },
        {
            code: '{execcc;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('othersubtag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('abc \\\\\\"def\\\\\\" ghi');
                chai.expect(ctx.input).to.deep.equal(['abc', '\\"def\\"', 'ghi']);
                chai.expect(ctx.runtime.moduleCount).to.equal(102);
                chai.expect(ctx.runtime.scopes.local).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.not.equal(ctx.runtime.scopes.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.entrypoint.cooldownMs = 4;
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.inputRaw = 'This is some input text';
                ctx.ccommands['othersubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'othersubtag').value)).thenReturn(new Date(0));
                const neverResolve = new PromiseCompletionSource();
                for (let i = 0; i < 100; i++)
                    void bbctx.runtime.withModule(() => neverResolve);
            },
            assert(ctx) {
                chai.expect(ctx.name).to.equal('test tag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
                chai.expect(ctx.runtime.scopes.local).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
            }
        },
        {
            code: '{execcc;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('othersubtag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('abc {\\"def\\":123}');
                chai.expect(ctx.input).to.deep.equal(['abc', '{"def":123}']);
                chai.expect(ctx.runtime.scopes.local).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.moduleCount).to.equal(102);
                return 'Success!';
            }), JsonSubtag],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.entrypoint.cooldownMs = 4;
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.inputRaw = 'This is some input text';
                ctx.ccommands['othersubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'othersubtag').value)).thenReturn(new Date(0));
                const neverResolve = new PromiseCompletionSource();
                for (let i = 0; i < 100; i++)
                    void bbctx.runtime.withModule(() => neverResolve);
            },
            assert(ctx) {
                chai.expect(ctx.name).to.equal('test tag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
                chai.expect(ctx.runtime.scopes.local).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
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
            expected: '`Unknown subtag assert`',
            errors: [
                { start: 0, end: 8, error: new UnknownSubtagError('assert') }
            ],
            setup(ctx) {
                ctx.ccommands['othersubtag'] = {
                    content: '{assert}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'othersubtag').value)).thenReturn(new Date(0));
            }
        },
        {
            code: '{execcc;otherSubtag}',
            expected: '`Terminated recursive tag after 200 execs.`',
            errors: [
                { start: 0, end: 20, error: new RuntimeModuleOverflowError(200) }
            ],
            setup(ctx) {
                ctx.ccommands['othersubtag'] = {
                    content: '{fail}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'othersubtag').value)).thenReturn(new Date(0));
                const neverResolve = new PromiseCompletionSource();
                for (let i = 0; i < 199; i++)
                    void bbctx.runtime.withModule(() => neverResolve);
            },
            assert(ctx) {
                chai.expect(ctx.runtime.moduleCount).to.equal(199);
                chai.expect(ctx.runtime.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('othersubtag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('arg1 arg2 "-f flag value"');
                chai.expect(ctx.input).to.deep.equal(['arg1', 'arg2', '-f flag value']);
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.equal('flag value');
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('arg1 arg2');
                chai.expect(ctx.runtime.moduleCount).to.equal(102);
                chai.expect(ctx.runtime.scopes.local).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.not.equal(ctx.runtime.scopes.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.entrypoint.cooldownMs = 4;
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.inputRaw = 'This is some input text';
                ctx.ccommands['othersubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'othersubtag').value)).thenReturn(new Date(0));
                const neverResolve = new PromiseCompletionSource();
                for (let i = 0; i < 100; i++)
                    void bbctx.runtime.withModule(() => neverResolve);
            },
            assert(ctx) {
                chai.expect(ctx.name).to.equal('test tag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('This is some input text');
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
                chai.expect(ctx.runtime.scopes.local).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('othersubtag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('arg1 arg2 -f flag value');
                chai.expect(ctx.input).to.deep.equal(['arg1', 'arg2', '-f', 'flag', 'value']);
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.equal('flag value');
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('arg1 arg2');
                chai.expect(ctx.runtime.moduleCount).to.equal(102);
                chai.expect(ctx.runtime.scopes.local).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.not.equal(ctx.runtime.scopes.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.entrypoint.cooldownMs = 4;
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.inputRaw = 'This is some input text';
                ctx.ccommands['othersubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'othersubtag').value)).thenReturn(new Date(0));
                const neverResolve = new PromiseCompletionSource();
                for (let i = 0; i < 100; i++)
                    void bbctx.runtime.withModule(() => neverResolve);
            },
            assert(ctx) {
                chai.expect(ctx.name).to.equal('test tag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('This is some input text');
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
                chai.expect(ctx.runtime.scopes.local).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
            }
        },
        {
            code: '{execcc;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('othersubtag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('arg1 arg2 \\-f flag value');
                chai.expect(ctx.input).to.deep.equal(['arg1', 'arg2', '-f', 'flag', 'value']);
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('arg1 arg2 \\-f flag value');
                chai.expect(ctx.runtime.moduleCount).to.equal(102);
                chai.expect(ctx.runtime.scopes.local).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.not.equal(ctx.runtime.scopes.root);
                return 'Success!';
            })],
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) }
            ],
            setup(ctx) {
                ctx.entrypoint.cooldownMs = 4;
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.inputRaw = 'This is some input text';
                ctx.ccommands['othersubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'othersubtag').value)).thenReturn(new Date(0));
                const neverResolve = new PromiseCompletionSource();
                for (let i = 0; i < 100; i++)
                    void bbctx.runtime.withModule(() => neverResolve);
            },
            assert(ctx) {
                chai.expect(ctx.name).to.equal('test tag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(4);
                chai.expect(ctx.inputRaw).to.equal('This is some input text');
                chai.expect(ctx.flaggedInput.f?.merge().raw).to.be.undefined;
                chai.expect(ctx.flaggedInput._.merge().raw).to.equal('This is some input text');
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
                chai.expect(ctx.runtime.scopes.local).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
            }
        }
    ]
});
