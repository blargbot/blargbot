import type { CommandContext } from '@blargbot/cluster';
import { CommandType, GlobalCommand } from '@blargbot/cluster';
import z from 'zod';

import { templates } from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.define;

export class DefineCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'define',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{word}',
                    description: cmd.default.description,
                    execute: (ctx, [word]) => this.define(ctx, word.asString)
                }
            ]
        }, true);
    }

    public async define(context: CommandContext, word: string): Promise<CommandResult> {
        const response = await fetchSafe(context, `https://wordsapiv1.p.rapidapi.com/words/${word}`, {
            headers: {
                'x-rapidapi-key': context.config.general.mashape,
                'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com'
            }
        });
        const details = wordApiMapping.safeParse(response);
        if (!details.success)
            return cmd.default.unavailable;

        const defaultIPA = details.data.pronunciation.all ?? '';

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.author),
                    title: cmd.default.embed.title({ word }),
                    description: defaultIPA !== '' ? cmd.default.embed.description(pronunciation(defaultIPA)) : undefined,
                    fields: details.data.results
                        .slice(0, 15)
                        .map((r, i) => {
                            const specificIPA = details.data.pronunciation[r.partOfSpeech] ?? defaultIPA;
                            return {
                                name: cmd.default.embed.field.name({ index: i + 1, type: r.partOfSpeech }),
                                value: cmd.default.embed.field.value.default({
                                    pronunciation: specificIPA !== defaultIPA ? cmd.default.embed.field.value.pronunciation(pronunciation(defaultIPA)) : undefined,
                                    synonyms: r.synonyms !== undefined ? cmd.default.embed.field.value.synonyms({ synonyms: r.synonyms }) : undefined,
                                    definition: r.definition
                                }),
                                inline: true
                            };
                        })
                }
            ]
        };
    }
}

function pronunciation(phonetic: string): { phonetic: string; pronunciation: string; } {
    return {
        phonetic,
        pronunciation: `http://ipa-reader.xyz/?text=${encodeURIComponent(phonetic.replace(/'/g, '&apos;'))})`
    };
}

async function fetchSafe(context: CommandContext, url: string, init?: RequestInit): Promise<unknown> {
    try {
        const response = await context.util.fetch(url, init);
        return await response.json();
    } catch {
        return undefined;
    }
}

const wordApiMapping = z.object({
    word: z.string(),
    results: z.object({
        definition: z.string(),
        partOfSpeech: z.string(),
        synonyms: z.string().array().optional()
    }).array(),
    frequency: z.number(),
    pronunciation: z.record(
        z.string(),
        z.string().optional()
    )
});
