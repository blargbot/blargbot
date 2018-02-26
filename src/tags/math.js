/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:55
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:55
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

const operators = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '%': (a, b) => a % b,
  '^': (a, b) => Math.pow(a, b)
};

module.exports =
  Builder.ComplexTag('math')
    .withArgs(b => b.require('operator').require(b => b.addChild('values').allowMany(true)))
    .withDesc('Returns a number based on the operator and values. ' +
      'Valid operators are `' + Object.keys(operators).join('`, `') + '`')
    .withExample(
      '2 + 3 + 6 - 2 = {math;-;{math;+;2;3;6};2}',
      '2 + 3 + 6 - 2 = 9'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('<3', Builder.util.notEnoughArguments)
    .whenDefault(async params => {
      if (!operators.hasOwnProperty(params.args[1]))
        return await Builder.errors.invalidOperator(params);

      let operator = operators[params.args[1]];
      let values = await Builder.util.flattenArgArrays(params.args.slice(2));
      values = values.map(parseFloat);

      if (values.filter(isNaN).length > 0)
        return await Builder.util.notANumber(params);

      return values.reduce(operator);
    })
    .build();