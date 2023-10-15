const express = require('express');
const app = express();
const {
   MongoClient
} = require('mongodb');
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
   let videos = await readData('shotis');
      let shuffledVideos1 = shuffle(videos);
      let shuffledVideos = shuffle(shuffledVideos1);
      let video = shuffledVideos[Math.floor(shuffledVideos.length * Math.random())];
         
      res.type('json').send(JSON.stringify({
        url: 'https://shoti-api.libyzxy0.repl.co/video-cdn/' + video.video_id, 
        usernane: video.username, 
        nickname: video.nickname,
        title: video.title,
        duration: video.duration
      }, null, 2) + '\n');
   } catch (err) {
      res.send({ code: 500, error: err.message })
   }
})

app.listen(3000, () => {
   console.log(`App is listening on port 3000.`);
})