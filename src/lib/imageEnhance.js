/**
 * Client-side Image Enhancement using Canvas API
 * Adjusts brightness, contrast, and saturation without API calls
 */

/**
 * Enhance image using Canvas API
 * @param {File} imageFile - The image file to enhance
 * @param {Object} adjustments - Enhancement adjustments
 * @returns {Promise<string>} - Enhanced image as data URL
 */
export async function enhanceImageWithCanvas(imageFile, adjustments = {}) {
    const {
        brightness = 1.2,    // 1.0 = normal, >1 = brighter
        contrast = 1.15,     // 1.0 = normal, >1 = more contrast
        saturation = 1.25,   // 1.0 = normal, >1 = more saturated
        sharpness = 1.1      // 1.0 = normal, >1 = sharper
    } = adjustments;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                try {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Set canvas size to image size
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw original image
                    ctx.drawImage(img, 0, 0);

                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // Apply enhancements pixel by pixel
                    for (let i = 0; i < data.length; i += 4) {
                        let r = data[i];
                        let g = data[i + 1];
                        let b = data[i + 2];

                        // 1. Adjust Brightness
                        r *= brightness;
                        g *= brightness;
                        b *= brightness;

                        // 2. Adjust Contrast
                        const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
                        r = factor * (r - 128) + 128;
                        g = factor * (g - 128) + 128;
                        b = factor * (b - 128) + 128;

                        // 3. Adjust Saturation
                        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
                        r = gray + saturation * (r - gray);
                        g = gray + saturation * (g - gray);
                        b = gray + saturation * (b - gray);

                        // Clamp values to 0-255
                        data[i] = Math.max(0, Math.min(255, r));
                        data[i + 1] = Math.max(0, Math.min(255, g));
                        data[i + 2] = Math.max(0, Math.min(255, b));
                    }

                    // Put modified image data back
                    ctx.putImageData(imageData, 0, 0);

                    // Optional: Apply sharpness using convolution
                    if (sharpness > 1.0) {
                        applySharpness(ctx, canvas.width, canvas.height, sharpness);
                    }

                    // Convert canvas to data URL
                    const enhancedDataUrl = canvas.toDataURL(imageFile.type || 'image/jpeg', 0.95);
                    resolve(enhancedDataUrl);

                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(imageFile);
    });
}

/**
 * Apply sharpness filter using convolution
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} width 
 * @param {number} height 
 * @param {number} amount 
 */
function applySharpness(ctx, width, height, amount) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);

    // Sharpening kernel
    const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ];

    const side = Math.round(Math.sqrt(kernel.length));
    const halfSide = Math.floor(side / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dstOff = (y * width + x) * 4;
            let r = 0, g = 0, b = 0;

            for (let cy = 0; cy < side; cy++) {
                for (let cx = 0; cx < side; cx++) {
                    const scy = Math.min(height - 1, Math.max(0, y + cy - halfSide));
                    const scx = Math.min(width - 1, Math.max(0, x + cx - halfSide));
                    const srcOff = (scy * width + scx) * 4;
                    const wt = kernel[cy * side + cx];

                    r += data[srcOff] * wt;
                    g += data[srcOff + 1] * wt;
                    b += data[srcOff + 2] * wt;
                }
            }

            // Apply sharpness amount
            output[dstOff] = data[dstOff] + (r - data[dstOff]) * (amount - 1);
            output[dstOff + 1] = data[dstOff + 1] + (g - data[dstOff + 1]) * (amount - 1);
            output[dstOff + 2] = data[dstOff + 2] + (b - data[dstOff + 2]) * (amount - 1);
        }
    }

    // Put sharpened data back
    const sharpenedData = new ImageData(output, width, height);
    ctx.putImageData(sharpenedData, 0, 0);
}

/**
 * Auto-enhance image with default settings
 * @param {File} imageFile 
 * @returns {Promise<string>}
 */
export async function autoEnhanceImage(imageFile) {
    return enhanceImageWithCanvas(imageFile, {
        brightness: 1.15,   // Slight brightness boost
        contrast: 1.1,      // Slight contrast boost
        saturation: 1.2,    // Make colors more vibrant
        sharpness: 1.05     // Subtle sharpening
    });
}
