function splitInput(text) {
  let words = [];
  text = text.replace(/\n/g, '\n ');
  let chars = text.split('');
  let escaped = false;
  let inPhrase = false;
  let temp = '';
  for (let i = 0; i < chars.length; i++) {
    switch (chars[i]) {
      case '\\':
        if (escaped)
          temp += '\\';
        else escaped = true;
        break;
      case '"':
        if (temp == '') {
          if (escaped) {
            temp += '"';
            escaped = false;
          }
          else inPhrase = true;
        } else {
          if (inPhrase && (chars[i + 1] == ' ' || chars[i + 1] == undefined) && !escaped) {
            inPhrase = false;
            words.push(temp.replace(/\n /g, '\n'));
            temp = '';
          } else {
            temp += '"';
            escaped = false;
          }
        };
        break;
      case ' ':
        if (escaped) temp += ' ';
        else if (!inPhrase && temp != '') {
          words.push(temp);
          temp = '';
        } else if (inPhrase) temp += ' ';
        if (escaped) escaped = false;
        break;
      default:
        temp += chars[i];
        if (escaped) escaped = false;
        break;
    }
  }
  if (temp != '')
    words.push(temp);
  return words;
}

console.log(splitInput(`Hello! My name is george.`));
console.log(splitInput(`Hello! "My name" is george.`));
console.log(splitInput(`Hello! \\"My name" is george.`));
console.log(splitInput(`"Hello! My name" "is ge"org"e.\\" It's nice" to meet you`));
console.log(splitInput(`"Hello! My name" "is ge"org"e." It's
nice to "meet
  you"`));
console.log(splitInput(`Hello! My name \\ \\  is george\\ .`));
