import type { JsonConverterResult } from './JsonConverterResult.js';

export interface IJsonConverterImpl<T> {
    fromJson(value: JToken | undefined): JsonConverterResult<T>;
    test(value: unknown): value is T;
    toJson(value: T): JToken | undefined;
}
