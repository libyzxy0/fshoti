const express = require('express');
const app = express();
const {
   MongoClient
} = require('mongodb');
const {
   getVideoInfo
} = require('./tiktok-handler')
const client = new MongoClient(process.env.MONGO_URI);

(async function () {
   try {
      await client.connect();
      console.log('Connected to MongoDB');
   } catch (error) {
      console.error('Error connecting to MongoDB:', error);
   }
})()

async function readData(col) {
   try {
      const database = client.db(process.env.DB_NAME);
      const collection = database.collection(col);
      const query = {};
      const result = await collection.find(query).toArray();
      return result;
   } catch (error) {
      console.log(error);
   }
}

function shuffle(array) {
   let shuffledArray = array.slice();
   for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
   }
   return shuffledArray
}

app.get('/api', async (req, res) => {
  try {
   res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
   let apikey = req.query.apikey;
   let apikeys = await readData('apikeys');
   let videos = await readData('videos');
   let auth = apikeys.find((keys) => keys.apikey === apikey);
   if (true) {
      let cookedData = {};
      async function generate() {
         let shuffledVideos1 = shuffle(videos);
         let shuffledVideos = shuffle(shuffledVideos1);
         //Randomly choose shuffled videos
         let video = shuffledVideos[Math.floor(shuffledVideos.length * Math.random())];
         //====Randomizer End====
         let tt = await getVideoInfo(video.url);
         cookedData = {
            code: tt.error ? 500 : 200,
            url: tt.data.url,
            username: tt.user?.username,
         };
      }
      await generate();
      if (cookedData.code != 200) {
         await generate();
         return;
      }
      res.type('json').send(JSON.stringify(cookedData, null, 2) + '\n');
   } else {
      res.status(401).send({
         error: 'Authenticate first'
      });
   }
   } catch (err) {
      res.send({ code: 500, error: err.message })
   }
})

app.listen(3000, () => {
   console.log(`App is listening on port 3000.`);
})