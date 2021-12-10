import React, { useState } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import helpers from '../utils/helpers.js';
import './Demo.css'
import axios from 'axios'
import utils from '../utils';

const {
  getMesh,
  addObserver,
  initControllers,
  initOrbits,
  initiControls,
  updateText,
  loadFont,
  addTextMesh,
  loadModel,
  setTexture,
  getCubicBezierCurve3,
  getIntersections,
  resizeRendererToDisplaySize,
} = helpers;

const { AudioRecorder } = utils;

function Recorder() {
  const recorderInstance = new AudioRecorder();
  // recorderInstance.init();

  return <div>
      <button onClick={recorderInstance.onStartRecord} class="record">record</button>
      <button onClick={recorderInstance.onStopRecord} class="stop">stop</button>
      <button onClick={recorderInstance.onPlayRecord} class="play">play</button>
      <button onClick={recorderInstance.onDownloadRecord} class="download">download</button>
  </div>
}

export default Recorder;
