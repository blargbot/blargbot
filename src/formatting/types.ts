export const format: unique symbol = Symbol('format');

export interface IFormattable<T> {
    [format](formatter: IFormatter): T;
}

export interface IFormatStringDefinition<T = never> {
    readonly id: string;
    readonly template: string;
    (value: T): IFormatString;
}

export interface IFormatString extends IFormattable<string> {
    readonly id: string;
    readonly template: string;
    readonly value: unknown;
}

export interface IFormatter {
    readonly locale: Intl.Locale;
    format(string: IFormatString): string;
}
