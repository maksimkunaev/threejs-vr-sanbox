export default class AudioRecord {
  constructor() {
    this.leftchannel = [];
    this.rightchannel = [];
    this.recorder = null;
    this.recordingLength = 0;
    this.volume = null;
    this.mediaStream = null;
    this.sampleRate = 44100;
    this.context = null;
    this.blob = null;

    this.getAccess()
  }

  getAccess = () => {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    navigator.getUserMedia({ audio: true },this.onSuccess,this.onError )
  }

  onSuccess = e => {
    console.log("user consent");

    // creates the audio context
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();

    // creates an audio node from the microphone incoming stream
    this.mediaStream = this.context.createMediaStreamSource(e);

    // console.log("user consent");

    // // creates the audio context
    // window.AudioContext = window.AudioContext || window.webkitAudioContext;
    // this.context = new AudioContext();

    // // creates an audio node from the microphone incoming stream
    // this.mediaStream = this.context.createMediaStreamSource(e);

    // // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
    // // bufferSize: the onaudioprocess event is called when the buffer is full
    // var bufferSize = 2048;
    // var numberOfInputChannels = 2;
    // var numberOfOutputChannels = 2;
    // if (this.context.createScriptProcessor) {
    //  this.recorder = this.context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
    // } else {
    //  this.recorder = this.context.createJavaScriptNode(bufferSize, numberOfInputChannels, numberOfOutputChannels);
    // }

    // this.recorder.onaudioprocess = (e) => {
    //  this.leftchannel.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    //  this.rightchannel.push(new Float32Array(e.inputBuffer.getChannelData(1)));
    //  this.recordingLength += bufferSize;
    // }

    // // we connect the recorder
    // this.mediaStream.connect(this.recorder);
    // this.recorder.connect(this.context.destination);
  }

  onStartRecord = () => {
    var bufferSize = 2048;
    var numberOfInputChannels = 2;
    var numberOfOutputChannels = 2;
    if (this.context.createScriptProcessor) {
      this.recorder = this.context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
    } else {
      this.recorder = this.context.createJavaScriptNode(bufferSize, numberOfInputChannels, numberOfOutputChannels);
    }

    this.recorder.onaudioprocess = (e) => {
      this.leftchannel.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      this.rightchannel.push(new Float32Array(e.inputBuffer.getChannelData(1)));
      this.recordingLength += bufferSize;
    }

    // we connect the recorder
    this.mediaStream.connect(this.recorder);
    this.recorder.connect(this.context.destination);
  }

  onError(error) {
    console.error(error);
  }

  onStopRecord = () => {
    // stop recording
    this.recorder.disconnect(this.context.destination);
    this.mediaStream.disconnect(this.recorder);

    // we flat the left and right channels down
    // Float32Array[] => Float32Array
    var leftBuffer = flattenArray(this.leftchannel, this.recordingLength);
    var rightBuffer = flattenArray(this.rightchannel, this.recordingLength);
    // we interleave both channels together
    // [left[0],right[0],left[1],right[1],...]
    var interleaved = interleave(leftBuffer, rightBuffer);

    // we create our wav file
    var buffer = new ArrayBuffer(44 + interleaved.length * 2);
    var view = new DataView(buffer);

    // RIFF chunk descriptor
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 44 + interleaved.length * 2, true);
    writeUTFBytes(view, 8, 'WAVE');
    // FMT sub-chunk
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunkSize
    view.setUint16(20, 1, true); // wFormatTag
    view.setUint16(22, 2, true); // wChannels: stereo (2 channels)
    view.setUint32(24, this.sampleRate, true); // dwSamplesPerSec
    view.setUint32(28, this.sampleRate * 4, true); // dwAvgBytesPerSec
    view.setUint16(32, 4, true); // wBlockAlign
    view.setUint16(34, 16, true); // wBitsPerSample
    // data sub-chunk
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    // write the PCM samples
    var index = 44;
    var volume = 1;
    for (var i = 0; i < interleaved.length; i++) {
      view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
      index += 2;
    }

    // our final blob
    this.blob = new Blob([view], { type: 'audio/wav' });
  }

  onPlayRecord = () => {
    if (this.blob == null) {
      return;
    }

    var url = window.URL.createObjectURL(this.blob);
    var audio = new Audio(url);
    audio.play();
  }

  onDownloadRecord = () => {
    if (this.blob == null) {
      return;
    }

    var url = URL.createObjectURL(this.blob);

    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "sample.wav";
    a.click();
    window.URL.revokeObjectURL(url);
  }
}


function flattenArray(channelBuffer, recordingLength) {
  var result = new Float32Array(recordingLength);
  var offset = 0;
  for (var i = 0; i < channelBuffer.length; i++) {
    var buffer = channelBuffer[i];
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

function interleave(leftChannel, rightChannel) {
  var length = leftChannel.length + rightChannel.length;
  var result = new Float32Array(length);

  var inputIndex = 0;

  for (var index = 0; index < length;) {
    result[index++] = leftChannel[inputIndex];
    result[index++] = rightChannel[inputIndex];
    inputIndex++;
  }
  return result;
}

function writeUTFBytes(view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}