import { FlagDefinition } from '../parse';


export function flags(flags: DeepReadOnly<FlagDefinition[]>): string[] {
    return flags.map(flag => `\`-${flag.flag}\`/\`--${flag.word}\`: ${flag.desc || 'No description.'}`
    ) ?? [];
}
