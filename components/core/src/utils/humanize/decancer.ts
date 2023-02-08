import { randomUUID } from 'node:crypto';

import limax from 'limax';
import unorm from 'unorm';

const limaxOpt = {
    tone: false,
    separateNumbers: false,
    separateApostrophes: false,
    maintainCase: true,
    custom: Array.from('., !\'"?0123456789')
} as const;

export function decancer(text: string): string {
    const opt = {
        ...limaxOpt,
        replacement: randomUUID()
    };
    return unorm.nfkd(text)
        .replace(/[^ ]+/g, text => limax(text, opt))
        .replaceAll(opt.replacement, '');
}
