import { guard } from '../../globalCore';
import { CommandDefinition, CommandSignatureHandler, CommandHandlerDefinition, CommandLiteralParameter, CommandParameter, CommandSingleParameter, CommandConcatParameter, CommandGreedyParameter } from '../../types';
import { CommandContext } from '../CommandContext';
import { CommandVariableType, isCommandVariableType } from './parameterType';

export function compileSignatures<TContext extends CommandContext>(definition: CommandDefinition<TContext>): ReadonlyArray<CommandSignatureHandler<TContext>> {
    return [...flattenSubCommands(definition, '')]
        .map(v => compileSignature(v));
}

interface FlatCommandHandlerDefinition<TContext extends CommandContext> {
    parameters: string;
    definition: CommandHandlerDefinition<TContext>;
}

function* flattenSubCommands<TContext extends CommandContext>(
    definition: CommandDefinition<TContext>,
    subCommands: string
): Generator<FlatCommandHandlerDefinition<TContext>> {
    if ('subcommands' in definition) {
        for (const key of Object.keys(definition.subcommands)) {
            yield* flattenSubCommands(definition.subcommands[key], `${subCommands} ${key}`.trim());
        }
    }

    if ('execute' in definition) {
        yield {
            parameters: `${subCommands} ${definition.parameters ?? ''}`.trim(),
            definition: definition
        };
    }
}

function compileSignature<TContext extends CommandContext>(signature: FlatCommandHandlerDefinition<TContext>): CommandSignatureHandler<TContext> {
    return {
        description: signature.definition.description,
        execute: signature.definition.execute,
        parameters: parseParameters(signature.parameters)
    };
}

function parseParameters(parameters: string): CommandParameter[] {
    const result = [];
    let parameter;

    for (let i = 0; i < parameters.length; i++) {
        switch (parameters[i]) {
            case ' ': break;
            case '{':
                ({ parameter, i } = readVariable(parameters, i));
                result.push(parameter);
                break;
            default: {
                if (!guard.isLetter(parameters[i]) && parameters[i] !== '\\')
                    throw new Error('Literals must start with a letter');
                ({ parameter, i } = readLiteral(parameters, i));
                result.push(parameter);
            }
        }
    }

    return result;
}

type CommandVariableParameter = CommandSingleParameter | CommandGreedyParameter | CommandConcatParameter;

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

function readVariableType(name: string, parameters: string, i: number): { type: CommandVariableType; i: number; } {
    if (parameters[i] !== ':')
        return { type: 'string', i: i };

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
                if (isCommandVariableType(type))
                    return { type, i: i };
                throw new Error(`'${type}' is not a supported variable type`);
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

function readVariableKind(name: string, type: CommandVariableType, parameters: string, i: number): { parameter: CommandVariableParameter; i: number; } {
    let fallback: string | undefined = undefined;
    let raw = false;
    if (name.startsWith('~')) {
        raw = true;
        name = name.slice(1);
    }

    switch (parameters[i]) {
        case '?':
            fallback ??= '';
        // fallthrough
        case '!':
            if (parameters[++i] !== '}')
                throw new Error(`Expected '}' but got '${parameters[i]}' in parameter '${name}'`);
        // fallthrough
        case '=':
            if (fallback === undefined)
                ({ fallback, i } = readFallback(name, parameters, i));
        // fallthrough
        case '}': return {
            i: i,
            parameter: {
                kind: 'singleVar',
                fallback: fallback,
                name: name,
                raw: raw,
                type: type
            }
        };
        case '+': switch (parameters[++i]) {
            case '?':
                fallback ??= '';
            // fallthrough
            case '!':
                if (parameters[++i] !== '}')
                    throw new Error(`Expected '}' but got '${parameters[i]}' in parameter '${name}'`);
            // fallthrough
            case '=':
                if (fallback === undefined)
                    ({ fallback, i } = readFallback(name, parameters, i));
            // fallthrough
            case '}': return {
                i: i,
                parameter: {
                    kind: 'concatVar',
                    fallback: fallback,
                    name: name,
                    raw: raw,
                    type: type
                }
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
                    parameter: {
                        kind: 'greedyVar',
                        minLength: minLength,
                        name: name,
                        raw: raw,
                        type: type
                    }
                };
            }
        }
    }
    throw new Error(`Unterminated parameter '${name}'`);
}

function readFallback(name: string, parameters: string, i: number): { fallback: string | undefined; i: number; } {
    if (parameters[i] !== '=')
        return { fallback: undefined, i };

    let fallback = '';
    for (i++; i < parameters.length; i++) {
        switch (parameters[i]) {
            case '}':
                return { fallback, i: i };
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

    if (current.length > 0)
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
