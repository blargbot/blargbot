export function jsonBody<T>(body: T, serializer: { write(value: T): string; } = defaultSerializer): Blob {
    return new Blob([serializer.write(body)], { type: 'application/json' });
}

const defaultSerializer = {
    write<T>(value: T): string {
        return JSON.stringify(value);
    }
};
