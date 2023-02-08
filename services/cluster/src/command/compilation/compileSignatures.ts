import type { CommandDefinition, CommandGreedyParameter, CommandHandlerDefinition, CommandLiteralParameter, CommandParameter, CommandSignatureHandler, CommandSingleParameter, CommandVariableType, CommandVariableTypeName } from '@blargbot/cluster/types.js';

import type { CommandContext } from '../CommandContext.js';
import { parseParameterType } from './parameterType.js';

export function compileSignatures<TContext extends CommandContext>(definitions: ReadonlyArray<CommandDefinition<TContext>>): ReadonlyArray<CommandSignatureHandler<TContext>> {
    return [...compileSignaturesIter(definitions, '', false)];
}

interface FlatCommandHandlerDefinition<TContext extends CommandContext> {
    parameters: string;
    definition: CommandHandlerDefinition<TContext>;
    hidden: boolean;
}

function* compileSignaturesIter<TContext extends CommandContext>(
    definitions: Iterable<CommandDefinition<TContext>>,
    subCommands: string,
    hidden: boolean
): Generator<CommandSignatureHandler<TContext>> {
    for (const definition of definitions) {
        if ('execute' in definition) {
            yield compileSignature({
                parameters: `${subCommands} ${definition.parameters}`.trim(),
                definition: definition,
                hidden: definition.hidden ?? hidden
            });
        }

        if ('subcommands' in definition) {
            yield* compileSignaturesIter(definition.subcommands, `${subCommands} ${definition.parameters}`.trim(), definition.hidden ?? hidden);
        }
    }
}

function compileSignature<TContext extends CommandContext>(signature: FlatCommandHandlerDefinition<TContext>): CommandSignatureHandler<TContext> {
    return {
        description: signature.definition.description,
        hidden: signature.hidden,
        execute: signature.definition.execute,
        parameters: parseParameters(signature.parameters)
    };
}

function parseParameters(parameters: string): CommandParameter[] {
    const result = [];
    let parameter: CommandParameter;

    for (let i = 0; i < parameters.length; i++) {
        switch (parameters[i]) {
            case ' ': break;
            case '{':
                ({ parameter, i } = readVariable(parameters, i));
                result.push(parameter);
                break;
            default: {
                if (!/[a-zA-Z]/.test(parameters[i]) && parameters[i] !== '\\')
                    throw new Error('Literals must start with a letter');
                ({ parameter, i } = readLiteral(parameters, i));
                result.push(parameter);
            }
        }
    }

    return result;
}

type CommandVariableParameter<T extends CommandVariableTypeName = CommandVariableTypeName> = CommandSingleParameter<T, boolean> | CommandGreedyParameter<T>;

function readVariable(parameters: string, i: number): { parameter: CommandVariableParameter; i: number; } {
    let name;
    let type;
    ({ name, i } = readVariableName(parameters, i));
    ({ type, i } = readVariableType(name, parameters, i));
    return readVariableKind(name, type, parameters, i);
}

function readVariableName(parameters: string, i: number): { name: string; i: number; } {
    if (parameters[i] !== '{')
        throw new Error(`Expected '{' but got '${parameters[i]}'`);

    let name = '';
    for (i++; i < parameters.length; i++) {
        switch (parameters[i]) {
            case '}':
            case '=':
            case ':':
            case '[':
            case '+':
            case '?':
            case '!':
                return { name, i: i };
            case '\\':
                if (++i >= parameters.length)
                    break;
            //fallthrough
            default:
                name += parameters[i];
        }
    }

    throw new Error(`Unterminated parameter '${name}'`);
}

function readVariableType(name: string, parameters: string, i: number): { type: CommandVariableType<CommandVariableTypeName>; i: number; } {
    if (parameters[i] !== ':')
        return { type: parseParameterType('string'), i: i };

    let type = '';
    for (i++; i < parameters.length; i++) {
        switch (parameters[i]) {
            case '}':
            case '=':
            case '?':
            case '!':
            case '+':
            case '[':
                if (type === '')
                    type = 'string';
                return { type: parseParameterType(type), i: i };
            case '\\':
                if (++i >= parameters.length)
                    break;
            //fallthrough
            default:
                type += parameters[i];
        }
    }
    throw new Error(`Unterminated parameter '${name}'`);
}

function readVariableKind(name: string, type: CommandVariableType<CommandVariableTypeName>, parameters: string, i: number): { parameter: CommandVariableParameter; i: number; } {
    let required = true;
    let fallback: string | undefined = undefined;
    const result = { name, type, raw: false };
    if (name.startsWith('~')) {
        result.raw = true;
        name = result.name = name.slice(1);
    }

    switch (parameters[i]) {
        case '?':
            required = false;
        // fallthrough
        case '!':
            if (parameters[++i] !== '}')
                throw new Error(`Expected '}' but got '${parameters[i]}' in parameter '${name}'`);
        // fallthrough
        case '=': if (required) {
            const res = readFallback(name, parameters, i);
            required &&= res.required;
            fallback ??= res.fallback;
            i = res.i;
        }
        // fallthrough
        case '}': return {
            i: i,
            parameter: { kind: 'singleVar', required, fallback, ...result }
        };
        case '+': switch (parameters[++i]) {
            case '?':
                required = false;
            // fallthrough
            case '!':
                if (parameters[++i] !== '}')
                    throw new Error(`Expected '}' but got '${parameters[i]}' in parameter '${name}'`);
            // fallthrough
            case '=': if (required) {
                const res = readFallback(name, parameters, i);
                required &&= res.required;
                fallback ??= res.fallback;
                i = res.i;
            }
            // fallthrough
            case '}': return {
                i: i,
                parameter: { kind: 'concatVar', required, fallback, ...result }
            };
            default:
                throw new Error(`Invalid parameter '${name}'`);
        }
        case '[': {
            let minLength;
            ({ minLength, i } = readGreedyCount(name, parameters, i));
            if (parameters[i] === '}') {
                return {
                    i: i + 1,
                    parameter: { kind: 'greedyVar', minLength: minLength, ...result }
                };
            }
        }
    }
    throw new Error(`Unterminated parameter '${name}'`);
}

function readFallback(name: string, parameters: string, i: number): { fallback: string | undefined; i: number; required: boolean; } {
    if (parameters[i] !== '=')
        return { fallback: undefined, i, required: true };

    let fallback = '';
    for (i++; i < parameters.length; i++) {
        switch (parameters[i]) {
            case '}':
                return { fallback, i: i, required: false };
            case '\\':
                if (++i >= parameters.length)
                    break;
            //fallthrough
            default:
                fallback += parameters[i];
        }
    }
    throw new Error(`Unterminated parameter '${name}'`);
}

function readGreedyCount(name: string, parameters: string, i: number): { minLength: number; i: number; } {
    if (parameters[i] !== '[')
        throw new Error(`Invalid parameter '${name}'`);

    if (parameters[++i] === ']')
        return { minLength: 1, i: i + 1 };

    let numbers = '';
    for (i; i < parameters.length; i++) {
        switch (parameters[i]) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                numbers += parameters[i];
                break;
            case ']': {
                const res = parseInt(numbers);
                if (isNaN(res))
                    throw new Error(`'${numbers}' is not a valid count`);
                return { minLength: res, i: i + 1 };
            }
            default:
                throw new Error(`${numbers}${parameters[i]} is not a valid number`);
        }
    }
    throw new Error(`Unterminated parameter '${name}'`);
}

function readLiteral(parameters: string, i: number): { parameter: CommandLiteralParameter; i: number; } {
    const results = [];
    let current = '';
    forLoop:
    for (; i < parameters.length; i++) {
        switch (parameters[i]) {
            case ' ':
                break forLoop;
            case '|':
                results.push(current);
                current = '';
                break;
            case '\\':
                if (++i >= parameters.length)
                    break;
            //fallthrough
            default:
                current += parameters[i];
        }
    }

    results.push(current);

    const [name, ...alias] = results;

    return {
        i,
        parameter: {
            name,
            alias,
            kind: 'literal'
        }
    };
}
