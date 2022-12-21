import { createHash, getHashes } from 'node:crypto';

import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class HashSubtag extends Subtag {
    public static get methods(): readonly string[] {
        return getHashes().filter(h => allowedHashes.has(h));
    }

    public constructor() {
        super({
            name: 'hash',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.basic.description,
                    exampleCode: tag.basic.exampleCode,
                    exampleOut: tag.basic.exampleOut,
                    returns: 'number',
                    execute: (_, [text]) => this.computeHash(text.value)
                },
                {
                    parameters: ['algorithm', 'text'],
                    description: tag.secure.description({ methods: HashSubtag.methods }),
                    exampleCode: tag.secure.exampleCode,
                    exampleOut: tag.secure.exampleOut,
                    returns: 'string',
                    execute: (_, [algorithm, text]) => this.computeStrongHash(algorithm.value, text.value)
                }
            ]
        });
    }

    public computeHash(text: string): number {
        return text.split('')
            .reduce(function (a, b) {
                a = (a << 5) - a + b.charCodeAt(0);
                return a & a;
            }, 0);
    }

    public computeStrongHash(algorithm: string, text: string): string {
        if (!HashSubtag.methods.includes(algorithm.toLowerCase()))
            throw new BBTagRuntimeError('Unsupported hash', `${algorithm} is not a supported hash algorithm`);

        const data = text.startsWith('buffer:') ? Buffer.from(text.slice(7), 'base64')
            : text.startsWith('text:') ? Buffer.from(text.slice(5))
                : Buffer.from(text);

        const hash = createHash(algorithm.toLowerCase());
        return hash.update(data).digest('hex');
    }
}

const allowedHashes = new Set([
    'md5',
    'sha1',
    'sha256',
    'sha512',
    'whirlpool'
]);
