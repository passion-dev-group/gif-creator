const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const GIFEncoder = require('gifencoder');

const frameCount = 40;
const endHoldFrames = 10;
const frameSize = { width: 800, height: 1600 };

const popEaseOut = (t) => {
    if (t < 0.7) return Math.pow(1.25 * t, 1.8);
    if (t < 0.8) return 1.05 - (0.2 * (t - 0.6)) / 0.2;
    return 1.0 - 0.05 * (1 - t) / 0.2;
}

const createGif = async (uploadedPath, outputPath, envelopBackImg, envelopFrontImg) => {
    const middle = await loadImage(uploadedPath);
    const canvas = createCanvas(frameSize.width, frameSize.height);
    const ctx = canvas.getContext('2d');

    const encoder = new GIFEncoder(frameSize.width, frameSize.height);
    const gifStream = fs.createWriteStream(outputPath);
    encoder.createReadStream().pipe(gifStream);

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(80);
    encoder.setDispose(2);

    encoder.setTransparent(); // Use default transparent index


    const letterTotalUp = frameSize.height * 0.3;
    const envelopeTotalDown = frameSize.height;
    const baseLetterY = frameSize.height * 0.55;
    const baseEnvY = 50;
    const slideStartFrame = Math.floor(frameCount / 2);
    let letterHeight = frameSize.height / 3.5;

    const dy = (frameSize.height / 2 - letterHeight) / slideStartFrame;

    for (let i = 0; i < frameCount; i++) {
        const t = i / (frameCount - 1);
        const bounce = popEaseOut(t);

        const letterY = baseLetterY - bounce * letterTotalUp;
        let envelopeY = baseEnvY;

        if (i >= slideStartFrame) {
            const slideT = (i - slideStartFrame) / (frameCount - slideStartFrame - 1);
            envelopeY = baseEnvY + slideT * envelopeTotalDown;
        }

        let diffY = 0;
        if (i < slideStartFrame) {
            letterHeight = letterHeight + dy;
            diffY = dy * i;
        }

        // ctx.fillStyle = 'transparent';
        // ctx.fillRect(0, 0, frameSize.width, frameSize.height);
        ctx.clearRect(0, 0, frameSize.width, frameSize.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, frameSize.width, frameSize.height);

        ctx.drawImage(envelopBackImg, 0, envelopeY, frameSize.width, frameSize.height / 2);
        ctx.drawImage(middle, 0, letterY - diffY, frameSize.width, letterHeight);
        ctx.drawImage(envelopFrontImg, 0, envelopeY + frameSize.height / 2, frameSize.width, frameSize.height / 2);

        encoder.addFrame(ctx);
    }

    for (let i = 0; i < endHoldFrames; i++) {
        encoder.addFrame(ctx);
    }

    encoder.finish();
    console.log(`✅ Created: ${outputPath}`);
}

module.exports = createGif;
