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

app.get('/', async (req, res) => {
   let apikey = req.query.apikey;
   let apikeys = await readData('apikeys');
   let videos = await readData('videos');
   let auth = apikeys.find((keys) => keys.apikey === apikey);
   if (auth) {
      let cookedData = {};
      async function generate() {
         let shuffledVideos1 = shuffle(videos);
         let shuffledVideos = shuffle(shuffledVideos1);
         //Randomly choose shuffled videos
         let video = shuffledVideos[Math.floor(shuffledVideos.length * Math.random())];
         let sub_video = shuffledVideos[Math.floor(shuffledVideos.length * Math.random())];
         //====Randomizer End====
         let tt = await getVideoInfo(video.url);

         cookedData = {
            code: tt.error ? 500 : 200,
            message: tt.error ? "error" : "success",
            data: {
               url: tt.data.url,
               play: tt.data.play,
               wmplay: tt.data.wmplay,
               duration: tt.data.duration,
               id: video.id,
               error: tt.data.error
            },
            user: {
               username: tt.user.unique_id ? tt.user.unique_id : `Hello ${rd.username}, your requested source hasn't returned by the cdn.\n\nYou don't want to receive this error?, set 'refresh_error' option to true.`,
               nickname: tt.user.nickname,
               id: tt.user.id,
            },
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
         error: 'Authenticate firsts'
      });
   }
})

app.get('*', (req, res) => {
   res.redirect('https://shoti-api.libyzxy0.repl.co/');
})
app.listen(3000, () => {
   console.log(`App is listening on port 3000.`);
})