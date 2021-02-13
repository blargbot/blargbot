import { SubtagArgumentKind as Kind } from '../utils';
import { SubtagArgument as Arg, SubtagArgumentType as Type } from './BaseSubtagHandler';

export const argBuilder = {
    required(value: string | Arg | Array<string | Arg>, types?: Type | Type[], multiple?: boolean): Arg {
        return argBuilder.makeArg(Kind.REQUIRED, value, types, multiple);
    },
    optional(value: string | Arg | Array<string | Arg>, types?: Type | Type[], multiple?: boolean): Arg {
        return argBuilder.makeArg(Kind.OPTIONAL, value, types, multiple);
    },
    literal(value: string | Arg | Array<string | Arg>, multiple?: boolean): Arg {
        return argBuilder.makeArg(Kind.LITERAL, value, 'string', multiple);
    },
    selection(value: string | Arg | Array<string | Arg>, multiple?: boolean): Arg {
        return argBuilder.makeArg(Kind.SELECTION, value, 'transparent', multiple);
    },
    makeArg(kind: Kind, value: string | Arg | Array<string | Arg>, types?: Type | Type[], multiple?: boolean): Arg {
        if (!Array.isArray(value))
            value = [value];
        if (!Array.isArray(types))
            types = (types == null ? ['any'] : [types]);

        if (value.length === 0)
            throw new Error('One or more values must be provided');
        if (value.length === 1 && typeof value[0] !== 'string')
            throw new Error('If only 1 argument is provided, it must be a string');
        if (kind === Kind.SELECTION && value.length === 1)
            throw new Error('Selection arguments must be an array of values');
        if (kind === Kind.LITERAL && value.length !== 1)
            throw new Error('Literal arguments must be a single value');
        if (kind === Kind.LITERAL && multiple === true)
            throw new Error('Cannot have multiple of a single literal');
        if (types.find(t => typeof t !== 'string'))
            throw new Error('types must all be strings');

        return {
            content: value,
            types: types,
            kind: kind,
            multiple: multiple === true
        };
    },
    toString(args: Array<string | Arg>, options?: Partial<ToStringOptions>): string {
        const _options: ToStringOptions = options === undefined ? defaultOptions : { ...defaultOptions, ...options };

        function process(arg: Arg | string): string {
            if (typeof arg === 'string')
                return arg;

            const content = arg.content.map(process);
            const separator = _options.separator[arg.kind] ?? _options.separator.default;
            const [open, close] = _options.brackets[arg.kind] ?? _options.brackets.default;
            const multiple = arg.multiple ? _options.multiple : '';

            if (content.length == 1 && _options.includeTypes) {
                let types: string = arg.types[0] ?? 'none';
                if (arg.types.length > 1)
                    types = `(${arg.types.join('|')})`;
                content[0] += ':' + types;
            }

            return `${open}${content.join(separator)}${multiple}${close}`;
        }

        return args.map(process).join(_options.separator.default);
    }
};

export interface ToStringOptions {
    includeTypes: boolean;
    brackets: Record<Kind, [open: string, close: string] | undefined> & { default: [open: string, close: string] };
    separator: Record<Kind, string | undefined> & { default: string }
    multiple: string;
    ifNone: string
}

const defaultOptions: ToStringOptions = {
    includeTypes: false,
    brackets: {
        default: ['', ''],
        [Kind.REQUIRED]: ['<', '>'],
        [Kind.OPTIONAL]: ['[', ']'],
        [Kind.LITERAL]: ['', ''],
        [Kind.SELECTION]: ['(', ')']
    },
    separator: {
        default: ' ',
        [Kind.REQUIRED]: ' ',
        [Kind.OPTIONAL]: ' ',
        [Kind.LITERAL]: ' ',
        [Kind.SELECTION]: ' / '
    },
    multiple: '...',
    ifNone: ''
};