const { desktopCapturer, remote } = require("electron");
const { Menu, dialog } = remote;
const { writeFileSync } = require("fs"); 
const notifier = require('node-notifier');
const path = require('path');

const videoElement = document.querySelector("video");
const videoSelectBtn = document.getElementById("videoSelectBtn");
const stopBtn = document.getElementById("stopBtn");
const startBtn = document.getElementById("startBtn");
const fileNameTextField = document.getElementById('filenameTextField');

//Get available video sources
let mediaRecorder;
let recordedChunks = [];


startBtn.onclick = (e) => { 
    mediaRecorder.start();
    fileNameTextField.style.display = 'none'
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
  notifier.notify ({
    title: 'My awesome title',
    message: 'Hello from electron, Mr. User!',
    icon: path.join(__dirname, 'sm-logo.png'),  // Absolute path 
    sound: true,  // Only Notification Center or Windows Toasters
    wait: true    // Wait with callback, until user action is taken  
 
 }, (err, response) => {
    // Response is response from notification
 });
};

 

stopBtn.onclick = (e) => {
   mediaRecorder.stop();
   fileNameTextField.style.display = 'block'
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
};

const videoSources = async () => {

  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      };
    })
  );

  videoOptionsMenu.popup();
};

videoSelectBtn.onclick = videoSources;

const selectSource = async (source) => {
  videoSelectBtn.innerText = source.name;
  const constraintVideo = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };
  //Create audio stream
  const constraintsAudio = {
    audio: true
  };
  //Create stream
  const videoStream = await navigator.mediaDevices.getUserMedia(
    constraintVideo
  );
  const audioStream = await navigator.mediaDevices.getUserMedia(
    constraintsAudio
  );
  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ]);
  videoElement.srcObject = combinedStream;
  videoElement.muted = true;
  videoElement.volume = 0;
  videoElement.play();

  let videoOutputOptions = {
      mimeType: 'video/webm;codecs=vp9',
     audioBitsPerSecond: 128000,
    videoBitsPerSecond: 2500000,
    
    };

  if (!MediaRecorder.isTypeSupported(videoOutputOptions.mimeType)) {
    console.error(`${videoOutputOptions.mimeType} is not supported`);
    videoOutputOptions.mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(videoOutputOptions.mimeType)) {
      console.error(`${videoOutputOptions.mimeType} is not supported`);
      videoOutputOptions.mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(videoOutputOptions.mimeType)) {
        console.error(`${videoOutputOptions.mimeType} is not supported`);
        videoOutputOptions.mimeType = 'video/webm;codecs=H264';
      }
    }
  } 
  try {   
    mediaRecorder = new MediaRecorder(combinedStream, videoOutputOptions);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
   // errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  } 

 // Register event handlers
 mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
};

const handleDataAvailable = (event) => {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
};

const handleStop = async (e) =>{ 

        const rand =  Math.floor((Math.random() * 10000000));
	    const name  = "video_"+Date.now()+"-"+rand+".webm" ; 
        const blob = new Blob(recordedChunks, { type: 'video/webm'});
        const blobraw = await blob.arrayBuffer();
        const buffer = Buffer.from(blobraw);
        const { filePath } = await dialog.showSaveDialog(
            {
               buttonLabel: 'Save video',
               defaultPath: name,
               filters :[
                {name: 'webm', extensions: ['webm',]},
                {name: 'All Files', extensions: ['*']}
               ]
            }
            );
        if (filePath) {
            await writeFileSync(filePath, buffer,writeFileCallback );
        }
    }
    

const writeFileCallback = () => {
    recordedChunks = [];
    console.log("Video saved successfully");
    stopVideo();
}

 
const stopVideo = () => {
    videoElement.src = videoElement.srcObject = null;
    videoElement.muted = false;
    videoElement.volume = 1;
}





 

