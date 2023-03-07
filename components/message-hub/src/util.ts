export function jsonToBlob(value: unknown): Blob {
    try {
        return new Blob([JSON.stringify(value)], { type: 'application/json' });
    } catch {
        throw new Error('Failed to convert value to a JSON blob');
    }
}

export async function blobToJson<T>(value: Blob, serializer?: { read(value: string): T; }): Promise<T> {
    if (value.type !== 'application/json')
        throw new Error(`Expected blob to be of type 'application/json' but found '${value.type}'`);
    try {
        const text = await value.text();
        return serializer === undefined ? JSON.parse(text) as T : serializer.read(text);
    } catch {
        throw new Error('Blob content was declared to be of type \'application/json\' but is not valid json');
    }
}
