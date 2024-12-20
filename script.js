// Facial Recognition Project

// Global Variables
let model;
let imageList = [];
let faceGroups = [];
let faceDetectionModel;

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
    inputShape: null,
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

// Load Face Detection Model
async function loadFaceDetectionModel() {
  faceDetectionModel = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/face_detection/model.json');
  console.log('Face detection model loaded');
}

// Detect Faces in Video Stream
function detectFacesInVideoStream() {
  const video = document.getElementById('video');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  const tensor = tf.browser.fromPixels(canvas);
  const outputs = faceDetectionModel.predict(tensor);
  const faces = outputs.dataSync();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  faces.forEach(face => {
    const x = face;
    const y = face;
    const w = face;
    const h = face;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.strokeStyle = 'red';
    ctx.stroke();
  });
  tensor.dispose();
  return faces;
}

// Capture Face as Image
function captureFaceAsImage(face) {
  const video = document.getElementById('video');
  const canvas = document.createElement('canvas');
  canvas.width = face;
  canvas.height = face;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, face, face, face, face, 0, 0, face, face);
  const imageData = canvas.toDataURL();
  return imageData;
}

// Add Face to Image List
function addFaceToImageList(face) {
  const imageData = captureFaceAsImage(face);
  const image = new Image();
  image.src = imageData;
  imageList.push({ image, faceDescriptor: face });
  updateImageList();
}

// Update Image List
function updateImageList() {
  const imageListElement = document.getElementById('imageList');
  imageListElement.innerHTML = '';
  imageList.forEach((image, index) => {
    const imgElement = document.createElement('img');
    imgElement.src = image.image.src;
    imgElement.title = `Image ${index + 1}`;
    imageListElement.appendChild(imgElement);
  });
}

// Group Faces by Name
function groupFacesByName() {
  const groupName = prompt('Enter group name:');
  if (groupName) {
    const groupedFaces = imageList.filter(face => face.faceDescriptor === groupName);
    const group = { name: groupName, faces: groupedFaces };
    faceGroups.push(group);
    updateFaceGroups();
  }
}

// Update Face Groups
function updateFaceGroups() {
  const faceGroupsElement = document.getElementById('faceGroups');
  faceGroupsElement.innerHTML = '';
  faceGroups.forEach(group => {
    const groupElement = document.createElement('div');
    groupElement.textContent = group.name;
    group.faces.forEach(face => {
      const faceElement = document.createElement('img');
      faceElement.src = face.image.src;
      groupElement.appendChild(faceElement);
    });
    faceGroupsElement.appendChild(groupElement);
  });
}

// Draw Face Bounding Box
function drawFaceBoundingBox(face) {
  const video = document.getElementById('video');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.rect(face, face, face, face);
  ctx.strokeStyle = 'red';
  ctx.stroke();
}

// Initialize
loadModel().then(() => {
  loadFaceDetectionModel().then(() => {
    // Get video stream from webcam
    navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
        const video = document.getElementById('video');
        video.srcObject = stream;
        video.play();
        setInterval(() => {
          const faces = detectFacesInVideoStream();
          if (faces.length > 0) {
            addFaceToImageList(faces);
          }
        }, 100);
      })
.catch(error => console.error(error));
  });
});

// Event listeners
document.getElementById('captureFaceButton').addEventListener('click', () => {
  const faces = detectFacesInVideoStream();
  if (faces.length > 0) {
    addFaceToImageList(faces);
  }
});

document.getElementById('groupFacesButton').addEventListener('click', groupFacesByName);

// Face detection interval
setInterval(() => {
  const faces = detectFacesInVideoStream();
  faces.forEach(face => {
    drawFaceBoundingBox(face);
  });
}, 100);
