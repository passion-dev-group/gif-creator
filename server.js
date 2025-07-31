const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { loadImage } = require('canvas');
const createGif = require('./animate'); // your existing function

const app = express();
const port = process.env.PORT || 3000;

// Configure multer
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public')); // to serve static frontend
app.use('/img', express.static(path.join(__dirname, 'img')));

// Handle file upload
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const uploadedPath = req.file.path; // e.g. 'uploads/abc123.png'
        const outputImgFolder = './img/output_gifs';
        const rawName = path.parse(req.file.originalname).name;
        const safeName = rawName.replace(/\s+/g, '-'); // replaces spaces with hyphens
        const gifFileName = `${safeName}-${Date.now()}.gif`;
        const outputPath = path.join(outputImgFolder, gifFileName);
        const gifUrlPath = path.posix.join('img/output_gifs', gifFileName);
        const gifUrl = `${req.protocol}://${req.get('host')}/${gifUrlPath}`;

        const envelopBackImg = await loadImage('./img/back-id.png');
        const envelopFrontImg = await loadImage('./img/front-id.png');

        await createGif(uploadedPath, outputPath, envelopBackImg, envelopFrontImg);

        return res.json({ success: true, gif: gifUrl });

    } catch (err) {
        console.error('Error generating gif:', err);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
});


// Serve upload form (optional)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Server listening at http://localhost:${port}`);
});
