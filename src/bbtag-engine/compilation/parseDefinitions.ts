import { parse } from '../parse.js';
import type { SubtagReturnTypeMap, SubtagSignature, SubtagSignatureParameter, SubtagSignatureParameterGroup, SubtagSignatureValueParameter } from '../types.js';
import type { AnySubtagSignatureOptions } from './AnySubtagSignatureOptions.js';
import type { SubtagLogic } from './logic/index.js';
import { iterableOrSingleSubtagLogic, iterableSubtagLogic, passthroughSubtagLogic, stringifySubtagLogic, stringIterableSubtagLogic, stringSubtagLogic, voidSubtagLogic } from './logic/index.js';
import type { SubtagSignatureCallable } from './SubtagSignatureCallable.js';
import type { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions.js';

export function parseDefinitions<Locals extends object>(definitions: ReadonlyArray<AnySubtagSignatureOptions<Locals>>): ReadonlyArray<{
    readonly signature?: SubtagSignature;
    readonly implementation?: SubtagSignatureCallable<Locals>;
}> {
    return definitions.map(parseDefinition);
}

function parseDefinition<Locals extends object>(definition: AnySubtagSignatureOptions<Locals>): { signature?: SubtagSignature; implementation?: SubtagSignatureCallable<Locals>; } {
    const parameters = definition.parameters.map(parseArgument);
    return {
        signature: getSignature(definition, parameters),
        implementation: getExecute(definition, parameters)
    };
}

function getSignature<Locals extends object>(definition: AnySubtagSignatureOptions<Locals>, parameters: readonly SubtagSignatureParameter[]): SubtagSignature | undefined {
    if ('return' in definition)
        return undefined;

    return {
        subtagName: definition.subtagName,
        parameters: parameters
    };
}

function parseArgument(parameter: SubtagSignatureParameterOptions): SubtagSignatureParameter {
    if (typeof parameter === 'object')
        return createParameterGroup(parameter.repeat.map(parseArgument), parameter.minCount ?? 0);

    let autoResolve = true;
    if (parameter.startsWith('~')) {
        autoResolve = false;
        parameter = parameter.slice(1);
    }

    let startDefault = parameter.indexOf(':');
    if (startDefault === -1)
        startDefault = parameter.length + 1;
    let startMaxLength = parameter.lastIndexOf('#');
    if (startMaxLength === -1)
        startMaxLength = parameter.length + 1;

    let name = parameter.slice(0, Math.min(startDefault, startMaxLength));
    let defaultValue = parameter.slice(startDefault + 1, startMaxLength);
    let maxLength = parseInt(parameter.slice(startMaxLength + 1));
    if (isNaN(maxLength)) {
        maxLength = 1_000_000;
        defaultValue = parameter.slice(startDefault + 1);
    }
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
                name = match[1];
            }
            name += '!';
        }
    }

    const result: SubtagSignatureValueParameter = {
        name: name.slice(0, name.length - 1),
        autoResolve,
        required,
        defaultValue,
        maxLength: maxLength
    };

    return greedy === false ? result : createParameterGroup([result], greedy);
}

function createParameterGroup(parameters: SubtagSignatureParameter[], minCount: number): SubtagSignatureParameterGroup {
    const nested = [];
    for (const p of parameters) {
        if ('nested' in p || !p.required)
            throw new Error('All parameters inside a parameter group must be required');
        nested.push(p);
    }
    return { nested, minRepeats: minCount };
}

function getExecute<Locals extends object>(definition: AnySubtagSignatureOptions<Locals>, parameters: readonly SubtagSignatureParameter[]): SubtagSignatureCallable<Locals> | undefined {
    if (definition.execute === undefined)
        return undefined;
    const implementation = logicWrappers[definition.returns](definition.execute as never);
    const id = definition.execute.name;
    if (id === 'execute' || id === '')
        throw new Error('The `execute` method of a replacer must have a name other than `execute`');

    return {
        id,
        subtagName: definition.subtagName,
        parameters,
        implementation
    };
}

const logicWrappers: { [P in keyof SubtagReturnTypeMap]: <Locals extends object>(factory: SubtagLogic<Locals, Awaitable<SubtagReturnTypeMap[P]>>) => SubtagLogic<Locals> } = {
    'unknown': passthroughSubtagLogic,
    'number': stringifySubtagLogic,
    'hex': next => stringifySubtagLogic(next, val => val.toString(16).padStart(6, '0')),
    'number[]': iterableSubtagLogic,
    'boolean': stringifySubtagLogic,
    'boolean|number': stringifySubtagLogic,
    'boolean[]': iterableSubtagLogic,
    'string': stringSubtagLogic,
    'string|nothing': stringSubtagLogic,
    'string[]': iterableSubtagLogic,
    'json': next => stringifySubtagLogic(next, parse.string),
    'json|nothing': next => stringifySubtagLogic(next, parse.string),
    'json[]': iterableSubtagLogic,
    'json[]|nothing': iterableSubtagLogic,
    'nothing': voidSubtagLogic,
    'id': stringSubtagLogic,
    'id[]': iterableSubtagLogic,
    'loop': stringIterableSubtagLogic,
    'error': voidSubtagLogic,
    'hex[]': iterableSubtagLogic,
    'nothing[]': iterableSubtagLogic,
    'number|number[]': iterableOrSingleSubtagLogic
};
