export function jsonBody(body: unknown): Blob {
    return new Blob([JSON.stringify(body)], { type: 'application/json' });
}
