import { DefaultFormatter, FormatStringCompiler, transformers } from '@blargbot/core/formatting';
import { format, IFormattable, isFormattable } from '@blargbot/domain/messages/types';
import { expect } from 'chai';
import { describe, it } from 'mocha';

export function runFormatTreeTests<T extends object>(source: T, cases: TestCasesHelper<T>): void {
    runFormatTreeTestsCore([], source, cases);
}

function runFormatTreeTestsCore<T extends object>(prefix: string[], source: T, cases: TestCasesHelper<T>): void {
    for (const [key, v] of Object.entries(source) as Array<[string & keyof T, T[string & keyof T]]>) {
        const path = [...prefix, key];
        if (typeof v === 'function') {
            const factory = v as (...args: unknown[]) => IFormattable<string>;
            const c = cases[key] as Array<{ name: string; input: unknown[]; expected: string | Iterable<string>; }>;
            describe(path.join('.'), () => {
                for (const scenario of c) {
                    it(`should handle the ${scenario.name} case`, () => {
                        //arrange
                        const compiler = new FormatStringCompiler({ transformers });
                        const formatter = new DefaultFormatter(new Intl.Locale('en-GB'), compiler);

                        // act
                        const result = factory(...scenario.input)[format](formatter);

                        // assert
                        expect(result).to.eq(scenario.expected);
                    });
                }
            });
        } else if (isFormattable(v)) {
            const c = cases[key] as string | Iterable<string>;
            const allowed = typeof c === 'string' ? [c] : [...c];
            describe(path.join('.'), () => {
                it('should display correctly', () => {
                    //arrange
                    const compiler = new FormatStringCompiler({ transformers });
                    const formatter = new DefaultFormatter(new Intl.Locale('en-GB'), compiler);

                    // act
                    const result = v[format](formatter);

                    // assert
                    expect(result).to.be.oneOf(allowed);
                });
            });
        } else if (typeof v === 'object' && v !== null) {
            runFormatTreeTestsCore(path, v, cases[key] as TestCasesHelper<T[keyof T]>);
        }
    }
}

type TestCasesHelper<T> = {
    [P in keyof T]:
    T[P] extends IFormattable<string> ? string | Iterable<string>
    : T[P] extends (...args: infer R) => unknown ? Array<{ name: string; input: R; expected: string | Iterable<string>; }>
    : TestCasesHelper<T[P]>
}
