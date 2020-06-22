const fetch = require('node-fetch');
const xml2js = require('xml2js');


if (require.main === module) {
  (async () => {
    const data = await fetchXML(process.argv[2]);
    console.log(data);
  })();
}

async function fetchXML(url) {
  const res = await fetch(url);
  const content = await res.text();
  const xml = await parseXML(content);
  return parse(xml);
}

function parse(xml) {
  if (xml.Report.Control[0].Status[0] != '通常') return;

  const data = {};
  data.type     = xml.Report.Control[0].Title[0];
  data.office   = xml.Report.Control[0].PublishingOffice[0];
  data.title    = xml.Report.Head[0].Title[0];
  data.datetime = xml.Report.Head[0].ReportDateTime[0];
  data.headline = xml.Report.Head[0].Headline[0].Text[0];

  data.pref = parsePref(xml);
  data.cities = parseCity(xml);
  return data;
}

function parsePref(xml) {
  const warning = xml.Report.Body[0].Warning[0];
  const area = warning.Item[0].Area[0];
  return { code: area.Code[0], name: area.Name[0] };
}

function parseCity(xml) {
  const warning = xml.Report.Body[0].Warning[3];

  const cities = {};
  warning.Item.forEach(item => {
    const code = item.Area[0].Code[0];
    
    cities[code] = {
      name: item.Area[0].Name[0],
      warnings: getWarnings(item.Kind),
      status: getStatus(item.Kind)
    };
  });

  return cities;
}

function getWarnings(kinds) {
  if (kinds[0].Status[0] === '発表警報・注意報はなし') {
    return [];
  } else {
    const names = kinds.filter(kind => kind.Status[0] !== '解除').map(kind => kind.Name[0]);
    return names;
  }
}

function getStatus(kinds) {
  if (kinds[0].Status[0] === '発表警報・注意報はなし') {
    return 'none';
  } else {
    const names = kinds.filter(kind => kind.Status[0] !== '解除').map(kind => kind.Name[0]);
    if (names.find(d => d.includes('特別警報'))) return 'emergency';
    if (names.find(d => d.includes('警報'))) return 'warning';
    if (names.find(d => d.includes('注意報'))) return 'advisory';
    return 'none';
  }
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

module.exports = { fetchXML };
