const { DataTag, DataCustomCommand } = require('../Structures/Data');
const Context = require('../Structures/Context');
const SubTag = require('./SubTag');
const TagArray = require('./TagArray');
const TagError = require('./TagError');

class TagContext extends Context {
  /* {
   *     ctx?, msg?, msgId?,
   *  content, author, name, isCustomCommand?
   * }
   */

  constructor(client, params = {}, data) {
    super(client,
      params.ctx ? params.ctx.msg : params.msg, // msg
      undefined, // text
      params.ctx ? params.ctx.prefix : _config.discord.prefix); // prefix

    this.content = params.content;
    this.fallback = null;

    this._author = params.author;
    this.name = params.name;
    console.log(params);
    this.isCustomCommand = params.isCustomCommand || data instanceof DataCustomCommand || false;
    console.log(this.isCustomCommand);
    this.terminate = false;
    this.isStaff = false;
    this.isAuthorStaff = false;

    this.result = '';

    this.data = data;

    this.totalLoops = 0;
    this.totalExecs = 0;
    this.totalTimers = 0;
    this.tempArgs = {};

    this.vars = {};
  }

  get user() {
    return this.msg.author;
  }

  get author() {
    return this._author;
  }

  async decode(key, args) {
    return await this.client.Helpers.Message.decode(this.channel, key, args);
  }

  async process() {
    try {
      this.isAuthorStaff = await this.checkStaff(this.author);
      this.rawContent = this.content || await this.data.getContent();
      this.lexedContent = await this.client.TagLexer.parse(this.rawContent);
      this.result = await this.processSub(this.lexedContent);
      return this.result.join('');
    } catch (err) {
      if (err instanceof TagError) {
        return 'Parsing Error: ' + await this.decode(err.key, err.args);
      } else {
        throw err;
      }
    }
  }

  async processSub(elemMap) {
    if (!Array.isArray(elemMap)) elemMap = [elemMap];
    const oldFallback = this.fallback;
    let content = [];
    for (const element of elemMap) {
      if (this.terminate) break;
      try {
        if (element instanceof SubTag) {
          let name = element.name;
          let pipe = element.pipe;
          if (Array.isArray(name)) {
            name = await this.processSub(name);
          }
          let display = true;
          if (Array.isArray(pipe)) {
            display = false;
            pipe = await this.processSub(pipe);
          }
          name = name.join('');

          if (this.client.TagManager.has(name)) {
            const res = await this.client.TagManager.execute(name, this, element.named ? element.namedArgs : element.args, element.named);
            if (res.terminate) this.terminate = true;
            if (res.replace) {
              if (res.replaceTarget) {
                content.replace(res.replaceTarget, res.content);
              } else {
                if (display)
                  if (Array.isArray(res.content) && !(res.content instanceof TagArray))
                    content.push(...res.content);
                  else
                    content.push(res.content);
              }
            } else {
              if (display)
                if (Array.isArray(res.content) && !(res.content instanceof TagArray))
                  content.push(...res.content);
                else
                  content.push(res.content);
            }
            if (!display && pipe != '')
              await this.client.TagVariableManager.executeSet(this, pipe, res.content);
          } else {
            throw new TagError(this.client.Constants.TagError.TAG_NOT_FOUND, { tag: name });
          }
        } else if (element instanceof TagArray) {
          for (let arrElm of element) {
            arrElm = await this.processSub(arrElm);
          }
          content.push(element);
        } else if (Array.isArray(element)) {
          content.push(await this.processSub(element));
        } else content.push(element);
      } catch (err) {
        if (err instanceof TagError) {
          if (err.decoded === '') content.push(''); // TODO: redo, messy
          if (err.decoded !== null) content.push(this.fallback || `\`${err.decoded}\``);
          else content.push(this.fallback || `\`${await this.decode(err.key, err.args)} [${element.rowIndex}:${element.columnIndex}]\``);
        } else {
          throw err;
        }
      }
    }
    this.fallback = oldFallback;
    return content;
  }
}

module.exports = TagContext;