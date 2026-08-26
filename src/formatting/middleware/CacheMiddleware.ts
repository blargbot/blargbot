import type { ICompiledFormatString, IFormatStringCompiler, IFormatStringCompilerMiddleware } from '../compiler/index.js';

export class CacheMiddleware implements IFormatStringCompilerMiddleware {
    readonly #cache: { [P in string]?: ICompiledFormatString; };

    public constructor() {
        this.#cache = {};
    }

    public handle(_compiler: IFormatStringCompiler, next: (template: string) => ICompiledFormatString, template: string): ICompiledFormatString {
        return this.#cache[template] ??= next(template);
    }
}
