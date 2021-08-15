import { SubtagHandlerCallSignature, SubtagHandlerDefinition, SubtagHandlerDefinitionParameterGroup, SubtagHandlerParameter } from '@cluster/types';

const argumentRequired = [undefined, '!', '+'] as ReadonlyArray<string | undefined>;

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
    if (typeof parameter === 'object') {
        return {
            name: parameter.name ?? undefined,
            autoResolve: false,
            greedy: parameter.type?.endsWith('OrMore') === true ? parseInt(parameter.type) : false,
            required: argumentRequired.includes(parameter.type),
            nested: parameter.parameters.map(parseArgument),
            defaultValue: '',
            maxLength: 1000000
        };
    }

    let autoResolve = true;
    if (parameter.startsWith('~')) {
        autoResolve = false;
        parameter = parameter.slice(1);
    }

    const match: Record<string, string | undefined> = /^(?<parameter>.*?)(?::(?<defaultValue>.*?))?(?:#(?<maxLength>\d+))?$/.exec(parameter)?.groups ?? {};
    const { defaultValue = '', maxLength = '1000000', parameter: param } = match;
    parameter = param ?? parameter;
    let required = true;
    let greedy: number | false = false;
    switch (parameter[parameter.length - 1]) {
        case '?':
            required = false;
            break;
        case '*':
            required = false;
            greedy = 0;
            break;
        case '+':
            greedy = 1;
            break;
        case '!':
            break;
        default: {
            const match = /^(.*?)\+(\d)$/.exec(parameter);
            if (match !== null) {
                greedy = parseInt(match[2]);
                required = greedy > 0;
                parameter = match[1];
            }
            parameter += '!';
        }
    }
    parameter = parameter.slice(0, parameter.length - 1);

    return {
        name: parameter,
        autoResolve,
        required,
        greedy: greedy,
        defaultValue,
        nested: [],
        maxLength: parseInt(maxLength)
    };
}
