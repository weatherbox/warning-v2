const { PubSub } = require('@google-cloud/pubsub');
const { Datastore } = require('@google-cloud/datastore');
const projectId = 'weatherbox-217409';
const datastore = new Datastore({ projectId });

const warning = require('./xml')


exports.handler = async (event, context) => {
  const pubsubMessage = event.data;
  const message = JSON.parse(Buffer.from(pubsubMessage, 'base64').toString());
  console.log(message);

  const data = await main(message.url);
  console.log(data);
};

if (require.main === module) {
  (async () => {
    const data = await main(process.argv[2]);
    console.log(data);
  })();
}


async function main(url) {
  const data = await warning.fetchXML(url);
  await saveDatastore(data);
  return data;
}


async function saveDatastore(data) {
  const id = data.pref.code;
  const entity = {
    key: datastore.key(['jma-xml-weather-warning', id]),
    data: [
      {
        name: 'datetime',
        value: new Date(data.datetime),
        excludeFromIndexes: true,
      },
      {
        name: 'pref',
        value: data.pref.name,
        excludeFromIndexes: true,
      },
      {
        name: 'headline',
        value: data.headline,
        excludeFromIndexes: true,
      },
      {
        name: 'data',
        value: data,
        excludeFromIndexes: true,
      },
    ]
  };

  try {
    await datastore.save(entity);
    await publishUpdate({ id });

  } catch (err) {
    console.error('ERROR:', err);
  }
}


async function publishUpdate(data) {
  const topicName = 'jma-xml-warning-update';
  const pubsub = new PubSub({projectId});

  const messageId = await pubsub.topic(topicName).publish(Buffer.from(JSON.stringify(data)));
  console.log("published: " + topicName);
}

