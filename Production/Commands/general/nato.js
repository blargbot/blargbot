const { GeneralCommand } = require('../../../Core/Structures/Command');

class NatoCommand extends GeneralCommand {
  constructor(client) {
    super(client, {
      name: 'nato',
      minArgs: 1
    });
  }

  get nato() {
    return {
      a: 'Alpha',
      b: 'Bravo',
      c: 'Charlie',
      d: 'Delta',
      e: 'Echo',
      f: 'Foxtrot',
      g: 'Golf',
      h: 'Hotel',
      i: 'India',
      j: 'Juliett',
      k: 'Kilo',
      l: 'Lima',
      m: 'Mike',
      n: 'November',
      o: 'Oscar',
      p: 'Papa',
      q: 'Quebec',
      r: 'Romeo',
      s: 'Sierra',
      t: 'Tango',
      u: 'Uniform',
      v: 'Victor',
      w: 'Whiskey',
      x: 'Xray',
      y: 'Yankee',
      z: 'Zulu'
    };
  }

  async execute(ctx) {
    let input = ctx.input._.join('').replace(/[^a-z]/gi, '');
    let output = [];

    for (const char of input) {
      output.push(this.nato[char.toLowerCase()]);
    }

    return output.join(' ');
  }
}

module.exports = NatoCommand;