import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { ColorFormat, ColorSubtag } from '@cluster/subtags/misc/color';

import { MarkerError, runSubtagTests, SubtagTestCase } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ColorSubtag(),
    argCountBounds: { min: 1, max: 3 },
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
            setup(ctx) { ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = 'abc'; },
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Invalid color', '"_myVariable" is not a valid color') }
            ]
        },
        {
            code: '{color;_myVariable}',
            expected: '204080',
            setup(ctx) {
                ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.myVariable`] = [32, 64, 128];
            }
        },
        ...generateTestCases('FFFFFF', '', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('FFFFFF', 'hex', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('97', 'ansi16', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('231', 'ansi256', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('65535,65535,65535', 'apple', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('0,0,0,0', 'cmyk', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('100', 'gray', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('0,0,100', 'hcg', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('0,0,100', 'hsl', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('0,0,100', 'hsv', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('0,100,0', 'hwb', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('white', 'keyword', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('100,0.01,-0.01', 'lab', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,315]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('100,0.01,296.81', 'lch', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65534.71]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[60,0,100]', hsl: '[60,100,100]', hsv: '[60,0,100]', hwb: '[60,100,0]', keyword: 'white', lab: '[100,0,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('255,255,255', '', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('255,255,255', 'rgb', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.05,100,100]' }),
        ...generateTestCases('95.05,100,100', 'xyz', { hex: 'FFFFF4', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65430.04,62747.13]', cmyk: '[0,0.16,4.25,0]', gray: '100', hcg: '[57.74000000000001,4.25,100]', hsl: '[57.74000000000001,100,97.87]', hsv: '[57.74000000000001,4.25,100]', hwb: '[57.74000000000001,95.75,0]', keyword: 'ivory', lab: '[100,0.01,5.59]', lch: '[100,5.59,89.95]', rgb: '[255,254.59,244.15]', xyz: '[95.05,100,100]' }),
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

function generateTestCases(input: string, format: string, results: Record<ColorFormat, string>): SubtagTestCase[] {
    const cases = Object.entries(results).map(([output, expected]) => ({ code: `{color;${input};${output};${format}}`, expected }));
    if (format === '')
        cases.push(...Object.entries(results).map(([output, expected]) => ({ code: `{color;${input};${output}}`, expected })));
    return cases;
}
