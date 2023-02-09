import type { IJsonConverterImpl } from './IJsonConverterImpl.js';
import type { ISerializer } from './ISerializer.js';

export interface IJsonConverter<T> extends IJsonConverterImpl<T>, ISerializer<T> {
    readonly optional: IJsonConverter<T | undefined>;
    readonly nullable: IJsonConverter<T | null>;
    readonly nullish: IJsonConverter<T | undefined | null>;

}
