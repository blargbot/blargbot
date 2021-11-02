import { SubtagHandlerCallSignature, SubtagHandlerDefinition, SubtagHandlerDefinitionParameterGroup, SubtagHandlerParameter, SubtagHandlerParameterGroup, SubtagHandlerValueParameter } from '@cluster/types';

export function parseDefinitions(definitions: readonly SubtagHandlerDefinition[]): readonly SubtagHandlerCallSignature[] {
    return definitions.map(parseDefinition);
}

function parseDefinition(definition: SubtagHandlerDefinition): SubtagHandlerCallSignature {
    return {
        ...definition,
        parameters: definition.parameters.map(parseArgument),
        execute: definition.execute
    };
}

function parseArgument(parameter: string | SubtagHandlerDefinitionParameterGroup): SubtagHandlerParameter {
    if (typeof parameter === 'object')
        return createParameterGroup(parameter.parameters.map(parseArgument), parameter.minCount ?? 0);

    let autoResolve = true;
    if (parameter.startsWith('~')) {
        autoResolve = false;
        parameter = parameter.slice(1);
    }

    const match = /^(?<name>.*?)(?::(?<defaultValue>.*?))?(?:#(?<maxLength>\d+))?$/.exec(parameter)?.groups ?? {} as Record<string, string | undefined>;
    const { defaultValue = '', maxLength = '1000000' } = match;
    let name = match.name ?? parameter;
    let required = true;
    let greedy: number | false = false;
    switch (name[name.length - 1]) {
        case '?':
            required = false;
            break;
        case '*':
            greedy = 0;
            break;
        case '+':
            greedy = 1;
            break;
        case '!':
            break;
        default: {
            const match = /^(.*?)\+(\d)$/.exec(name);
            if (match !== null) {
                greedy = parseInt(match[2]);
                required = greedy > 0;
                name = match[1];
            }
            name += '!';
        }
    }

    const result: SubtagHandlerValueParameter = {
        name: name.slice(0, parameter.length - 1),
        autoResolve,
        required,
        defaultValue,
        maxLength: parseInt(maxLength)
    };

    return greedy === false ? result : createParameterGroup([result], greedy);
}

function createParameterGroup(parameters: SubtagHandlerParameter[], minCount: number): SubtagHandlerParameterGroup {
    const nested = [];
    for (const p of parameters) {
        if ('nested' in p || !p.required)
            throw new Error('All parameters inside a parameter group must be required');
        nested.push(p);
    }
    return { nested, minRepeats: minCount };
}
