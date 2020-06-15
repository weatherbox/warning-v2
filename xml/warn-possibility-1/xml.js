const fetch = require('node-fetch');
const xml2js = require('xml2js');


if (require.main === module) {
  fetchXML(process.argv[2]);
}


async function fetchXML(url) {
  const res = await fetch(url);
  const content = await res.text();
  const xml = await parseXML(content);
  console.dir(xml, { depth: 3 });

  if (xml.Report.Control[0].Status[0] != '通常') return;

  const data = {};
  data.type     = xml.Report.Control[0].Title[0];
  data.office   = xml.Report.Control[0].PublishingOffice[0];
  data.title    = xml.Report.Head[0].Title[0];
  data.datetime = xml.Report.Head[0].ReportDateTime[0];

  parseInfos(xml);
  console.log(data);
}


// 警報級の可能性（明日まで）
function parseInfos(xml) {
  const infos = xml.Report.Body[0].MeteorologicalInfos[0];

  meteorologicalInfo(infos);

}


function meteorologicalInfo(infos) {
  const info = infos.MeteorologicalInfo[0];

  const datetime = {
    datetime: info.DateTime[0],
    duration: info.Duration[0]
  };

  const areas = info.Item.map(forecast_24h);
  console.dir(areas, { depth: null });
}

function forecast_24h(item) {
  console.log(item);

  const area = {
    code: item.Area[0].Code[0],
    name: item.Area[0].Name[0],
  };

  const forecast = {};
  item.Kind.forEach(kind => {
    const type = kind.Property[0].Type[0];
    const detail = kind.Property[0].DetailForecast[0];

    if (type === '２４時間最大雨量') {
      const part = detail.PrecipitationForecastPart[0];
      const precip = part.Base[0]['jmx_eb:Precipitation'];
      forecast['rain'] = {
        text: part.Sentence[0],
        value: precip ? getPrecipitation(precip) : null,
      };
      //TODO: SubArea, Local

    } else if (type === '２４時間最大降雪量') {
      const part = detail.SnowfallDepthForecastPart[0];
      forecast['snow'] = {
        text: part.Sentence[0],
      };
    }
  });
  return { area, forecast };
}


function getPrecipitation(precip) {
  return {
    v: findValue(precip,  '２４時間最大雨量'),
    min: findValue(precip,  '２４時間最大雨量（範囲の下端）'),
    max: findValue(precip,  '２４時間最大雨量（範囲の上端）'),
  };
}


function findValue(list, type) {
  const find = list.find(d => d.$.type === type);
  return find ? parseInt(find._) : null;
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
