import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { SubtagType } from '@blargbot/cluster/utils';
import { createHash, getHashes } from 'crypto';

const allowedHashes = new Set([
    'md5',
    'sha1',
    'sha256',
    'sha512',
    'whirlpool'
]);

export const supportedHashes = getHashes().filter(h => allowedHashes.has(h));

export class HashSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'hash',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description:
                        'Returns the numeric hash of `text`, based on the unicode value of each individual character. ' +
                        'This results in seemingly randomly generated numbers that are constant for each specific query.\n' +
                        'NOTE: This hash isnt a particularly robust one, it is a quick implementation that was thrown together. ' +
                        'To use a proper hash function, specify the `algorithm`',
                    exampleCode: 'The hash of brown is {hash;brown}.',
                    exampleOut: 'The hash of brown is 94011702.',
                    returns: 'number',
                    execute: (_, [text]) => this.computeHash(text.value)
                },
                {
                    parameters: ['algorithm', 'text'],
                    description:
                        'Perfoms a hash on the given `text`. If the `text` starts with `buffer:` then it will first be decoded as a base64 string. ' +
                        'If it starts with `text:` then it will be treated as plaintext. ' +
                        'The hash result will be returned as a hex number.\n' +
                        `Supported \`algorithm\`s are: ${supportedHashes.map(a => `\`${a}\``).join(', ')}`,
                    exampleCode: '{hash;sha256;',
                    exampleOut: 'The hash of brown is 94011702.',
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
        if (!supportedHashes.includes(algorithm.toLowerCase()))
            throw new BBTagRuntimeError('Unsupported hash', `${algorithm} is not a supported hash algorithm`);

        const data = text.startsWith('buffer:') ? Buffer.from(text.slice(7), 'base64')
            : text.startsWith('text:') ? Buffer.from(text.slice(5))
                : Buffer.from(text);

        const hash = createHash(algorithm.toLowerCase());
        return hash.update(data).digest('hex');
    }
}
