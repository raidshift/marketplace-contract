const express = require('express')

const app = express();
const port = 3000;

app.use(express.static(__dirname));

app.get('/nft', (req, res) => {
  res.sendFile(__dirname + '/nft/index.html')
});

app.get('/', (req, res) => {
  res.redirect('/nft')
});

app.listen(port, () => {
  console.log(`flateric listening on port ${port}!`)
});