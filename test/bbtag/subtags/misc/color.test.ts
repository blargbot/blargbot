import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { ColorFormat, ColorSubtag } from '@blargbot/bbtag/subtags/misc/color';
import { TagVariableType } from '@blargbot/domain/models/index';

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
            setup(ctx) { ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, 'abc'); },
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Invalid color', '"_myVariable" is not a valid color') }
            ]
        },
        {
            code: '{color;_myVariable}',
            expected: '204080',
            setup(ctx) {
                ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'myVariable' }, [32, 64, 128]);
            }
        },
        ...generateTestCases('FFFFFF', '', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('FFFFFF', 'hex', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('97', 'ansi16', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('231', 'ansi256', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('65535,65535,65535', 'apple', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('0,0,0,0', 'cmyk', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('100', 'gray', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('0,0,100', 'hcg', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('0,0,100', 'hsl', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('0,0,100', 'hsv', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('0,100,0', 'hwb', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('white', 'keyword', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('100,0.01,-0.01', 'lab', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,315]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('100,0.01,296.81', 'lch', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65534.71]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[60,0,100]', hsl: '[60,100,100]', hsv: '[60,0,100]', hwb: '[60,100,0]', keyword: 'white', lab: '[100,0,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('255,255,255', '', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('255,255,255', 'rgb', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65535]', cmyk: '[0,0,0,0]', gray: '100', hcg: '[0,0,100]', hsl: '[0,0,100]', hsv: '[0,0,100]', hwb: '[0,100,0]', keyword: 'white', lab: '[100,0.01,-0.01]', lch: '[100,0.01,296.81]', rgb: '[255,255,255]', xyz: '[95.047,100,108.83]' }),
        ...generateTestCases('95.047,100,108.83', 'xyz', { hex: 'FFFFFF', ansi16: '[97]', ansi256: '[231]', apple: '[65535,65535,65514.09]', cmyk: '[0,0,0.03,0]', gray: '100', hcg: '[60,0.03,100]', hsl: '[60,100,99.98]', hsv: '[60,0.03,100]', hwb: '[60,99.97,0]', keyword: 'white', lab: '[100,0,0.03]', lch: '[100,0.03,90]', rgb: '[255,255,254.92]', xyz: '[95.047,100,108.83]' }),
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
