import { FlagDefinition } from '../../types';

export function flags(flags: readonly FlagDefinition[]): string[] {
    return flags.map(flag => `\`-${flag.flag}\`/\`--${flag.word}\`: ${flag.desc}`);
}
