import { BBTagRuntimeError, BBTagRuntimeState, BBTagScript, RuntimeModuleOverflowError } from '@bbtag/blargbot';
import { ExecTagSubtag, JsonSubtag } from '@bbtag/blargbot/subtags';
import { PromiseCompletionSource } from '@blargbot/async-tools';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { makeAssertSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: ExecTagSubtag,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{exec;otherSubtag}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('otherSubtag');
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
                ctx.entrypoint.name = 'test tag';
                ctx.entrypoint.inputRaw = 'This is some input text';
                ctx.tags['otherSubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'otherSubtag').value)).thenReturn(new Date(0));
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
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
                chai.expect(ctx.runtime.outputOptions.embeds).to.deep.equal([{ title: 'abc' }]);
            }
        },
        {
            code: '{exec;otherSubtag;}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('otherSubtag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(0);
                chai.expect(ctx.inputRaw).to.equal('');
                chai.expect(ctx.input).to.deep.equal([]);
                chai.expect(ctx.runtime.scopes.local).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.moduleCount).to.equal(102);
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
                ctx.tags['otherSubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 0
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'otherSubtag').value)).thenReturn(new Date(0));
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
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
            }
        },
        {
            code: '{exec;otherSubtag;abc;\\"def\\";ghi}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('otherSubtag');
                chai.expect(ctx.runtime.entrypoint.name).to.equal('test tag');
                chai.expect(ctx.cooldownMs).to.equal(7);
                chai.expect(ctx.inputRaw).to.equal('abc \\\\\\"def\\\\\\" ghi');
                chai.expect(ctx.input).to.deep.equal(['abc', '\\"def\\"', 'ghi']);
                chai.expect(ctx.runtime.scopes.local).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.scopes.tag).to.not.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.moduleCount).to.equal(102);
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
                ctx.tags['otherSubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'otherSubtag').value)).thenReturn(new Date(0));
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
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
            }
        },
        {
            code: '{exec;otherSubtag;abc;{j;{"def":123}}}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('otherSubtag');
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
                ctx.tags['otherSubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'otherSubtag').value)).thenReturn(new Date(0));
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
                chai.expect(ctx.runtime.scopes.tag).to.equal(ctx.runtime.scopes.root);
                chai.expect(ctx.runtime.moduleCount).to.equal(100);
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
                { start: 0, end: 18, error: new RuntimeModuleOverflowError(200) }
            ],
            setup(ctx) {
                ctx.tags['otherSubtag'] = {
                    content: '{fail}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'otherSubtag').value)).thenReturn(new Date(0));
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
            code: '{exec;otherSubtag;arg1;arg2;-f flag value}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('otherSubtag');
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
                ctx.tags['otherSubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'otherSubtag').value)).thenReturn(new Date(0));
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
            code: '{exec;otherSubtag;arg1 arg2 -f flag value}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('otherSubtag');
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
                ctx.tags['otherSubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'otherSubtag').value)).thenReturn(new Date(0));
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
            code: '{exec;otherSubtag;arg1 arg2 \\-f flag value}',
            expected: 'Success!',
            subtags: [makeAssertSubtag((ctx) => {
                chai.expect(ctx).to.not.equal(ctx.runtime.entrypoint);
                chai.expect(ctx.name).to.equal('otherSubtag');
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
                ctx.tags['otherSubtag'] = {
                    content: '{assert}{eval}',
                    cooldown: 7
                };
            },
            postSetup(bbctx, ctx) {
                ctx.cooldowns.setup(m => m.getCooldown(bbctx)).thenReturn(new Date(0));
                ctx.cooldowns.setup(m => m.getCooldown(argument.isInstanceof(BBTagScript).and(s => s.name === 'otherSubtag').value)).thenReturn(new Date(0));
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
