export function jsonBody<T>(body: T, serializer: (value: T) => string = JSON.stringify): Blob {
    return new Blob([serializer(body)], { type: 'application/json' });
}
