import type { ReplacementValue } from './compiler/ReplacementContext.js';

export const format: unique symbol = Symbol('format');

export interface IFormattable<T> {
    [format](formatter: IFormatter): T;
}

export interface IFormatStringDefinition<T extends ReplacementValue = never> {
    readonly id: string;
    readonly template: string;
    (value: T): IFormatString;
}

export interface IFormatString extends IFormattable<string> {
    readonly id: string;
    readonly template: string;
    readonly value: ReplacementValue;
}

export interface IFormatter {
    readonly locale: Intl.Locale;
    format(string: IFormatString): string;
}
