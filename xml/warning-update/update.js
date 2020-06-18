const { Storage } = require('@google-cloud/storage');
const bucketName = 'weather-warning';
const indexJson = 'warning.json';

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
  const data = await query();
  await uploadPublic(indexJson, data);
}


async function query() {
  const query = datastore.createQuery('jma-xml-weather-warning');
  const [infos] = await datastore.runQuery(query);

  const cities = {};
  const prefs = {};
  let lastUpdated = 0;
  infos.forEach(d => {
    const prefCode = d[datastore.KEY].name;
    prefs[prefCode] = {
      headline: d.headline,
      datetime: d.datetime,
      prefName: d.data.pref.name,
    };

    for (let code in d.data.cities) {
      const city = d.data.cities[code];
      city.prefCode = prefCode;
      cities[code] = city;
    }

    if (new Date(d.datetime) > new Date(lastUpdated)) lastUpdated = d.datetime;
  });
  console.log(lastUpdated);

  return { cities, prefs, lastUpdated };
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
