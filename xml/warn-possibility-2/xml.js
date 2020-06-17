const fetch = require('node-fetch');
const xml2js = require('xml2js');


if (require.main === module) {
  (async () => {
    const data = await fetchXML(process.argv[2]);
    console.dir(data, { depth: null });
  })();
}


async function fetchXML(url) {
  const res = await fetch(url);
  const content = await res.text();
  const xml = await parseXML(content);

  if (xml.Report.Control[0].Status[0] != '通常') return;

  let data = {};
  data.type     = xml.Report.Control[0].Title[0];
  data.office   = xml.Report.Control[0].PublishingOffice[0];
  data.title    = xml.Report.Head[0].Title[0];
  data.datetime = xml.Report.Control[0].DateTime[0];
  data.reportDatetime = xml.Report.Head[0].ReportDateTime[0];

  data = Object.assign(data, parseInfos(xml));
  return data;
}


// 警報級の可能性（明後日以降）
function parseInfos(xml) {
  const infos = xml.Report.Body[0].MeteorologicalInfos[0];

  const possibility = timeSeriesPossibility(infos);
  return { possibility };
}


// TimeSeriesInfo
// 警報級の可能性の予想 

function timeSeriesPossibility(infos) {
  const info = infos.TimeSeriesInfo[0];

  const timeDefine = info.TimeDefines[0].TimeDefine.map(time => {
    return {
      datetime: time.DateTime[0],
      duration: time.Duration[0],
    };
  });
  const areas = info.Item.map(possibilityRank);
  return  { timeDefine, areas };
}

function possibilityRank(item) {
  const area = {
    code: item.Area[0].Code[0],
    name: item.Area[0].Name[0],
  };

  const possibility = [];
  item.Kind.forEach(kind => {
    const property = kind.Property[0];
    const type = property.Type[0].replace('の警報級の可能性', '');
    const rank = possibilityRankOfWarningPart(property);
    if (rank) possibility.push({ type, rank });
  });

  const possibilityAll = possibility[0].rank.map((_, i) => {
    const ranks = possibility.map(p => p.rank[i]);
    if (ranks.includes('高')) return '高';
    if (ranks.includes('中')) return '中';
    return null;
  });

  return { area, possibility, possibilityAll };
}

function possibilityRankOfWarningPart(kind) {
  const ranks = kind.PossibilityRankOfWarningPart[0]['jmx_eb:PossibilityRankOfWarning'];
  if (ranks[0].$.condition === '提供なし' || ranks[0]._ === 'なし') return null;

  return  ranks.map(rank => {
    if (rank.$.condition === '値なし') {
      return null;
    } else { 
      return rank._
    }
  });
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
