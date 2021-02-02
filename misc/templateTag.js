/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:35:50
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:36:52
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

//Import the builder. You dont need this, but it has a lot of built in functionality
const Builder = require('../src/structures/TagBuilder');
const newbutils = require('../src/newbu');

module.exports =
    //Begin a new tag. Auto tags will be complex or simple based on if they have args or not.
    Builder.AutoTag('abs')
        //Does this accept arrays? Will already be set to true if the type is ArrayTag
        .acceptsArrays()
        //Specifies what arguments the tag accepts, purely for documentation. Return either an array or a single object
        //Uses '../src/structures/ArgumentFactory' for the builder
        .withArgs(a => a.require('number', true))
        //Set the description of the tag. MarkDown Compatible
        .withDesc('Gets the absolute value of `number`. If multiple are supplied, then an array will be returned')
        //Provide examples on how to use this tag
        .withExample(
            '{abs;-535}',
            '535'
        )
        //When arguments are <condition>, do this...
        // Conditions can be a function accepting (subtag, context, args), a number for the number of args,
        // or a string representing multiple values. Valid strings are:
        // ((\d+,)*\d+), (\d+-\d+), ((>|>=|<|<=|==|!=|=|!)\d+)
        .whenArgs(0, Builder.errors.notEnoughArguments)
        //Default case to be run if none of the conditional parameters are satisfied
        .whenDefault(async function (subtag, context, args) {
            let values = Builder.util.flattenArgArrays(args).map(newbutils.parse.float);
            if (values.filter(isNaN).length > 0)
                return Builder.errors.notANumber(subtag, context);
            values = values.map(Math.abs);
            if (values.length == 1)
                return values[0];
            return newbutils.serializeTagArray(values);
        })
        //Build into an actual tag object
        .build();