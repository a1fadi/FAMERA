const video = document.getElementById("video");

  faceapi.nets.ssdMobilenetv1.loadFromUri("models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("models"),
  startWebcam()
    // Used to send a message to notify
    // const twilio = require('twilio');
    // const accountSid = 'your_account_sid';
    // const authToken = 'your_auth_token';
    // const client = twilio(accountSid, authToken);

  async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        detectFaces(video);
    } catch (error) {
        console.error("TRY AGAIN FAM ERA FAM!!!!", error);
    }
}

function getLabeledFaceDescriptions() {
  // This is where you add 'labels' for the program to learn faces to recognise -  the line below here is essentially the 
  // database however it is not really working for when the photos are really clear :(
  // From experimenting it is not the name or the amount of labels but rather 
  // the content inside of the folders i.e photo type and the person in front of the 
  // camera, I am not too sure however as I havent been able to really conduct too many tests with other people
  // With the photos of other people, it works for 'Fadi' and 'Laith' but only because the photos are in a similar position
  // So I believe the software isnt too great at picking up faces, or it needs better photos
  // Dear marker, if you could try add yourself with 4 PNG photos on your local version of this code then it may work 
  // as it relies on seeing people in real time. Try use photos from Fadi and Laith, on another device 
  const labels = ["Laith", "Fadi"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 3; i++) {
        const img = await faceapi.fetchImage(`./labels/${label}/${i}.png`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
        //This is where the program sends messages out to people that there is an unknown visitor in their property. 
        //This section doesn't work but i believe its because of my use of twilio

        // if (descriptions === "unknown") {
        // sendMessage("Unknown person has entered your property, tap to view", 0412876354, 0451940973); 
        // setTimeout(detectUnknown, 5000); 
        // 
        // async function sendMessage(message, toPhoneNumber, fromPhoneNumber) {
        //     try {
        //         await client.messages.create({
        //             body: message,
        //             to: toPhoneNumber,    
        //             from: fromPhoneNumber, 
        //         });

        //         console.log('Message sent successfully.');
        //     } catch (error) {
        //         console.error('Error sending message:', error);
        //     }
        // }

      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

video.addEventListener("play", async () => {
  // This section of the code is used to find the key points of the persons face and create a canvas for the facial recognition 
  // Landmarks to be displayed on 
  const facepoints = await getLabeledFaceDescriptions();
  const facer = new faceapi.FaceMatcher(facepoints);
  const screen = faceapi.createCanvasFromMedia(video);
  document.body.append(screen);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(screen, displaySize);

  // Calls all the functions from the API to detect faces
  setInterval(async () => {
    const poi = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Re formats all parts of the detections 
    const resizedDetections = faceapi.resizeResults(poi, displaySize);
    screen.getContext("2d").clearRect(0, 0, screen.width, screen.height);
    const results = resizedDetections.map((d) => {
      return facer.findBestMatch(d.descriptor);
    });
    // Draws the results 
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result,
      });
      drawBox.draw(screen);
     faceapi.draw.drawFaceLandmarks(screen, resizedDetections[i]);
    });
  }, 100);
});