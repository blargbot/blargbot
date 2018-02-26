const ArgumentBuilder = require('./ArgumentBuilder');

class TagBuilder {
  static SimpleTag(name) { return new TagBuilder().withCategory(bu.TagType.SIMPLE).withName(name); }
  static ComplexTag(name) { return new TagBuilder().withCategory(bu.TagType.COMPLEX).withName(name); }
  static ArrayTag(name) { return new TagBuilder().withCategory(bu.TagType.ARRAY).withName(name); }
  static CCommandTag(name) { return new TagBuilder().withCategory(bu.TagType.CCOMMAND).withName(name); }

  constructor(init) {
    this.tag = {}
    this.execute = {
      preExec: [],
      conditional: [],
      default: null
    };

    this.withProp('init', init);
    this.withProp('isTag', true);
    this.withProp('requireCtx', false);
  }

  build() {
    this.tag.execute = function (exec) {
      return async function (params) {
        try {
          if (this.category === bu.TagType.CCOMMAND && !params.ccommand)
            return EnsureResponse(params, await bu.tagProcessError(params, '`Can only use in CCommands`'));

          if (this.staff && !params.isStaff)
            return EnsureResponse(params, await bu.tagProcessError(params, '`Author must be staff`'));

          let callback;

          for (const c of exec.conditional) {
            if (c.condition(params.args)) {
              callback = c.action;
              break;
            }
          }
          callback = callback || exec.default;

          if (callback == null)
            throw new Error('Missing default execution on subtag ' + this.name + '\nParams:' + JSON.stringify(params));

          for (const preExec of exec.preExec)
            await preExec(params);

          return EnsureResponse(params, await callback(params));
        }
        catch (e) {
          console.error(e);
          throw e;
        }
      }

      function EnsureResponse(params, result) {
        if (typeof result !== 'object')
          result = {
            replaceString: result
          };

        if (result.terminate === undefined) result.terminate = params.terminate;
        if (result.replaceContent === undefined) result.replaceContent = false;
        if (result.replaceString === undefined) result.replaceString = '';

        return result;
      }
    }(this.execute);

    console.debug('Tag built:', this.tag);
    return this.tag;
  }

  requireStaff(staff) {
    return this.withProp('staff', true);
  }

  withProp(key, value) {
    this.tag[key] = value;
    return this;
  }

  withDepreciated(depreciated) {
    return this.withProp('depreciated', depreciated);
  }

  withCategory(category) {
    return this.withProp('category', category);
  }

  withName(name) {
    return this.withProp('name', name);
  }

  withArgs(args) {
    if (typeof args === 'function') {
      let builder = ArgumentBuilder.Literal;
      args(builder);
      args = builder.build();
    }
    return this.withProp('args', args);
  }

  withUsage(usage) {
    return this.withProp('usage', usage);
  }

  withDesc(desc) {
    return this.withProp('desc', desc);
  }

  //Either code and output or code, input and output
  withExample(code, input, output) {
    if (output == null) {
      output = input;
      input = null;
    }
    this.withProp('exampleCode', code);
    this.withProp('exampleIn', input);
    this.withProp('exampleOut'.output);
    return this;
  }

  beforeExecute(...actions) {
    this.execute.preExec.push(...actions);
    return this;
  }

  whenArgs(condition, action) {
    if (typeof condition === 'number')
      this.whenArgs((args) => args.length === condition, action);
    else if (typeof condition === 'string') {
      condition = condition.replace(/\s*/g, '');
      if (/^[><=!]\d+$/.test(condition)) { //<, >, = or ! a single count
        let value = parseInt(condition.substr(1));
        switch (condition[0]) {
          case '<':
            this.whenArgs(args => args.length < value, action);
            break;
          case '>':
            this.whenArgs(args => args.length > value, action);
            break;
          case '!':
            this.whenArgs(args => args.length !== value, action);
            break;
          case '=':
            this.whenArgs(value, action);
            break;
        }
      } else if (/^(>=|<=)\d+$/.test(condition)) { //<= or >= a single count
        let value = parseInt(condition.substr(2));
        switch (condition.substr(0, 2)) {
          case '>=':
            this.whenArgs(args => args.length >= value, action);
            break;
          case '<=':
            this.whenArgs(args => args.length <= value, action);
            break;
        }
      } else if (/^\d+-\d+$/.test(condition)) { //inclusive range of values ex 2-5
        let split = condition.split('-'),
          from = parseInt(split[0]),
          to = parseInt(split[1]);

        if (from > to)
          from = (to, to = from)[0];
        this.whenArgs(args => args.length >= from && args.length <= to, action);
      } else if (/^\d+(,\d+)+$/.test(condition)) { //list of values ex 1, 2, 6
        let values = condition.split(',').map(v => parseInt(v));
        this.whenArgs(args => values.indexOf(args.length) != -1, action)
      } else if (/^\d+$/.test(condition)) {//single value, no operator
        this.whenArgs(parseInt(condition), action);
      } else
        throw new Error('Failed to determine conditions for ' + condition + ' for tag ' + this.name);
    } else if (typeof condition === 'function') {
      this.execute.conditional.push({
        condition: condition,
        action: action
      });
    }
    return this;
  }

  whenDefault(execute) {
    this.execute.default = execute;
    return this;
  }
}

TagBuilder.util = {
  async processAllSubtags(params) {
    for (let i = 1; i < params.args.length; i++) {
      params.args[i] = await bu.processTagInner(params, i);
    }
  },
  escapeInjection(text) {
    return bu.fixContent(text)
      .replace(new RegExp(bu.specialCharBegin, 'g'), '')
      .replace(new RegExp(bu.specialCharDiv, 'g'), '')
      .replace(new RegExp(bu.specialCharEnd, 'g'), '');
  },
  async flattenArgArrays(args) {
    let result = [];
    for (const arg of args) {
      let arr = await bu.deserializeTagArray(arg);
      if (typeof arr === 'object' && Array.isArray(arr.v))
        result.push(...arr.v);
      else
        result.push(arg);
    }
    return result;
  },

  async error(params, message) { return await bu.tagProcessError(params, '`' + message + '`'); }
};

TagBuilder.errors = {
  notEnoughArguments(params) { return TagBuilder.util.error(params, 'Not enough arguments'); },
  tooManyArguments(params) { return TagBuilder.util.error(params, 'Too many arguments'); },
  noUserFound(params) { return TagBuilder.util.error(params, 'No user found'); },
  noRoleFound(params) { return TagBuilder.util.error(params, 'No role found'); },
  noChannelFound(params) { return TagBuilder.util.error(params, 'No channel found'); },
  notANumber(params) { return TagBuilder.util.error(params, 'Not a number'); },
  notAnArray(params) { return TagBuilder.util.error(params, 'Not an array'); },
  invalidOperator(params) { return TagBuilder.util.error(params, 'Invalid operator'); }
};

module.exports = TagBuilder;

console.info('TagBuilder loaded');