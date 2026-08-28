import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { FormatStringCompilerOptions, IFormattable } from '@blargbot/formatting';
import { format, FormatString, FormatStringCompiler, Formatter, util } from '@blargbot/formatting';

export async function runFormatTreeTests<T extends object>(source: T, options: FormatStringCompilerOptions, cases: TestCasesHelper<T>): Promise<void> {
    await runFormatTreeTestsCore([], source, options, cases);
}

async function runFormatTreeTestsCore<T extends object>(prefix: string[], source: T, options: FormatStringCompilerOptions, cases: TestCasesHelper<T>): Promise<void> {
    for (const [key, v] of Object.entries(source) as Array<[string & keyof T, T[string & keyof T]]>) {
        const path = [...prefix, key];
        if (typeof v === 'function') {
            const factory = v as (...args: unknown[]) => IFormattable<string>;
            const c = cases[key] as Array<{ name: string; input: unknown[]; expected: string | (() => string) | ((value: string) => void); }>;
            const name = path.join('.');
            await describe(name, async () => {
                for (const scenario of c) {
                    await it(`should handle the "${scenario.name}" case`, () => {
                        name;
                        //arrange
                        const compiler = new FormatStringCompiler(options);
                        const formatter = new Formatter(new Intl.Locale('en'), [], compiler);
                        const formattable = factory(...scenario.input);
                        const check = typeof scenario.expected === 'string' ? () => scenario.expected : scenario.expected;

                        // act
                        const result = formattable[format](formatter);

                        // assert
                        const expected = check(result) as string | void;
                        if (typeof expected === 'string') {
                            assert.equal(result, expected);
                            if (formattable instanceof FormatString)
                                assert.notEqual(formattable.template, expected);
                        }
                    });
                }
            });
        } else if (util.isFormattable(v)) {
            const c = cases[key] as string | (() => string) | ((value: string) => void);
            await describe(path.join('.'), async () => {
                await it('should display correctly', () => {
                    //arrange
                    const compiler = new FormatStringCompiler(options);
                    const formatter = new Formatter(new Intl.Locale('en'), [], compiler);
                    const check = typeof c === 'string' ? () => c : c;

                    // act
                    const result = v[format](formatter) as string;

                    // assert
                    const expected = check(result) as string | void;
                    if (typeof expected === 'string')
                        assert.equal(result, expected);

                });
            });
        } else if (typeof v === 'object' && v !== null) {
            await runFormatTreeTestsCore(path, v, options, cases[key] as TestCasesHelper<T[keyof T]>);
        }
    }
}

type TestCasesHelper<T> = {
    [P in keyof T]:
    T[P] extends IFormattable<string> ? string | (() => string) | ((value: string) => void)
    : T[P] extends (...args: infer R) => unknown ? Array<{ name: string; input: R; expected: string | (() => string) | ((value: string) => void); }>
    : TestCasesHelper<T[P]>
}
