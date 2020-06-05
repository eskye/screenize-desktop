const videoElement = document.querySelector("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const videoSelectBtn = document.getElementById("videoSelectBtn");


const { desktopCapturer, remote } = require("electron");
const { Menu } = remote;
//Get available video sources

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

const selectSource = async (source) =>{
    videoSelectBtn.innerText = source.name;
    const constraintVideo ={
        audio: false,
        video:{
            mandatory:{
                chromeMediaSource:'desktop',
                chromeMediaSourceId:source.id
            }
        }
    };
    //Create audio stream
    const constraintsAudio = {
        audio:{
        echoCancellation: false,
        channelCount: 1,
        autoGainControl:false,
        noiseSuppression:false
    }
}
    //Create stream
    const videoStream = await navigator.mediaDevices.getUserMedia(constraintVideo);
    const audioStream = await navigator.mediaDevices.getUserMedia(constraintsAudio);
    const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
    videoElement.srcObject = combinedStream;
    videoElement.play();

}