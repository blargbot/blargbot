/**
 * @Author: RagingLink 
 * @Date: 2020-08-17 14:03:17
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-05-20 23:03:10
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

 const Builder = require('../structures/TagBuilder');
 let operators = {
     '&': (a, b) => a & b,
     '|': (a, b) => a | b,
     '^': (a, b) => a ^ b,
     '~': (a) => ~a,
     '<<': (a, b) => a << b,
     '>>': (a, b) => a >> b,
     '>>>': (a, b) => a >>> b
 }
 
 module.exports =
     Builder.AutoTag('bitwise')
         .acceptsArrays()
         .withArgs(a => [a.require('operator'), a.require('value'), a.optional('othervalue', true)])
         .withAlias('bitmath')
         .withDesc(`Performs a bitwise operation on the provided value(s). Supplied values must be binary numbers.\nValid operators are: \`${Object.keys(operators).join(', ')}\``)
         .withExample(
             '{bitwise;^;1000;1001}',
             '1000'
         ).whenArgs('0-1', Builder.errors.notEnoughArguments)
         .whenDefault(async (subtag, context, args) => {
             if (!operators.hasOwnProperty(args[0]))
                 return Builder.errors.invalidOperator(subtag, context);
             let operator = operators[args[0]]
             
             if (args[0] === '~')
                 return operator(parseInt(args[1], 2)).toString(2);
             if(args.length === 2) 
                 return Builder.errors.notEnoughArguments(subtag, context);
 
             let values = Builder.util.flattenArgArrays(args.slice(1));
             values = values.map(v => parseInt(v, 2))
 
             if (values.filter(i => isNaN(i) || i === undefined).length > 0)
                 return Builder.errors.notANumber(subtag, context);
         
             return values.reduce(operator).toString(2);
         }).build();