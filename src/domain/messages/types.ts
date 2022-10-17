export type IFormatStringDefinition<T extends string, V = never> = (value: V) => IFormatString<T>;

export interface IFormattable<T> {
    format(formatter: IFormatter): T;
}

export interface IFormatString<T extends string = string> extends IFormattable<string> {
    readonly template: T;
    readonly value: unknown;
}

export interface IFormatter {
    format(format: IFormatString): string;
}

export function literal<T>(value: Exclude<T, undefined>): IFormattable<T>;
export function literal<T>(value: T | undefined): IFormattable<T> | undefined;
export function literal<T>(value: T | undefined): IFormattable<T> | undefined {
    if (value === undefined)
        return undefined;
    return {
        format() {
            return value;
        }
    };
}
