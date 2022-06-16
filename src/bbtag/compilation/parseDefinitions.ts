import { parse } from '@blargbot/core/utils';

import { ArrayOrValueSubtagLogicWrapper, ArraySubtagLogic, DeferredSubtagLogic, IgnoreSubtagLogic, StringifySubtagLogic, StringIterableSubtagLogic, StringSubtagLogic, SubtagLogic } from '../logic';
import { SubtagReturnTypeMap, SubtagSignature, SubtagSignatureParameter, SubtagSignatureParameterGroup, SubtagSignatureValueParameter } from '../types';
import { AnySubtagSignatureOptions } from './AnySubtagSignatureOptions';
import { SubtagSignatureCallable } from './SubtagSignatureCallable';
import { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions';

export function parseDefinitions(definitions: readonly AnySubtagSignatureOptions[]): ReadonlyArray<{
    readonly signature?: SubtagSignature;
    readonly implementation?: SubtagSignatureCallable;
}> {
    return definitions.map(parseDefinition);
}

function parseDefinition(definition: AnySubtagSignatureOptions): { signature?: SubtagSignature; implementation?: SubtagSignatureCallable; } {
    const parameters = definition.parameters.map(parseArgument);
    return {
        signature: getSignature(definition, parameters),
        implementation: getExecute(definition, parameters)
    };
}

function getSignature(definition: AnySubtagSignatureOptions, parameters: readonly SubtagSignatureParameter[]): SubtagSignature | undefined {
    if (definition.description === undefined)
        return undefined;

    return {
        subtagName: definition.subtagName,
        description: definition.description,
        parameters: parameters,
        exampleCode: definition.exampleCode,
        exampleOut: definition.exampleOut,
        exampleIn: definition.exampleIn
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
    let maxLength = parse.int(parameter.slice(startMaxLength + 1), { strict: true });
    if (maxLength === undefined) {
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

function getExecute(definition: AnySubtagSignatureOptions, parameters: readonly SubtagSignatureParameter[]): SubtagSignatureCallable | undefined {
    if (definition.execute === undefined)
        return undefined;
    const wrapper = logicWrappers[definition.returns];
    return {
        parameters: parameters,
        implementation: new wrapper(definition as SubtagLogic<unknown> as SubtagLogic<never>)
    };
}

const logicWrappers: { [P in keyof SubtagReturnTypeMap]: new (factory: SubtagLogic<Awaitable<SubtagReturnTypeMap[P]>>) => SubtagLogic } = {
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
    'embed[]': ArraySubtagLogic,
    'hex[]': ArraySubtagLogic,
    'nothing[]': ArraySubtagLogic,
    'number|number[]': ArrayOrValueSubtagLogicWrapper
};
