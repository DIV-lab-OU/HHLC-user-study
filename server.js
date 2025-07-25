const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/submit', (req, res) => {
    const data = req.body;
    const timestamp = Date.now();
    const filename = `participant_${timestamp}.json`;
    const filepath = path.join(__dirname, 'data', filename);

    fs.writeFile(filepath, JSON.stringify(data, null, 2), err => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
