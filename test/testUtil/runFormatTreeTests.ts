import { DefaultFormatter, FormatStringCompiler, transformers } from '@blargbot/core/formatting';
import { FormatString } from '@blargbot/domain/messages/FormatString';
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
            const c = cases[key] as Array<{ name: string; input: unknown[]; expected: string | (() => string) | ((value: string) => void); }>;
            const name = path.join('.');
            describe(name, () => {
                for (const scenario of c) {
                    it(`should handle the "${scenario.name}" case`, () => {
                        name;
                        //arrange
                        const compiler = new FormatStringCompiler({ transformers });
                        const formatter = new DefaultFormatter(new Intl.Locale('en-GB'), compiler);
                        const formattable = factory(...scenario.input);
                        const check = typeof scenario.expected === 'string' ? () => scenario.expected : scenario.expected;

                        // act
                        const result = formattable[format](formatter);

                        // assert
                        const expected = check(result) as string | void;
                        if (typeof expected === 'string') {
                            expect(result).to.eq(expected);
                            if (formattable instanceof FormatString)
                                expect(formattable.template).not.to.eq(expected);
                        }
                    });
                }
            });
        } else if (isFormattable(v)) {
            const c = cases[key] as string | (() => string) | ((value: string) => void);
            describe(path.join('.'), () => {
                it('should display correctly', () => {
                    //arrange
                    const compiler = new FormatStringCompiler({ transformers });
                    const formatter = new DefaultFormatter(new Intl.Locale('en-GB'), compiler);
                    const check = typeof c === 'string' ? () => c : c;

                    // act
                    const result = v[format](formatter) as string;

                    // assert
                    const expected = check(result) as string | void;
                    if (typeof expected === 'string')
                        expect(result).to.eq(expected);

                });
            });
        } else if (typeof v === 'object' && v !== null) {
            runFormatTreeTestsCore(path, v, cases[key] as TestCasesHelper<T[keyof T]>);
        }
    }
}

type TestCasesHelper<T> = {
    [P in keyof T]:
    T[P] extends IFormattable<string> ? string | (() => string) | ((value: string) => void)
    : T[P] extends (...args: infer R) => unknown ? Array<{ name: string; input: R; expected: string | (() => string) | ((value: string) => void); }>
    : TestCasesHelper<T[P]>
}
