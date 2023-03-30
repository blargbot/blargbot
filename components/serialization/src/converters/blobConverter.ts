import { makeJsonConverter } from '../makeJsonConverter.js';
import { success } from '../result.js';
import { bufferConverter } from './bufferConverter.js';
import { createJsonObjectConverter } from './createJsonObjectConverter.js';
import { stringConverter } from './stringConverter.js';

const baseConverter = createJsonObjectConverter({
    type: stringConverter.optional,
    data: bufferConverter
});

export const blobConverter = makeJsonConverter<Blob>({
    async fromJson(value) {
        const result = await baseConverter.fromJson(value);
        if (!result.success)
            return result;

        return success(new Blob([result.value.data], { type: result.value.type }));
    },
    test(value): value is Blob {
        return value instanceof Blob;
    },
    async toJson(value) {
        return await baseConverter.toJson({
            type: value.type,
            data: Buffer.from(await value.arrayBuffer())
        });
    }
});
