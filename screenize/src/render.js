const { desktopCapturer, remote } = require("electron");
const { Menu, dialog } = remote;
const { writeFile } = require("fs");

const videoElement = document.querySelector("video");
const videoSelectBtn = document.getElementById("videoSelectBtn");
//Get available video sources
let mediaRecorder;
const recordedChunks = [];

const startBtn = document.getElementById("startBtn");
startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
};

const stopBtn = document.getElementById("stopBtn");

stopBtn.onclick = (e) => {
  mediaRecorder.stop();
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
    audio: {
      echoCancellation: false,
      channelCount: 1,
      autoGainControl: false,
      noiseSuppression: false,
    },
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
  videoElement.play();

  const videoOutputOptions = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(combinedStream, videoOutputOptions);

  //Register event handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
};

const handleDataAvailable = (e) => {
  console.log("video availabe: " + e);
  recordedChunks.push(e.data);
};

const handleStop = async (e) =>{
    const blob = new Blob(recordedChunks, {
      type: 'video/webm; codecs=vp9'
    });
  
    const buffer = Buffer.from(await blob.arrayBuffer());
  
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: 'Save video',
      defaultPath: `vid-${Date.now()}.webm`
    });
  
    if (filePath) {
      writeFile(filePath, buffer, () => console.log('video saved successfully!'));
    }
  
  }
