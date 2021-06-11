import { SubtagHandlerArgument, SubtagHandlerCallSignature, SubtagHandlerDefinition, SubtagHandlerDefinitionArgumentGroup } from '../types';

const argumentGreedy = ['oneOrMore', 'zeroOrMore'] as ReadonlyArray<string | undefined>;
const argumentRequired = [undefined, 'required', 'oneOrMore'] as ReadonlyArray<string | undefined>;

export function parseDefinitions(definitions: readonly SubtagHandlerDefinition[]): readonly SubtagHandlerCallSignature[] {
    return definitions.map(parseDefinition);
}

function parseDefinition(definition: SubtagHandlerDefinition): SubtagHandlerCallSignature {
    return {
        args: definition.args.map(parseArgument),
        description: definition.description,
        execute: definition.execute
    };
}

function parseArgument(argument: string | SubtagHandlerDefinitionArgumentGroup): SubtagHandlerArgument {
    if (typeof argument === 'object') {
        return {
            name: argument.name,
            autoResolve: false,
            greedy: argumentGreedy.includes(argument.type),
            required: argumentRequired.includes(argument.type),
            nestedArgs: argument.args.map(parseArgument)
        };
    }

    let autoResolve = true;
    if (argument[0] === '~') {
        autoResolve = false;
        argument = argument.slice(1);
    }

    let required = true;
    let many = false;
    switch (argument[argument.length - 1]) {
        case '?': required = false; break;
        case '*': required = false; many = true; break;
        case '+': many = true; break;
        case '!': break;
        default: argument += '!';
    }
    argument = argument.slice(0, argument.length - 1);

    return {
        name: argument,
        autoResolve,
        required,
        greedy: many,
        nestedArgs: []
    };
}