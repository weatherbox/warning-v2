const fetch = require('node-fetch');
const xml2js = require('xml2js');


if (require.main === module) {
  fetchXML(process.argv[2]);
}


async function fetchXML(url) {
  const res = await fetch(url);
  const content = await res.text();
  const xml = await parseXML(content);
  console.log(xml);
}

function parseXML(data) {
  return new Promise(function (resolve, reject) {
    const parser = new xml2js.Parser();
    parser.parseString(data, (err, xml) => {
      if (err) reject(err);
      resolve(xml);
    });
  });
}
