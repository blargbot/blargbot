/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:06
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-10-27 11:39:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const { FlowState } = require('../structures/bbtag/FlowControl');
const Builder = require('../structures/TagBuilder'),
    waitMessage = require('./waitmessage'),
    bbengine = require('../structures/bbtag/Engine');

module.exports =
    Builder.ArrayTag('filter')
        .withArgs(a => [
            a.require('variable'),
            a.require('array'),
            a.require('code')
        ])
        .withDesc('For every element in `array`, `variable` will be set and then `code` will be run. Returns a new array containing all the elements that returned the value `true`.\n' +
            '\n\n While inside the `condition` parameter, none of the following subtags may be used: `' + waitMessage.overrideSubtags.join(', ') + '`')
        .withExample(
            '{set;~array;apples;apple juice;grapefruit}\n{filter;~element;~array;{bool;{get;~element};startswith;apple}}',
            '["apples","apple juice"]'
        ).resolveArgs(0, 1)
        .whenArgs('0-2', Builder.errors.notEnoughArguments)
        .whenArgs(3, async function (subtag, context, args) {
            let varName = args[0],
                arr = await bu.getArray(context, args[1]) || { v: args[1].split('') },
                result = [];
            let array = Array.from(arr.v);

            let checkFunc = waitMessage.createCheck(subtag, context, args[2], (msg, user, emoji) => {
                return context.makeChild({ msg });
            });

            let processed = {};
            let i = 0;

            loop:
            for (const item of array) {
                let stringifiedItem = typeof item === 'object' ? JSON.stringify(item) : null;
                if (processed[stringifiedItem || item]) continue;
                if (await bbengine.safeLoopIteration(context)) {
                    return Builder.errors.maxSafeLoops(subtag, context);
                };

                await context.variables.set(varName, item);
                try {
                    let res = await checkFunc(context.msg, item);
                    switch (context.state.flowState) {
                        case FlowState.NORMAL:
                            break;
                        case FlowState.CONTINUE_LOOP:
                            context.state.flowState = FlowState.NORMAL;
                            continue loop;
                        case FlowState.BREAK_LOOP:
                            context.state.flowState = FlowState.NORMAL;
                        //Fallthrough
                        default:
                            break loop;
                    }
                    if (res) {
                        processed[stringifiedItem || item] = true;
                        //If item 'e' is an object, it stringifies it for comparison. Otherwise it will always return false
                        result.push(...array.filter(e => typeof e === 'object' ? JSON.stringify(e) === stringifiedItem : e === item));
                    }
                } catch (err) {
                    if (typeof err == "function") {
                        return err(subtag, context);
                    }
                    throw err;
                }
            }
            context.variables.reset(varName);
            return JSON.stringify(result);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();
