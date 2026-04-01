const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4201;
const DIST = path.join(__dirname, 'dist', 'my-project', 'browser');

app.use(express.static(DIST));

// SPA fallback: Angular 18 outputs index.csr.html
app.get('*', (req, res) => {
  const indexCsr = path.join(DIST, 'index.csr.html');
  const indexHtml = path.join(DIST, 'index.html');
  const index = fs.existsSync(indexCsr) ? indexCsr : indexHtml;
  res.sendFile(index);
});

app.listen(PORT, () => {
  console.log(`Frontend for gateway: http://localhost:${PORT}`);
  console.log(`Then open http://localhost:8080 in browser`);
});
