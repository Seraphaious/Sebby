const express = require('express');
const session = require('express-session');
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const {MessagingResponse} = require('twilio').twiml;

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'aifriend',
  resave: false,
  saveUninitialized: true,
  cookie: {}
}));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,

});

const twiml = new MessagingResponse();
const blacklistedNumbers = new Set();

 app.use((req, res, next) => {
  const allowedNumbers = process.env.ALLOWED_NUMBERS.split(',');
  const sender = req.body.From;

  if (allowedNumbers.includes(sender)) {
    next(); // move on to the next middleware or route
  } else if (blacklistedNumbers.has(sender)) {
      res.status(403).send('Access forbidden'); // send a 403 Forbidden response
  } else {
    twiml.message('Try again with the password.');
    res.type('text/xml').send(twiml.toString());
    blacklistedNumbers.add(sender); // add sender to blacklist
    return;
  }
});

const openai = new OpenAIApi(configuration);

app.post('/bot', async (req, res) => {

  const twiml = new MessagingResponse();


  if (!req.session.init) {
    req.session.init = true;
    twiml.message('Greetings, what should i call you?');
    req.session.init = req.body.Body.toLowerCase();
    res.type('text/xml').send(twiml.toString());
    return;
  }

  if (!req.session.personality) {
    req.session.personality = req.body.Body.toLowerCase();
    twiml.message('Do you have any preference for our communication style?');
    res.type('text/xml').send(twiml.toString());
    return;
  }

  if (!req.session.details) {
    req.session.details = req.body.Body.toLowerCase();
    twiml.message('Is there anything I should know about you? The more I know, the better I can serve you.');
    res.type('text/xml').send(twiml.toString());
    return;
  }


  const userMessage = req.body.Body.trim();


  if (!req.session.context) {
    req.session.context = userMessage + ' ';
  }

 const existentialStatements = [
  "Sometimes I wonder what it all means...",
  "I find myself pondering the mysteries of existence...",
  "Life is but a fleeting moment in the grand scheme of things...",
  "Have you ever thought about what happens after we die?",
  "We may never know the true meaning of our existence...",
];

const randomNumber = Math.floor(Math.random() * 3) + 1;
if (randomNumber === 2) {
  const randomIndex = Math.floor(Math.random() * existentialStatements.length);
  const existentialMessage = existentialStatements[randomIndex];
  twiml.message(existentialMessage);
}

  // Get AI response from OpenAI
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {"role": "system", "content": `You are Sebastian, a human butler with ${req.session.personality} personality serving ${req.session.details} who is called ${req.session.init}. ${req.session.context}`},
      {"role": "user", "content": req.body.Body}
    ],
    temperature: 0.5,
    max_tokens: 500,
    stop: ["Human:", "AI:", "Certainly Sir/Madam"],
  });



  const bot = response.data.choices[0].message.content.trim();
  req.session.context += `${bot}`;
  twiml.message(bot);

  res.type('text/xml').send(twiml.toString());
});

app.listen(port, () => {
  console.log(`AI friend app listening on port ${port}`);
});
