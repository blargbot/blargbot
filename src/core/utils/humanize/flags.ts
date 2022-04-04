import { FlagDefinition } from '@blargbot/domain/models';

export function flags(flags: readonly FlagDefinition[]): string[] {
    return flags.map(flag => `\`-${flag.flag}\`/\`--${flag.word}\`: ${flag.description}`);
}
