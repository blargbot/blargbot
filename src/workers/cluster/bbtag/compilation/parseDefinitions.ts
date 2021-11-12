import { AnySubtagHandlerDefinition, SubtagHandlerCallSignature, SubtagHandlerDefinitionParameterGroup, SubtagHandlerParameter, SubtagHandlerParameterGroup, SubtagHandlerValueParameter, SubtagResultTypeMap } from '@cluster/types';

import { ArraySubtagResult, ArrayWithErrorsSubtagResult, IgnoreSubtagResult, StringifySubtagResult, StringIterableSubtagResult, StringSubtagResult, SubtagResult } from '../results';

export function parseDefinitions(definitions: readonly AnySubtagHandlerDefinition[]): readonly SubtagHandlerCallSignature[] {
    return definitions.map(parseDefinition);
}

function parseDefinition(definition: AnySubtagHandlerDefinition): SubtagHandlerCallSignature {
    return {
        ...definition,
        parameters: definition.parameters.map(parseArgument),
        execute: getExecute(definition)
    };
}

function parseArgument(parameter: string | SubtagHandlerDefinitionParameterGroup): SubtagHandlerParameter {
    if (typeof parameter === 'object')
        return createParameterGroup(parameter.repeat.map(parseArgument), parameter.minCount ?? 0);

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
        name: name.slice(0, name.length - 1),
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

function getExecute(definition: AnySubtagHandlerDefinition): SubtagHandlerCallSignature['execute'] {
    if (definition.returns === 'unknown')
        return (...args) => definition.execute(...args);

    const subtagResult = subtagResultTypes[definition.returns] as new (value: unknown) => SubtagResult;
    return (...args) => new subtagResult(definition.execute(...args));
}

const subtagResultTypes: { [P in Exclude<keyof SubtagResultTypeMap, 'unknown'>]: new (value: Awaitable<SubtagResultTypeMap[P]>) => SubtagResult } = {
    number: StringifySubtagResult,
    numbers: ArraySubtagResult,
    boolean: StringifySubtagResult,
    booleans: ArraySubtagResult,
    string: StringSubtagResult,
    strings: ArraySubtagResult,
    array: ArraySubtagResult,
    arrayWithErrors: ArrayWithErrorsSubtagResult,
    nothing: IgnoreSubtagResult,
    id: StringSubtagResult,
    ids: ArraySubtagResult,
    loop: StringIterableSubtagResult
};
