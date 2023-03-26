export function jsonToBlob<T>(value: T, serializer: { write(value: T): string; } = jsonSerializer): Blob {
    try {
        return new Blob([serializer.write(value)], { type: 'application/json' });
    } catch {
        throw new Error('Failed to convert value to a JSON blob');
    }
}

export async function blobToJson<T>(value: Blob, serializer: { read(value: string): T; } = jsonSerializer): Promise<T> {
    if (value.type !== 'application/json')
        throw new Error(`Expected blob to be of type 'application/json' but found '${value.type}'`);
    try {
        const text = await value.text();
        return serializer.read(text);
    } catch {
        throw new Error('Blob content was declared to be of type \'application/json\' but is not valid json');
    }
}

const jsonSerializer = {
    write<T>(value: T): string {
        return JSON.stringify(value);
    },
    read<T>(value: string): T {
        return JSON.parse(value) as T;
    }
};
