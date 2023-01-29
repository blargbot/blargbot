import { CommandType, randChoose } from '@blargbot/cluster/utils/index.js';
import { util } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';
import res from '@blargbot/res';

import type { CommandContext } from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.spell;

export class SpellCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'spell',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{name?}',
                    description: cmd.default.description,
                    execute: (ctx, [name]) => this.getSpell(ctx, name.asOptionalString)
                }
            ]
        });
    }

    public async getSpell(context: CommandContext, name: string | undefined): Promise<CommandResult> {
        const spell = name === undefined ? randChoose(Object.values(spells)) : await this.#findSpell(context, name);
        if (spell === undefined)
            return cmd.default.notFound;

        const normSchool = spell.school.toLowerCase();
        const components = spell.components
            .split(/,\s*/g)
            .map(c => ({ component: c, norm: c.toLowerCase() }))
            .map(c => componentKeys.has<string>(c.norm) ? componentMap[c.norm] : c.component)
            .join(', ');

        return {
            embeds: [
                {
                    title: util.literal(spell.name),
                    color: schoolKeys.has<string>(normSchool) ? schools[normSchool] : undefined,
                    description: cmd.default.embed.description({
                        level: util.literal(spell.level),
                        description: util.literal(spell.desc),
                        school: util.literal(spell.school)
                    }),
                    fields: [
                        {
                            name: cmd.default.embed.field.duration.name,
                            value: util.literal(spell.duration),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.range.name,
                            value: util.literal(spell.range),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.castingTime.name,
                            value: util.literal(spell.casting_time),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.components.name,
                            value: util.literal(components),
                            inline: true
                        }
                    ]
                }
            ]
        };
    }

    async #findSpell(context: CommandContext, name: string): Promise<typeof spellsJson[number] | undefined> {
        const exact = spells[name.toLowerCase()];
        if (exact !== undefined)
            return exact;

        const result = await context.queryChoice({
            context: context.message.channel,
            actors: context.author,
            prompt: cmd.default.query.prompt,
            placeholder: cmd.default.query.placeholder,
            choices: Object.values(spells)
                .filter(hasValue)
                .filter(s => s.name.toLowerCase().includes(name.toLowerCase()))
                .map(s => ({
                    label: util.literal(s.name),
                    description: cmd.default.query.choice.description({
                        level: util.literal(s.level),
                        school: util.literal(s.school)
                    }),
                    value: s
                }))
        });

        return result.state === 'SUCCESS' ? result.value : undefined;
    }
}

const spellsJson = await res.spells.load();
const spells: Record<string, typeof spellsJson[number] | undefined> = {};
for (const spell of spellsJson) {
    spells[spell.name.toLowerCase()] = {
        ...spell,
        desc: spell.desc
            .replace(/<\/?p>/gi, '\n')
            .replace(/<\/?br>/gi, '\n\n')
            .replace(/\n{3,}/, '\n\n')
            .replace(/<\/?b>/gi, '**')
            .trim()
    };
}

const componentMap = {
    v: 'Verbal',
    s: 'Somantic',
    m: 'Material',
    f: 'Focus',
    df: 'Divine Focus',
    xp: 'XP Cost'
} as const;
const componentKeys = new Set(Object.keys(componentMap));

const schools = {
    abjuration: 0x5fbae8,
    conjuration: 0x30e52d,
    divination: 0x100547,
    enchantment: 0xf79ee2,
    evocation: 0xff951c,
    illusion: 0x672cf9,
    necromancy: 0x1e0500,
    transmutation: 0xf2f259
} as const;
const schoolKeys = new Set(Object.keys(schools));
