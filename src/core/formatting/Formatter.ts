import { IFormatString, IFormatter } from '@blargbot/domain/messages/types';

import { IFormatStringCompiler } from './FormatStringCompiler';

export interface IFormatterMiddleware {
    handle(formatter: IFormatter, next: (string: IFormatString) => string, string: IFormatString): string;
}

export class Formatter implements IFormatter {
    readonly #compiler: IFormatStringCompiler;
    readonly #format: (string: IFormatString) => string;

    public readonly locale: Intl.Locale;

    public constructor(locale: Intl.Locale, middleware: Iterable<IFormatterMiddleware>, compiler: IFormatStringCompiler) {
        this.locale = locale;
        this.#compiler = compiler;
        this.#format = [...middleware]
            .reduceRight(
                (p, c) => c.handle.bind(c, this, p),
                this.#formatCore.bind(this));
    }

    public format(string: IFormatString): string {
        return this.#format(string);
    }

    #formatCore(string: IFormatString): string {
        const formatter = this.#compiler.compile(string.template);
        const valueStack: unknown[] = [string.value];
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
