const { PubSub } = require('@google-cloud/pubsub');
const { Datastore } = require('@google-cloud/datastore');
const projectId = 'weatherbox-217409';
const datastore = new Datastore({ projectId });

const possibility = require('./xml');
const officeCode = require('./office-code.json');


exports.handler = async (event, context) => {
  const pubsubMessage = event.data;
  const message = JSON.parse(Buffer.from(pubsubMessage, 'base64').toString());
  console.log(message);

  await main(message.url);
};

if (require.main === module) {
  (async () => {
    const data = await main(process.argv[2]);
    console.dir(data, { depth: null });
  })();
}


async function main(url) {
  const data = await possibility.fetchXML(url);
  await saveDatastore(data);
  return data;
}


async function saveDatastore(data) {
  const id = officeCode[data.office];
  console.log(id);
  const entity = {
    key: datastore.key(['jma-xml-warning-possibility-1', id]),
    data: [
      {
        name: 'datetime',
        value: new Date(data.datetime),
        excludeFromIndexes: true,
      },
      {
        name: 'title',
        value: data.title,
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
  const topicName = 'jma-xml-warning-possibility-update';
  const pubsub = new PubSub({projectId});

  const messageId = await pubsub.topic(topicName).publish(Buffer.from(JSON.stringify(data)));
  console.log("published: " + topicName);
}

