import type { IJsonConverterImpl } from './IJsonConverterImpl.js';

export type IJsonConverterType<T extends IJsonConverterImpl<unknown>> = T extends IJsonConverterImpl<infer R> ? R : never;
