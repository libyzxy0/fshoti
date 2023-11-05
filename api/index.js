const express = require('express');
const cors = require('cors');
const app = express();
const tikwm = require('./tikwm');
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

(async function () {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
})();

async function writeData(collection, data) {
  try {
    const database = client.db(process.env.DB_NAME);
    const col = database.collection(collection);
    const result = await col.insertOne(data);
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function readData(collection) {
  try {
    const database = client.db(process.env.DB_NAME);
    const col = database.collection(collection);
    const result = await col.find({}).toArray();
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function updateData(collection, dataID, newData) {
  try {
    const database = client.db(process.env.DB_NAME);
    const col = database.collection(collection);
    const result = await col.findOneAndUpdate({ _id: dataID }, { $set: newData });
    return result;
  } catch (error) {
    console.log(error);
  }
}

function shuffle(array) {
  const newArray = array.slice();

  // Randomly choose between Fisher-Yates shuffle and a simple random shuffle
  const useFisherYates = Math.random() < 0.5;

  if (useFisherYates) {
    // Fisher-Yates shuffle
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
  } else {
    // Simple random shuffle
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * newArray.length);
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
  }

  return newArray;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/api/info', async (req, res) => {
  let { f: method } = req.body;
  let apikeyList = await readData('apikeys');
  console.log(method);

  if (method == 'leaderboard') {
    apikeyList.sort((a, b) => b.requests - a.requests);
    let top = apikeyList.slice(0, 100);
    const final = top.filter(item => item.requests !== 0);
    res.type('json').send(JSON.stringify(final, null, 2) + '\n');
  } else if (method == 'stats') {
    let videoCount = await readData('videos');
    const totalRequests = apikeyList.reduce((accumulator, currentItem) => accumulator + currentItem.requests, 0);
    res.send({
      videos: videoCount.length,
      users: apikeyList.length,
      requests: totalRequests
    });
  } else {
    res.send({ msg: "Method not allowed" });
  }
});

app.post('/api/createkey', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      res.send({ success: false });
      return;
    }
    console.log(username);

    const uniqueId = Date.now().toString(32) + Math.random().toString(32).substr(3);
    let result = await writeData('apikeys', {
      username: username ? username : 'Unknown',
      apikey: `$shoti-${uniqueId}`,
      requests: 0,
      createdAt: new Date()
    });

    res.send({ success: true, apikey: '$shoti-' + uniqueId, username: result });
  } catch (err) {
    res.send({ success: false });
  }
});

app.post('/api/v1/add', async (req, res) => {
  try {
    const { url, apikey } = req.body;
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(3);

    let videos = await readData('videos');
    let apikeys = await readData('apikeys');

    let video = videos.find((vid) => vid.url === url);
    if (!video) {
      res.send({ success: false });
      return;
    }

    let apiKey = apikeys.find((key) => key.apikey === apikey);
    if (!apiKey) {
      res.send({ success: false });
      return;
    }

    writeData('videos', {
      url: url,
      id: uniqueId,
      addedDate: new Date()
    }).then(() => {
      res.send({ success: true, id: uniqueId });
    }).catch((err) => {
      console.log(err);
      res.send({ success: false });
    });
  } catch (err) {
    console.log(err);
    res.send({ success: false });
  }
});

const cache = {
  apikeys: null,
  videos: null,
};

const mutex = {
  apikeyLock: false,
};

app.post('/api/v1/get', async (req, res) => {
  try {
    const { apikey } = req.body;

    if (!cache.apikeys) {
      cache.apikeys = await readData('apikeys');
    }

    const apikeys = cache.apikeys;
    apikeys.sort((a, b) => b.requests - a.requests);
    const topUsers = apikeys.slice(0, 100);

    // Use a mutex to prevent concurrent access to apiKeyData
    if (mutex.apikeyLock) {
      // Handle the case when another request is already accessing the apiKeyData
      return res.status(429).json({
        code: 429,
        message: 'Concurrent request, please try again later',
      });
    }

    mutex.apikeyLock = true;
    const apiKeyData = apikeys.find((key) => key.apikey === apikey);
    mutex.apikeyLock = false;

    if (!apiKeyData) {
      return res.status(401).json({
        code: 401,
        message: 'error-apikey-invalid',
      });
    }

    await updateData('apikeys', apiKeyData._id, {
      requests: apiKeyData.requests + 1,
    });

    const userRank = topUsers.findIndex((item) => item.apikey === apiKeyData.apikey) + 1;

    const videoResponse = await generateVideo(apikey, userRank);

    if (!videoResponse || videoResponse.code !== 200) {
      console.error('Error:', videoResponse);
      const retryResponse = await generateVideo(apikey, userRank);
      return res.status(retryResponse.code).json(retryResponse);
    }

    return res.status(200).json(videoResponse);
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ code: 500, error: err.message });
  }
});

async function generateVideo(apikey, userRank) {
  if (!cache.videos) {
    cache.videos = await readData('videos');
  }

  const videos = cache.videos;
  const shuffledVideos = shuffle(videos);
  const randomIndex = getRandomInt(0, shuffledVideos.length - 1);
  const randomVideo = shuffledVideos[randomIndex];
  const videoId = randomVideo.url;

  try {
    const videoInfo = await tikwm.getVideoInfo(videoId);

    return {
      code: videoInfo ? 200 : 400,
      message: videoInfo ? 'success' : 'error',
      data: {
        _shoti_rank: userRank,
        region: videoInfo.data?.region,
        url: 'https://shoti-api.libyzxy0.repl.co/video-cdn/' + videoInfo.data?.id,
        cover: 'http://tikwm.com/video/cover/' + videoInfo.data?.id + '.webp',
        title: videoInfo.data?.title,
        duration: videoInfo.data?.duration + 's',
        user: {
          username: videoInfo.data.author.unique_id,
          nickname: videoInfo.data.author.nickname,
        },
      },
    };
  } catch (err) {
    console.error('Regenerating...');
    return generateVideo(apikey, userRank);
  }
}

app.listen(3000, () => {
  console.log(`App is listening on port 3000.`);
});