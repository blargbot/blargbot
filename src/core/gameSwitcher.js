const moment = require('moment');
const holidays = require('../../holidays.json');

const games = [
  // { name: 'Important Update About Recent Events: https://blargbot.xyz/update' }
  // { name: 'Migration Plan for June 4th: https://blargbot.xyz/migration' }
  { name: 'Old version of blargbot. Do not use.' }
  // { name: `with tiny bits of string!` },
  // { name: `with a mouse!` },
  // { name: `with a laser pointer!`, type: 3 },
  // { name: `with a ball of yarn!` },
  // { name: `in a box!` },
  // { name: `the pitter-patter of tiny feet.`, type: 2 }
];

/**
 * Switches the game the bot is playing
 */
module.exports = async function switchGame() {
  let name = '', type = 0;

  const date = moment().format('MM-DD');
  if (holidays[date]) {
    name = holidays[date];
  } else {
    let game = games[Math.floor(Math.random() * games.length)];
    if (typeof game === 'function') game = game();
    name = game.name;
    if (game.type) type = game.type;
  }

  bot.editStatus("online", {
    name, type
  });
};

// switch (gameId) {
//   case 0:
//     name = `with ${bot.users.size} users!`;
//     break;
//   case 1:
//     type = 2;
//     name = `${bot.guilds.size} guilds!`;
//     break;
//   case 2:
//     type = 2;
//     name = `${Object.keys(bot.channelGuildMap).length} channels!`;
//     break;
//   case 3:
//     name = `with tiny bits of string!`;
//     break;
//   case 4:
//     name = `on version ${await bu.getVersion()}!`;
//     break;
//   case 5:
//     name = `type 'b!help'!`;
//     break;
//   case 6:
//     type = 3;
//     name = `a laser pointer!`;
//     break;
//   case 7:
//     name = `with a mouse!`;
//     break;
//   case 8:
//     name = `with a ball of yarn!`;
//     break;
//   case 9:
//     name = `in a box!`;
//     break;
//   case 10:
//     type = 3;
//     name = `you on cluster ${process.env.CLUSTER_ID}!`;
//     break;
//   case 11:
//     type = 2;
//     name = 'the pitter-patter of tiny feet.';
// }