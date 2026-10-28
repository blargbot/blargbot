export function isUrl(value: string): value is `http${'s' | ''}://${string}` {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export function cleanUrl(value: string): string {
    if (value.startsWith('<') && value.endsWith('>'))
        return value.slice(1, -1);
    return value;
}

export function readDataUrl(dataUri: string): { contentType: string | undefined; bytes: Uint8Array<ArrayBuffer>; } | undefined {
    const match = dataUri.match(/^data:([^,]*?),(.*)$/s);

    if (match === null)
        return undefined;

    const [, metadata, data] = match;

    const parts = metadata.split(';');
    const contentType = parts[0] === '' ? undefined : parts[0];
    const isBase64 = parts.includes('base64');

    if (isBase64) {
        const buffer = Buffer.from(data, 'base64');
        return { contentType, bytes: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) };
    }

    const decoded = decodeURIComponent(data);
    return { contentType, bytes: new TextEncoder().encode(decoded) };
}
