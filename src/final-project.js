import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// --- CONFIGURATION CONSTANTS ---
const ENGINE_CLASSES = {
    '50cc': { maxSpeed: 80, accel: 30, brake: 60, steer: 0.02, gravity: 150 },
    '100cc': { maxSpeed: 100, accel: 40, brake: 55, steer: 0.02, gravity: 170 },
    '150cc': { maxSpeed: 120, accel: 45, brake: 50, steer: 0.02, gravity: 180 }, 
    '200cc': { maxSpeed: 180, accel: 80, brake: 50, steer: 0.02, gravity: 200 }
};

const CAR_MODELS = {
    'cyber': { 
        name: 'Cyber Car', 
        path: 'cyberpunk_car.glb', 
        scale: 1,
        rotation: Math.PI,      
        zOffset: 0,
        yOffset: -1,      
        wheelNames: ["Object_99", "Object_93"],
        fixPivot: true,
        hasCockpit: false,
        steeringWheelName: null,
        steeringAxis: null,
        fixSteeringPivot: false,
        invertSteering: false,
    },
    'bmw': { 
        name: 'BMW M4 GTS', 
        path: '2016_bmw_m4_gts.glb',
        scale: 200,         
        rotation: Math.PI,  
        zOffset: 0,
        yOffset: -0.5,       
        wheelNames: [ 'tire', 'carwheel'],
        fixPivot: true,
        hasCockpit: true,
        steeringWheelName: ["steering_wheel"],
        steeringAxis: 'y',
        fixSteeringPivot: true,
        invertSteering: false


                                  
        
    },
    'x5': {
        name: 'BMW X5 (2019)',
        path: '2019_bmw_x5_xdrive30d.glb',
        scale: 200,
        rotation: Math.PI,
        zOffset: 0,
        yOffset: -0.5,
        wheelNames: [
            'tire_0',
            'rim_black_0',
            'rim_chrome_0',
            'disk_1',
            'disk_2'
        ],
        fixPivot: true,
        spinAxis: 'x',
        disableWheelSpin: true,
        hasCockpit: true,
        steeringWheelName: [],
        steeringAxis: 'y',
        fixSteeringPivot: false,
        invertSteering: false
    },
    'civic': { 
        name: 'Honda Civic Type R', 
        path: 'honda_civic.glb',
        scale: 200,         
        rotation: Math.PI, 
        zOffset: 0,
        yOffset: -0.5,   
        wheelNames: ["308", "314", "361", "317", "448", "311", "343", "598", "334", "337", "634", "340", "353", "691", "727",  "327",  "454", "356", "347", "350", "324", "330", "321"],
        fixPivot: true,
        hasCockpit: true,
        steeringWheelName: ["87" , "90"],
        steeringAxis: 'z',
        fixSteeringPivot: true,
        invertSteering: false,
        wheelstoFlip: ["356", "347", "350", "324", "330", "321"],
    
    },
    'supra': { 
        name: 'Toyota Supra', 
        path: 'supra.glb',
        scale: 2,         
        rotation: Math.PI,   
        zOffset: 0,
        yOffset: -.5,   
        wheelNames: ["120", "149"],
        fixPivot: true,
        hasCockpit: true,
        steeringWheelName: ["204", "205"],
        steeringAxis: 'y',
        fixSteeringPivot: true,
        invertSteering: true

    },
    'odyssey': { 
        name: 'Honda Odyssey', 
        path: 'odyssey.glb',
        scale: 0.02,         
        rotation: 0,   
        zOffset: 0,
        yOffset: -.5,    
        wheelNames: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "46", "47", "48"],
        fixPivot: true,
        hasCockpit: true,
        steeringWheelName: ["204", "205"],
        steeringAxis: 'y',
        fixSteeringPivot: true,
        invertSteering: true
    }
};

let GAME_STATE = {
    mode: 'traditional', // 5 laps or endless
    engine: '150cc',
    car: 'cyber',
    isPlaying: false
};

// Racing line for demo mode: a closed lap through both checkpoints and the
// finish line, laid down the middle of the road and then pulled towards the
// apexes. Flat x,y,z triples, one point roughly every 10 units.
const DEMO_LINE = [
    4, 10, 79, 5, 10, 69, 5, 10, 59, 6, 10, 49, 6, 10, 40,
    7, 10, 30, 7, 10, 20, 8, 10, 10, 9, 10, 1, 10, 10, -9,
    11, 10, -19, 12, 10, -28, 12, 10, -37, 14, 10, -44, 19, 11, -50,
    24, 11, -54, 28, 12, -58, 34, 12, -60, 41, 13, -62, 48, 13, -64,
    57, 14, -66, 67, 14, -68, 78, 14, -70, 88, 14, -72, 98, 15, -74,
    106, 15, -76, 114, 15, -78, 120, 16, -80, 125, 17, -83, 128, 17, -89,
    131, 17, -94, 135, 17, -101, 138, 16, -109, 142, 15, -118, 146, 15, -128,
    150, 14, -137, 154, 14, -147, 158, 13, -155, 161, 12, -163, 165, 11, -171,
    169, 11, -179, 173, 10, -187, 177, 9, -196, 181, 8, -204, 185, 7, -213,
    189, 7, -221, 194, 6, -229, 198, 5, -237, 202, 4, -244, 206, 4, -252,
    210, 3, -260, 215, 2, -269, 220, 1, -277, 224, 0, -285, 229, -1, -294,
    234, -2, -302, 239, -2, -310, 244, -2, -318, 248, -2, -326, 253, -2, -334,
    258, -2, -342, 263, -2, -351, 268, -2, -358, 272, -2, -365, 277, -1, -371,
    282, 0, -375, 287, 0, -379, 293, 1, -380, 300, 1, -381, 307, 2, -381,
    313, 3, -379, 320, 3, -377, 325, 4, -373, 330, 4, -369, 335, 5, -363,
    338, 6, -357, 340, 7, -351, 341, 8, -344, 340, 8, -337, 340, 9, -329,
    339, 10, -321, 338, 10, -312, 337, 11, -302, 335, 13, -292, 333, 14, -281,
    332, 15, -272, 332, 15, -265, 333, 16, -259, 333, 16, -253, 334, 16, -246,
    336, 17, -237, 338, 17, -227, 340, 18, -217, 341, 18, -208, 343, 19, -199,
    345, 19, -189, 347, 19, -180, 349, 20, -171, 350, 20, -162, 352, 20, -153,
    354, 21, -143, 356, 21, -134, 358, 21, -125, 359, 21, -116, 361, 21, -107,
    363, 21, -98, 364, 21, -89, 364, 21, -79, 365, 21, -70, 365, 21, -60,
    366, 21, -50, 366, 21, -40, 367, 21, -30, 367, 21, -20, 367, 21, -11,
    367, 21, -1, 367, 21, 9, 367, 21, 19, 367, 21, 29, 367, 21, 38,
    367, 21, 48, 366, 21, 57, 366, 21, 66, 366, 21, 76, 365, 21, 85,
    365, 21, 95, 365, 21, 105, 366, 21, 115, 367, 21, 124, 367, 21, 134,
    368, 21, 143, 369, 21, 152, 369, 21, 162, 370, 21, 172, 370, 21, 182,
    371, 21, 192, 371, 21, 202, 371, 22, 211, 372, 23, 221, 372, 24, 231,
    372, 25, 241, 372, 26, 251, 372, 26, 261, 372, 27, 271, 372, 28, 281,
    372, 29, 291, 372, 30, 301, 371, 31, 311, 371, 32, 321, 370, 33, 331,
    370, 34, 341, 369, 35, 351, 368, 36, 361, 367, 36, 370, 366, 37, 380,
    364, 38, 390, 362, 39, 400, 361, 40, 410, 359, 41, 419, 356, 42, 429,
    354, 42, 439, 351, 43, 449, 349, 43, 458, 346, 44, 467, 343, 44, 474,
    341, 45, 481, 338, 45, 487, 334, 46, 491, 329, 46, 495, 324, 46, 500,
    318, 46, 505, 312, 47, 510, 304, 47, 516, 296, 47, 521, 288, 47, 526,
    280, 47, 531, 272, 47, 536, 263, 47, 541, 255, 47, 545, 247, 47, 549,
    238, 47, 553, 230, 47, 557, 221, 47, 560, 213, 47, 563, 204, 47, 566,
    195, 47, 569, 186, 47, 572, 178, 47, 575, 169, 47, 577, 160, 47, 579,
    151, 47, 581, 142, 47, 583, 133, 47, 585, 124, 47, 586, 115, 47, 587,
    108, 47, 588, 101, 47, 589, 94, 47, 589, 86, 47, 589, 76, 47, 590,
    65, 47, 589, 55, 46, 589, 46, 44, 589, 42, 43, 587, 39, 42, 585,
    35, 41, 581, 32, 39, 572, 29, 38, 562, 26, 36, 553, 24, 35, 544,
    22, 34, 538, 20, 33, 531, 18, 31, 521, 17, 29, 510, 16, 27, 498,
    15, 26, 488, 14, 24, 478, 13, 23, 467, 12, 21, 458, 12, 20, 450,
    11, 18, 440, 11, 16, 430, 11, 15, 419, 11, 13, 410, 10, 12, 401,
    10, 9, 390, 9, 10, 379, 9, 10, 368, 8, 10, 358, 8, 10, 349,
    8, 10, 340, 8, 10, 330, 9, 10, 321, 9, 10, 311, 9, 10, 302,
    9, 10, 292, 9, 10, 283, 9, 10, 274, 10, 10, 264, 10, 10, 254,
    9, 10, 244, 8, 10, 234, 8, 10, 225, 7, 10, 215, 7, 10, 206,
    6, 10, 196, 6, 10, 187, 5, 10, 177, 5, 10, 167, 4, 10, 157,
    4, 10, 147, 4, 10, 137, 4, 10, 127, 4, 10, 118, 4, 10, 108,
    4, 10, 98, 4, 10, 88
];

const DEMO_WAYPOINTS = [];
for (let i = 0; i < DEMO_LINE.length; i += 3) {
    DEMO_WAYPOINTS.push(new THREE.Vector3(DEMO_LINE[i], DEMO_LINE[i + 1], DEMO_LINE[i + 2]));
}

// Demo driver tuning.
//   safety   - how much of the geometric cornering limit to use. Above 1 the car
//              has to hang the tail out to make the corner, which is the point.
//   lookBase - pure-pursuit aim distance at a standstill, plus lookGain per unit
//              of speed. Short = twitchy, long = cuts corners.
const AI = { safety: 1.15, lookBase: 14, lookGain: 0.34, drift: true };

let demoModeActive = false;

// --- ANTI-GHOST SYSTEM ---
window.gameLoopId = null;

const clock = new THREE.Clock();

// --- UI Elements ---
const uiSpeed = document.getElementById('speed-display');

const btnReset = document.getElementById('reset-btn');

// --- Time Trial UI ---
const uiTimeCurrent = document.getElementById('time-current');
const uiTimeBest = document.getElementById('time-best');
const uiLapCount = document.getElementById('lap-count');

// --- Format Time ---
function formatTime(seconds) {
    if (seconds === Infinity) return "--:--.--";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// --- CAMERA STATE ---
let cameraMode = 0; // 0 = Chase, 1 = Hood/Cockpit
const cameraOffsets = [
    // Mode 0: Chase (Calculated dynamically via spherical, so we leave this blank/unused)
    null, 

    // Mode 1: Hood Cam (Up 2.5, Forward 1.0)
    new THREE.Vector3(0, 2.5, -1.0),
    new THREE.Vector3(0, 1.7, 0.8)   // Mode 2: Cockpit (Lower & Inside)

    
];


// --- Basic Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x01030a); 
scene.fog = new THREE.FogExp2(0x040b16, 0.002);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const defaultCameraPosition = new THREE.Vector3(0, 10, 20);
const defaultCameraTarget = new THREE.Vector3(0, 0, 0);
camera.position.copy(defaultCameraPosition);
camera.lookAt(defaultCameraTarget);

// --- AUDIO SETUP  ---
const listener = new THREE.AudioListener();
camera.add(listener); // Listener stays on camera (Ears)

let carController = null;
const audioLoader = new THREE.AudioLoader();

// PositionalAudio 
const idleSound = new THREE.PositionalAudio(listener);
const accelerationSound = new THREE.PositionalAudio(listener);
const driftSound = new THREE.PositionalAudio(listener); 

// MUSIC & SFX (Global / 2D) 
const bgmNormal = new THREE.Audio(listener);
const bgmFast   = new THREE.Audio(listener);
const sfxFanfare = new THREE.Audio(listener);
const bgmMenu = new THREE.Audio(listener);


// Configure 3D Sound Settings
// RefDistance: Sound is full volume within this distance (e.g., 10 units)
// RolloffFactor: How fast it gets quiet as you move away
function configureSound(sound) {
    sound.setRefDistance(10); 
    sound.setRolloffFactor(0.5); 
    sound.setDistanceModel('linear'); // Smooth fading
}

configureSound(idleSound);
configureSound(accelerationSound);
configureSound(driftSound);

const tryAttachAudio = () => {
    if (carController && idleSound.buffer && accelerationSound.buffer && driftSound.buffer) {
        carController.setEngineAudio(idleSound, accelerationSound, driftSound);
    }
};


audioLoader.load('idle.mp3', (buffer) => {
    idleSound.setBuffer(buffer);
    idleSound.setLoop(true);
    idleSound.setVolume(0);
    tryAttachAudio();
});
audioLoader.load('acceleration.mp3', (buffer) => {
    accelerationSound.setBuffer(buffer);
    accelerationSound.setLoop(true);
    accelerationSound.setVolume(0); 
    tryAttachAudio();
});
audioLoader.load('drift.mp3', (buffer) => {
    driftSound.setBuffer(buffer);
    driftSound.setLoop(true);
    driftSound.setVolume(0);  
    tryAttachAudio();
});


audioLoader.load('menu.mp3', (buffer) => {
    bgmMenu.setBuffer(buffer);
    bgmMenu.setLoop(true); // Loop forever
    bgmMenu.setVolume(1);

    
});

// --- LOAD MUSIC ---
audioLoader.load('bgm.mp3', (buffer) => {
    bgmNormal.setBuffer(buffer);
    bgmNormal.setLoop(true);
    bgmNormal.setVolume(1);
});

audioLoader.load('bgmfast.mp3', (buffer) => {
    bgmFast.setBuffer(buffer);
    bgmFast.setLoop(true);
    bgmFast.setVolume(1);
});

audioLoader.load('fanfare.mp3', (buffer) => {
    sfxFanfare.setBuffer(buffer);
    sfxFanfare.setLoop(false); 
    sfxFanfare.setVolume(1.5);
});

// Camera follow helpers
const chaseLerpFactor = 1.12;
const carWorldPosition = new THREE.Vector3();
const carWorldQuaternion = new THREE.Quaternion();
let carModel = null;

// Camera / car sizing helpers
const followSpherical = new THREE.Spherical(15, THREE.MathUtils.degToRad(60), 0);
let minCameraDistance = 5;
let maxCameraDistance = 30;
const minPolarAngle = THREE.MathUtils.degToRad(20);
const maxPolarAngle = THREE.MathUtils.degToRad(85);
const pointerRotationSpeed = 0.0055;
const scrollZoomFactor = 0.05;
const relativeCameraOffset = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const lookAtOffset = new THREE.Vector3(0, 2, 0);
const lookAtTarget = new THREE.Vector3();
const pointerState = { dragging: false, pointerId: null, lastX: 0, lastY: 0 };

// --- COLLISION GLOBAL ---
const mapColliders = []; 
const animatedObjects = [];
const ghostColliders = [];

const renderer = new THREE.WebGLRenderer({ 
    antialias: true});
renderer.shadowMap.enabled = true; 
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.cursor = 'grab';
renderer.domElement.style.touchAction = 'none';
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.environment = null; // Neon style

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector3(1, 1, 1), 1.6, 0.35, 0.9);
composer.addPass(bloomPass);

// --- Pointer / camera events ---
const releasePointerCapture = (event) => {
    if (renderer.domElement.hasPointerCapture && renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
    }
};
const stopPointerDrag = (event) => {
    if (pointerState.pointerId !== event.pointerId) return;
    pointerState.dragging = false;
    pointerState.pointerId = null;
    renderer.domElement.style.cursor = 'grab';
    releasePointerCapture(event);
};
const onPointerDown = (event) => {
    if (event.button !== 0) return;
    pointerState.dragging = true;
    pointerState.pointerId = event.pointerId;
    pointerState.lastX = event.clientX;
    pointerState.lastY = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
    renderer.domElement.style.cursor = 'grabbing';
};
const onPointerMove = (event) => {
    if (!pointerState.dragging || pointerState.pointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - pointerState.lastX;
    const deltaY = event.clientY - pointerState.lastY;
    followSpherical.theta -= deltaX * pointerRotationSpeed;
    followSpherical.phi = THREE.MathUtils.clamp(followSpherical.phi + deltaY * pointerRotationSpeed, minPolarAngle, maxPolarAngle);
    pointerState.lastX = event.clientX;
    pointerState.lastY = event.clientY;
};
const onWheel = (event) => {
    event.preventDefault();
    followSpherical.radius = THREE.MathUtils.clamp(followSpherical.radius + event.deltaY * scrollZoomFactor, minCameraDistance, maxCameraDistance);
};

renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerup', stopPointerDrag);
renderer.domElement.addEventListener('pointerleave', stopPointerDrag);
renderer.domElement.addEventListener('pointercancel', stopPointerDrag);
renderer.domElement.addEventListener('wheel', onWheel, { passive: false });


// --- Lights ---
function setupNeonLighting() {
    const ambient = new THREE.AmbientLight(0x2a1036, 0.25); 
    scene.add(ambient);

    const cyanDir = new THREE.DirectionalLight(0x5cf7ff, 0.9);
    cyanDir.position.set(1, 1.2, 0.4);
    cyanDir.castShadow = false;
    scene.add(cyanDir);

    const pinkDir = new THREE.DirectionalLight(0xff5cf1, 0.9);
    pinkDir.position.set(-1, 1.1, -0.5);
    pinkDir.castShadow = false;
    scene.add(pinkDir);
}
setupNeonLighting();

const cityNeonLights = [];
function addCityNeonLights() {
    const lightSets = [
        { pos: new THREE.Vector3(80, 40, 0), color: 0x5cf7ff },
        { pos: new THREE.Vector3(-80, 40, 0), color: 0xff5cf1 },
        { pos: new THREE.Vector3(0, 35, 120), color: 0x5cf7ff },
        { pos: new THREE.Vector3(0, 35, -120), color: 0xff5cf1 },
        { pos: new THREE.Vector3(140, 30, 140), color: 0xff5cf1 },
        { pos: new THREE.Vector3(-140, 30, -140), color: 0x5cf7ff },
        { pos: new THREE.Vector3(140, 30, -140), color: 0x5cf7ff },
        { pos: new THREE.Vector3(-140, 30, 140), color: 0xff5cf1 },
    ];

    lightSets.forEach(({ pos, color }) => {
        const l = new THREE.PointLight(color, 12, 280, 2);
        l.position.copy(pos);
        l.castShadow = false;
        scene.add(l);
        cityNeonLights.push(l);
    });
}
addCityNeonLights();

// --- Map sectoring ---
const trackSectors = [];
const trackSectorMap = new Map();
const sectorWorkVec = new THREE.Vector3();
const bboxHelper = new THREE.Box3();
const sizeHelper = new THREE.Vector3();
const trackSectorSize = 200; 
let trackRenderDistance = 400; 
let sectorCullingEnabled = true;
const carBoundsHelper = new THREE.Box3();
const carSizeHelper = new THREE.Vector3();
const carCenterHelper = new THREE.Vector3();

function styleMeshForNeon(child) {
    if (!child.material) return;
    bboxHelper.setFromObject(child);
    bboxHelper.getSize(sizeHelper);
    const isBuilding = sizeHelper.y > 15 && sizeHelper.y > sizeHelper.x * 0.7 && sizeHelper.y > sizeHelper.z * 0.7;
    const isTrack = !isBuilding && sizeHelper.y < 12 && (sizeHelper.x > 6 || sizeHelper.z > 6);
    const treatAsTrack = isTrack || !isBuilding; 
    const neonPalette = [0x00c8ff, 0xff3fb3];
    const neonColor = neonPalette[child.id % neonPalette.length];

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const styled = materials.map((mat) => {
        const clone = mat.clone();
        clone.metalness = treatAsTrack ? 0.65 : Math.max(0.5, clone.metalness ?? 0.5);
        clone.roughness = treatAsTrack ? 0.28 : Math.min(0.35, clone.roughness ?? 0.35);
        clone.envMapIntensity = treatAsTrack ? 1.1 : 1.6;

        if (treatAsTrack) {
            clone.emissive = new THREE.Color(0x0c1228);
            clone.emissiveIntensity = 0.6;
        } else if (isBuilding) {
            clone.emissive = new THREE.Color(neonColor);
            clone.emissiveIntensity = 1.8;
        } else {
            clone.emissiveIntensity = clone.emissiveIntensity ?? 0.35;
        }
        return clone;
    });
    child.material = Array.isArray(child.material) ? styled : styled[0];
}

// Painting to look like Anthony's Car
function applyBlackPaint(model) {
    if(model )
    model.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
            const name = (mat.name || '').toLowerCase();
         
            if (!name.includes('carpaint')) return;
            if (mat.color) mat.color.set('#111111');
            if ('metalness' in mat) mat.metalness = Math.max(mat.metalness ?? 0.6, 0.85);
            if ('roughness' in mat) mat.roughness = 0.28;
        });
    });
}

// Headlights and Tailights Setup
function setupCarLighting(model) {
    // Calculate Local Bounds
    carBoundsHelper.setFromObject(model);
    carBoundsHelper.getSize(carSizeHelper);
    carBoundsHelper.getCenter(carCenterHelper);
    
    // Convert World Center to Local Center
    const localCenter = new THREE.Vector3().copy(carCenterHelper).sub(model.position);
    
    // COMMON CONFIG
    const xOffset = carSizeHelper.x * 0.3; 
    // Headlights sit slightly lower than roof, Taillights slightly higher than bumper
    const yPos = localCenter.y + (carSizeHelper.y * 0.1); 

    // --- VISIBILITY FILL LIGHT ---
    // A soft light that hovers above the car so it's never too dark to see.
    // Intensity: 3.0 (Bright enough to see paint, not bright enough to blind you)
    // Distance: 25 (Small radius, so it doesn't light up the ground too much)
    const fillLight = new THREE.PointLight(0xffffff,800.0, 20);
    
  
    fillLight.position.set(localCenter.x, yPos + 10.0, localCenter.z + 2.0);
    fillLight.castShadow = false;
    model.add(fillLight);

    // --- FRONT LIGHTS ---
    const frontZ = localCenter.z - (carSizeHelper.z * 0.5) + 0.5; 
    const frontReach = Math.max(300, carSizeHelper.z * 30);
    const headBulbGeom = new THREE.SphereGeometry(0.001, 16, 16);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const makeHeadLight = (xSign) => {
        const light = new THREE.SpotLight(0xffffff, 300, frontReach, Math.PI / 3, 0.3, 1.2);
        light.castShadow = false;
        light.position.set(localCenter.x + xSign * xOffset, yPos, frontZ);
        
        const target = new THREE.Object3D();
        target.position.set(localCenter.x + xSign * xOffset, yPos, frontZ - 100); // Point Forward (-Z)
        
        model.add(target);
        light.target = target;
        model.add(light);
        
        const bulb = new THREE.Mesh(headBulbGeom, headMat);
        bulb.position.copy(light.position);
        bulb.renderOrder = 10;
        model.add(bulb);
    };

    // --- REAR LIGHTS ---
    const backZ = localCenter.z + (carSizeHelper.z * 0.5) - 0.4;
    const tailReach = 50; 
    const tailBulbGeom = new THREE.BoxGeometry(0.001, 0.001, .001); // Rectangular look
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red Color

    const makeTailLight = (xSign) => {
        const light = new THREE.SpotLight(0xff0000, 100, tailReach, Math.PI / 2, 0.5, 1);
        light.castShadow = false;
        light.position.set(localCenter.x + xSign * xOffset, yPos, backZ);

        const target = new THREE.Object3D();
        target.position.set(localCenter.x + xSign * xOffset, yPos, backZ + 50);
        
        model.add(target);
        light.target = target;
        model.add(light);

        const lens = new THREE.Mesh(tailBulbGeom, tailMat);
        lens.position.copy(light.position);
        lens.renderOrder = 10;
        model.add(lens);
    };

    makeHeadLight(1);  // Left Front
    makeHeadLight(-1); // Right Front
    makeTailLight(1);  // Left Rear
    makeTailLight(-1); // Right Rear
}

function updateSectorVisibility(carPos) {
    if (!sectorCullingEnabled || !trackSectors.length) return;
    trackSectors.forEach((sector) => {
        if (!sector.anchor) return;
        sector.anchor.getWorldPosition(sectorWorkVec);
        const visible = carPos.distanceTo(sectorWorkVec) < trackRenderDistance;
        sector.meshes.forEach((mesh) => {
            mesh.visible = visible;
        });
    });
}

// --- SPONSOR BILLBOARD ---
function createSponsorBillboard(position) {

    if (scene.getObjectByName("MoravianSign")) {
        return; 
    }
    const loader = new THREE.TextureLoader();
    
    loader.load('MVU_Logo.png', (texture) => {
        

        const wrapper = new THREE.Group();
        wrapper.name = "MoravianSign";
        wrapper.position.copy(position);
        scene.add(wrapper);

        const poleGeo = new THREE.CylinderGeometry(1, 1, 45, 16);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = -20; 
        wrapper.add(pole);

   
        const signGroup = new THREE.Group();
        wrapper.add(signGroup); 
      
        const boxGeo = new THREE.BoxGeometry(62, 22, 2); 
        const boxMat = new THREE.MeshPhongMaterial({ 
        color: 0x111111,
        emissive: 0x00ffcc,
        emissiveIntensity: 0.01
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        signGroup.add(box);

    
        const planeGeo = new THREE.PlaneGeometry(60, 20);
        const planeMat = new THREE.MeshBasicMaterial({ 
            map: texture,
            side: THREE.DoubleSide, 
            transparent: true
        });
        const frontImage = new THREE.Mesh(planeGeo, planeMat);
        frontImage.position.z = 1.1;
        signGroup.add(frontImage);


        const backImage = frontImage.clone();
        backImage.rotation.y = Math.PI; 
        backImage.position.z = -1.1; 
        signGroup.add(backImage);

    
        animatedObjects.push(signGroup);
        
  
    });
}

// --- Safety Net ---
function addSafetyNet() {
    const geometry = new THREE.BoxGeometry(5000, 1, 5000);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, visible: false });
    const safetyFloor = new THREE.Mesh(geometry, material);
    
    safetyFloor.position.set(0, -20, 0); 
    safetyFloor.name = 'SafetyNet'; 
    
    scene.add(safetyFloor);
    

    mapColliders.push(safetyFloor); 
}
addSafetyNet();

// --- TRACK SPATIAL INDEX ---
// three's Raycaster brute-forces every triangle of every mesh whose bounds the
// ray touches. Two meshes in this map carry ~7.7k triangles each and span the
// whole world, so one cast costs ~2ms - a third of a frame budget. Bucketing the
// triangles into a flat XZ grid takes that under 0.01ms, which is what makes
// per-frame body collision affordable.
class TrackIndex {
    constructor(meshes, cell = 48) {
        this.cell = cell;
        this.objs = [];
        const verts = [], norms = [], owner = [];
        const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
        const la = new THREE.Vector3(), lb = new THREE.Vector3(), lc = new THREE.Vector3();
        const n = new THREE.Vector3();

        for (const m of meshes) {
            if (!m.geometry || !m.geometry.attributes.position) continue;
            m.updateMatrixWorld(true);
            const oi = this.objs.length;
            const mat = Array.isArray(m.material) ? m.material[0] : m.material;
            this.objs.push({
                name: m.name,
                matrixWorld: m.matrixWorld.clone(),
                quaternion: m.quaternion.clone(),
                doubleSided: mat ? mat.side === THREE.DoubleSide : false
            });
            const pos = m.geometry.attributes.position, idx = m.geometry.index;
            const count = idx ? idx.count : pos.count;
            for (let i = 0; i + 2 < count; i += 3) {
                const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
                la.fromBufferAttribute(pos, i0); lb.fromBufferAttribute(pos, i1); lc.fromBufferAttribute(pos, i2);
                // three reports face.normal in object space, so store it that way
                THREE.Triangle.getNormal(la, lb, lc, n);
                norms.push(n.x, n.y, n.z);
                a.copy(la).applyMatrix4(m.matrixWorld);
                b.copy(lb).applyMatrix4(m.matrixWorld);
                c.copy(lc).applyMatrix4(m.matrixWorld);
                verts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
                owner.push(oi);
            }
        }
        this.v = new Float32Array(verts);
        this.n = new Float32Array(norms);
        this.o = new Int32Array(owner);
        this.count = owner.length;

        let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
        for (let t = 0; t < this.count; t++) {
            for (let k = 0; k < 3; k++) {
                const x = this.v[t * 9 + k * 3], z = this.v[t * 9 + k * 3 + 2];
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (z < minZ) minZ = z;
                if (z > maxZ) maxZ = z;
            }
        }
        this.minX = minX;
        this.minZ = minZ;
        this.nx = Math.max(1, Math.ceil((maxX - minX) / cell) + 1);
        this.nz = Math.max(1, Math.ceil((maxZ - minZ) / cell) + 1);

        const lists = new Array(this.nx * this.nz);
        for (let t = 0; t < this.count; t++) {
            let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
            for (let k = 0; k < 3; k++) {
                const x = this.v[t * 9 + k * 3], z = this.v[t * 9 + k * 3 + 2];
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (z < z0) z0 = z;
                if (z > z1) z1 = z;
            }
            for (let cz = this._cz(z0); cz <= this._cz(z1); cz++) {
                for (let cx = this._cx(x0); cx <= this._cx(x1); cx++) {
                    const k = cz * this.nx + cx;
                    (lists[k] || (lists[k] = [])).push(t);
                }
            }
        }
        this.buckets = lists.map(l => (l ? Int32Array.from(l) : null));
        this.seen = new Int32Array(this.count);
        this.tick = 0;
    }

    _cx(x) { return Math.min(this.nx - 1, Math.max(0, Math.floor((x - this.minX) / this.cell))); }
    _cz(z) { return Math.min(this.nz - 1, Math.max(0, Math.floor((z - this.minZ) / this.cell))); }

    // Same shape as Raycaster.intersectObjects: sorted, with object + face.normal.
    raycast(origin, dir, far) {
        this.tick++;
        const out = [];
        const ox = origin.x, oy = origin.y, oz = origin.z;
        const dx = dir.x, dy = dir.y, dz = dir.z;

        const sweepCell = (cx, cz) => {
            const b = this.buckets[cz * this.nx + cx];
            if (!b) return;
            for (let i = 0; i < b.length; i++) {
                const t = b[i];
                if (this.seen[t] === this.tick) continue;
                this.seen[t] = this.tick;
                const d = this._hit(ox, oy, oz, dx, dy, dz, t * 9, far, this.objs[this.o[t]].doubleSided);
                if (d !== null) {
                    out.push({
                        distance: d,
                        point: new THREE.Vector3(ox + dx * d, oy + dy * d, oz + dz * d),
                        object: this.objs[this.o[t]],
                        face: { normal: new THREE.Vector3(this.n[t * 3], this.n[t * 3 + 1], this.n[t * 3 + 2]) }
                    });
                }
            }
        };

        if (Math.hypot(dx, dz) < 1e-6) {
            sweepCell(this._cx(ox), this._cz(oz));           // straight up or down
        } else {
            let cx = this._cx(ox), cz = this._cz(oz);
            const stepX = dx > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
            const bx = this.minX + (cx + (dx > 0 ? 1 : 0)) * this.cell;
            const bz = this.minZ + (cz + (dz > 0 ? 1 : 0)) * this.cell;
            let tMaxX = Math.abs(dx) < 1e-9 ? Infinity : (bx - ox) / dx;
            let tMaxZ = Math.abs(dz) < 1e-9 ? Infinity : (bz - oz) / dz;
            const tDx = Math.abs(dx) < 1e-9 ? Infinity : Math.abs(this.cell / dx);
            const tDz = Math.abs(dz) < 1e-9 ? Infinity : Math.abs(this.cell / dz);
            let travelled = 0;
            while (travelled <= far) {
                sweepCell(cx, cz);
                if (tMaxX < tMaxZ) {
                    cx += stepX; travelled = tMaxX; tMaxX += tDx;
                } else {
                    cz += stepZ; travelled = tMaxZ; tMaxZ += tDz;
                }
                if (cx < 0 || cx >= this.nx || cz < 0 || cz >= this.nz) break;
            }
        }
        out.sort((p, q) => p.distance - q.distance);
        return out;
    }

    // Moller-Trumbore, honouring material side the way Mesh.raycast does
    _hit(ox, oy, oz, dx, dy, dz, o, far, doubleSided) {
        const v = this.v;
        const ax = v[o], ay = v[o + 1], az = v[o + 2];
        const e1x = v[o + 3] - ax, e1y = v[o + 4] - ay, e1z = v[o + 5] - az;
        const e2x = v[o + 6] - ax, e2y = v[o + 7] - ay, e2z = v[o + 8] - az;
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
        const det = e1x * px + e1y * py + e1z * pz;
        if (doubleSided ? Math.abs(det) < 1e-9 : det < 1e-9) return null;
        const inv = 1 / det;
        const tx = ox - ax, ty = oy - ay, tz = oz - az;
        const u = (tx * px + ty * py + tz * pz) * inv;
        if (u < 0 || u > 1) return null;
        const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
        const w = (dx * qx + dy * qy + dz * qz) * inv;
        if (w < 0 || u + w > 1) return null;
        const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
        return (t < 0 || t > far) ? null : t;
    }
}

let trackIndex = null;

// Cast against the track, through the index once it exists.
function castTrack(raycaster, origin, dir, far) {
    if (trackIndex) return trackIndex.raycast(origin, dir, far);
    raycaster.set(origin, dir);
    raycaster.far = far;
    return raycaster.intersectObjects(mapColliders);
}

// A face blocks the car when it is too steep to stand on. This is the same test
// the suspension uses to decide what counts as ground, so anything drivable -
// including the steep ramps - is never treated as a wall.
const WALL_MAX_NY = 0.5;




// Time Trial Manager
class TimeTrialManager {
    constructor(uiCurrent, uiBest, uiLap) {
        this.uiCurrent = uiCurrent;
        this.uiBest = uiBest;
        this.uiLap = uiLap;
        this.lapTimes = [];
        
        this.lap = 1;
        this.bestTime = Infinity;
        
      
        this.lapStartTime = 0; 
        this.totalStartTime = 0; 
        this.currentLapDuration = 0;
        
        this.isRunning = false;
        this.isWarmup = true; 

   
        this.minLapTime = 5.0; 

    
        this.lastUITime = 0;   
        this.uiUpdateRate = 65; 
        this.workVec = new THREE.Vector3(); 
        this.workQuat = new THREE.Quaternion(); 
        this.yAxis = new THREE.Vector3(0, 1, 0);

        // Checkpoints Config
        this.checkpoints = [
            { pos: new THREE.Vector3(370, 25, -130), rot: 0, radius: 20, passed: false }, 
            { pos: new THREE.Vector3(80, 47, 615), rot: 1.5, radius: 35, passed: false },
            { pos: new THREE.Vector3(4, 10, 80), rot: 0, radius: 15, passed: false, isFinish: true } 
        ];
        
        this.nextCheckpointIndex = 0;
        this.debugMeshes = [];

        // Create Checkpoint Visuals
        this.checkpoints.forEach((cp) => {
            const geometry = new THREE.BoxGeometry(cp.radius * 3.0, 25, 1);
            const material = new THREE.MeshBasicMaterial({ 
                color: cp.isFinish ? 0x00ff00 : 0x00ffff, 
                transparent: true, opacity: 0.25, side: THREE.DoubleSide, 
                depthWrite: false, blending: THREE.AdditiveBlending 
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(cp.pos);
            mesh.position.y += 10; 
            mesh.rotation.y = cp.rot; 
            scene.add(mesh);
            this.debugMeshes.push(mesh);
        });
    }

    start() {
        this.isWarmup = true;
        this.isRunning = false;
        this.lapTimes = [];

 
        if (bgmNormal.isPlaying) bgmNormal.stop();
        if (bgmFast.isPlaying) bgmFast.stop();
        if (sfxFanfare.isPlaying) sfxFanfare.stop();

        
        
        if (this.uiCurrent) {
            this.uiCurrent.innerText = "WARMUP";
            this.uiCurrent.style.color = '#ffaa00'; 
        }

        if (GAME_STATE.mode === 'traditional') {
            document.getElementById('max-laps').innerText = "/ 5";
        } else {
            document.getElementById('max-laps').innerText = "";
        }
        
        this.nextCheckpointIndex = 2; // Look for finish line first
        this.lap = 1;
        this.resetCheckpointsVisuals();
    }
    
    fullReset() {
        this.lap = 1;
        this.bestTime = Infinity;
        this.lapTimes = [];
        if (this.uiBest) this.uiBest.innerText = "--:--.--";
        if (this.uiLap) this.uiLap.innerText = this.lap;
        this.start(); 
    }

    resetCheckpointsVisuals() {
        this.checkpoints.forEach(cp => cp.passed = false);
        this.debugMeshes.forEach((m, idx) => {
            const isFin = this.checkpoints[idx].isFinish;
            m.material.color.setHex(isFin ? 0x00ff00 : 0x00ffff);
            m.material.opacity = 0;
        });
    }

    update(carPosition) {
        const now = performance.now();

        if (this.isRunning) {
            const totalRaceTime = (now - this.totalStartTime) / 1000.0;
            
            if (now - this.lastUITime > this.uiUpdateRate) {
                if (this.uiCurrent) this.uiCurrent.innerText = formatTime(totalRaceTime);
                this.lastUITime = now;
            }
        }

        const targetCP = this.checkpoints[this.nextCheckpointIndex];
        const targetMesh = this.debugMeshes[this.nextCheckpointIndex];

        this.workVec.copy(carPosition).sub(targetCP.pos);
        this.workQuat.setFromAxisAngle(this.yAxis, -targetCP.rot); 
        this.workVec.applyQuaternion(this.workQuat);

        const gateHalfWidth = (targetCP.radius * 3.0) / 2.0; 
        const gateThickness = 6.0; 

        if (Math.abs(this.workVec.x) < gateHalfWidth && Math.abs(this.workVec.z) < gateThickness) {
            

            if (targetMesh.material.opacity < 0.05) {
                targetMesh.material.color.setHex(0x333333);
                targetMesh.material.opacity = 0.1;
            }

            if (targetCP.isFinish) {
                if (this.isWarmup) {
                   
                  
                    this.isWarmup = false;
                    this.isRunning = true;

                    if (bgmNormal.buffer && !bgmNormal.isPlaying) {
                        bgmNormal.play();
                    }
                    
                    this.lapTimes = [];
                    const startT = performance.now();
                    this.totalStartTime = startT;
                    this.lapStartTime = startT; // Start Lap 1 Timer
                    
                    if(this.uiCurrent) this.uiCurrent.style.color = '#00ffcc';
                    
                    this.nextCheckpointIndex = 0;
                    this.resetCheckpointsVisuals();
                } else {
                 
                    const potentialDuration = (performance.now() - this.lapStartTime) / 1000.0;

                    if (potentialDuration > this.minLapTime) {
                        const lapEndT = performance.now();
                        const duration = (lapEndT - this.lapStartTime) / 1000.0;
                   
                        this.lapStartTime = lapEndT;
                        this.completeLap(duration);
                        
                    }
                }
            } else {
            
                this.nextCheckpointIndex++;
            }
        } 
        else if (targetMesh.material.opacity === 0) {
            targetMesh.material.color.setHex(0xffff00);
            targetMesh.material.opacity = 0.0; 
        }
    }

    completeLap(duration) {
        this.lapTimes.push(duration);
       

        if (duration < this.bestTime) {
            this.bestTime = duration;
            if (this.uiBest) this.uiBest.innerText = formatTime(this.bestTime);
            if (this.uiCurrent) {
                this.uiCurrent.style.color = '#00ff00';
                setTimeout(() => { if(this.uiCurrent) this.uiCurrent.style.color = '#00ffcc'; }, 1000);
            }
        }

        // Check for Race Finish (Traditional Mode)
        if (GAME_STATE.mode === 'traditional' && this.lap >= 5) {
            this.endGame();
            return;
        }

        if (GAME_STATE.mode === 'traditional' && this.lap === 4) {
       
            if (bgmNormal.isPlaying) bgmNormal.stop();
            if (bgmFast.buffer) bgmFast.play();
        }

        this.lap++;
        if (this.uiLap) this.uiLap.innerText = this.lap;
        
        this.nextCheckpointIndex = 0;
        this.resetCheckpointsVisuals();
    }

    endGame() {
        if (carController) carController.canDrive = false;
        this.isRunning = false;

        // 1. STOP ALL MUSIC
        if (bgmNormal.isPlaying) bgmNormal.stop();
        if (bgmFast.isPlaying) bgmFast.stop();
        if (sfxFanfare.buffer) sfxFanfare.play();
        idleSound.setVolume(0);
        accelerationSound.setVolume(0);
        driftSound.setVolume(0);

        // 2. GET LAPS 
        let lapsToCount = this.lapTimes;
        if (GAME_STATE.mode === 'traditional') {
             lapsToCount = this.lapTimes.slice(-5);
        }

        const totalTime = lapsToCount.reduce((a, b) => a + b, 0);

        // 3. UPDATE UI
        const uiContainer = document.getElementById('ui-container');
        const resultsScreen = document.getElementById('results-screen');
        
        if (uiContainer) uiContainer.classList.add('hidden');
        if (resultsScreen) resultsScreen.classList.remove('hidden');
        
        // Connect to HTML elements
        const lapElements = [
            document.getElementById('res-lap1'),
            document.getElementById('res-lap2'),
            document.getElementById('res-lap3'),
            document.getElementById('res-lap4'),
            document.getElementById('res-lap5')
        ];
        const lTotal = document.getElementById('res-total');

        // Best Lap Logic
        let bestTime = Infinity;
        let bestIndex = -1;

        lapsToCount.forEach((time, index) => {
            if (lapElements[index]) {
                lapElements[index].innerText = formatTime(time);
                lapElements[index].style.color = "white"; 
                lapElements[index].style.textShadow = "none";
                lapElements[index].style.fontWeight = "normal";
            }
            
            if (time < bestTime) {
                bestTime = time;
                bestIndex = index;
            }
        });


        if (bestIndex !== -1 && lapElements[bestIndex]) {
            const winner = lapElements[bestIndex];
            winner.style.color = "#FFD700"; 
            winner.style.textShadow = "0 0 10px #FFD700, 0 0 20px #FFAA00"; 
            winner.style.fontWeight = "bold";
        }
        
        if (lTotal) lTotal.innerText = formatTime(totalTime);
    }
}
    const timeTrial = new TimeTrialManager(uiTimeCurrent, uiTimeBest, uiLapCount);
    
    function createSmokeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        

        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
        
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');    
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)'); 
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');     
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
}

class CarControls {
    constructor(model, idleSoundRef, accelerationSoundRef, driftSoundRef, physicsStats, wheelKeywords=[], shouldFixPivot = false, spinAxis = 'x', steeringWheelNames = [], steeringAxis = 'z', fixSteeringPivot = false, invertSteering, disableWheelSpin = false, wheelstoFlip = []) {
    
        this.model = model;
        this.invertSteering = invertSteering;
        this.spinAxis = spinAxis || 'x';
        this.disableWheelSpin = disableWheelSpin;
        this.wheelstoFlip = wheelstoFlip;
        

        
        
        // Wheel Setup
        this.wheels = [];
        const foundWheelMeshes = [];
        if (wheelKeywords.length > 0) {
            this.model.traverse((child) => {
                if (child.isMesh) {
                    const isWheel = wheelKeywords.some(keyword => {
                        if (keyword.startsWith('=')) return child.name === keyword.substring(1);
                        return child.name.toLowerCase().includes(keyword.toLowerCase());
                    });
                    if (isWheel) foundWheelMeshes.push(child);
                }
            });
        }
        // Wheel Pivot Logic
        foundWheelMeshes.forEach(mesh => {
            if (shouldFixPivot) {
                const box = new THREE.Box3().setFromObject(mesh);
                const center = new THREE.Vector3();
                box.getCenter(center);
                const pivot = new THREE.Group();
                pivot.name = mesh.name;
                mesh.parent.add(pivot);
                pivot.position.copy(mesh.parent.worldToLocal(center.clone()));
                pivot.attach(mesh);
                this.wheels.push(pivot);
            } else {
                this.wheels.push(mesh);
            }
        });
    


    
        this.steeringParts = [];
        this.steeringAxis = steeringAxis; 
        if (!Array.isArray(steeringWheelNames)) {
            if (typeof steeringWheelNames === 'string') {
                steeringWheelNames = [steeringWheelNames];
            } else {
                steeringWheelNames = []; // 
            }
        }

        if (steeringWheelNames && steeringWheelNames.length > 0) {
            const rawSteeringParts = [];
            this.model.traverse((child) => {
                if (child.isMesh || child.type === 'Group') {
                    const isMatch = steeringWheelNames.some(keyword => {
                        if (keyword.startsWith('=')) return child.name === keyword.substring(1);
                        return child.name.toLowerCase().includes(keyword.toLowerCase());
                    });
                    if (isMatch) rawSteeringParts.push(child);
                }
            });

            rawSteeringParts.forEach(part => {
                if (fixSteeringPivot) { 
                    
        
                    const box = new THREE.Box3().setFromObject(part);
                    const center = new THREE.Vector3();
                    box.getCenter(center);

                    const pivot = new THREE.Group();
                    part.parent.add(pivot);

                    pivot.position.copy(part.parent.worldToLocal(center.clone()));

                    pivot.attach(part);

                    this.steeringParts.push(pivot);
                  
                } else {
                    this.steeringParts.push(part);
                }
            });
        }


        
        // --- 1. DYNAMIC CAR STATS ---
        const stats = physicsStats || { maxSpeed: 120, accel: 45, brake: 50, steer: 0.005, gravity: 180 };
        this.maxSpeed = stats.maxSpeed; 
        this.acceleration = stats.accel;
        this.brakeStrength = stats.brake;
        this.maxSteer = stats.steer; 
        this.gravity = stats.gravity;
        this.drag = 0.5;

        // --- 2. PHYSICS CONSTANTS ---
        this.rideHeight = 0.5; 
        this.tiltSpeed = 0.08; 
        // Collision body: two circles along the car's axis, so the corners and
        // flanks are covered rather than a single ray down the middle. Together
        // they cover roughly a 4.2 x 2.6 footprint.
        this.bodyRadius = 1.3;
        this.bodyOffset = 0.8;
        this.bodyHeights = [1.2, 2.6];   // above the model origin; steps over low kerbs
        this.wallBounce = 0.2; 

        // --- 3. STATE ---
        this.speed = 0;
        this.velocity = new THREE.Vector3();
        this.moveDirection = new THREE.Vector3(0, 0, -1);
        this.isGrounded = false;
        this.isDriftingState = false;
        this.badObjects = [];
        this.lastSafePosition = new THREE.Vector3(0, 30, 180); 
        this.lastSafeQuaternion = new THREE.Quaternion();
        this.safePosTimer = 0;
        this.groundMemory = 0; 
        this.memoryDuration = 0.1; 
        this.lastValidGroundY = -Infinity;

        // --- 4. RAYCASTERS ---
        this.groundRaycaster = new THREE.Raycaster();
        this.upRaycaster = new THREE.Raycaster();
        this.wallRaycaster = new THREE.Raycaster();

        // --- 5. AUDIO & INPUT ---
        this.idleSound = idleSoundRef || null;
        this.accelerationSound = accelerationSoundRef || null;
        this.driftSound = driftSoundRef || null;
        this.keys = { forward: false, backward: false, left: false, right: false, space: false };
        this.canDrive = true;
        this.analogSteering = 0;
        this.gamepadIndex = null;

        // AI mode
        this.aiMode = false;
        this.aiWaypoints = [];
        this.aiWaypointIndex = 0;
        this._aiSteering = 0;
        this._aiResetCount = 0;
        this._aiLastResetTime = 0;

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('gamepadconnected', (e) => { this.gamepadIndex = e.gamepad.index; });
        window.addEventListener('gamepaddisconnected', (e) => { if (this.gamepadIndex === e.gamepad.index) this.gamepadIndex = null; });

        // --- 6. VISUAL DEBUGGERS ---
        this.debugMode = false;
        this.arrowSuspension = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), new THREE.Vector3(), 15, 0x00ff00);
        this.arrowWall = new THREE.ArrowHelper(new THREE.Vector3(0,0,-1), new THREE.Vector3(), 6, 0xff0000);
        this.mindSphere = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.5 }));
        scene.add(this.arrowSuspension);
        scene.add(this.arrowWall);
        scene.add(this.mindSphere); 
        this.arrowSuspension.visible = false;
        this.arrowWall.visible = false;
        this.mindSphere.visible = false;

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'v') {
                this.debugMode = !this.debugMode;
                this.arrowSuspension.visible = this.debugMode;
                this.arrowWall.visible = this.debugMode;
                this.mindSphere.visible = this.debugMode;
            }
        });

        // --- 7. SMOKE PARTICLE SYSTEM ---
        this.smokeParticles = [];
        const smokeTex = createSmokeTexture();
        const smokeMat = new THREE.SpriteMaterial({ map: smokeTex, color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
        for (let i = 0; i < 40; i++) {
            const p = new THREE.Sprite(smokeMat);
            p.visible = false;
            p.scale.set(4, 4, 4); 
            scene.add(p);
            this.smokeParticles.push({ mesh: p, life: 0 });
        }
        this.smokeTimer = 0; 
    }


    setEngineAudio(idle, accel, drift) {
        this.idleSound = idle;
        this.accelerationSound = accel;
        this.driftSound = drift;
        if(this.idleSound && !this.idleSound.isPlaying) this.idleSound.play();
        if(this.accelerationSound && !this.accelerationSound.isPlaying) this.accelerationSound.play();
        if(this.driftSound && !this.driftSound.isPlaying) this.driftSound.play();
        if(this.idleSound) this.idleSound.setVolume(0);
        if(this.accelerationSound) this.accelerationSound.setVolume(0); 
        if(this.driftSound) this.driftSound.setVolume(0);             
    }

    _updateAIInputs(rawDelta = 1 / 60) {
        const path = this.aiWaypoints;
        if (!path || path.length < 4) return;
        const n = path.length;
        // Smoothed frame time: one long frame must not upset the speed profile.
        this._aiDt = this._aiDt ? this._aiDt * 0.92 + rawDelta * 0.08 : rawDelta;
        const deltaTime = THREE.MathUtils.clamp(this._aiDt, 1 / 240, 0.05);

        // ---- one-time: curvature radius + grade for every point on the line ----
        if (!this._aiRadius || this._aiRadius.length !== n) {
            this._aiRadius = new Float64Array(n);
            this._aiGrade = new Float64Array(n);
            this._aiSeg = new Float64Array(n);
            // Circumradius over a wide stencil: sampling adjacent points only
            // turns rounding noise into phantom hairpins.
            const S = 3;
            for (let i = 0; i < n; i++) {
                const a = path[(i - S + n * 2) % n], b = path[i], c = path[(i + S) % n];
                const ab = Math.hypot(b.x - a.x, b.z - a.z);
                const bc = Math.hypot(c.x - b.x, c.z - b.z);
                const ca = Math.hypot(a.x - c.x, a.z - c.z);
                const area2 = Math.abs((b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z));
                this._aiRadius[i] = area2 < 1e-6 ? 1e6 : (ab * bc * ca) / area2;
                const nx = path[(i + 1) % n];
                this._aiSeg[i] = Math.hypot(nx.x - b.x, nx.z - b.z);
                this._aiGrade[i] = ca > 0.01 ? (c.y - a.y) / ca : 0;
            }
            // a corner is only as fast as its tightest part
            const r = this._aiRadius.slice();
            for (let i = 0; i < n; i++) {
                for (let k = -S; k <= S; k++) {
                    this._aiRadius[i] = Math.min(this._aiRadius[i], r[(i + k + n * 2) % n]);
                }
            }
            this._aiVmax = new Float64Array(n);
        }

        // ---- speed profile (recomputed if the frame rate shifts) ----
        // The car turns a fixed angle per FRAME, so a slower frame rate means a
        // wider turning circle; the car also slides a little wide of the ideal
        // arc, and that lag grows with frame time. Both are folded in here.
        const yawRate = this.maxSteer / deltaTime;                   // rad/s at full lock
        const fpsScale = THREE.MathUtils.clamp(1 / (60 * deltaTime), 0.5, 1);
        if (!this._aiProfileYaw || Math.abs(this._aiProfileYaw - yawRate) > yawRate * 0.08) {
            this._aiProfileYaw = yawRate;
            const v = this._aiVmax;
            for (let i = 0; i < n; i++) {
                let lim = yawRate * this._aiRadius[i] * AI.safety * fpsScale;
                const g = this._aiGrade[i];
                // the steep ramps on this track launch the car if taken flat out
                if (g > 0.22) lim = Math.min(lim, THREE.MathUtils.lerp(75, 34, THREE.MathUtils.clamp((g - 0.22) / 0.45, 0, 1)));
                if (g < -0.22) lim = Math.min(lim, 70);
                v[i] = Math.min(lim, this.maxSpeed);
            }
            // backward pass: arrive at every corner already slow enough
            const a = this.brakeStrength;
            for (let pass = 0; pass < 3; pass++) {
                for (let k = n; k > 0; k--) {
                    const i = k % n, j = (i + 1) % n;
                    const d = Math.max(this._aiSeg[i], 0.01);
                    v[i] = Math.min(v[i], Math.sqrt(v[j] * v[j] + 2 * a * d));
                }
            }
        }

        // ---- where are we on the line ----
        const pos = new THREE.Vector3(), quat = new THREE.Quaternion();
        this.model.getWorldPosition(pos);
        this.model.getWorldQuaternion(quat);
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
        fwd.y = 0;
        if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, -1);
        fwd.normalize();
        const speed = Math.abs(this.speed);

        let idx = this.aiWaypointIndex | 0;
        const d2 = (i) => (path[i].x - pos.x) ** 2 + (path[i].z - pos.z) ** 2;
        // walk forward past points we have already gone by
        for (let k = 0; k < 12; k++) {
            const a = path[idx], b = path[(idx + 1) % n];
            const sx = b.x - a.x, sz = b.z - a.z;
            if ((pos.x - a.x) * sx + (pos.z - a.z) * sz > sx * sx + sz * sz) idx = (idx + 1) % n;
            else break;
        }
        // lost the line (respawn, big shunt): re-acquire globally
        if (d2(idx) > 90 * 90) {
            let best = idx, bd = Infinity;
            for (let i = 0; i < n; i++) { const d = d2(i); if (d < bd) { bd = d; best = i; } }
            idx = best;
        }
        this.aiWaypointIndex = idx;

        // ---- aim point ----
        const look = THREE.MathUtils.clamp(AI.lookBase + speed * AI.lookGain, 12, 60);
        let acc = Math.hypot(path[idx].x - pos.x, path[idx].z - pos.z);
        let ti = idx;
        while (acc < look) { const nx = (ti + 1) % n; acc += this._aiSeg[ti]; ti = nx; if (ti === idx) break; }
        const aim = path[ti];

        // ---- steering: pure pursuit + cross-track correction ----
        const to = new THREE.Vector3(aim.x - pos.x, 0, aim.z - pos.z);
        const dist = Math.max(to.length(), 1);
        to.divideScalar(dist);
        const cross = fwd.x * to.z - fwd.z * to.x;      // +ve => target is to the right
        const dot = THREE.MathUtils.clamp(fwd.dot(to), -1, 1);
        const alpha = Math.atan2(-cross, dot);          // +ve => steer left

        // lateral error from the line, so we track it rather than just chase it
        const segA = path[idx], segB = path[(idx + 1) % n];
        const tx = segB.x - segA.x, tz = segB.z - segA.z;
        const tl = Math.hypot(tx, tz) || 1;
        const lateral = ((pos.x - segA.x) * tz - (pos.z - segA.z) * tx) / tl;   // +ve => right of line

        // Pure pursuit gives the yaw rate that swings the car onto the aim point;
        // the lateral term stops it settling parallel to the line but off it.
        const yawWanted = (2 * Math.sin(alpha) * Math.max(speed, 12)) / Math.max(dist, 8)
            + THREE.MathUtils.clamp(lateral * 0.035, -0.5, 0.5);

        // A racer uses the handbrake when the corner asks for more rotation than
        // the front tyres can give. Drifting doubles the steering authority, so
        // the command is scaled to match and the car does not spin.
        const gripYaw = this.maxSteer / deltaTime;
        const wantDrift = AI.drift && speed > 50 && Math.abs(yawWanted) > gripYaw * 0.95;
        const steerMult = wantDrift ? 2 : 1;
        let steerCmd = yawWanted * deltaTime / (this.maxSteer * steerMult);

        // ---- speed target ----
        let target = this._aiVmax[idx];
        for (let k = 1, j = idx; k <= 3; k++) { j = (j + 1) % n; target = Math.min(target, this._aiVmax[j]); }

        // ---- safety net: a wall genuinely close ahead ----
        const eye = pos.clone(); eye.y += 1.6;
        const _n = new THREE.Vector3();
        const wallAt = (deg, far) => {
            const d = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(deg));
            for (const h of castTrack(this.wallRaycaster, eye, d, far)) {
                if (h.object.name === 'SafetyNet' || !h.face) continue;
                _n.copy(h.face.normal).transformDirection(h.object.matrixWorld).normalize();
                if (Math.abs(_n.y) < 0.6) return h.distance;   // flat ramps are not walls
            }
            return far;
        };
        const SAFE = Math.max(16, Math.min(45, speed * 0.45));
        const wl = wallAt(24, SAFE), wr = wallAt(-24, SAFE), wf = wallAt(0, SAFE);
        if (wl < SAFE) steerCmd -= (1 - wl / SAFE) * 1.4;
        if (wr < SAFE) steerCmd += (1 - wr / SAFE) * 1.4;
        if (wf < SAFE * 0.7) target = Math.min(target, Math.max(20, wf * 1.4));

        this._aiSteering = THREE.MathUtils.clamp(steerCmd, -1, 1);

        // ---- throttle / brake ----
        this.keys.forward = speed < target;
        this.keys.backward = speed > target * 1.06 + 4;

        this.keys.space = wantDrift;
        this.keys.left = false;
        this.keys.right = false;
    }

    updateEngineAudio() {
        if (!this.idleSound || !this.accelerationSound || !this.driftSound) return;
        if (this.idleSound.context && this.idleSound.context.state === 'suspended') {
            this.idleSound.context.resume();
        }
        const isMoving = Math.abs(this.speed) > 1.0; 
        if (isMoving) {
            if (!this.accelerationSound.isPlaying) this.accelerationSound.play();
            this.accelerationSound.setVolume(0.5);
            const speedRatio = Math.min(Math.abs(this.speed) / this.maxSpeed, 1.0);
            this.accelerationSound.setPlaybackRate(0.8 + (speedRatio * 0.7));
            this.idleSound.setVolume(0);
        } else {
            if (!this.idleSound.isPlaying) this.idleSound.play();
            this.idleSound.setVolume(0.5);
            this.accelerationSound.setVolume(0);
        }
        if (this.isDriftingState && this.isGrounded && Math.abs(this.speed) > 20) {
            if (!this.driftSound.isPlaying) this.driftSound.play();
            const currentVol = this.driftSound.getVolume();
            this.driftSound.setVolume(THREE.MathUtils.lerp(currentVol, 0.6, 0.2));
        } else {
            const currentVol = this.driftSound.getVolume();
            this.driftSound.setVolume(THREE.MathUtils.lerp(currentVol, 0, 0.2));
        }
    }

    manualReset() {
        this.speed = 0;
        this.velocity.set(0, 0, 0);
        this.model.position.set(0, 30, 180); 
        this.model.rotation.set(0, 0, 0);
        this.lastSafePosition.set(0, 30, 180);
        this.moveDirection.set(0, 0, -1);
        this.groundMemory = 0;
    }

    hardRespawn() {
        if (this.aiMode) {
            const now = performance.now() / 1000;
            if (now - this._aiLastResetTime < 5.0) {
                this._aiResetCount++;
            } else {
                this._aiResetCount = 1;
            }
            this._aiLastResetTime = now;

            if (this._aiResetCount >= 3) {
                this._aiRespawnToWaypoint();
                return;
            }
        }

        console.log("Void Respawn");
        this.model.position.copy(this.lastSafePosition);
        this.model.position.y += 2.0;
        const safeEuler = new THREE.Euler().setFromQuaternion(this.lastSafeQuaternion, 'YXZ');
        this.model.rotation.set(0, safeEuler.y, 0);
        this.moveDirection.set(0, 0, -1).applyEuler(this.model.rotation);
        this.speed = 0;
        this.velocity.set(0,0,0);
        this.safePosTimer = 0;
        this.groundMemory = 0;
    }

    _aiRespawnToWaypoint() {
        const path = this.aiWaypoints;
        if (!path || path.length === 0) return;

        // Points are only ~10 units apart, so stepping to the next one would not
        // clear whatever we are wedged against. Jump a car length or so down the
        // racing line instead.
        const AHEAD = Math.min(8, path.length - 1);
        this.aiWaypointIndex = (this.aiWaypointIndex + AHEAD) % path.length;
        const target = path[this.aiWaypointIndex];
        const nextWP = path[(this.aiWaypointIndex + 1) % path.length];

        // Drop in above the line and let the suspension settle it
        this.model.position.set(target.x, target.y + 5, target.z);

        const facingDir = new THREE.Vector3(
            nextWP.x - target.x, 0, nextWP.z - target.z
        ).normalize();
        // atan2(-fx, -fz) gives the Y rotation needed so local -Z aligns with facingDir
        this.model.rotation.set(0, Math.atan2(-facingDir.x, -facingDir.z), 0);
        this.moveDirection.copy(facingDir);

        this.speed = 0;
        this.velocity.set(0, 0, 0);
        this.safePosTimer = 0;
        this.groundMemory = 0;
        this._aiResetCount = 0;
    }

    onKeyDown(event) {
        if (!this.canDrive && ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code)) return;
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
            case 'Space': this.keys.space = true; break; 
        }
    }
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
            case 'Space': this.keys.space = false; break;
        }
    }

    pollGamepad() {
        if (this.gamepadIndex === null) {
            const pads = Array.from(navigator.getGamepads());
            const found = pads.find(p => p && p.connected);
            if (found) this.gamepadIndex = found.index;
            else return;
        }
        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (!gp) return;

        const DEADZONE = 0.15;
        const isStandard = gp.mapping === 'standard';

        // Only use left stick X for steering on standard-mapped controllers to avoid
        // trigger axes being misread as steering on non-standard layouts.
        const rawX = isStandard ? gp.axes[0] : 0;
        this.analogSteering = Math.abs(rawX) > DEADZONE ? rawX : 0;

        // RT = button 7, LT = button 6 (standard mapping only; no axis fallbacks)
        const accel = gp.buttons[7]?.pressed || false;
        const brake = gp.buttons[6]?.pressed || false;

        if (this.canDrive) {
            this.keys.forward = accel;
            this.keys.backward = brake;
            this.keys.space = gp.buttons[2]?.pressed || false;
        }

        // D-pad steering (digital fallback, separate from analog)
        this.keys.left = gp.buttons[14]?.pressed || false;
        this.keys.right = gp.buttons[15]?.pressed || false;
    }

    spawnSmoke(pos) {
        const p = this.smokeParticles.find(particle => particle.life <= 0);
        if (p) {
            p.mesh.visible = true;
            p.mesh.position.copy(pos);
            p.mesh.position.x += (Math.random() - 0.5) * 1.5; 
            p.mesh.position.z += (Math.random() - 0.5) * 1.5;
            p.mesh.position.y += 0.5; 
            p.mesh.scale.set(4, 4, 4);
            p.mesh.material.opacity = 0.9;
            p.life = 1.0; 
        }
    }
    updateSmoke(deltaTime) {
        this.smokeParticles.forEach(p => {
            if (p.life > 0) {
                p.life -= deltaTime;
                p.mesh.position.y += deltaTime * 3.0; 
                const scale = 4 + (1.0 - p.life) * 8.0; 
                p.mesh.scale.set(scale, scale, scale);
                p.mesh.material.opacity = p.life * 0.9; 
                if (p.life <= 0) p.mesh.visible = false;
            }
        });
    }

    updateDebugVisuals(suspensionOrigin, wallOrigin, wallDir) {
        if (!this.debugMode) return;
        if (this.arrowSuspension) {
            this.arrowSuspension.position.copy(suspensionOrigin);
            this.arrowSuspension.setDirection(new THREE.Vector3(0, -1, 0));
        }
        if (this.arrowWall) {
            this.arrowWall.position.copy(wallOrigin);
            this.arrowWall.setDirection(wallDir);
        }
        if (this.mindSphere) {
            this.mindSphere.position.copy(wallOrigin);
        }
    }

    // Move-and-slide body collision against the barriers.
    //
    // The previous version cast a single ray forward from the car's centre.
    // That missed anything the corners hit, missed walls entirely while
    // drifting (the car travels sideways but the ray points along the bonnet),
    // gave up if the first thing it hit happened to be a floor face, and -
    // because the ray was a fixed 6 units long - let the car tunnel straight
    // through the ~1 unit thick barriers whenever a frame moved it further
    // than that.
    //
    // The car is modelled as two circles, front and rear. Each frame we work
    // out where this frame's velocity would put it, sweep for anything in the
    // way, then separate that destination from any wall it still overlaps and
    // hand the result back as a velocity. Sweeping alone is not enough: a car
    // running along a wall at a shallow angle points nearly parallel to it, so
    // the swept ray only meets the wall far beyond the distance travelled.
    checkWallCollisions(deltaTime) {
        const pos = this.model.position;
        const quat = new THREE.Quaternion();
        this.model.getWorldQuaternion(quat);
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
        fwd.y = 0;
        if (fwd.lengthSq() < 1e-8) return;
        fwd.normalize();

        const R = this.bodyRadius;
        const OFF = this.bodyOffset;
        const org = new THREE.Vector3();
        const dir = new THREE.Vector3();
        const nrm = new THREE.Vector3();
        const front = new THREE.Vector3();
        const rear = new THREE.Vector3();

        // nearest blocking face along a ray, skipping anything drivable
        const firstWall = (origin, direction, far) => {
            const hits = castTrack(this.wallRaycaster, origin, direction, far);
            for (let i = 0; i < hits.length; i++) {
                const h = hits[i];
                if (!h.face || !h.face.normal || h.object.name === 'SafetyNet') continue;
                nrm.copy(h.face.normal).transformDirection(h.object.matrixWorld).normalize();
                if (isNaN(nrm.x) || isNaN(nrm.y) || isNaN(nrm.z)) continue;
                if (Math.abs(nrm.y) > WALL_MAX_NY) continue;
                return { distance: h.distance, nx: nrm.x, nz: nrm.z };
            }
            return null;
        };

        const vx = this.velocity.x, vz = this.velocity.z;
        const planar = Math.hypot(vx, vz);
        const travel = planar * deltaTime;

        // Broad phase: on open road there is nothing within reach, and this is
        // the overwhelmingly common case.
        let near = false;
        for (let k = 0; k < 4 && !near; k++) {
            const a = k * Math.PI / 2;
            dir.set(Math.sin(a), 0, Math.cos(a));
            org.copy(pos);
            org.y += this.bodyHeights[0];
            if (firstWall(org, dir, travel + R + OFF + 1.0)) near = true;
        }
        if (!near) return;

        // Push a position clear of anything its body overlaps.
        const separate = (p, passes) => {
            for (let iter = 0; iter < passes; iter++) {
                let shifted = false;
                front.copy(p).addScaledVector(fwd, OFF);
                rear.copy(p).addScaledVector(fwd, -OFF);
                for (let c = 0; c < 2; c++) {
                    const centre = c === 0 ? front : rear;
                    let best = null;
                    for (let k = 0; k < 8; k++) {
                        const a = k * Math.PI / 4;
                        dir.set(Math.sin(a), 0, Math.cos(a));
                        org.copy(centre);
                        org.y += this.bodyHeights[0];
                        const w = firstWall(org, dir, R);
                        if (w && (!best || w.distance < best.distance)) {
                            best = { distance: w.distance, nx: w.nx, nz: w.nz, dx: dir.x, dz: dir.z };
                        }
                    }
                    if (!best) continue;
                    let px = best.nx, pz = best.nz;
                    if (px * best.dx + pz * best.dz > 0) { px = -px; pz = -pz; }   // face us
                    const len = Math.hypot(px, pz);
                    if (len < 1e-6) continue;
                    const push = (R - best.distance) + 0.05;
                    p.x += (px / len) * push;
                    p.z += (pz / len) * push;
                    shifted = true;
                    front.copy(p).addScaledVector(fwd, OFF);
                    rear.copy(p).addScaledVector(fwd, -OFF);
                }
                if (!shifted) break;
            }
        };

        // 1. free the car from anything it is already inside
        separate(pos, 2);

        // 2. walk the frame's movement in sub-steps no longer than the body, so
        //    a fast car can never skip past a barrier between two samples, and
        //    slide along whatever gets in the way
        const dest = new THREE.Vector3(pos.x, pos.y, pos.z);
        let mx = vx, mz = vz;
        let hitSomething = false, headOnMax = 0;
        const steps = travel > 1e-4 ? Math.min(8, Math.max(1, Math.ceil(travel / (R * 0.75)))) : 0;

        for (let sIdx = 0; sIdx < steps; sIdx++) {
            const mag = Math.hypot(mx, mz);
            if (mag < 1e-5) break;
            const ux = mx / mag, uz = mz / mag;
            const stepTravel = (mag * deltaTime) / steps;
            dir.set(ux, 0, uz);

            front.copy(dest).addScaledVector(fwd, OFF);
            rear.copy(dest).addScaledVector(fwd, -OFF);
            let allowed = stepTravel, nx = 0, nz = 0, blocked = false;
            for (let c = 0; c < 2; c++) {
                const centre = c === 0 ? front : rear;
                for (let hi = 0; hi < this.bodyHeights.length; hi++) {
                    org.copy(centre);
                    org.y += this.bodyHeights[hi];
                    const w = firstWall(org, dir, stepTravel + R);
                    if (!w) continue;
                    const room = w.distance - R;
                    if (room < allowed) { allowed = room; nx = w.nx; nz = w.nz; blocked = true; }
                }
            }

            if (!blocked) {
                dest.x += ux * stepTravel;
                dest.z += uz * stepTravel;
            } else {
                const go = Math.max(allowed, 0);
                dest.x += ux * go;
                dest.z += uz * go;
                if (nx * ux + nz * uz > 0) { nx = -nx; nz = -nz; }      // face us
                const len = Math.hypot(nx, nz);
                if (len > 1e-6) {
                    nx /= len; nz /= len;
                    const into = mx * nx + mz * nz;
                    if (into < 0) { mx -= nx * into; mz -= nz * into; } // slide
                    headOnMax = Math.max(headOnMax, Math.abs(into) / mag);
                }
                hitSomething = true;
            }
            separate(dest, 2);
        }

        // 3. hand the corrected movement back as velocity
        const dx = dest.x - pos.x, dz = dest.z - pos.z;
        const moved = Math.hypot(dx, dz);
        const sign = this.speed >= 0 ? 1 : -1;

        if (hitSomething && headOnMax > 0.9 && travel > 0.05) {
            // square into a wall: shove back a little rather than sticking to it
            this.speed = -sign * Math.min(20, Math.abs(this.speed) * this.wallBounce);
        } else {
            if (moved > 1e-6) {
                const loss = hitSomething ? THREE.MathUtils.lerp(0.97, 0.5, headOnMax) : 1;
                this.speed = sign * (moved / deltaTime) * loss;
                this.moveDirection.set((dx / moved) * sign, 0, (dz / moved) * sign);
            } else if (hitSomething) {
                this.speed = 0;
            }
        }
        this.velocity.x = this.moveDirection.x * this.speed;
        this.velocity.z = this.moveDirection.z * this.speed;
    }

    // --- MAIN LOOP ---
    update(deltaTime) {
        this.pollGamepad();
        if (this.aiMode) this._updateAIInputs(deltaTime);
        if (this.canDrive) {
            if (this.keys.forward) this.speed += this.acceleration * deltaTime;
            else if (this.keys.backward) this.speed -= this.brakeStrength * deltaTime;
            else this.speed *= (1 - this.drag * deltaTime);
            this.isDriftingState = this.keys.space && Math.abs(this.speed) > 10;
            const steerMult = this.isDriftingState ? 2.0 : 1.0;
            if (this.analogSteering !== 0 && this.gamepadIndex !== null) {
                this.steering = -this.analogSteering * this.maxSteer * steerMult;
            } else if (this.keys.left) this.steering = this.maxSteer * steerMult;
            else if (this.keys.right) this.steering = -this.maxSteer * steerMult;
            else this.steering = 0;
            if (this.aiMode) this.steering = this._aiSteering * this.maxSteer * steerMult;
            this.updateSmoke(deltaTime);
            if (this.isDriftingState && this.isGrounded) {
                this.smokeTimer += deltaTime;
                if (this.smokeTimer > 0.05) { 
                    this.smokeTimer = 0;
                    const worldPos = new THREE.Vector3();
                    this.model.getWorldPosition(worldPos);
                    const worldQuat = new THREE.Quaternion();
                    this.model.getWorldQuaternion(worldQuat);
                    const offsetL = new THREE.Vector3(-1.5, 0, 2.5); 
                    offsetL.applyQuaternion(worldQuat);
                    offsetL.add(worldPos);
                    this.spawnSmoke(offsetL);
                    const offsetR = new THREE.Vector3(1.5, 0, 2.5); 
                    offsetR.applyQuaternion(worldQuat);
                    offsetR.add(worldPos);
                    this.spawnSmoke(offsetR);
                }
            }
        } else {
            this.speed *= (1 - this.drag * deltaTime);
            this.steering = 0;
            this.isDriftingState = false;
            this.updateSmoke(deltaTime);
        }
        this.speed = THREE.MathUtils.clamp(this.speed, -this.maxSpeed, this.maxSpeed);
        if (Math.abs(this.speed) > 0.1) {
            this.model.rotateY(this.steering * (this.speed > 0 ? 1 : -1));
        }
        this.model.updateMatrixWorld(true);
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        this.model.getWorldPosition(worldPos);
        this.model.getWorldQuaternion(worldQuat);
        const forwardDir = new THREE.Vector3(0, 0, (this.speed > 0 ? -1 : 1));
        forwardDir.applyQuaternion(worldQuat).normalize();
        const wallRayOrigin = worldPos.clone(); 
        wallRayOrigin.y += 2.0; 
        const suspRayOrigin = worldPos.clone();
        suspRayOrigin.y += 5.0; 
        const finalWorldQuat = new THREE.Quaternion();
        this.model.getWorldQuaternion(finalWorldQuat);
        const carFacingDir = new THREE.Vector3(0, 0, -1).applyQuaternion(finalWorldQuat);
        const grip = (this.keys.space && Math.abs(this.speed) > 10) ? 0.12 : 0.8; 
        this.moveDirection.lerp(carFacingDir, grip).normalize();
        if (Math.abs(this.speed) < 5) this.moveDirection.copy(carFacingDir);
        this.velocity.x = this.moveDirection.x * this.speed;
        this.velocity.z = this.moveDirection.z * this.speed;
        
        let rayOrigin = suspRayOrigin.clone();
        let hits = castTrack(this.groundRaycaster, rayOrigin, new THREE.Vector3(0, -1, 0), 15.0);
        let groundHit = null;
        if (hits.length > 0) groundHit = hits[0];
        if (!groundHit) {
            const upHits = castTrack(this.upRaycaster, worldPos, new THREE.Vector3(0, 1, 0), 5.0);
            if (upHits.length > 0) {
                const roof = upHits[0];
                if (!this.badObjects.includes(roof.object.name)) groundHit = roof; 
            }
        }
        let isRayHittingSomething = false;
        if (groundHit) {
            const name = groundHit.object.name;
            const isBadObject = this.badObjects.includes(name) || name.includes("SafetyNet");
            if (!isBadObject) {
                let groundNormal = groundHit.face.normal.clone().applyQuaternion(groundHit.object.quaternion);
                const angle = groundNormal.angleTo(new THREE.Vector3(0, 1, 0)); 
                if (angle < 1.0 || groundHit.distance < 0) { 
                    const targetY = groundHit.point.y + this.rideHeight;
                    const distToTarget = Math.abs(targetY - this.model.position.y);
                    const snapDistance = 2.0; 
                    if (distToTarget < snapDistance) {
                        isRayHittingSomething = true;
                        this.isGrounded = true;
                        this.groundMemory = this.memoryDuration;
                        this.lastValidGroundY = groundHit.point.y; 
                        this.velocity.y = Math.max(0, this.velocity.y);
                        this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, targetY, 0.5);
                        if (angle < 1.0) {
                            const currentLook = new THREE.Vector3(0, 0, -1).applyQuaternion(worldQuat);
                            const project = currentLook.clone().sub(groundNormal.clone().multiplyScalar(currentLook.dot(groundNormal))).normalize();
                            const targetRot = new THREE.Matrix4().lookAt(new THREE.Vector3(), project, groundNormal);
                            const targetQuat = new THREE.Quaternion().setFromRotationMatrix(targetRot);
                            this.model.quaternion.slerp(targetQuat, this.tiltSpeed);
                        }
                        this.safePosTimer += deltaTime;
                        if (this.safePosTimer > 1.0 && Math.abs(this.speed) > 5) {
                            this.lastSafePosition.copy(this.model.position);
                            this.lastSafePosition.y += 1.0; 
                            this.lastSafeQuaternion.copy(this.model.quaternion);
                            this.safePosTimer = 0;
                        }
                    }
                }
            }
        }
        if (!isRayHittingSomething) {
            this.groundMemory -= deltaTime;
            if (this.groundMemory > 0) {
                const targetY = this.lastValidGroundY + this.rideHeight;
                this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, targetY, 0.5);
                this.velocity.y = 0;
                this.isGrounded = true; 
            } else {
                this.velocity.y -= this.gravity * deltaTime; 
                this.isGrounded = false;
                this.safePosTimer = 0;
            }
        }
        // Resolve against the barriers now that this frame's velocity is final.
        this.checkWallCollisions(deltaTime);
        this.model.position.addScaledVector(this.velocity, deltaTime);
        if(this.model.position.y < -10) this.hardRespawn();
        if (this.isGrounded) {
             const euler = new THREE.Euler().setFromQuaternion(this.model.quaternion, 'YXZ');
             euler.x *= 0.9; 
             euler.z *= 0.9; 
             this.model.quaternion.setFromEuler(euler);
        }
        this.updateEngineAudio();
        this.updateDebugVisuals(suspRayOrigin, wallRayOrigin, forwardDir);
        if (typeof uiSpeed !== 'undefined') uiSpeed.innerText = Math.abs(this.speed).toFixed(1);

        // --- SPIN THE WHEELS ---
        if (this.wheels.length > 0 && !this.disableWheelSpin) {
            const spinAmount = this.speed * deltaTime * 0.5; 
            this.wheels.forEach(wheel => {
                let finalSpin = spinAmount;

           
                const shouldFlip = this.wheelstoFlip.some(keyword => 
                    wheel.name.includes(keyword)
                );

                if (shouldFlip) {
                    finalSpin *= -1; // FLIP IT!
                }

                // Apply rotation
                if (this.spinAxis === 'z') wheel.rotateZ(finalSpin);
                else if (this.spinAxis === 'y') wheel.rotateY(finalSpin);
                else wheel.rotateX(finalSpin);
            });
        }

       // --- ANIMATE VISUAL STEERING WHEEL(S) ---
       if (this.steeringParts.length > 0) {
        this.steeringParts.forEach(part => {

            let directionFlip = (this.steeringAxis === 'y') ? 1.0 : -1.0; 

            if( this.invertSteering ) {
                directionFlip *= -1.0;
            }

            const rotAmount = this.steering * 10.0 * directionFlip;

            part.rotation[this.steeringAxis] = rotAmount;
        });
    }
    }
}
// --- Loaders ---
export function levelOneBackground() {
   

    const loader = new GLTFLoader();
    
    loader.load('moonview_highway.glb', (gltf) => {
 
        const model = gltf.scene;

        model.scale.set(600.0, 600.0, 600.0); 
        model.position.set(0, -10, 0); 
        
        scene.add(model);

        // --- THE BAN LIST ---
        const noCollisionKeywords = [
            
            "Object_0",
            "Object_23_1",
           "Object_57_1",
            "Object_17_1",
            "Object_16_1",
            "Object_41",
           
        
        ];

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                styleMeshForNeon(child); 


                const isBanned = noCollisionKeywords.some(keyword => child.name.includes(keyword));

                if (!isBanned) {
                    mapColliders.push(child);
                } else {
                    ghostColliders.push(child); 
                }
            }
        });

        // Everything in mapColliders is static, so index it once here.
        const t0 = performance.now();
        trackIndex = new TrackIndex(mapColliders);
        console.log(`Track index: ${trackIndex.count} triangles in ${(performance.now() - t0).toFixed(0)}ms`);

    }, 
    (xhr) => { console.log("Map: " + ((xhr.loaded / xhr.total) * 100).toFixed(0) + "%"); },
    (error) => { console.error("MAP ERROR:", error); }
    );
}
// --- MENU INTERACTION & HUD BUTTONS ---

const hudButtons = document.querySelectorAll('.game-btn');
hudButtons.forEach(btn => {
    btn.style.pointerEvents = 'auto';
});

function setupMenuSelection(id, configKey) {
    const container = document.getElementById(id);
    if (!container) return;
    const buttons = container.getElementsByClassName('menu-btn');
    Array.from(buttons).forEach(btn => {
        btn.addEventListener('click', () => {
    
            Array.from(buttons).forEach(b => b.classList.remove('selected'));
 
            btn.classList.add('selected');
   
            GAME_STATE[configKey] = btn.getAttribute('data-value');
      
        });
    });
}

// Initialize Menu Listeners
setupMenuSelection('mode-select', 'mode');
setupMenuSelection('engine-select', 'engine');
setupMenuSelection('car-select', 'car');

// START BUTTON
const btnStart = document.getElementById('start-race-btn');
if (btnStart) {
    btnStart.addEventListener('click', () => {
        if (bgmMenu.isPlaying) bgmMenu.stop();
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('ui-container').classList.remove('hidden');
        initGameSession();
    });
}

// DEMO BUTTON
const btnDemo = document.getElementById('demo-btn');
if (btnDemo) {
    btnDemo.addEventListener('click', () => startDemoMode());
}

// IN-GAME EXIT BUTTON
const btnExitIngame = document.getElementById('menu-btn-ingame');
if (btnExitIngame) {
    btnExitIngame.addEventListener('click', () => {
        returnToMainMenu();
    });
}

// RESULTS SCREEN EXIT BUTTON
const btnReturn = document.getElementById('return-menu-btn');
if (btnReturn) {
    btnReturn.addEventListener('click', () => {
        returnToMainMenu();
    });
}

// RESTART RACE BUTTON (Formerly Respawn)
const btnRestartRace = document.getElementById('reset-btn');
if (btnRestartRace) {
    btnRestartRace.addEventListener('click', () => {
    

        // 1. Reset Physics & Position
        if (carController) {
            carController.manualReset();
            carController.speed = 0; 
        }

        // 2. Reset Timer, Laps, and Array History
        if (typeof timeTrial !== 'undefined') {
            timeTrial.fullReset(); 
        }

        // 3. Focus window so you can drive immediately
        window.focus(); 
    });
}

// --- GAME SESSION LOADER ---
function initGameSession() {
    const selectedCarConfig = CAR_MODELS[GAME_STATE.car];
    const selectedEngineStats = ENGINE_CLASSES[GAME_STATE.engine];
    cameraMode = 0;

    createSponsorBillboard(new THREE.Vector3(330, 35, -470.8));

    if (carModel) {
        scene.remove(carModel);
        carModel = null;
    }

    const loader = new GLTFLoader();

    // DRACO Loader setup 
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
    
    loader.load(selectedCarConfig.path, (gltf) => {
        // 1. CREATE THE WRAPPER
        const physicsGroup = new THREE.Group();
        physicsGroup.position.set(0, 30, 180); 

        // 2. SETUP THE VISUALS
        const visualModel = gltf.scene;

        
        visualModel.traverse((child) => {
            if (child.isMesh) {
              
                const materials = Array.isArray(child.material) ? child.material : [child.material];

                materials.forEach(mat => {
                    const name = mat.name.toLowerCase();
         
                });
                
             
                child.castShadow = true;
            }
        });

        // only apply paint to the x5 
        if (selectedCarConfig.name === "BMW X5 (2019)") {
            applyBlackPaint(visualModel);
        }
        
   
        // Apply Scale to Visuals Only
        visualModel.scale.set(selectedCarConfig.scale, selectedCarConfig.scale, selectedCarConfig.scale);
        
        // Apply Rotation to Visuals Only (Fixes backwards BMW)
        if (selectedCarConfig.rotation) {
            visualModel.rotation.y = selectedCarConfig.rotation;
        }

        if (selectedCarConfig.yOffset) {
            visualModel.position.y = selectedCarConfig.yOffset;
        }

        if(selectedCarConfig.zOffset) {
            visualModel.position.z = selectedCarConfig.zOffset;
        }

        // Enable Shadows
        visualModel.traverse((node) => { if (node.isMesh) node.castShadow = true; });


        physicsGroup.add(visualModel);
        carModel = physicsGroup;
        scene.add(carModel);

        carModel.add(idleSound);
        carModel.add(accelerationSound);
        carModel.add(driftSound);

        
       // ADD LIGHTING
       setupCarLighting(carModel);

       carModel.updateMatrixWorld(true);

        // START PHYSICS
        carController = new CarControls(
            carModel, 
            idleSound, 
            accelerationSound, 
            driftSound, 
            selectedEngineStats,
            selectedCarConfig.wheelNames,
            selectedCarConfig.fixPivot,
            selectedCarConfig.spinAxis || 'x',
            selectedCarConfig.steeringWheelName,
            selectedCarConfig.steeringAxis,
            selectedCarConfig.fixSteeringPivot,
            selectedCarConfig.invertSteering,
            selectedCarConfig.disableWheelSpin,
            selectedCarConfig.wheelstoFlip

        );
        
        tryAttachAudio();

        if (typeof timeTrial !== 'undefined') timeTrial.fullReset();

        if (demoModeActive) {
            carController.aiMode = true;
            carController.aiWaypoints = DEMO_WAYPOINTS;
            carController.aiWaypointIndex = 0;
            // Start BGM right away instead of waiting for warmup finish
            if (bgmNormal.buffer && !bgmNormal.isPlaying) bgmNormal.play();
        }

        window.focus();

    }, undefined, (err) => console.error(err));
}

function unlockAudio() {
    if (listener.context.state === 'suspended') {
        listener.context.resume().then(() => {
            // If menu music loaded but was blocked, play it now
            if (bgmMenu.buffer && !bgmMenu.isPlaying) {
                bgmMenu.play();
            }
        });
    }
    // Remove listener after first click
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
}
document.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio);

// Reset Button
btnReset.addEventListener('click', () => {
    if (carController) {
        carController.manualReset();
        window.focus(); 
    }
});

const btnRestart = document.getElementById('restart-btn');

if (btnRestart) {
    btnRestart.addEventListener('click', () => {
        // 1. Reset all times and laps
        timeTrial.fullReset();
        
        // 2. Reset Car Position (Move to start line)
        if (carController) {
            carController.manualReset();
        }
        
        // 3. Refocus window so you can drive immediately
        window.focus();
    });
}


// Wire pause overlay buttons to existing handlers
document.getElementById('pause-restart-btn')?.addEventListener('click', () => {
    document.getElementById('pause-overlay').classList.add('hidden');
    btnRestartRace?.click();
});
document.getElementById('pause-exit-btn')?.addEventListener('click', () => {
    document.getElementById('pause-overlay').classList.add('hidden');
    returnToMainMenu();
});

// --- GAMEPAD MENU NAVIGATOR ---
const MenuNavigator = (() => {
    const SECTIONS = ['mode-select', 'engine-select', 'car-select', 'start', 'demo'];
    let sectionIdx = 0;
    let btnIdx = 0;
    let pauseFocusIdx = 0;
    let prev = {};

    function getActiveGamepad() {
        for (const pad of navigator.getGamepads()) {
            if (pad && pad.connected) return pad;
        }
        return null;
    }

    function getSectionBtns(sectionId) {
        if (sectionId === 'start') {
            const el = document.getElementById('start-race-btn');
            return el ? [el] : [];
        }
        if (sectionId === 'demo') {
            const el = document.getElementById('demo-btn');
            return el ? [el] : [];
        }
        const c = document.getElementById(sectionId);
        return c ? Array.from(c.getElementsByClassName('menu-btn')) : [];
    }

    function clearFocus() {
        SECTIONS.forEach(s => getSectionBtns(s).forEach(b => b.classList.remove('focused')));
        document.getElementById('pause-restart-btn')?.classList.remove('focused');
        document.getElementById('pause-exit-btn')?.classList.remove('focused');
    }

    function applyMenuFocus() {
        clearFocus();
        getSectionBtns(SECTIONS[sectionIdx])[btnIdx]?.classList.add('focused');
    }

    function applyPauseFocus() {
        clearFocus();
        const id = pauseFocusIdx === 0 ? 'pause-restart-btn' : 'pause-exit-btn';
        document.getElementById(id)?.classList.add('focused');
    }

    // Returns true only on the frame a button transitions to pressed
    function justPressed(gp, idx) {
        const cur = gp.buttons[idx]?.pressed || false;
        return cur && !prev[`b${idx}`];
    }

    // Returns true only on the frame an axis crosses the threshold
    function axisMoved(gp, axis, dir) {
        const THRESH = 0.5;
        const cur = dir > 0 ? gp.axes[axis] > THRESH : gp.axes[axis] < -THRESH;
        return cur && !prev[`a${axis}d${dir}`];
    }

    function savePrev(gp) {
        gp.buttons.forEach((b, i) => prev[`b${i}`] = b.pressed);
        gp.axes.forEach((v, i) => {
            prev[`a${i}d1`]  = v >  0.5;
            prev[`a${i}d-1`] = v < -0.5;
        });
    }

    function isHidden(id) {
        const el = document.getElementById(id);
        if (!el) return true;
        return el.classList.contains('hidden') || el.style.display === 'none';
    }

    function currentScreen() {
        if (!isHidden('intro-screen'))  return 'intro';
        if (!isHidden('main-menu'))     return 'menu';
        if (!isHidden('pause-overlay')) return 'pause';
        if (!isHidden('results-screen')) return 'results';
        return 'ingame';
    }

    function showPause() {
        if (!carController) return;
        carController.canDrive = false;
        carController.keys = { forward: false, backward: false, left: false, right: false, space: false };
        document.getElementById('pause-overlay').classList.remove('hidden');
        pauseFocusIdx = 0;
        applyPauseFocus();
    }

    function hidePause() {
        document.getElementById('pause-overlay').classList.add('hidden');
        if (carController) {
            carController.canDrive = true;
            carController.keys = { forward: false, backward: false, left: false, right: false, space: false };
            carController.analogSteering = 0;
        }
        clearFocus();
    }

    function poll() {
        const gp = getActiveGamepad();
        if (!gp) { prev = {}; return; }

        const dLeft  = justPressed(gp, 14) || axisMoved(gp, 0, -1);
        const dRight = justPressed(gp, 15) || axisMoved(gp, 0,  1);
        const dUp    = justPressed(gp, 12) || axisMoved(gp, 1, -1);
        const dDown  = justPressed(gp, 13) || axisMoved(gp, 1,  1);
        const btnA      = justPressed(gp, 0);
        const btnB      = justPressed(gp, 1);
        const gpStart   = justPressed(gp, 9);

        const screen = currentScreen();

        if (screen === 'intro') {
            if (btnA || gpStart) document.getElementById('intro-screen')?.click();

        } else if (screen === 'menu') {
            if (dUp && sectionIdx > 0) {
                sectionIdx--;
                btnIdx = Math.min(btnIdx, getSectionBtns(SECTIONS[sectionIdx]).length - 1);
                applyMenuFocus();
            }
            if (dDown && sectionIdx < SECTIONS.length - 1) {
                sectionIdx++;
                btnIdx = Math.min(btnIdx, getSectionBtns(SECTIONS[sectionIdx]).length - 1);
                applyMenuFocus();
            }
            const btns = getSectionBtns(SECTIONS[sectionIdx]);
            if (dLeft  && btnIdx > 0)              { btnIdx--; applyMenuFocus(); }
            if (dRight && btnIdx < btns.length - 1) { btnIdx++; applyMenuFocus(); }
            if (btnA) {
                btns[btnIdx]?.click();
                applyMenuFocus();
            }
            if (gpStart) document.getElementById('start-race-btn')?.click();

        } else if (screen === 'pause') {
            if (dUp   && pauseFocusIdx > 0) { pauseFocusIdx--; applyPauseFocus(); }
            if (dDown && pauseFocusIdx < 1) { pauseFocusIdx++; applyPauseFocus(); }
            if (btnA) {
                if (pauseFocusIdx === 0) document.getElementById('pause-restart-btn')?.click();
                else                    document.getElementById('pause-exit-btn')?.click();
            }
            if (btnB || gpStart) hidePause();

        } else if (screen === 'results') {
            if (btnA || gpStart) document.getElementById('return-menu-btn')?.click();

        } else if (screen === 'ingame') {
            if (gpStart) showPause();
        }

        savePrev(gp);
    }

    function init() {
        sectionIdx = 0;
        // Align btnIdx to whichever button already has `selected`
        const btns = getSectionBtns(SECTIONS[sectionIdx]);
        btnIdx = btns.findIndex(b => b.classList.contains('selected'));
        if (btnIdx < 0) btnIdx = 0;
        applyMenuFocus();
    }

    return { poll, init, hidePause };
})();

MenuNavigator.init();

// Add a label to it so we don't get confused
const trackerLabelDiv = document.createElement('div');
trackerLabelDiv.className = 'label';
trackerLabelDiv.textContent = 'GHOST / UI';
trackerLabelDiv.style.marginTop = '-1em';
trackerLabelDiv.style.color = '#ff00ff';
trackerLabelDiv.style.fontSize = '12px';
trackerLabelDiv.style.position = 'absolute';
trackerLabelDiv.style.textShadow = '0 0 4px black';
trackerLabelDiv.style.display = 'none'; 
document.body.appendChild(trackerLabelDiv);


// --- THE INVINCIBLE LOOP ---
function animate() {
    const canvas = renderer.domElement;
    
    // Anti-Ghost System
    if (!canvas.dataset.loopId) canvas.dataset.loopId = Math.random().toString();
    const myLoopId = canvas.dataset.loopId;
    if (window.currentLoopId && window.currentLoopId !== myLoopId) return;
    window.currentLoopId = myLoopId;

    requestAnimationFrame(animate);

    MenuNavigator.poll();

    const rawDelta = clock.getDelta();
    const deltaTime = Math.min(rawDelta, 0.05);

    // --- SPIN ANIMATED OBJECTS ---
    if (animatedObjects.length > 0) {
        animatedObjects.forEach(obj => {
  
            obj.rotation.y += 0.5 * deltaTime; 
        });
    }

    if (carController) {
        carController.update(deltaTime);
  
        if (typeof timeTrial !== 'undefined') timeTrial.update(carModel.position);
    }

    // Camera Logic
    if (carModel) {
        // 1. Get Car Info
        carModel.getWorldPosition(carWorldPosition);
        carModel.getWorldQuaternion(carWorldQuaternion);
        
        // 2. Handle Sector Culling (Keep this!)
        if (typeof updateSectorVisibility === 'function') updateSectorVisibility(carWorldPosition);

        // Right stick camera control (chase cam only)
        if (cameraMode === 0 && carController && carController.gamepadIndex !== null) {
            const gp = navigator.getGamepads()[carController.gamepadIndex];
            if (gp) {
                const DEADZONE = 0.15;
                const STICK_SPEED = 2.0;
                const rx = Math.abs(gp.axes[2]) > DEADZONE ? gp.axes[2] : 0;
                const ry = Math.abs(gp.axes[3]) > DEADZONE ? gp.axes[3] : 0;
                if (rx !== 0) followSpherical.theta -= rx * STICK_SPEED * deltaTime;
                if (ry !== 0) followSpherical.phi = THREE.MathUtils.clamp(
                    followSpherical.phi + ry * STICK_SPEED * deltaTime,
                    minPolarAngle, maxPolarAngle
                );
                // R3 press — reset camera to default behind-car position
                const r3 = gp.buttons[11]?.pressed || false;
                if (r3 && !carController._prevR3) {
                    followSpherical.theta = 0;
                    followSpherical.phi = THREE.MathUtils.degToRad(60);
                }
                carController._prevR3 = r3;
            }
        }

        if (cameraMode === 0) {
            // --- MODE 0: CHASE CAM (Smooth Elastic Follow) ---
            followSpherical.radius = THREE.MathUtils.clamp(followSpherical.radius, minCameraDistance, maxCameraDistance);
            
            relativeCameraOffset.setFromSpherical(followSpherical);
            relativeCameraOffset.applyQuaternion(carWorldQuaternion);
            desiredCameraPosition.copy(carWorldPosition).add(relativeCameraOffset);
            
            camera.position.lerp(desiredCameraPosition, chaseLerpFactor);
            lookAtTarget.copy(carWorldPosition).add(lookAtOffset);
            camera.lookAt(lookAtTarget);

        } else {
            // --- MODE 1 & 2: ATTACHED CAMS (Hard Snap) ---
            const offset = cameraOffsets[cameraMode].clone();
            if(GAME_STATE.car === "odyssey" && cameraMode === 1) {
                offset.y += 1; 
            }
            if(GAME_STATE.car === "odyssey" && cameraMode === 2) {
                offset.y += .4; 
                offset.z += -1.2;
            }
            if(GAME_STATE.car === "x5" && cameraMode === 1) {
                offset.y += 1; 
            }
            if(GAME_STATE.car === "x5" && cameraMode === 2) {
                offset.y += 1; 
            }
            
            
            
            
            // 2. Rotate it to match the car
            offset.applyQuaternion(carWorldQuaternion);
            
            // 3. Add to car position
            const camPos = carWorldPosition.clone().add(offset);
            
            // 4. SNAP camera there
            camera.position.copy(camPos);
            
            // 5. Look ahead
            const forward = new THREE.Vector3(0, 0, -20); // Look 20 units ahead
            forward.applyQuaternion(carWorldQuaternion);
            const target = carWorldPosition.clone().add(forward);
            
            camera.lookAt(target);
        }
    }
    
   

    renderer.render(scene, camera);
}
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}, false);


// Toggle Camera Mode (Press C)
window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyC') {
        // Check the config of the CURRENT car
        const currentCarConfig = CAR_MODELS[GAME_STATE.car];
        
        // Decide how many modes are allowed
        // If hasCockpit is explicitly false, we only have 2 modes (0 & 1).
        // Otherwise, we have 3 modes (0, 1, & 2).
        const maxModes = (currentCarConfig.hasCockpit === false) ? 2 : 3;

        // 3. Cycle through allowed modes
        cameraMode = (cameraMode + 1) % maxModes; 
        
        // Optional Log
        const modes = ["Chase", "Hood", "Cockpit"];
        console.log(`CAMERA: ${modes[cameraMode]} (Max: ${maxModes})`);
    }
});

// --- DEMO MODE ---
function onExitDemo(e) {
    if (!demoModeActive) return;
    stopDemoMode();
}

function startDemoMode() {
    demoModeActive = true;
    const prevEngine = GAME_STATE.engine;
    GAME_STATE.engine = '200cc';
    GAME_STATE.mode = 'endless';

    if (bgmMenu.isPlaying) bgmMenu.stop();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('ui-container').classList.remove('hidden');
    document.getElementById('demo-overlay').classList.remove('hidden');

    initGameSession();

    // Restore engine selection so menu shows the right choice when user returns
    GAME_STATE.engine = prevEngine;

    // Any interaction exits demo
    setTimeout(() => {
        document.addEventListener('keydown', onExitDemo);
        document.getElementById('demo-banner').addEventListener('click', onExitDemo);
    }, 500); // Small delay so the click that launched demo doesn't immediately exit it
}

function stopDemoMode() {
    demoModeActive = false;
    document.getElementById('demo-overlay').classList.add('hidden');
    document.removeEventListener('keydown', onExitDemo);
    const banner = document.getElementById('demo-banner');
    if (banner) banner.removeEventListener('click', onExitDemo);
    if (carController) carController.aiMode = false;
    returnToMainMenu();
}

// --- RETURN TO MENU LOGIC ---
function returnToMainMenu() {
    // Clean up demo mode if active
    if (demoModeActive) {
        demoModeActive = false;
        document.getElementById('demo-overlay').classList.add('hidden');
        document.removeEventListener('keydown', onExitDemo);
        const banner = document.getElementById('demo-banner');
        if (banner) banner.removeEventListener('click', onExitDemo);
    }

    // 1. Hide Game UI & Results
    document.getElementById('ui-container').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');
    
    // 2. Show Main Menu
    document.getElementById('main-menu').classList.remove('hidden');
    
    // 3. Reset Audio
    if (bgmNormal.isPlaying) bgmNormal.stop();
    if (bgmFast.isPlaying) bgmFast.stop();
    if (sfxFanfare.isPlaying) sfxFanfare.stop();
    idleSound.setVolume(0);
    accelerationSound.setVolume(0);
    driftSound.setVolume(0);

    
    
    // Play Menu Music (Since audio is already unlocked, this works instantly)
    if (bgmMenu.buffer) {
        bgmMenu.play();
    }

    // 4. Cleanup Scene (Optional but good for performance)
    if (carModel) {
        scene.remove(carModel);
        carModel = null;
        carController = null;
    }
    
    // 5. Reset Camera to Default (Optional)
    camera.position.copy(defaultCameraPosition);
    camera.lookAt(defaultCameraTarget);

    MenuNavigator.init();
    MenuNavigator.hidePause();
}

// --- INTRO SCREEN LOGIC ---
const introScreen = document.getElementById('intro-screen');

if (introScreen) {
    introScreen.addEventListener('click', () => {
        
        // 1. Initialize Audio Context (The "Unlock")
        if (listener.context.state === 'suspended') {
            listener.context.resume();
        }

        // 2. Play Menu Music
        if (bgmMenu.buffer) {
            bgmMenu.play();
        }

        // 3. Fade Out & Remove Overlay
        introScreen.style.transition = "opacity 0.5s";
        introScreen.style.opacity = "0";
        
        setTimeout(() => {
            introScreen.style.display = 'none';
        }, 500);
    });
}

levelOneBackground();
animate();
