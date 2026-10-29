import assert from 'node:assert/strict';

import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { AsyncRegex, CompileRegexFeature } from '@blargbot/bbtag/subtags';
import { RegexReplaceSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CompileRegexFeature>({ id: 'features' });
const regex = new Mock<AsyncRegex>({ id: 'AsyncRegex' });

await runSubtagTests({
    subtag: new RegexReplaceSubtag(features.instance),
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 3, noEval: [1] } },
    names: ['regexReplace'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(regex);
    },
    cases: [
        {
            code: '{regexreplace;/[a-z]\\d/g;oooh}',
            expected: '',
            setup() {
                features.setup(m => m.compileRegex('[a-z]\\d', 'g'))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
            },
            async assert(ctx) {
                regex.setup(m => m.replace('a1b2c3', 'oooh')).resolves('success!').mustHappen(1);
                const result = await ctx.bbtag.root.output.replace?.('a1b2c3');
                assert.equal(result, 'success!');
            }
        },
        {
            code: '{regexreplace;/[a-z]\\d;{eval}}',
            expected: '`Invalid Regex`',
            errors: [
                { start: 23, end: 29, error: new MarkerError('eval', 23) },
                { error: new BBTagRuntimeError('Invalid Regex') }
            ]
        },
        {
            code: '{regexreplace;{fail};{eval}}',
            expected: '`Invalid Regex`',
            errors: [
                { start: 21, end: 27, error: new MarkerError('eval', 21) },
                { error: new BBTagRuntimeError('Invalid Regex') }
            ],
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.replace, undefined);
            }
        },
        {
            code: '{regexreplace;/^(a+)+$/;{eval}}',
            expected: '`Unsafe Regex`',
            errors: [
                { start: 24, end: 30, error: new MarkerError('eval', 24) },
                { error: new BBTagRuntimeError('Unsafe Regex') }
            ],
            setup() {
                features.setup(m => m.compileRegex('^(a+)+$', ''))
                    .resolves({ success: false, cause: 'unsafe' })
                    .mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.replace, undefined);
            }
        },
        {
            code: `{regexreplace;/${'a'.repeat(1998)}/;{eval}oooh}`,
            expected: '',
            errors: [
                { start: 2015, end: 2021, error: new MarkerError('eval', 2015) }
            ],
            setup() {
                features.setup(m => m.compileRegex('a'.repeat(1998), ''))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
            },
            async assert(ctx) {
                regex.setup(m => m.replace('a1b2c3', 'oooh')).resolves('success!').mustHappen(1);
                const result = await ctx.bbtag.root.output.replace?.('a1b2c3');
                assert.equal(result, 'success!');
            }
        },
        {
            code: `{regexreplace;/${'a'.repeat(1999)}/;{eval}}`,
            expected: '`Regex too long`',
            errors: [
                { start: 2016, end: 2022, error: new MarkerError('eval', 2016) },
                { error: new BBTagRuntimeError('Regex too long') }
            ],
            setup() {
                features.setup(m => m.compileRegex('a'.repeat(1999), ''))
                    .resolves({ success: false, cause: 'tooLong' })
                    .mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.replace, undefined);
            }
        },
        {
            code: '{regexreplace;a1eeb2c3;/[a-z]\\d/g;oooh}',
            expected: 'oooheeooohoooh',
            setup() {
                features.setup(m => m.compileRegex('[a-z]\\d', 'g'))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.replace('a1eeb2c3', 'oooh'))
                    .resolves('oooheeooohoooh')
                    .mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.replace, undefined);
            }
        },
        {
            code: '{regexreplace;{eval};/[a-z]\\d;{eval}}',
            expected: '`Invalid Regex`',
            errors: [
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 30, end: 36, error: new MarkerError('eval', 30) },
                { error: new BBTagRuntimeError('Invalid Regex') }
            ],
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.replace, undefined);
            }
        },
        {
            code: '{regexreplace;{eval};{fail};{eval}}',
            expected: '`Invalid Regex`',
            errors: [
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 28, end: 34, error: new MarkerError('eval', 28) },
                { error: new BBTagRuntimeError('Invalid Regex') }
            ],
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.replace, undefined);
            }
        },
        {
            code: '{regexreplace;{eval};/^(a+)+$/;{eval}}',
            expected: '`Unsafe Regex`',
            errors: [
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 31, end: 37, error: new MarkerError('eval', 31) },
                { error: new BBTagRuntimeError('Unsafe Regex') }
            ],
            setup() {
                features.setup(m => m.compileRegex('^(a+)+$', ''))
                    .resolves({ success: false, cause: 'unsafe' })
                    .mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.replace, undefined);
            }
        },
        {
            code: `{regexreplace;a1eeb2c3;/b|${'a'.repeat(1996)}/;{eval}oooh}`,
            expected: 'a1eeoooh2c3',
            errors: [
                { start: 2024, end: 2030, error: new MarkerError('eval', 2024) }
            ],
            setup() {
                features.setup(m => m.compileRegex(`b|${'a'.repeat(1996)}`, ''))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.replace('a1eeb2c3', 'oooh'))
                    .resolves('a1eeoooh2c3')
                    .mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.replace, undefined);
            }
        },
        {
            code: `{regexreplace;{eval};/${'a'.repeat(1999)}/;{eval}}`,
            expected: '`Regex too long`',
            errors: [
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 2023, end: 2029, error: new MarkerError('eval', 2023) },
                { error: new BBTagRuntimeError('Regex too long') }
            ],
            setup() {
                features.setup(m => m.compileRegex('a'.repeat(1999), ''))
                    .resolves({ success: false, cause: 'tooLong' })
                    .mustHappen(1);
            },
            assert(ctx) {
                assert.equal(ctx.bbtag.root.output.replace, undefined);
            }
        }
    ]
});
