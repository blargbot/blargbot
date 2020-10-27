/**
 * @Author: RagingLink 
 * @Date: 2020-07-28 21:09:40
 * @Last Modified by: RagingLink
 * @Last Modified time: 2020-08-01 20:2 7:36
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('jsonsort')
        .withAlias('jsort')
        .withArgs(a => [a.require('array'), a.require('path'), a.optional('descending')])   
        .withDesc('Sorts an array of objects based on on the provided `path`.\n' +
            '`path` is a dot-noted series of properties.' +
            'If `descending` is provided, sorts in descending order.\n' +
            'If provided a variable, will modify the original `array`.'
        ).withExample(
            '{set;~array;{json;[\n  {"points" : 10, "name" : "Blargbot"},\n  {"points" : 3, "name" : "UNO"},\n' +
            '  {"points" : 6, "name" : "Stupid cat"},\n  {"points" : 12, "name" : "Winner"}\n]}}\n' +
            '{jsonstringify;{jsonsort;{slice;{get;~array};0};points};2}',
            '[\n  "{\\"points\\":3,\\"name\\":\\"UNO\\"}",\n  "{\\"points\\":6,\\"name\\":\\"Stupid cat\\"}",' +
            '\n  "{\\"points\\":10,\\"name\\":\\"Blargbot\\"}",\n  "{\\"points\\":12,\\"name\\":\\"Winner\\"}"\n]'
        ).whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async (subtag, context, args) => {
            let arr = await bu.getArray(context, args[0]),
                path = args[1] ? args[1].split('.') : undefined;
                descending = bu.parseBoolean(args[2]);
            
            if (!bu.isBoolean(descending))
                descending = !!args[2];

            if (arr == null || !Array.isArray(arr.v))
                return Builder.errors.notAnArray(subtag, context);
            if(!path) return Builder.errors.customError(subtag, context, 'No path provided');
            //Map array with values of array[item][path]
            let mappedArray = await Promise.all(arr.v.map(item => {
                try {
                    if (typeof item !== 'object')
                        item = JSON.parse(item)
                } catch (e) {
                    item = {};
                }
                for (const part of path) {
                    if (typeof item === 'string') {
                        try {
                            item = JSON.parse(item);
                        } catch (err) { }
                    }

                    if (typeof item === 'object') {
                        const keys = Object.keys(item);
                        if (keys.length === 2 && keys.includes('v') && keys.includes('n') && /^\d+$/.test(part)) {
                            item = item.v;
                        }
                    }
                    if (item && item.hasOwnProperty(part)) {
                        item = item[part];
                    } else item = undefined;
                } 
                return item;
            }));
            //If there are any undefined values return an error stating at which index the 'faulty' object is and how many faulty there are
            let undefinedItems = mappedArray.filter(v => v === undefined)
            if (undefinedItems.length !== 0) {
                return Builder.errors.customError(subtag, context, 'Cannot read property ' + path + ' at index ' + mappedArray.indexOf(undefined) + ', ' + undefinedItems.length + ' total failures' );
            };
            //Sort the array
            arr.v = arr.v.sort((a, b) => {
                if (typeof a !== 'object')
                    a = JSON.parse(a)
                if (typeof b !== 'object')
                    b = JSON.parse(b);
                //Value of path of a
                for (const part of path) {
                    if (typeof a === 'string') {
                        try {
                            a = JSON.parse(a);
                        } catch (err) { }
                    }

                    if (typeof a === 'object') {
                        const keys = Object.keys(a);
                        if (keys.length === 2 && keys.includes('v') && keys.includes('n') && /^\d+$/.test(part)) {
                            a = a.v;
                        }
                    }
                    if (a.hasOwnProperty(part)) a = a[part];
                }
                //Value of path of b
                for (const part of path) {
                    if (typeof b === 'string') {
                        try {
                            b = JSON.parse(b);
                        } catch (err) { }
                    }

                    if (typeof b === 'object') {
                        const keys = Object.keys(b);
                        if (keys.length === 2 && keys.includes('v') && keys.includes('n') && /^\d+$/.test(part)) {
                            b = b.v;
                        }
                    }
                    if (b.hasOwnProperty(part)) b = b[part];
                }   
                return bu.compare(a,b)
            });
            
            if (descending) arr.v.reverse();

            if (!arr.n)
                return bu.serializeTagArray(arr.v);
            await context.variables.set(arr.n, arr.v);

        })
        .build();
