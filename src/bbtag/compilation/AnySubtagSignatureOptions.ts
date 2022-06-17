import { SubtagReturnTypeMap } from '../types';
import { SubtagSignatureCallableOptions } from './SubtagSignatureCallableOptions';
import { SubtagSignatureOptions } from './SubtagSignatureOptions';

export type AnySubtagSignatureCallableOptions = { [P in keyof SubtagReturnTypeMap]: SubtagSignatureCallableOptions<P> }[keyof SubtagReturnTypeMap];
type NoIntersectOrFullIntersect<A, B> =
    | (A & { [P in Exclude<keyof B, keyof A>]?: never })
    | (B & { [P in Exclude<keyof A, keyof B>]?: never })
    | (A & B)

export type AnySubtagSignatureOptions = NoIntersectOrFullIntersect<SubtagSignatureOptions, AnySubtagSignatureCallableOptions>;
