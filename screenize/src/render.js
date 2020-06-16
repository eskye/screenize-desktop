const { desktopCapturer, remote } = require("electron");
const { Menu, dialog } = remote;
const { writeFileSync } = require("fs"); 
const notifier = require('node-notifier');
const path = require('path');
const nodeDiskInfo = require('node-disk-info');
const {exec} = require('child_process');
const ffmpeg = require('ffmpeg-static-electron');
//const ffmpeg = require('fluent-ffmpeg');
 
// const ffmpegCmd =  ffmpeg();
// ffmpegCmd.mergeToFile

  
const videoElement = document.querySelector("video");
const videoSelectBtn = document.getElementById("videoSelectBtn");
const stopBtn = document.getElementById("stopBtn");
const startBtn = document.getElementById("startBtn"); 

//Get available video sources
let mediaRecorder;
let recordedChunks = [];

// const ffmpegPath1 = ffmpeg.path
//   ? ffmpeg.path.replace('app.asar', 'app.asar.unpacked')
//   : false;
// const ffmpegPath2 = ffmpegPath1.replace(
//   '/dist/',
//   '/node_modules/ffmpeg-static/'
// );

document.addEventListener('DOMContentLoaded',() =>{
  (async () => { 
    
})(); 
    startBtn.style.display = 'none';
    stopBtn.style.display = 'none';
});



const showControls = () =>{
    startBtn.style.display = 'block';
    stopBtn.style.display = 'block';
    videoSelectBtn.disabled = true;
}

startBtn.onclick = (e) => { 
    mediaRecorder.start(); 
  startBtn.classList.add("is-success");
  startBtn.innerText = "Recording";
  startBtn.disabled = true;
  stopBtn.disabled = false;
  notification('Recording started');
};

 

stopBtn.onclick = (e) => {
   mediaRecorder.stop(); 
   notification('Recording stopped and ready to save');
  startBtn.classList.remove("is-success");
  startBtn.innerText = "Start";
  startBtn.disabled = false;
  stopBtn.disabled = true;
  videoSelectBtn.disabled = false;
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
   showControls();
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
        if(!checkDisk(blob.size)) return;
        const blobraw = await blob.arrayBuffer();
        const convertedBlob = await convertWebmToMp4(name, new Uint8Array(blobraw));
        const buffer = Buffer.from(convertedBlob);
        const { filePath } = await dialog.showSaveDialog(
            {
               buttonLabel: 'Save video',
               defaultPath: name,
               filters :[
                {name: 'mp4', extensions: ['mp4',]},
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

const checkDisk = (blobSize) => {
    const disks = nodeDiskInfo.getDiskInfoSync(); 
   return disks.every(disk => disk._available > blobSize); 
}
 
const notification = (message) =>{
    notifier.notify({
        title: 'Notification',
        message: message,
        icon: path.join(__dirname, 'sm-logo.png'),
        sound: true,
        wait: true // Wait with callback, until user action is taken  
       }, (err, response) => {
    });
}

const convertWebmToMp4 = async (name, webcamData)=>{
  await exec(ffmpeg.path, [
    '-i',
     webcamData,
    '-f',
    'mp4',
    '-vcodec','libx264', // video codec
    '-acodec','aac', // audio codec
    '-b:v', '6400k',  // video bitrate
    '-b:a', '4800k',  // audio bitrate
    '-strict', 'experimental', // standard
    '-r',
    '30000/1001',
    '-crf',
    '26',
    '-g',
    '16',
    '-movflags',
    'faststart',
    '-preset',
    'veryfast',
      name,
  ])
   
}

