'use strict';

const express = require('express');
// const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
// load .env content into process.env 
require('dotenv').config();
// require mongoose model
const URL_SH = require('./model');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Only allow cors with FCC
const corsOptions = {
  origin: 'https://www.freecodecamp.org',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  // const resp = await URL_SH.remove(); // --> delete all documents
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/', async function (req, res) {
  const id = req.query.id;
  res.redirect('/api/shorturl/' + id);
});

app.get('/api/shorturl/:id', async function (req, res) {
  const id = req.params.id;
  URL_SH.findOne({ short_url: id }, (err, document) => {
    if (err) return console.error(err);
    else if (!document) return res.send('ID was not found.');
    else return res.redirect(document.original_url);
  });
});

app.post('/api/shorturl/new', async function (req, res) {
  const url = req.body.url;
  // check if url is valid
  try {
    await validateURL(url);
  } catch (err) {
    console.log(err);
    return res.json({ 'error': 'invalid URL' });
  }
  // if url is valid, count existing entries and save document with incremented id
  let id = 1;
  URL_SH.estimatedDocumentCount((err, count) => {
    if (err) return console.error(err);
    id += count;
  })
    .then(() => {
      URL_SH.create({ original_url: url, short_url: id }, (err, _) => {
        if (err) return console.error(err);
      });
    })
    .then(() => {
      return res.json({ original_url: url, short_url: id });
    })
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});

async function validateURL(url) {
  return new Promise((resolve, reject) => {
    const url_regex = /^https?:\/\/www\.[\w]+\.([a-z]{2,}|[a-z]{2}\.[a-z]{2})(\/[\w]+)*$/i;
    if (!url_regex.test(url)) return reject('Invalid format. Ex: https://www.google.com');
    const urlToParse = url.split(/https?:\/\//)[1]; // cut off http protocol for dns lookup
    dns.lookup(urlToParse, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}