/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-05 17:19:13
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.ArrayTag('concat')
    .withArgs(a => a.require('arrays', true))
    .withDesc('Combines multiple arrays and outputs the new array.')
    .withExample(
      '{concat;["this", "is"];["an", "array"]}',
      '["this","is","an","array"]'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenDefault(async function(params) {
      let result = [];
      for (const value of params.args.slice(1)) {
        let arr = await bu.getArray(params, value);
        if (typeof arr === "object" && Array.isArray(arr.v))
          result.push(...arr.v);
        else
          return await Builder.errors.notAnArray(params);
      }
      return bu.serializeTagArray(result);
    })
    .build();