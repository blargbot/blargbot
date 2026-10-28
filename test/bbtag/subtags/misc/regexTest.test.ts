import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { AsyncRegex, CompileRegexFeature } from '@blargbot/bbtag/subtags';
import { RegexTestSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CompileRegexFeature>({ id: 'features' });
const regex = new Mock<AsyncRegex>({ id: 'AsyncRegex' });

await runSubtagTests({
    subtag: new RegexTestSubtag(features.instance),
    argCountBounds: { min: 2, max: { count: 2, noEval: [1] } },
    names: ['regexTest'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(regex);
    },
    cases: [
        {
            code: '{regextest;a1b2c3d4e5c6;/[bc]\\d/g}',
            expected: 'true',
            setup() {
                features.setup(m => m.compileRegex('[bc]\\d', 'g'))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.test('a1b2c3d4e5c6'))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{regextest;ffff;/[a-z]\\d/g}',
            expected: 'false',
            setup() {
                features.setup(m => m.compileRegex('[a-z]\\d', 'g'))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.test('ffff'))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: '{regextest;{eval};/[a-z]\\d}',
            expected: '`Invalid Regex`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { error: new BBTagRuntimeError('Invalid Regex') }
            ]
        },
        {
            code: '{regextest;{eval};{fail}}',
            expected: '`Invalid Regex`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { error: new BBTagRuntimeError('Invalid Regex') }
            ]
        },
        {
            code: '{regextest;{eval};/^(a+)+$/}',
            expected: '`Unsafe Regex`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { error: new BBTagRuntimeError('Unsafe Regex') }
            ],
            setup() {
                features.setup(m => m.compileRegex('^(a+)+$', ''))
                    .resolves({ success: false, cause: 'unsafe' })
                    .mustHappen(1);
            }
        },
        {
            code: `{regextest;{eval};/${'a'.repeat(1998)}/}`,
            expected: 'false',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) }
            ],
            setup() {
                features.setup(m => m.compileRegex('a'.repeat(1998), ''))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.test(''))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: `{regextest;{eval};/${'a'.repeat(1999)}/}`,
            expected: '`Regex too long`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { error: new BBTagRuntimeError('Regex too long') }
            ],
            setup() {
                features.setup(m => m.compileRegex('a'.repeat(1999), ''))
                    .resolves({ success: false, cause: 'tooLong' })
                    .mustHappen(1);
            }
        }
    ]
});
