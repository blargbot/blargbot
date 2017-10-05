/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-05 17:19:13
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

e.init = () => {
  e.category = bu.TagType.ARRAY;
};

e.requireCtx = require;

e.isTag = true;
e.name = `concat`;
e.args = `&lt;arrays&gt;...`;
e.usage = `{concat;arrays...}`;
e.desc = `Combines multiple arrays and outputs the new array.`;
e.exampleIn = `{concat;["this", "is"];["an", "array"]}`;
e.exampleOut = `["this","is","an","array"]`;

e.execute = async function (params) {
  for (let i = 1; i < params.args.length; i++) {
    params.args[i] = await bu.processTagInner(params, i);
  }
  let replaceContent = false;
  let replaceString;
  if (params.args.length >= 2) {
    params.args[1] = await bu.processTagInner(params, 1);
    let nArrs = [];
    for (let i = 1; i < params.args.length; i++) {
      let arr = await bu.getArray(params, params.args[i]);
      if (arr && Array.isArray(arr.v)) {
        nArrs.push(arr.v);
      } else {
        return {
          terminate: params.terminate,
          replaceString: '`Not an array`',
          replaceContent: replaceContent
        };
      }
    }
    replaceString = bu.serializeTagArray([].concat(...nArrs));
  } else {
    replaceString = await bu.tagProcessError(params, '`Not enough arguments`');
  }

  return {
    terminate: params.terminate,
    replaceString: replaceString,
    replaceContent: replaceContent
  };
};