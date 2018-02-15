const Sherlock = require('sherlockjs');
const parse = require('parse-duration');

function parseDate(text) {
  let locked;
  let time = parse(text);
  if (time === 0) {
    locked = Sherlock.parse(text);

    if (locked.startDate && locked.endDate) {
      time = locked.endDate - locked.startDate;
    } else if (locked.startDate) {
      time = locked.startDate - Date.now();
    }
  }  //console.log(locked);
  console.log(time + ' - ' + text + ' ' + JSON.stringify(locked));
  return time || null;
}


parseDate('next tuesday');
parseDate('february 25th');
parseDate('5m2s4d');
parseDate('5 days');
parseDate('5d');
parseDate('tomorrow at 4:30pm');
parseDate('tomorrow at 4:30pm MST');
parseDate('tomorrow at 4:30pm UTC');
parseDate('tomorrow at 4:30pm MST UTC');
parseDate('aasfsafsad');