import { snowflake } from '@blargbot/core/utils';
import limax from 'limax';
import { nfkd } from 'unorm';

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
        replacement: snowflake.create().toString()
    };
    return nfkd(text)
        .replace(/[^ ]+/g, text => limax(text, opt))
        .replaceAll(opt.replacement, '');
}
