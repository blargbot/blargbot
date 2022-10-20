import { IFormatter } from '@blargbot/domain/messages/types';

import { IFormatStringCompiler } from './FormatStringCompiler';

export class DefaultFormatter implements IFormatter {
    readonly #compiler: IFormatStringCompiler;

    public readonly locale: Intl.Locale;

    public constructor(locale: Intl.Locale, compiler: IFormatStringCompiler) {
        this.locale = locale;
        this.#compiler = compiler;
    }

    public format(template: string, value: unknown): string {
        const formatter = this.#compiler.compile(template);
        const valueStack: unknown[] = [value];
        return formatter({
            formatter: this,
            valueStack: valueStack,
            withValue(value, action) {
                valueStack.push(value);
                try {
                    return action(this);
                } finally {
                    valueStack.pop();
                }
            }
        });
    }
}
