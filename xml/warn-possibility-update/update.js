const { Storage } = require('@google-cloud/storage');
const bucketName = 'weather-warning';
const indexJson = 'possibility.json';

const { Datastore } = require('@google-cloud/datastore');
const projectId = 'weatherbox-217409';
const datastore = new Datastore({ projectId });

const prefCodes = require('./distlict-pref.json');


exports.handler = (event, context) => {
  main();
};

if (require.main === module) {
  main();
}

async function main() {
  const tommorow = await query('jma-xml-warning-possibility-1');
  const dayafter = await query('jma-xml-warning-possibility-2');

  if (tommorow && dayafter) {
    const { t, all } = joinPrefs(tommorow, dayafter);
    const data = { tommorow: t, dayafter, all };
    await uploadPublic(indexJson, data);
  }
}


async function query(type) {
  const query = datastore.createQuery(type);
  const [infos] = await datastore.runQuery(query);

  const target = infos[0].target;
  if (!infos.some(d => d.target != target)) {
    console.log(type, "diff target", target);
    return;
  }

  const areas = {};
  const ranks = [];
  infos.forEach(d => {
    const id = d[datastore.KEY].name;
    d.data.possibility.areas.forEach(area => {
      area.reportDatetime = d.data.reportDatetime;
      areas[area.area.code] = area;
      ranks.push(area.possibilityAll);
    });
  });

  const count = countRanks(ranks);
  console.log(type, count);
  const timeDefine = infos[0].data.possibility.timeDefine;
  return { areas, timeDefine, count };
}


function countRanks(ranks) {
  const count = ranks[0].map((_, i) => {
    const t = ranks.map(rank => rank[i]);
    return t.filter(d => ['高', '中'].includes(d)).length;
  });
  return count;
}


function joinPrefs(p1, p2) {
  const all = {};

  for (let code in p1.areas) {
    const ap1 = p1.areas[code];
    const prefCode = getPrefCode(code, p2);
    ap1.area.prefCode = prefCode;
    
    const ap2 = p2.areas[prefCode];
    if (!ap2) console.warn(code, ap1.area.name, prefCode);
    const ranks = [].concat(...[ap1, ap2].map(p => p.possibilityAll));
    all[code] = getMaxRank(ranks); 
  }

  return { t: p1, all };
}


// 府県週間天気予報の発表単位
// 季節細分 [一時細分, ...]
// https://www.jma.go.jp/jma/kishou/know/kurashi/shukan_saibun.html
const table = {
  '130020': '130100', // 伊豆諸島北部: 伊豆諸島
  '130030': '130100', // 伊豆諸島南部: 伊豆諸島

  // 青森県
  '020010': '020100', // 津軽
  '020020': ['020100', '020200'], // 下北
  '020030': '020200', // 三八上北

  '030020': '030100', // 岩手県 沿岸北部: 沿岸
  '030030': '030100', // 岩手県 沿岸南部: 沿岸
  
  // 福島県 中通り・浜通り
  '070010': '070100',
  '070020': '070100',

  // 長野県 中部・南部
  '200020': '200100',
  '200030': '200100',

  // 長崎県 南部・北部・五島
  '420010': '420100',
  '420020': '420100',
  '420040': '420100',

  "012010": '012000', // 上川地方
  "012020": '012000', // 留萌地方
  "014020": ['014100', '014000'], // 釧路地方
  "014010": ['014100', '014000'], // 根室地方
  "014030": "014000", // 十勝地方 **
  "015010": '015000', // 胆振地方
  "015020": '015000', // 日高地方
  "016010": '016000', // 石狩地方
  "016020": '016000', // 空知地方
  "016030": '016000', // 後志地方
  "017010": '017000', // 渡島地方
  "017020": '017000', // 檜山地方
}
function getPrefCode(code, p2) {
  const prefCode = prefCodes[code];
  if (p2.areas[code]) {
    return code;

  } else if (p2.areas[prefCode]) {
    return prefCode;

  } else if (table[code]) {
    if (Array.isArray(table[code])) {
      for (let c of table[code]) {
        if (p2.areas[c]) return c;
      }

    } else {
      return table[code];
    }
  }
}

function getMaxRank(ranks) {
  if (ranks.includes('高')) return '高';
  if (ranks.includes('中')) return '中';
  return null;
}

async function uploadPublic(filename, data) {
  const storage = new Storage();
  const file = await storage.bucket(bucketName).file(filename);
  await file.save(JSON.stringify(data), {
    contentType: 'application/json',
    gzip: true,
    matadata: {
      cacheControl: 'no-cache'
    }
  });
  await file.makePublic();
}
