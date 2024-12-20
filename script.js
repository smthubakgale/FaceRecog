// Facial Recognition Project

// Global Variables
let model;
let imageList = ;

// Load Facial Recognition Model
async function loadModel() {
  // Check if model exists
  model = await tf.loadLayersModel('localstorage://my-facial-recognition-model');
  if (!model) {
    // Create and train new model
    model = await createModel();
    await trainModel(model, trainData, testData);
    await saveModel(model);
  }
  console.log('Model loaded');
}

// Create Facial Recognition Model
async function createModel() {
  // Define model architecture
  const model = tf.sequential();
  model.add(tf.layers.conv2d({
    inputShape: ,
    filters: 32,
    kernelSize: 3,
    activation: 'relu'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  model.add(tf.layers.conv2d({
    filters: 128,
    kernelSize: 3,
    activation: 'relu'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));

  // Compile model
  model.compile({
    optimizer: tf.optimizers.adam(),
    loss: 'categoricalCrossentropy',
    metrics: 
  });

  return model;
}

// Train Facial Recognition Model
async function trainModel(model, trainData, testData) {
  const batchSize = 32;
  const epochs = 10;

  await model.fit(trainData, {
    batchSize,
    epochs,
    validationData: testData,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}, Accuracy = ${logs.acc.toFixed(4)}`);
      }
    }
  });
}

// Save Facial Recognition Model
async function saveModel(model) {
  const saveResult = await model.save('localstorage://my-facial-recognition-model');
  console.log(`Model saved: ${saveResult.modelArtifactsInfo.modelTopology}`);
}

// Load Image and Preprocess
async function loadImageAndPreprocess(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = new ImageData(reader.result);
      const tensor = tf.browser.fromPixels(imageData);
      const normalizedTensor = tf.div(tensor, 255);
      resolve(normalizedTensor);
    };
    reader.readAsDataURL(file);
  });
}

// Detect Face in Image
async function detectFace(imageTensor) {
  const output = model.predict(imageTensor);
  const result = output.dataSync();
  return result;
}

// Add Image to List
async function addImageToLIst(file) {
  const imageTensor = await loadImageAndPreprocess(file);
  const faceDescriptor = await detectFace(imageTensor);
  imageList.push({ image: file, faceDescriptor });
  updateImageList();
}

// Update Image List
function updateImageList() {
  const imageListElement = document.getElementById('imageList');
  imageListElement.innerHTML = '';
  imageList.forEach((image, index) => {
    const imgElement = document.createElement('img');
    imgElement.src = URL.createObjectURL(image.image);
    imgElement.title = `Image ${index + 1}`;
    imageListElement.appendChild(imgElement);
  });
}

// Check if Image is Already in List
function isImageAlreadyInList(image) {
  return imageList.some((listImage) => {
    const imageTensor = tf.browser.fromPixels(listImage.image);
    const tensor = tf.browser.fromPixels(image);
    const similarity = tf.metrics.cosineSimilarity(imageTensor, tensor);
    return similarity.dataSync() > 0.5; // Adjust similarity threshold
  });
}

// Handle Image Upload
document.getElementById('imageInput').addEventListener('change', (e) => {
  const file = e.target.files;
  if (!isImageAlreadyInList(file)) {
    addImageToLIst(file).then(() => {
      makePrediction();
    });
  } else {
    console.log('Image already in list');
  }
});

// Make Prediction
async function makePrediction() {
  const inputImage = await loadImageAndPreprocess(imageList.image);
  const output = model.predict(inputImage);
  const result = output.dataSync();
  document.getElementById('result').innerText = `Prediction: ${result}`;
}

// Initialize
loadModel().then(() => {
  console.log('Model loaded');
});
