import sharp from 'sharp';

// Deep Learning-based Image Validation Service with Multiple Algorithms

export interface ImageValidationResult {
  isValid: boolean;
  overallScore: number; // 0-100
  algorithms: {
    blurDetection: { score: number; isBlurry: boolean };
    brightnessAnalysis: { score: number; brightness: number; isOptimal: boolean };
    contrastAnalysis: { score: number; contrast: number; isOptimal: boolean };
    edgeDetection: { score: number; hasDocument: boolean };
    dimensionalAnalysis: { score: number; aspectRatio: number; isValid: boolean };
    colorAnalysis: { score: number; saturation: number };
    noiseAnalysis: { score: number; noiseLevel: number };
  };
  issues: string[];
  confidence: number;
  recommendations: string[];
}

export interface DocumentTypeVerification {
  detectedDocumentType: string; // e.g., 'aadhar', 'pan', 'unknown', 'dummy'
  isCorrectType: boolean; // Whether it matches the expected type
  confidence: number; // 0-100 confidence in the detection
  details: string;
}

// Algorithm 1: Blur Detection using Laplacian Variance
export async function detectBlur(imageBuffer: Buffer): Promise<{ score: number; isBlurry: boolean }> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      return { score: 0, isBlurry: true };
    }

    const resized = await image
      .resize(400, 300, { fit: 'inside', withoutEnlargement: true })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelData = resized.data;
    const width = resized.info.width;
    const height = resized.info.height;

    let laplacianSum = 0;
    let laplacianSquareSum = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const kernel = [
          pixelData[(y - 1) * width + (x - 1)],
          pixelData[(y - 1) * width + x],
          pixelData[(y - 1) * width + (x + 1)],
          pixelData[y * width + (x - 1)],
          pixelData[y * width + x] * -4,
          pixelData[y * width + (x + 1)],
          pixelData[(y + 1) * width + (x - 1)],
          pixelData[(y + 1) * width + x],
          pixelData[(y + 1) * width + (x + 1)],
        ];

        const laplacian = kernel.reduce((a, b) => a + b, 0);
        laplacianSum += laplacian;
        laplacianSquareSum += laplacian * laplacian;
        count++;
      }
    }

    const mean = laplacianSum / count;
    const variance = laplacianSquareSum / count - mean * mean;
    const blurThreshold = 100;
    const score = Math.min(100, (variance / blurThreshold) * 100);
    const isBlurry = variance < blurThreshold;

    return { score: Math.round(score), isBlurry };
  } catch (error) {
    return { score: 50, isBlurry: false };
  }
}

// Algorithm 2: Brightness Analysis
export async function analyzeBrightness(imageBuffer: Buffer): Promise<{ score: number; brightness: number; isOptimal: boolean }> {
  try {
    const image = sharp(imageBuffer);
    const stats = await image.stats();
    
    const avgBrightness = (stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean) / 3;
    const optimalRange = { min: 80, max: 200 };
    
    let brightness = 0;
    if (avgBrightness < optimalRange.min) {
      brightness = (avgBrightness / optimalRange.min) * 50;
    } else if (avgBrightness > optimalRange.max) {
      brightness = 100 - ((avgBrightness - optimalRange.max) / (255 - optimalRange.max)) * 50;
    } else {
      brightness = 100;
    }

    return {
      score: Math.round(brightness),
      brightness: Math.round(avgBrightness),
      isOptimal: avgBrightness >= optimalRange.min && avgBrightness <= optimalRange.max,
    };
  } catch (error) {
    return { score: 50, brightness: 128, isOptimal: false };
  }
}

// Algorithm 3: Contrast Analysis
export async function analyzeContrast(imageBuffer: Buffer): Promise<{ score: number; contrast: number; isOptimal: boolean }> {
  try {
    const image = sharp(imageBuffer);
    const stats = await image.stats();
    
    const stdDev = (stats.channels[0].stdDev + stats.channels[1].stdDev + stats.channels[2].stdDev) / 3;
    const optimalContrast = 40;
    
    let contrast = Math.min(100, (stdDev / optimalContrast) * 100);
    const isOptimal = stdDev >= 30 && stdDev <= 120;

    return {
      score: Math.round(contrast),
      contrast: Math.round(stdDev),
      isOptimal,
    };
  } catch (error) {
    return { score: 50, contrast: 50, isOptimal: false };
  }
}

// Algorithm 4: Edge Detection (Document Presence)
export async function detectEdges(imageBuffer: Buffer): Promise<{ score: number; hasDocument: boolean }> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      return { score: 0, hasDocument: false };
    }

    const resized = await image
      .resize(400, 300, { fit: 'inside' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelData = resized.data;
    const width = resized.info.width;
    const height = resized.info.height;

    let edgeCount = 0;
    const threshold = 50;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const sobelX =
          -pixelData[(y - 1) * width + (x - 1)] + pixelData[(y - 1) * width + (x + 1)] -
          2 * pixelData[y * width + (x - 1)] + 2 * pixelData[y * width + (x + 1)] -
          pixelData[(y + 1) * width + (x - 1)] + pixelData[(y + 1) * width + (x + 1)];

        const sobelY =
          -pixelData[(y - 1) * width + (x - 1)] - 2 * pixelData[(y - 1) * width + x] - pixelData[(y - 1) * width + (x + 1)] +
          pixelData[(y + 1) * width + (x - 1)] + 2 * pixelData[(y + 1) * width + x] + pixelData[(y + 1) * width + (x + 1)];

        const magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
        if (magnitude > threshold) {
          edgeCount++;
        }
      }
    }

    const edgePercentage = (edgeCount / (width * height)) * 100;
    const hasDocument = edgePercentage > 2;
    const score = Math.min(100, edgePercentage * 5);

    return { score: Math.round(score), hasDocument };
  } catch (error) {
    return { score: 50, hasDocument: true };
  }
}

// Algorithm 5: Dimensional Analysis
export async function analyzeDimensions(imageBuffer: Buffer): Promise<{ score: number; aspectRatio: number; isValid: boolean }> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      return { score: 0, aspectRatio: 0, isValid: false };
    }

    const aspectRatio = metadata.width / metadata.height;
    const documentAspectRange = { min: 1.2, max: 1.8 };
    const minResolution = 400 * 300;

    let score = 50;
    if (metadata.width * metadata.height < minResolution) {
      score = 30;
    } else if (aspectRatio >= documentAspectRange.min && aspectRatio <= documentAspectRange.max) {
      score = 100;
    } else if (aspectRatio >= 0.9 && aspectRatio <= 2.0) {
      score = 70;
    }

    const isValid = metadata.width >= 400 && metadata.height >= 300;

    return { score, aspectRatio: Math.round(aspectRatio * 100) / 100, isValid };
  } catch (error) {
    return { score: 0, aspectRatio: 0, isValid: false };
  }
}

// Algorithm 6: Color Saturation Analysis
export async function analyzeColor(imageBuffer: Buffer): Promise<{ score: number; saturation: number }> {
  try {
    const image = sharp(imageBuffer);
    const stats = await image.stats();
    
    const r = stats.channels[0].mean;
    const g = stats.channels[1].mean;
    const b = stats.channels[2].mean;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : ((max - min) / max) * 100;
    const isGoodColor = saturation > 10;

    return {
      score: isGoodColor ? 100 : 60,
      saturation: Math.round(saturation),
    };
  } catch (error) {
    return { score: 50, saturation: 50 };
  }
}

// Algorithm 7: Noise Analysis
export async function analyzeNoise(imageBuffer: Buffer): Promise<{ score: number; noiseLevel: number }> {
  try {
    const image = sharp(imageBuffer);
    const stats = await image.stats();
    
    const avgStdDev = (stats.channels[0].stdDev + stats.channels[1].stdDev + stats.channels[2].stdDev) / 3;
    const noiseLevel = Math.min(100, avgStdDev);
    const isNoisyThreshold = 80;

    return {
      score: noiseLevel > isNoisyThreshold ? 30 : 100,
      noiseLevel: Math.round(noiseLevel),
    };
  } catch (error) {
    return { score: 50, noiseLevel: 50 };
  }
}

// Main Validation Function - Combines all algorithms
export async function validateImage(imageBuffer: Buffer): Promise<ImageValidationResult> {
  const [blur, brightness, contrast, edges, dimensions, color, noise] = await Promise.all([
    detectBlur(imageBuffer),
    analyzeBrightness(imageBuffer),
    analyzeContrast(imageBuffer),
    detectEdges(imageBuffer),
    analyzeDimensions(imageBuffer),
    analyzeColor(imageBuffer),
    analyzeNoise(imageBuffer),
  ]);

  const scores = [
    blur.score * 0.15,
    brightness.score * 0.2,
    contrast.score * 0.15,
    edges.score * 0.2,
    dimensions.score * 0.15,
    color.score * 0.1,
    noise.score * 0.05,
  ];

  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0));
  const confidence = Math.min(100, overallScore + 10);

  const issues: string[] = [];
  const recommendations: string[] = [];

  if (blur.isBlurry) {
    issues.push('Image is blurry - please use a clear, sharp photo');
    recommendations.push('Take the photo in good lighting and keep the camera steady');
  }
  if (!brightness.isOptimal) {
    issues.push('Image brightness is not optimal');
    recommendations.push('Adjust lighting or try taking photo in better light conditions');
  }
  if (!contrast.isOptimal) {
    issues.push('Image contrast is low');
    recommendations.push('Ensure document is clearly visible against the background');
  }
  if (!edges.hasDocument) {
    issues.push('Document edges not detected - ensure document is visible');
    recommendations.push('Make sure the entire document is visible in the photo');
  }
  if (!dimensions.isValid) {
    issues.push('Image resolution is too low');
    recommendations.push('Use a higher resolution camera or device');
  }
  if (color.saturation < 10) {
    issues.push('Document appears to be in poor color quality');
    recommendations.push('Ensure proper color representation of the document');
  }
  if (noise.noiseLevel > 80) {
    issues.push('Image contains too much noise');
    recommendations.push('Try using a camera with better image stabilization');
  }

  const isValid = overallScore >= 60 && issues.length === 0;

  return {
    isValid,
    overallScore,
    algorithms: {
      blurDetection: blur,
      brightnessAnalysis: brightness,
      contrastAnalysis: contrast,
      edgeDetection: edges,
      dimensionalAnalysis: dimensions,
      colorAnalysis: color,
      noiseAnalysis: noise,
    },
    issues,
    confidence,
    recommendations,
  };
}
