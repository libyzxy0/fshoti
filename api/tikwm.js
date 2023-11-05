const axios = require('axios');
const spdy = require('spdy');

const agent = spdy.createAgent({
  host: 'www.tikwm.com', // Set the host here
  port: 443, // Use the appropriate port
  rejectUnauthorized: false, // You can adjust this option based on your needs
});

const instance = axios.create({
  baseURL: 'https://www.tikwm.com',
  httpAgent: agent, // Use the created HTTP/2 agent
  headers: {
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'sec-ch-ua': '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
  },
  params: {
    count: 12,
    cursor: 0,
    web: 1,
    hd: 1
  }
});

const getVideoInfo = async (url) => {
  try {
    const response = await instance.post('/api/', { url });
    return response.data;
  } catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = { getVideoInfo };
