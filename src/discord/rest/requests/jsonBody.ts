import { Body } from './Endpoint';

export function jsonBody(value: unknown): Body {
    return {
        headers: {
            'Content-Type': 'application/json'
        },
        write(stream) {
            const json = JSON.stringify(value);
            stream.write(Buffer.from(json));
        }
    };
}
