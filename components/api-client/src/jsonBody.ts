export async function jsonBody<T>(body: T, serializer: { write(value: T): Awaitable<string>; } = defaultSerializer): Promise<Blob> {
    return new Blob([await serializer.write(body)], { type: 'application/json' });
}

const defaultSerializer = {
    write<T>(value: T): string {
        return JSON.stringify(value);
    }
};
