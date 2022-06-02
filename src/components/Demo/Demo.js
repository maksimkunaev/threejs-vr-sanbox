import React, { useEffect } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import helpers from '../../utils/helpers.js';
import './Demo.css'

import landmarks from './constants/landmarks.js'
import TRIANGULATION from './constants/triangulation.js'

function create_facemesh_mesh(keypoints){
  try {
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute(new Float32Array(keypoints.flat()),3));
    geometry.setIndex( new THREE.BufferAttribute( new Uint16Array(TRIANGULATION), 1 ) );
     
    const material = new THREE.MeshPhongMaterial();
    material.color.setHSL(0, 1, .5);  // red
    material.flatShading = true;

      const mesh = new THREE.Mesh( geometry, material );
      console.log(mesh);
      return mesh;
  } catch(n) {
  }
}

const {
  addObserver,
  initControllers,
  initOrbits,
  getCubicBezierCurve3,
  getIntersections,
  resizeRendererToDisplaySize,
} = helpers;

class Game {
  constructor() {
    this.IS_XR_ENABLED = false;

    this.renderer = this.getRenderer();
    this.scene = this.getScene(this.renderer);
    this.stage = this.getStage();
    this.scene.add(this.stage);

    this.globals = {
      controller1: null,
      controller2: null,
      moving: false,
      progress: 0,
      boxes: [],
      bezierCurve: null,
      model: {},
      clock: new THREE.Clock(),
      objectForTeleportation: []
    }


    this.stage.add( new THREE.AxesHelper( 100 ) );
    this.scene.background = new THREE.Color( '#0A1931' );
    // this.scene.fog = new THREE.Fog('#545454e8', 0, 35);

    this.floor = this.getFloor('#046582');
    this.scene.add(this.floor);
    this.globals.objectForTeleportation.push(this.floor);

    this.person = this.getPerson();
    this.stage.add(this.person);

    // ------ camera ------ //
    this.camera = this.getCamera();
    this.person.add(this.camera);

    const [controller1, controller2] = initControllers({ 
      scene: this.person, 
      onSelectStart: this.onSelectStart,
      renderer: this.renderer
    })

    this.person.add(controller1);
    this.person.add(controller2);

    this.globals.controller1 = controller1
    this.globals.controller2 = controller2

    // ------ orbits helpers ------ //
    initOrbits(this.camera, this.renderer.domElement);

    // ------ light ------ //
    this.scene.add(this.getHemitLight())
    this.scene.add(this.getDirLight())
    this.scene.add( new THREE.DirectionalLight( 0xffffff, 0.5 ) );

    // ------ boxes geometry ------ //
    this.globals.boxes = this.getBoxes()

    // ------ ring teleportation mesh ------ //
    this.ringMesh = this.getRing()
    this.stage.add(this.ringMesh)

    // ------ curve teleportation mesh ------ //
    this.curveMesh = this.getCurveMesh()
    this.stage.add(this.curveMesh);

    // ------ create raycaster ------ //
    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();

    if (this.IS_XR_ENABLED) {
      this.renderer.xr.enabled = true;
      document.body.appendChild(VRButton.createButton(this.renderer));
    }

    this.addFaceMesh(landmarks)
   

    // helpers.loadModel(model, this.stage) 
    //   .then(this.onModelLoad)

    // ------ run ------ //
    if (this.IS_XR_ENABLED) {
      this.renderer.setAnimationLoop(this.render);
    } 

    if (!this.IS_XR_ENABLED) {
      requestAnimationFrame(this.render);
    }
  }

  addFaceMesh = (landmarks) => {
    const points = landmarks.flat();
    console.log(points)
    const mesh = create_facemesh_mesh(points)

    mesh.position.set(0,0,0)
    mesh.scale.x = 0.2;
    mesh.scale.y = 0.2;
    mesh.scale.z = 0.2;
    
    console.log(mesh.geometry )
    this.scene.add( mesh );
  }

  onModelLoad = ({model, gltf}) => {
    const object = new THREE.Object3D();

    object.add(model)
    this.stage.add(object);

    model.position.set(0,1.6,-2)
    this.globals.objectForTeleportation.push(model);

    const mixer = new THREE.AnimationMixer( model );
    const animations = gltf.animations;

    const clip = THREE.AnimationClip.findByName( animations, 'sphere body|sphere bodyAction' );
    mixer.clipAction( clip );

    this.globals.model = {
      mesh: object,
      animations,
      mixer
    }
  }

  addAudio(url, listenerMesh, sourceMesh) {
    const listener = new THREE.AudioListener();
    listenerMesh.add( listener );

    const sound = new THREE.PositionalAudio( listener );

    // load a sound and set it as the Audio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( url, function( buffer ) {
      sound.setBuffer( buffer );
      sound.setRefDistance( 20 );
      sound.setLoop( true );
      sound.setVolume( 0.5 );
      sound.play();
    });

    sourceMesh.add( sound );
  }

  updateModel = () => {
    this.globals.clock.getDelta();
  }

  setAspect() {
    if (resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  updateTeleportCurveAndRing() {
    const { 
      ringMesh, 
      person, 
      globals,
      curveMesh,
    } = this;

    const intersects = getIntersections(
      this.globals.controller2, 
      this.globals.objectForTeleportation, 
      this.raycaster, 
      this.tempMatrix
    );
    const intersected = intersects[0];

    if (intersected && !globals.moving) {
      this.updateRingPosition(ringMesh, intersected)
    }

    if (intersected && !globals.moving) {
      const bezierCurve = getCubicBezierCurve3(
        person.position.x,
        person.position.y,
        person.position.z,
        ringMesh.position.x,
        ringMesh.position.y,
        ringMesh.position.z,
      );
      this.updateCurvePosition(curveMesh, bezierCurve, globals)
    }
  }

  updateRingPosition(ringMesh, intersected) {
    ringMesh.position.set(
      intersected.point.x, 
      intersected.point.y + 0.02, 
      intersected.point.z
    )
  }

  updateCurvePosition(curveMesh, bezierCurve, globals) {
    curveMesh.geometry = new THREE.BufferGeometry().setFromPoints( bezierCurve.getPoints( 50 ) );
    curveMesh.geometry.buffersNeedUpdate = true
    globals.bezierCurve = bezierCurve;
  }

  movePerson = () => {
    const { globals, person } = this;

    if (globals.moving && globals.bezierCurve) {
      if (globals.progress >= 1) {
        globals.progress = 0;
        globals.moving = false;
        globals.bezierCurve = null
        
        return;
      }

      person.position.copy(globals.bezierCurve.getPointAt(globals.progress));
      globals.progress += .05;
    }
  }

  moveBoxes = (time) => {
    const { globals } = this;
    const delta = 0.001;
    
    globals.boxes.forEach(({type, mesh}, ind) => {
      const coeff = (ind + 1)/ globals.boxes.length;

      if (type === 'cube') {
        mesh.rotation.x += time * delta;
        mesh.rotation.y += time * delta;
        mesh.rotation.z += time * delta;
      }
      
      mesh.position.y = Math.sin(time * coeff) + 2.2;
    })
  }

  render = (time) => {
    time *= 0.0005;

    this.setAspect()
    this.updateTeleportCurveAndRing()
    this.movePerson()
    this.moveBoxes(time);
    this.updateModel(time)

    if (!this.IS_XR_ENABLED) {
      requestAnimationFrame(this.render);
    } 

    this.renderer.render(this.scene, this.camera);
  }

  onSelectStart = () => {
    this.globals.moving = true;
  }

  onSelectEnd = () => {
    this.globals.moving = false;
  }

  getStage() {
    return new THREE.Group();
  }

  getRenderer() {
    const canvas = document.querySelector('#c');
    return new THREE.WebGLRenderer({canvas, antialias: true});
  }

  getScene(renderer) {
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;

    return new THREE.Scene();
  }

  getFloor(color, x, y, z) {
    const floorMesh = new THREE.Mesh( 
      new THREE.PlaneGeometry( 50, 50 ), 
      new THREE.MeshPhongMaterial( { 
        side: THREE.DoubleSide,
        color,
        depthWrite: false,
        roughness: 0.8,
        metalness: 0.2,
        bumpScale: 0.0005 
      }));
    floorMesh.rotation.x = - Math.PI / 2.0;
    floorMesh.receiveShadow = true;
    floorMesh.position.x = x || 0
    floorMesh.position.z = z || 0
    floorMesh.position.y = y || 0

    return floorMesh
  }

  getPerson() {
    const person = addObserver(new THREE.Object3D());
    person.position.set(0, 0, 0);

    return person;
  }

  getCamera() {
    const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 120);
    camera.position.set(20, 40, -60);

    return camera
  }

  getHemitLight() {
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );

    hemiLight.position.set( 0, 20, 0 );

    return hemiLight
  }

  getDirLight() {
    const dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( - 3, 10, - 10 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = - 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;

    return dirLight
  }

  getBox = (geometry, color) => {
    const material = new THREE.MeshPhongMaterial({color,shininess: 150});
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(Math.random() * 12 - 6, 8, Math.random() * 12 - 6);
    cube.rotation.set(Math.random()*2, Math.random()*2, Math.random()*2);

    cube.receiveShadow = true
    cube.castShadow = true

    return cube;
  }

  getBoxes = (count = 0) => {
    const height = 0.3;
    const geometry = new THREE.BoxGeometry(height, height, height);
    const boxes = [];

    for (let i = 0; i < count; i++) {
      const box = this.getBox(geometry, 'yellow');
      
      this.stage.add(box);
      boxes.push({ type: 'cube', mesh: box })
    }
 
    return boxes
  }

  getRing() {
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(.05, 0.2, 18), 
      new THREE.MeshPhongMaterial({color: '#185ADB'}));
    ringMesh.rotation.x = -Math.PI / 2;

    return ringMesh
  }

  getBufferGeometry(bezierCurve) {
    return new THREE.BufferGeometry().setFromPoints( bezierCurve.getPoints( 50 ) )
  }
  
  getCurveMesh() {
    const bezierCurve = getCubicBezierCurve3(0,0,0,-5,-5,-5);

    const curveMesh = new THREE.Line( 
      this.getBufferGeometry(bezierCurve),
      new THREE.LineBasicMaterial( { color : 0xff0000 } )
    );

    return curveMesh
  }
}

function Demo() {
  useEffect(() => {
    new Game();
  },[])

  return <canvas id="c" />
}

export default Demo;
