import { SubtagReturnTypeMap } from '../types.js';
import { SubtagSignatureCallableOptions } from './SubtagSignatureCallableOptions.js';
import { SubtagSignatureOptions } from './SubtagSignatureOptions.js';

export type AnySubtagSignatureCallableOptions = { [P in keyof SubtagReturnTypeMap]: SubtagSignatureCallableOptions<P> }[keyof SubtagReturnTypeMap];
type NoIntersectOrFullIntersect<A, B> =
    | (A & { [P in Exclude<keyof B, keyof A>]?: never })
    | (B & { [P in Exclude<keyof A, keyof B>]?: never })
    | (A & B)

export type AnySubtagSignatureOptions = NoIntersectOrFullIntersect<SubtagSignatureOptions, AnySubtagSignatureCallableOptions>;
