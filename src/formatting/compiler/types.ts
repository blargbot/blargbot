import type { ReplacementContext } from './ReplacementContext.js';

export interface IValueResolver {
    (context: ReplacementContext): unknown;
}

export interface IFormatStringCompiler {
    compile(template: string): ICompiledFormatString;
}

export interface ICompiledFormatString {
    readonly template: string;
    (context: ReplacementContext): string;
}

export interface IValueResolverTransform {
    transform(compiler: IFormatStringCompiler, resolver: IValueResolver, ...args: string[]): IValueResolver;
}

export interface IFormatStringCompilerMiddleware {
    handle(compiler: IFormatStringCompiler, next: (template: string) => ICompiledFormatString, template: string): ICompiledFormatString;
}
