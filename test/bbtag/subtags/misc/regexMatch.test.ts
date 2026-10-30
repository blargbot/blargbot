import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import type { AsyncRegex, CompileRegexFeature } from '@blargbot/bbtag-engine/subtags';
import { RegexMatchSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CompileRegexFeature>({ id: 'features' });
const regex = new Mock<AsyncRegex>({ id: 'AsyncRegex' });

await runSubtagTests({
    subtag: new RegexMatchSubtag(features.instance),
    argCountBounds: { min: 2, max: { count: 2, noEval: [1] } },
    names: ['regexMatch', 'match'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(regex);
    },
    cases: [
        {
            code: '{regexmatch;a1b2c3;/[a-z]\\d/g}',
            expected: '["a1","b2","c3"]',
            setup() {
                features.setup(m => m.compileRegex('[a-z]\\d', 'g'))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.match('a1b2c3'))
                    .resolves(['a1', 'b2', 'c3'])
                    .mustHappen(1);
            }
        },
        {
            code: '{regexmatch;ffff;/[a-z]\\d/g}',
            expected: '[]',
            setup() {
                features.setup(m => m.compileRegex('[a-z]\\d', 'g'))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.match('ffff'))
                    .resolves([])
                    .mustHappen(1);
            }
        },
        {
            code: '{regexmatch;{eval};/[a-z]\\d}',
            expected: '`Invalid Regex`',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { error: new BBTagRuntimeError('Invalid Regex') }
            ]
        },
        {
            code: '{regexmatch;{eval};{fail}}',
            expected: '`Invalid Regex`',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { error: new BBTagRuntimeError('Invalid Regex') }
            ]
        },
        {
            code: '{regexmatch;{eval};/^(a+)+$/}',
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
            code: `{regexmatch;{eval};/${'a'.repeat(1998)}/}`,
            expected: '[]',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) }
            ],
            setup() {
                features.setup(m => m.compileRegex('a'.repeat(1998), ''))
                    .resolves({ success: true, regex: regex.instance })
                    .mustHappen(1);
                regex.setup(m => m.match(''))
                    .resolves([])
                    .mustHappen(1);
            }
        },
        {
            code: `{regexmatch;{eval};/${'a'.repeat(1999)}/}`,
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
