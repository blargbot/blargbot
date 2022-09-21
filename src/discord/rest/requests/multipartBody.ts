import { randomUUID } from 'crypto';

import { Body } from './Endpoint';

const singleNewline = Buffer.from('\n');
const doubleNewline = Buffer.from('\n\n');

export function multipartBody(values: Iterable<{ name: string; filename?: string; body: Body; }>): Body {
    const boundary = `-------------${randomUUID()}`;
    return {
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        async write(stream) {
            for (const value of values) {
                stream.write(Buffer.from(`--${boundary}\nContent-Disposition: form-data; name=${JSON.stringify(value.name)}`));
                if (value.filename !== undefined)
                    stream.write(Buffer.from(`; filename=${JSON.stringify(value.filename)}`));
                stream.write(singleNewline);
                if (value.body.headers !== undefined) {
                    for (const [name, header] of Object.entries(value.body.headers))
                        if (header !== undefined)
                            stream.write(Buffer.from(`${name}: ${String(header)}`));
                    stream.write(doubleNewline);
                }

                await value.body.write(stream);
                stream.write(doubleNewline);
            }
            stream.write(Buffer.from(`\n--${boundary}--`));
        }
    };
}
