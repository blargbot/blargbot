import { ITemplatedString, IFormatter } from "./types";

export class Formatter implements IFormatter {
    static readonly #compilationCache = new Map<string, (value: unknown) => string>();
    readonly #transformers: Array<(value: ITemplatedString<string>) => ITemplatedString<string>>;

    public constructor(transformers: Array<(value: ITemplatedString<string>) => ITemplatedString<string>>) {
        this.#transformers = [...transformers];
    }

    public format(format: ITemplatedString<string>): string {
        format = this.#transformers.reduce((p, c) => c(p), format);

        const impl = this.#getCompiled(format.template);
        return impl(format.value);
    }

    #getCompiled(template: string): (value: unknown) => string {
        let result = Formatter.#compilationCache.get(template);
        if (result === undefined)
            Formatter.#compilationCache.set(template, result = this.#compile(template));
        return result;
    }

    #compile(template: string): (value: unknown) => string {
        return () => template; // TODO
    }
}
