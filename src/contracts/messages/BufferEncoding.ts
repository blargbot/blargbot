import z from 'zod';

type BufferEncoding = z.infer<typeof BufferEncoding>;
// eslint-disable-next-line @typescript-eslint/naming-convention
const BufferEncoding = z.enum(Object.keys({
    ascii: 'ascii',
    utf8: 'utf8',
    'utf-8': 'utf-8',
    utf16le: 'utf16le',
    'utf-16le': 'utf-16le',
    ucs2: 'ucs2',
    'ucs-2': 'ucs-2',
    base64: 'base64',
    base64url: 'base64url',
    latin1: 'latin1',
    binary: 'binary',
    hex: 'hex'
} satisfies { [P in NodeJS.BufferEncoding]: P }));

export { BufferEncoding };
