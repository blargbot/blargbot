import { AnySubtagHandlerDefinition, SubtagHandlerCallSignature, SubtagHandlerDefinitionParameterGroup, SubtagHandlerParameter, SubtagHandlerParameterGroup, SubtagHandlerValueParameter, SubtagLogic, SubtagResult, SubtagReturnTypeMap } from '@cluster/types';
import { parse } from '@cluster/utils';

import { ArraySubtagLogic, ArrayWithErrorsSubtagLogic, DeferredSubtagLogic, IgnoreSubtagLogic, StringifySubtagLogic, StringIterableSubtagLogic, StringSubtagLogic } from '../logic';

export function parseDefinitions(definitions: readonly AnySubtagHandlerDefinition[]): readonly SubtagHandlerCallSignature[] {
    return definitions.map(parseDefinition);
}

function parseDefinition(definition: AnySubtagHandlerDefinition): SubtagHandlerCallSignature {
    return {
        ...definition,
        parameters: definition.parameters.map(parseArgument),
        implementation: getExecute(definition)
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

function getExecute(definition: AnySubtagHandlerDefinition): SubtagLogic<SubtagResult> {
    const wrapper = logicWrappers[definition.returns];
    return new wrapper(definition as SubtagLogic<unknown> as SubtagLogic<never>);
}

const logicWrappers: { [P in keyof SubtagReturnTypeMap]: new (factory: SubtagLogic<Awaitable<SubtagReturnTypeMap[P]>>) => SubtagLogic<SubtagResult> } = {
    'unknown': DeferredSubtagLogic,
    'number': StringifySubtagLogic,
    'hex': StringSubtagLogic.withConversion(val => val.toString(16).padStart(6, '0')),
    'number[]': ArraySubtagLogic,
    'boolean': StringifySubtagLogic,
    'boolean|number': StringifySubtagLogic,
    'boolean[]': ArraySubtagLogic,
    'string': StringSubtagLogic,
    'string|nothing': StringSubtagLogic,
    'string[]': ArraySubtagLogic,
    '(string|error)[]': ArrayWithErrorsSubtagLogic,
    'json': StringSubtagLogic.withConversion(parse.string),
    'json|nothing': StringSubtagLogic.withConversion(parse.string),
    'json[]': ArraySubtagLogic,
    'json[]|nothing': ArraySubtagLogic,
    'nothing': IgnoreSubtagLogic,
    'id': StringSubtagLogic,
    'id[]': ArraySubtagLogic,
    'loop': StringIterableSubtagLogic,
    'error': IgnoreSubtagLogic,
    'embed': StringSubtagLogic.withConversion(JSON.stringify),
    'embed[]': ArraySubtagLogic
};
