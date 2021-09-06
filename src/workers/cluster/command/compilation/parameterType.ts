import { CommandVariableType, CommandVariableTypeBase, CommandVariableTypeName, CommandVariableTypes } from '@cluster/types';
import { humanize, parse } from '@cluster/utils';

export function parseParameterType(type: string): CommandVariableTypes {
    const [typeName, details] = getTypeName(type);
    const factory = parameterTypes[typeName];
    return typeof factory === 'function' ? factory(details) : factory;
}

function getTypeName(type: string): [CommandVariableTypeName, string] {
    const typeName = typeOrder.find(t => type.startsWith(t));
    if (typeName === undefined)
        throw new Error(`${type} is not a valid argument type`);

    type = type.slice(typeName.length);
    if (type !== '' && (!type.startsWith('(') || !type.endsWith(')')))
        throw new Error(`${typeName}${type} is not a valid argument type`);

    return [typeName, type.slice(1, -1)];
}

const typeOrder = [
    'literal',
    'role',
    'channel',
    'user',
    'sender',
    'member',
    'duration',
    'bigint',
    'integer',
    'number',
    'boolean',
    'string'
] as const;

const typeOrderMap = typeOrder
    .map((v, i, arr) => ({ v, i: arr.length - i }))
    .reduce<Partial<Record<typeof typeOrder[number], number>>>((p, c) => {
        p[c.v] = c.i;
        return p;
    }, {}) as Record<typeof typeOrder[number], number>;

const typeStrings: { [key in CommandVariableTypeName]: { single: string | undefined; plural: string | undefined; } } = {
    string: { single: undefined, plural: undefined },
    get literal(): never { throw new Error('AAAAAA'); },
    boolean: { single: 'true/false', plural: 'true/false' },
    channel: { single: 'a channel id, mention or name', plural: 'channel ids, mentions or names' },
    duration: { single: 'a duration', plural: 'durations' },
    bigint: { single: 'a whole number', plural: 'whole numbers' },
    integer: { single: 'a whole number', plural: 'whole numbers' },
    member: { single: 'a user id, mention or name', plural: 'user ids, mentions or names' },
    number: { single: 'a number', plural: 'numbers' },
    role: { single: 'a role id, mention or name', plural: 'role ids, mentions or names' },
    sender: { single: 'a user id, mention or name, or a webhook id', plural: 'user ids, mentions or names, or webhook ids' },
    user: { single: 'a user id, mention or name', plural: 'user ids, mentions or names' }
};

function buildParameter<T extends CommandVariableTypeName>(type: T, parse: CommandVariableTypeBase<T>['parse']): CommandVariableTypeBase<T> {
    return {
        name: type,
        priority: typeOrderMap[type],
        descriptionPlural: typeStrings[type].plural,
        descriptionSingular: typeStrings[type].single,
        parse: parse
    };
}

type ParameterTypeFactories = {
    [P in CommandVariableTypeName]: CommandVariableType<P> | ((details: string) => CommandVariableType<P>);
}

const parameterTypes: ParameterTypeFactories = {
    literal(options) {
        const choices = options.split('|').map(c => c.trim());
        if (choices.length === 0)
            throw new Error('Literal variable parameters must have at least 1 option');

        const lookup = new Map(choices.map(c => [c.toLowerCase(), c]));
        const errorOptions = humanize.smartJoin(choices.map(c => `\`${c}\``), ', ', ' or ');

        return {
            name: 'literal',
            priority: typeOrderMap.literal,
            descriptionPlural: humanize.smartJoin(choices.map(c => `\`${c}\``), ', ', ' or '),
            descriptionSingular: humanize.smartJoin(choices.map(c => `\`${c}\``), ', ', ' or '),
            choices,
            parse(value) {
                const match = lookup.get(value.toLowerCase());
                return match !== undefined
                    ? { success: true, value: match }
                    : { success: false, error: `\`${value}\` must be ${errorOptions}` };
            }
        };
    },
    string: buildParameter('string', value => ({ success: true, value })),
    bigint: buildParameter('bigint', (value, state) => {
        const result = parse.bigint(value);
        if (result === undefined)
            return { success: false, error: state.command.error(`\`${value}\` is not an integer`) };
        return { success: true, value: result };
    }),
    integer: buildParameter('integer', (value, state) => {
        const result = parse.int(value);
        if (isNaN(result))
            return { success: false, error: state.command.error(`\`${value}\` is not an integer`) };
        return { success: true, value: result };
    }),
    number: buildParameter('number', (value, state) => {
        const result = parse.float(value);
        if (isNaN(result))
            return { success: false, error: state.command.error(`\`${value}\` is not a number`) };
        return { success: true, value: result };
    }),
    boolean: buildParameter('boolean', (value, state) => {
        const result = parse.boolean(value);
        if (result === undefined)
            return { success: false, error: state.command.error(`\`${value}\` is not a boolean`) };
        return { success: true, value: result };
    }),
    duration: buildParameter('duration', (value, state) => {
        const result = parse.duration(value);
        if (result === undefined)
            return { success: false, error: state.command.error(`\`${value}\` is not a valid duration`) };
        return { success: true, value: result };
    }),
    channel: buildParameter('channel', (value, state) => {
        return state.lookupCache.findChannel(value);
    }),
    user: buildParameter('user', (value, state) => {
        return state.lookupCache.findUser(value);
    }),
    sender: buildParameter('sender', (value, state) => {
        return state.lookupCache.findSender(value);
    }),
    member: buildParameter('member', (value, state) => {
        return state.lookupCache.findMember(value);
    }),
    role: buildParameter('role', (value, state) => {
        return state.lookupCache.findRole(value);
    })
};
