const { Storage } = require('@google-cloud/storage');
const bucketName = 'weather-warning';
const indexJson = 'possibility.json';

const { Datastore } = require('@google-cloud/datastore');
const projectId = 'weatherbox-217409';
const datastore = new Datastore({ projectId });


exports.handler = (event, context) => {
  main();
};

if (require.main === module) {
  main();
}

async function main() {
  const tommorow = await query('jma-xml-warning-possibility-1');
  const dayafter = await query('jma-xml-warning-possibility-2');

  if (tommorow && dayafer) {
    const data = { tommorow, dayafter };
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
