import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { AsyncRegex, CompileRegexFeature } from '@blargbot/bbtag/subtags';
import { RegexSplitSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CompileRegexFeature>({ id: 'features' });
const regex = new Mock<AsyncRegex>({ id: 'AsyncRegex' });

await runSubtagTests({
    subtag: new RegexSplitSubtag(features.instance),
    argCountBounds: { min: 2, max: { count: 2, noEval: [1] } },
    names: ['regexSplit'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(regex);
    },
    cases: [
        {
            code: '{regexsplit;a1b2c3d4e5c6;/[bc]\\d/g}',
            expected: '["a1","","d4e5",""]',
            setup() {
                features.setup(m => m.compileRegex('[bc]\\d', 'g'))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.split('a1b2c3d4e5c6'))
                    .resolves(['a1', '', 'd4e5', ''])
                    .mustHappen(1);
            }
        },
        {
            code: '{regexsplit;ffff;/[a-z]\\d/g}',
            expected: '["ffff"]',
            setup() {
                features.setup(m => m.compileRegex('[a-z]\\d', 'g'))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.split('ffff'))
                    .resolves(['ffff'])
                    .mustHappen(1);
            }
        },
        {
            code: '{regexsplit;{eval};/[a-z]\\d}',
            expected: '`Invalid Regex`',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { error: new BBTagRuntimeError('Invalid Regex') }
            ]
        },
        {
            code: '{regexsplit;{eval};{fail}}',
            expected: '`Invalid Regex`',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { error: new BBTagRuntimeError('Invalid Regex') }
            ]
        },
        {
            code: '{regexsplit;{eval};/^(a+)+$/}',
            expected: '`Unsafe Regex`',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { error: new BBTagRuntimeError('Unsafe Regex') }
            ],
            setup() {
                features.setup(m => m.compileRegex('^(a+)+$', ''))
                    .resolves({ success: false, cause: 'unsafe' })
                    .mustHappen(1);
            }
        },
        {
            code: `{regexsplit;{eval}abc;/${'a'.repeat(1998)}/}`,
            expected: '["abc"]',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) }
            ],
            setup() {
                features.setup(m => m.compileRegex('a'.repeat(1998), ''))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.split('abc'))
                    .resolves(['abc'])
                    .mustHappen(1);
            }
        },
        {
            code: `{regexsplit;{eval};/${'a'.repeat(1999)}/}`,
            expected: '`Regex too long`',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
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
