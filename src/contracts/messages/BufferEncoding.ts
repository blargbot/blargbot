import z from 'zod';

import { cleanType } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const BufferEncoding = cleanType(z.enum(Object.keys({
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
} satisfies { [P in NodeJS.BufferEncoding]: P })));
export type BufferEncoding = z.infer<typeof BufferEncoding>;
