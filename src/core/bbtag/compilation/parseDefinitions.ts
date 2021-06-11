import { SubtagHandlerArgument, SubtagHandlerCallSignature, SubtagHandlerDefinition, SubtagHandlerDefinitionArgumentGroup } from '../types';

const argumentRequired = [undefined, '!', '+'] as ReadonlyArray<string | undefined>;

export function parseDefinitions(definitions: readonly SubtagHandlerDefinition[]): readonly SubtagHandlerCallSignature[] {
    return definitions.map(parseDefinition);
}

function parseDefinition(definition: SubtagHandlerDefinition): SubtagHandlerCallSignature {
    return {
        ...definition,
        args: definition.args.map(parseArgument),
        execute: definition.execute
    };
}

function parseArgument(argument: string | SubtagHandlerDefinitionArgumentGroup): SubtagHandlerArgument {
    if (typeof argument === 'object') {
        return {
            name: argument.name,
            autoResolve: false,
            greedy: argument.type?.endsWith('OrMore') ? parseInt(argument.type) : null,
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
    let greedy: number | null = null;
    switch (argument[argument.length - 1]) {
        case '?': required = false; break;
        case '*': required = false; greedy = 0; break;
        case '+': greedy = 1; break;
        case '!': break;
        default:
            const match = /^(.*?)\+(\d)$/.exec(argument);
            if (match !== null) {
                greedy = parseInt(match[2]);
                required = greedy > 0;
                argument = match[1];
            }
            argument += '!';
    }
    argument = argument.slice(0, argument.length - 1);

    return {
        name: argument,
        autoResolve,
        required,
        greedy: greedy,
        nestedArgs: []
    };
}