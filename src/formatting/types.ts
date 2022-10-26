export const format: unique symbol = Symbol('format');

export interface IFormattable<T> {
    [format](formatter: IFormatter): T;
}

export interface IFormatStringDefinition<T extends string, V = never> {
    readonly id: string;
    readonly template: T;
    (value: V): IFormatString<T>;
}

export interface IFormatString<T extends string = string> extends IFormattable<string> {
    readonly id: string;
    readonly template: T;
    readonly value: unknown;
}

export interface IFormatter {
    readonly locale: Intl.Locale;
    format(string: IFormatString): string;
}

export interface ITranslationSource {
    getTranslation(id: string, locale: Intl.Locale): string | undefined;
}
