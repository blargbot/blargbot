import type { ColorLocals, Colorspace, VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';
import Color from 'color';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.colorReplacer,
    argCountBounds: { min: 1, max: 3 },
    setup(ctx) {
        ctx.locals.setup(m => m.parseColor).returns((channels, format) => {
            const result = new Color(channels, format);
            return format === 'gray' ? result.rgb() : result;
        });
        const variablesFallback = ctx.createMock<VariableStore>();
        ctx.locals.setup(m => m.variables).returns(variablesFallback.instance, { isFallback: true });
        variablesFallback.setup((m, $) => m.get($.string)).returns({ key: '', value: undefined });
    },
    cases: [
        {
            code: '{color;}',
            expected: '`Invalid color`',
            errors: [
                { start: 0, end: 8, error: new BBTagRuntimeError('Invalid color', 'value was empty') }
            ]
        },
        {
            code: '{color;_myVariable}',
            expected: '`Invalid color`',
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Invalid color', '"_myVariable" is not a valid color') }
            ]
        },
        {
            code: '{color;_myVariable}',
            expected: '`Invalid color`',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('_myVariable')).returns({ key: '$myVariable', value: 'abc' }).mustHappen();
            },
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Invalid color', '"_myVariable" is not a valid color') }
            ]
        },
        {
            code: '{color;_myVariable}',
            expected: '204080',
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('_myVariable')).returns({ key: '$myVariable', value: [32, 64, 128] }).mustHappen();
            }
        },
        ...generateTestCases('FFFFFF', '', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('FFFFFF', 'hex', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('97', 'ansi16', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('231', 'ansi256', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('65535,65535,65535', 'apple', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('0,0,0,0', 'cmyk', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('100', 'gray', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('0,0,100', 'hcg', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('0,0,100', 'hsl', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('0,0,100', 'hsv', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('0,100,0', 'hwb', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('white', 'keyword', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('100,0,0', 'lab', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[305.21000000000004,0,100]', hsl: '[305.21000000000004,100,100]', hsv: '[305.21000000000004,0,100]', hwb: '[305.21000000000004,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,0]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('100,0,0', 'lch', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[305.21000000000004,0,100]', hsl: '[305.21000000000004,100,100]', hsv: '[305.21000000000004,0,100]', hwb: '[305.21000000000004,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,0]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('255,255,255', '', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('255,255,255', 'rgb', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0,0]', lch: '[100,0,158.2]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('95.047,100,108.83', 'xyz', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65534.36,65518.86]', cmyk: '[0,0,0.02,0]', gray: '100', hcg: '[57.639999999999986,0.02,100]', hsl: '[57.639999999999986,100,99.99]', hsv: '[57.639999999999986,0.02,100]', hwb: '[57.639999999999986,99.98,0]', keyword: 'white', lab: '[100,0,0.03]', lch: '[100,0.03,90]', rgb: '[255,255,254.94]', xyz: '[95.047,100,108.83]' }),
        {
            code: '{color;{eval}0;{eval};{eval}cba}',
            expected: '`Invalid input method`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { start: 15, end: 21, error: new MarkerError('eval', 15) },
                { start: 22, end: 28, error: new MarkerError('eval', 22) },
                { start: 0, end: 32, error: new BBTagRuntimeError('Invalid input method', '"cba" is not valid') }
            ]
        },
        {
            code: '{color;{eval}0;{eval}abc;{eval}}',
            expected: '`Invalid output method`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { start: 15, end: 21, error: new MarkerError('eval', 15) },
                { start: 25, end: 31, error: new MarkerError('eval', 25) },
                { start: 0, end: 32, error: new BBTagRuntimeError('Invalid output method', '"abc" is not valid') }
            ]
        },
        { code: '{color;[0,0,0,0];;cmyk}', expected: 'FFFFFF' }
    ]
});

function generateTestCases(input: string, format: string, results: Record<Colorspace, string>): Array<SubtagTestCase<ColorLocals & VariablesLocals>> {
    const cases = Object.entries(results).map(([output, expected]) => ({ code: `{color;${input};${output};${format}}`, expected }));
    if (format === '')
        cases.push(...Object.entries(results).map(([output, expected]) => ({ code: `{color;${input};${output}}`, expected })));
    return cases;
}
