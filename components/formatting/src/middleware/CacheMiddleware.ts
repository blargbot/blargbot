import { ICompiledFormatString, IFormatStringCompiler, IFormatStringCompilerMiddleware } from '../compiler';

export class CacheMiddleware implements IFormatStringCompilerMiddleware {
    readonly #cache: { [P in string]?: ICompiledFormatString; };

    public constructor() {
        this.#cache = {};
    }

    public handle(_compiler: IFormatStringCompiler, next: (template: string) => ICompiledFormatString, template: string): ICompiledFormatString {
        return this.#cache[template] ??= next(template);
    }
}
