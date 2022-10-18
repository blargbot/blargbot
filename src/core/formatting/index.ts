import { TranslatableString } from '@blargbot/domain/messages/TranslatableString';
import Eris from 'eris';
import moment, { Duration } from 'moment-timezone';

import { templates } from '../../cluster/text';
import { Emote } from '../Emote';
import { humanize, randChoose } from '../utils/index';
import { DefaultFormatter } from './DefaultFormatter';
import { CachingFormatStringCompiler } from './FormatStringCompiler';
import { ReplacementContext } from './ReplacementContext';

export * from './DefaultFormatter';
export * from './FormatStringCompiler';

const compiler = new CachingFormatStringCompiler({
    rand(...choices) {
        return () => randChoose(choices);
    },
    map(...args) {
        switch (args.length) {
            case 0: throw new Error(`Map requires a template`);
            case 1: args = [args.join(`|`)];
        }
        const formatter = this.compile(args[0]);
        return (ctx, value) => {
            if (value === undefined)
                return undefined;
            return toArray(value).map(v => ctx.withValue(v, formatter));
        };
    },
    join(...separators) {
        if (separators.length === 0)
            throw new Error(`At least 1 separator must be given`);
        return (_, value) => {
            if (value === undefined)
                return undefined;
            const res = toArray(value).flatMap((v, i, a) => [separators[Math.max(0, separators.length - (a.length - i))], v]);
            res.shift();
            return res.join(``);
        };
    },
    split(...separators) {
        if (separators.length === 0)
            throw new Error(`A separator must be provided`);
        const separator = separators.join(`|`);
        return (_, value) => {
            if (value === undefined)
                return undefined;

            if (typeof value !== `string`)
                throw new Error(`Split can only apply to strings`);
            return value.split(separator);
        };
    },
    upper(...args) {
        if (args.length !== 0)
            throw new Error(`Upper needs no arguments`);
        return (ctx, value) => {
            if (value === undefined)
                return undefined;

            if (typeof value !== `string`)
                throw new Error(`Split can only apply to strings`);
            return value.toLocaleUpperCase(ctx.formatter.locale.toString());
        };
    },
    lower(...args) {
        if (args.length !== 0)
            throw new Error(`Upper needs no arguments`);
        return (ctx, value) => {
            if (value === undefined)
                return undefined;

            if (typeof value !== `string`)
                throw new Error(`Split can only apply to strings`);
            return value.toLocaleLowerCase(ctx.formatter.locale.toString());
        };
    },
    bool(...results) {
        switch (results.length) {
            case 0: throw new Error(`Bool requires a template`);
            case 1:
            case 2: break;
            default: throw new Error(`Bool cannot accept more than 2 templates`);
        }
        const truthy = this.compile(results[0]);
        const falsy = results.length === 1 ? () => undefined : this.compile(results[1]);
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        return (ctx, value) => ctx.withValue(value, value ? truthy : falsy);
    },
    color() {
        return (_, value) => {
            if (value === undefined)
                return undefined;
            if (typeof value !== `number`)
                throw new Error(`Value must be a number`);
            return value.toString(16).padStart(6, `0`);
        };
    },
    percent(...args) {
        let precision = 2;
        switch (args.length) {
            case 0: break;
            case 1:
                precision = parseInt(args[0]);
                break;
            default: throw new Error(`Percent accepts up to 1 value`);
        }
        if (isNaN(precision))
            throw new Error(`Precision must be a number`);

        const mult = Math.pow(10, precision + 2);
        const div = Math.pow(10, precision);

        return (_, value) => {
            if (value === undefined)
                return undefined;
            if (typeof value !== `number`)
                throw new Error(`Value must be a number`);
            return `${Math.round(value * mult) / div}%`;
        };
    },
    plural(...cases) {
        const otherStr = cases.pop();
        if (otherStr === undefined)
            throw new Error(`Must provide the other case as the last case`);
        const other = this.compile(otherStr);
        const lookup: { [P in string]?: (context: ReplacementContext) => string } = {};
        for (const c of cases) {
            const match = c.match(/^(\d+|<|>):(.*)$/);
            if (match === null)
                throw new Error(`Plural arg must start with a number, < or > and a :`);
            if (match[1] in lookup)
                throw new Error(`Duplicate arg found for ${match[1]}`);
            lookup[match[1]] = this.compile(match[2]);
        }

        return (ctx, value) => {
            if (value === undefined)
                return undefined;
            return ctx.withValue(value, () => {
                const count = typeof value === `number` ? value : toArray(value).length;
                switch (new Intl.PluralRules(ctx.formatter.locale.toString()).select(count)) {
                    case `zero`: return lookup[count] ?? lookup[0] ?? other;
                    case `one`: return lookup[count] ?? lookup[1] ?? other;
                    case `two`: return lookup[count] ?? lookup[2] ?? other;
                    case `few`: return lookup[count] ?? lookup[`<`] ?? other;
                    case `many`: return lookup[count] ?? lookup[`>`] ?? other;
                    case `other`: return lookup[count] ?? other;
                }
            });
        };
    },
    tag(...args) {
        let format: string | undefined;
        switch (args.length) {
            case 0: break;
            case 1:
                format = args[0];
                break;
            default: throw new Error(`Tag accepts up to 1 value`);
        }

        return (_, value) => {
            if (value === undefined)
                return undefined;
            if (typeof value !== `object` || value === null)
                throw new Error(`Value must be an object`);
            if (value instanceof Eris.Base && (value instanceof Eris.User || value instanceof Eris.Role || value instanceof Eris.Channel))
                return value.mention;
            if (value instanceof Emote)
                return value.toString();
            if (value instanceof Date)
                return `<t:${moment(value).unix()}:${format ?? `f`}>`;
            if (moment.isMoment(value))
                return `<t:${value.unix()}:${format ?? `f`}>`;
            if (moment.isDuration(value))
                return `<t:${moment().add(value).unix()}:R>`;
            if (`username` in value && `discriminator` in value)
                return `${String((value as { username: unknown; }).username)}#${String((value as { discriminator: unknown; }).discriminator)}`;
            throw new Error(`Unrecognised item, failed to get the tag for it`);
        };
    },
    duration(...args) {
        let format = (duration: Duration): string => duration.humanize();
        switch (args.length) {
            case 0: break;
            default: throw new Error(`Duration can only accept 1 arg`);
            case 1: switch (args[0]) {
                case `H`: break;
                case `S`:
                    format = d => d.asSeconds().toString();
                    break;
                case `MS`:
                    format = d => d.asMilliseconds().toString();
                    break;
                case `F`:
                    format = d => humanize.duration(d);
                    break;
                default: throw new Error(`Unrecognised duration format`);
            }
        }

        return (ctx, value) => {
            if (value === undefined)
                return undefined;

            const asDuration = moment.isDuration(value) ? value : typeof value === `number` ? moment.duration(value) : undefined;
            if (asDuration === undefined || !asDuration.isValid())
                throw new Error(`Invalid duration`);

            asDuration.locale(ctx.formatter.locale.baseName);
            return format(asDuration);
        };
    },
    overflow(...args) {
        if (args.length !== 2)
            throw new Error(`Overflow requires exactly 2 arguments: maxLength and overflowText`);
        const maxLength = parseInt(args[0]);
        const overflowText = args[1];
        if (isNaN(maxLength))
            throw new Error(`Maxlength must be a number`);
        return (_, value) => {
            if (value === undefined)
                return undefined;

            if (typeof value !== `string`)
                throw new Error(`Overflow expects value to be a string`);

            if (value.length <= maxLength)
                return value;
            return value.slice(0, maxLength - overflowText.length) + overflowText;
        };
    },
    count(...args) {
        if (args.length !== 0)
            throw new Error(`Count cannot accept args`);
        return (_, value) => {
            if (value === undefined)
                return undefined;
            return toArray(value).length;
        };
    },
    bytes(...args) {
        if (args.length !== 0)
            throw new Error(`Bytes cannot accept args`);
        return (_, value) => {
            if (value === undefined)
                return undefined;
            if (typeof value !== `number`)
                throw new Error(`Bytes must be a number!`);
            const i = value === 0 ? 0 : Math.floor(Math.log(value) / Math.log(1024));
            return `${(value / Math.pow(1024, i)).toFixed(2)} ${[`B`, `kB`, `MB`, `GB`, `TB`][i]}`;
        };
    }
});
for (const template of TranslatableString.list()) {
    try {
        compiler.compile(template.template);
    } catch (err: unknown) {
        global.console.error(err);
    }
}

const formatter = new DefaultFormatter(new Intl.Locale(`en-GB`), compiler);

function toArray(value: unknown): readonly unknown[] {
    const arr = Array.isArray(value) ? value
        : typeof value === `object` && value !== null ? [...value as Iterable<unknown>]
            : undefined;
    if (arr === undefined)
        throw new Error(`Cannot map ${String(value)}`);
    return arr;
}

const test = templates.documentation.command.command.notes.alias({
    aliases: [`a`, `b`, `c`, `d`],
    parameter: `xyz`
}).format(formatter);
global.console.log(test);
