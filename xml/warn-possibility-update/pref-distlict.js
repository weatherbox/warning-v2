const jsonfile = require('jsonfile')


const list = jsonfile.readFileSync('./list.json');

const prefs = {};
const distlicts = {};

Object.keys(list).forEach(prefCode => {
  const pref = list[prefCode];
  const codes = Object.keys(pref.data);
  prefs[prefCode] = codes;

  codes.forEach(code => {
    distlicts[code] = prefCode;
  });
});

console.log(prefs);
jsonfile.writeFileSync('pref-distlict.json', prefs);

console.log(distlicts);
jsonfile.writeFileSync('distlict-pref.json', distlicts);
