const ArgFactory = require('./ArgumentFactory');

class TagBuilder {
  static SimpleTag(name) { return new TagBuilder().withCategory(bu.TagType.SIMPLE).withName(name); }
  static ComplexTag(name) { return new TagBuilder().withCategory(bu.TagType.COMPLEX).withName(name); }
  static ArrayTag(name) { return new TagBuilder().withCategory(bu.TagType.ARRAY).withName(name).acceptsArrays(true); }
  static CCommandTag(name) { return new TagBuilder().withCategory(bu.TagType.CCOMMAND).withName(name); }
  static AutoTag(name) { return new TagBuilder().withCategory(0).withName(name); }

  constructor(init) {
    this.properties = {};
    this.execute = {
      preExec: [],
      conditional: [],
      default: null
    };

    this.withProp('init', init);
    this.withProp('isTag', true);
    this.withProp('requireCtx', false);
    this.withProp('source', 'TagBuilder');
  }

  build() {
    let tag = Object.assign({}, this.properties);

    if (tag.category === 0) {
      if (tag.args != null && tag.args.length !== 0)
        tag.category = bu.TagType.COMPLEX;
      else
        tag.category = bu.TagType.SIMPLE;
    }

    tag.execute = function (tag, beforeExec, execConditional, execDefault) {
      return async function (params) {
        try {
          if (this.category === bu.TagType.CCOMMAND && !params.ccommand)
            return EnsureResponse(params, await TagBuilder.util.error(params, 'Can only use in CCommands'));

          if (this.staff && !params.isStaff)
            return EnsureResponse(params, await TagBuilder.util.error(params, 'Author must be staff'));

          let callback;

          for (const c of execConditional) {
            if (c.condition.apply(tag, [params.args])) {
              callback = c.action;
              break;
            }
          }
          callback = callback || execDefault;

          if (callback == null)
            throw new Error('Missing default execution on subtag ' + tag.name + '\nParams:' + JSON.stringify(params));

          for (const preExec of beforeExec)
            await preExec.apply(tag, [params]);

          return EnsureResponse(params, await callback.apply(tag, [params]));
        }
        catch (e) {
          console.error(e);
          throw e;
        }
      };

      function EnsureResponse(params, result) {
        console.debug('result: ', result);
        if (result == null)
          result = '';
        if (typeof result !== 'object')
          result = {
            replaceString: result
          };

        if (result.terminate == null) result.terminate = params.terminate;
        if (result.replaceContent == null) result.replaceContent = false;
        if (result.replaceString == null) result.replaceString = '';

        console.debug('result: ', result);

        return result;
      }
    }(tag,
      this.execute.preExec.slice(0),
      this.execute.conditional.slice(0),
      this.execute.default);

    //console.debug(tag.category, 'Tag built:', tag.name, ArgFactory.toString(tag.args));
    if (this.execute.preExec.length == 0)
      console.warn(`Tag ${this.properties.name} has no BeforeExecute set`);
    return tag;
  }

  withProp(key, value) {
    this.properties[key] = value;
    return this;
  }

  requireStaff(staff = true) {
    return this.withProp('staff', true);
  }

  acceptsArrays(array = true) {
    return this.withProp('array', array);
  }

  isDepreciated(depreciated = true) {
    return this.withProp('depreciated', depreciated);
  }

  withCategory(category) {
    return this.withProp('category', category);
  }

  withName(name) {
    return this.withProp('name', name);
  }

  withArgs(args) {
    if (typeof args === 'function')
      args = args(ArgFactory);
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
    this.withProp('exampleOut', output);
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
        this.whenArgs(args => values.indexOf(args.length) != -1, action);
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
    for (let i = 0; i < params.args.length; i++)
      params.args[i] = await bu.processTagInner(params, i);
  },
  /**
   * If params is an array rather than actually a params object then it will be used as an indexes array and this function will return another function.
   * Basically TagBuilder.util.processSubTags([1])(params) === TagBuilder.util.processSubTags(params, [1])
   */
  async processSubtags(params, indexes) {
    if (Array.isArray(params))
      return function (params) { return TagBuilder.util.processSubtags(params, indexes); };

    for (const index of indexes)
      params.args[index] = await bu.processTagInner(params, index);
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
      if (arr != null && Array.isArray(arr.v))
        result.push(...arr.v);
      else
        result.push(arg);
    }
    return result;
  },
  async error(params, message) { return await bu.tagProcessError(params, '`' + message + '`'); },
  parseChannel(params, channelId) {
    let channel = params.msg.channel;
    if (channel.id !== channelId) {
      if (!/([0-9]{17,23})/.test(channelId))
        return TagBuilder.errors.noChannelFound;
      channelId = channelId.match(/([0-9]{17,23})/)[0];
      channel = bot.getChannel(channelId);

      if (channel == null)
        return TagBuilder.errors.noChannelFound;
      if (channel.guild.id !== params.msg.guild.id)
        return p => TagBuilder.util.error(p, 'Channel must be in guild');
    }
    return channel;
  }
};

TagBuilder.errors = {
  notEnoughArguments(params) { return TagBuilder.util.error(params, 'Not enough arguments'); },
  tooManyArguments(params) { return TagBuilder.util.error(params, 'Too many arguments'); },
  noUserFound(params) { return TagBuilder.util.error(params, 'No user found'); },
  noRoleFound(params) { return TagBuilder.util.error(params, 'No role found'); },
  noChannelFound(params) { return TagBuilder.util.error(params, 'No channel found'); },
  noMessageFound(params) { return TagBuilder.util.error(params, 'No message found'); },
  notANumber(params) { return TagBuilder.util.error(params, 'Not a number'); },
  notAnArray(params) { return TagBuilder.util.error(params, 'Not an array'); },
  notABoolean(params) { return TagBuilder.util.error(params, 'Not a boolean'); },
  invalidOperator(params) { return TagBuilder.util.error(params, 'Invalid operator'); },
  userNotInGuild(params) { return TagBuilder.util.error(params, 'User not in guild'); },
  channelNotInGuild(params) { return TagBuilder.util.error(params, 'Channel not in guild'); },
  tooManyLoops(params) { return TagBuilder.util.error(params, 'Too many loops'); },
  unsafeRegex(params) { return TagBuilder.util.error(params, 'Unsafe regex detected'); }
};

module.exports = TagBuilder;

console.info('TagBuilder loaded');