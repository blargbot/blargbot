import { CommandVariableParser, CommandVariableType, CommandVariableTypeBase, CommandVariableTypeName, CommandVariableTypes } from '@blargbot/cluster/types.js';
import { parse } from '@blargbot/cluster/utils/index.js';

import { createCommandArgument } from './commandArgument.js';

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

function buildParameter<T extends Exclude<CommandVariableTypeName, 'literal'>>(type: T, parse: CommandVariableParser): CommandVariableTypeBase<T> {
    return {
        name: type,
        priority: typeOrderMap[type],
        type,
        parse: parse
    };
}

type ParameterTypeFactories = {
    [P in CommandVariableTypeName]: CommandVariableType<P> | ((details: string) => CommandVariableType<P>);
}

const parameterTypes: ParameterTypeFactories = {
    literal(options) {
        const choices = options.split('|').map(c => c.trim()).filter(c => c.length > 0);
        if (choices.length === 0)
            throw new Error('Literal variable parameters must have at least 1 option');

        const lookup = new Map(choices.map(c => [c.toLowerCase(), c]));

        return {
            name: 'literal',
            priority: typeOrderMap.literal,
            type: choices,
            choices,
            parse(value) {
                const match = lookup.get(value.toLowerCase());
                return match !== undefined
                    ? { success: true, value: createCommandArgument('literal', value) }
                    : { success: false, error: { parseFailed: { value: value, types: choices } } };
            }
        };
    },
    string: buildParameter('string', value => ({ success: true, value: createCommandArgument('string', value) })),
    bigint: buildParameter('bigint', (value) => {
        const result = parse.bigInt(value);
        if (result === undefined)
            return { success: false, error: { parseFailed: { value: value, types: ['an integer'] } } };
        return { success: true, value: createCommandArgument('bigint', result) };
    }),
    integer: buildParameter('integer', (value) => {
        const result = parse.int(value, { strict: true });
        if (result === undefined)
            return { success: false, error: { parseFailed: { value: value, types: ['an integer'] } } };
        return { success: true, value: createCommandArgument('integer', result) };
    }),
    number: buildParameter('number', (value) => {
        const result = parse.float(value);
        if (result === undefined)
            return { success: false, error: { parseFailed: { value: value, types: ['a number'] } } };
        return { success: true, value: createCommandArgument('number', result) };
    }),
    boolean: buildParameter('boolean', (value) => {
        const result = parse.boolean(value);
        if (result === undefined)
            return { success: false, error: { parseFailed: { value: value, types: ['a boolean'] } } };
        return { success: true, value: createCommandArgument('boolean', result) };
    }),
    duration: buildParameter('duration', (value) => {
        const result = parse.duration(value);
        if (result === undefined)
            return { success: false, error: { parseFailed: { value: value, types: ['a duration'] } } };
        return { success: true, value: createCommandArgument('duration', result) };
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
