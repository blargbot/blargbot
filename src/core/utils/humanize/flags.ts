import { FlagDefinition } from '@blargbot/domain/models';

export function flags(flags: ReadonlyArray<FlagDefinition<string>>): string[] {
    return flags.map(flag => `\`-${flag.flag}\`/\`--${flag.word}\`: ${flag.description}`);
}
