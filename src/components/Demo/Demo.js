import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import helpers from '../../utils/helpers.js';
import './Demo.css'
import { GUI } from 'dat.gui'

const {
  addObserver,
  initControllers,
  initOrbits,
  getCubicBezierCurve3,
  getIntersections,
  resizeRendererToDisplaySize,
  createFacemeshMesh,
  generateBoxes,
} = helpers;

// const planeSettings = generateBoxes(3)
const menuItems = [
  {
    image: 'sunset-text.png',
    position: [-2, 1, -3],
    size: [2, 1, 0],
    name: 'sunset',
  },
  {
    image: 'street-text.png',
    position: [2, 1, -3],
    size: [2, 1, 0],
    name: 'street',
  }
];

class Game {
  constructor() {
    this.IS_XR_ENABLED = true;

    this.renderer = this.getRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    this.scene = this.getScene(this.renderer);
    this.stage = this.getStage();
    this.scene.add(this.stage);

    this.globals = {
      controller1: null,
      controller2: null,
      gamepad1: null,
      gamepad2: null,
      moving: false,
      progress: 0,
      boxes: [],
      planes: [],
      bezierCurve: null,
      model: {},
      clock: new THREE.Clock(),
      objectForTeleportation: [],
      audio: {
        isEnabled: false,
        isPlaying: false,
        sound: null,
        listener: null,
        source: 'voice-1.ogg',
      },
      intersected: null,
      light: null,
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

    const {controller1, controller2, gamepad1, gamepad2 } = initControllers({ 
      scene: this.person, 
      onSelectStart: this.onSelectStart,
      onSelectEnd: this.onSelectEnd,
      renderer: this.renderer
    })

    gamepad1.addEventListener("connected", (e) => {
      console.log('gamepad1',);
      this.globals.gamepad1 = e.data.gamepad
    })


    gamepad2.addEventListener("connected", (e) => {
      console.log('gamepad2',);
      this.globals.gamepad2 = e.data.gamepad
    })

    this.person.add(controller1);
    this.person.add(controller2);

    this.globals.controller1 = controller1
    this.globals.controller2 = controller2

    // ------ orbits helpers ------ //
    initOrbits(this.camera, this.renderer.domElement);

    // ------ light ------ //
    const pointLight = this.getPointLight([0, 8, 0])
    this.scene.add(pointLight)
    this.globals.light = pointLight

    // ------ ring teleportation mesh ------ //
    this.ringMesh = this.getRing()
    this.stage.add(this.ringMesh)

    // ------ curve teleportation mesh ------ //
    this.curveMesh = this.getCurveMesh()
    this.stage.add(this.curveMesh);

    // ------ create raycaster ------ //
    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();

 

    // this.addFaceMesh(landmarks)
    // ------ get boxes ------ //

     this.getMenuItems(menuItems).forEach(plane => {
      this.stage.add(plane.mesh)
      this.globals.planes.push(plane)
    })

    // GIU
    const cube = pointLight
    const gui = new GUI()
    const cubeFolder = gui.addFolder('Cube')
    cubeFolder.add(cube.position, 'x', 0, Math.PI * 4)
    cubeFolder.add(cube.position, 'y', 0, Math.PI * 4)
    cubeFolder.add(cube.position, 'z', 0, Math.PI * 4)
    cubeFolder.open()

    const model = '/360_sphere_robot/scene.gltf';

    helpers.loadModel(model, this.stage) 
      .then(this.onModelLoad)

    // ------ run ------ //

    if (this.IS_XR_ENABLED) {
      this.renderer.xr.enabled = true;
      document.body.appendChild(VRButton.createButton(this.renderer));
    }
    
    if (this.IS_XR_ENABLED) {
      this.renderer.setAnimationLoop(this.render);
    } 

    if (!this.IS_XR_ENABLED) {
      requestAnimationFrame(this.render);
    }
  }

  addFaceMesh = (landmarks) => {
    const points = landmarks.flat();
    const mesh = createFacemeshMesh(points)

    mesh.position.set(0,0,0)
    mesh.scale.x = 0.2;
    mesh.scale.y = 0.2;
    mesh.scale.z = 0.2;

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

    this.globals.audio = {
      sound,
      listener,
      source: sourceMesh
    }
  }

  removeAudio() {
    const { sound, listener, source } = this.globals.audio;

    if (sound) {
      sound.stop();
      source.remove(sound);
      listener.remove(source);
    }
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

  updateBezierCurveAndRing() {
    const { 
      ringMesh, 
      person, 
      globals,
      curveMesh,
    } = this;

    if (globals.moving) return 

    const intersects = getIntersections(
      this.globals.controller1, 
      this.globals.objectForTeleportation, 
      this.raycaster, 
      this.tempMatrix
    );
    const intersected = intersects[0];

    if (!intersected) return 

    const bezierCurve = getCubicBezierCurve3(
      person.position.x,
      person.position.y,
      person.position.z,
      ringMesh.position.x,
      ringMesh.position.y,
      ringMesh.position.z,
    );

    this.updateCurvePosition(curveMesh, bezierCurve, globals);
    this.updateRingPosition(ringMesh, intersected);
  }

  getIntersectedFigure() {
    const { 
      globals,
    } = this;

    const intersects = getIntersections(
      this.globals.controller2, 
      [...this.globals.boxes.map(box => box.mesh), ...this.globals.planes.map(plane => plane.mesh)],
      this.raycaster, 
      this.tempMatrix
    );

    return intersects[0];
  }

  playAudio = () => {
    const {
      globals,
    } = this;

    this.addAudio(globals.audio.source, this.person, globals.model.mesh)
    console.log('play audio')
  }

  stopAudio = () => {
    console.log('stop audio')
    this.removeAudio()
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

  moveLight = (time) => {
    const { light } = this.globals;
   
    const newX = 3 * Math.sin(time);
    light.position.x = newX
  }

  onSelectStart = (e) => {
    console.log(e)
    if (e.data.handedness === "right")  {
      this.globals.moving = true;
    }
  }

  onSelectEnd = (e) => {
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
    camera.position.set(1.2, 3, 14);
    camera.lookAt( 0,0,0);
    return camera
  }

  getPointLight(position) {
    const sphere = new THREE.SphereGeometry( 0.1, 16, 8 );

    const light = new THREE.PointLight( 0xff0040, 2, 50 );
    light.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) );
    light.position.set( position[0], position[1], position[2] );
    light.castShadow = true;

    return light
  }

  getMenuItems = () => {
    const loader = new THREE.TextureLoader();

    return menuItems.map(({image, position, size, name}) => {
      const group = new THREE.Group();

      const material = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff});
      const bigGeometry = new THREE.PlaneGeometry(size[0], size[1]);
      const bigPlane = new THREE.Mesh(bigGeometry, material);
      bigPlane.position.set(0, 0, 0);

      const texture = loader.load(image);
      const smallMaterial = new THREE.MeshBasicMaterial({map: texture});
      const geometry = new THREE.PlaneGeometry(size[0], size[1] * 0.5);
      const smallPlane = new THREE.Mesh(geometry, smallMaterial);
      smallPlane.position.set(0,0,0);

      group.add(bigPlane);
      group.add(smallPlane);
      group.position.set(position[0], position[1], position[2]);

      return { type: "plane", mesh: group, name };
    })
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

  setHover = (e) => {
    const intersected = this.getIntersectedFigure();
    if (intersected) {
      if ( this.globals.intersected !== intersected.object ) {
        this.globals.intersected = intersected.object;
        this.globals.intersected.currentHex = this.globals.intersected.material.color.getHex()
        
        // console.log('set new box color');

        // set hover state
        this.globals.intersected.material.color.setHex(0xff0000)
      }
    } else {
      if (this.globals.intersected) {
        // console.log('return to original color',{intersected});
        // return to original color
        this.globals.intersected.material.color.setHex(this.globals.intersected.currentHex)
        this.globals.intersected = null
        // this.globals.intersected.material.opacity.set(this.globals.intersected.currentHex);
      }
    }

    // const selectedUuid = intersected?.object?.uuid;
    // return this.globals.boxes.find(box => box.mesh.uuid === selectedUuid);
  }

  checkButtonPressed = () => {
    const joystick = this.globals?.gamepad1?.buttons[3]

    if (joystick && joystick.touched) {
      const { axes } = this.globals.gamepad1;
      const [,,xAmplitude] = axes;

      if (xAmplitude > 0.15) {
        this.person.rotation.y -= 0.015;
      }

      if (xAmplitude < -0.15) {
        this.person.rotation.y += 0.015;
      }
      // console.log('joystick touched axes', axes);
      console.log('\n');
    }
  }

  render = (time) => {
    time *= 0.0005;

    this.setAspect()
    this.updateBezierCurveAndRing()
    this.movePerson()
    // this.getIntersectedFigure()
    // this.moveBoxes(time);
    // this.moveLight(time)
    this.updateModel(time)
    this.setHover()
    this.checkButtonPressed()
    
    if (!this.IS_XR_ENABLED) {
      requestAnimationFrame(this.render);
    } 

    this.renderer.render(this.scene, this.camera);
  }
}

function Demo() {
  useEffect(() => {
    new Game();
  },[])

  return <div>
     <canvas id="c" />
  </div>
}

export default Demo;

// todo
// 1. add initial room with 2 window and text ("left" and "right")
// select intersected box/plane/figure
// 2. add rotation person (camera) by movin sticks
// 3. add different lights