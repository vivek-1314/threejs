// comment
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from 'gsap';

//scene
const scene = new THREE.Scene();
const canvas = document.getElementById('canvas');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
//camera
const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(40, aspectRatio, 0.1, 1000);
camera.position.z = 3.2;

// GLTF Loader
const loader = new GLTFLoader();

// HDRI Loader
const rgbeLoader = new RGBELoader();
rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/pond_bridge_night_2k.hdr', function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    // scene.background = texture;
    scene.environment = texture;
});

let model;

// Load GLTF model
loader.load(
    './DamagedHelmet.gltf', 
    function (gltf) {
        model = gltf.scene;
        scene.add(model);
        
        // Adjust model scale for smaller screens
        if (window.innerWidth < 768) {
            model.scale.set(0.8, 0.8, 0.8);
        }
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error happened', error);
    }
);

// renderer
const renderer = new THREE.WebGLRenderer({canvas: document.querySelector("#canvas"), antialias: true , alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0015;
composer.addPass(rgbShiftPass);

// orbital controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false; // Disable zooming

function onMouseMove(event) {
    if(model){
        const rotatex = (event.clientX / window.innerWidth - 0.5) * Math.PI * 0.15; // Reduced sensitivity
        const rotatey = (event.clientY / window.innerHeight - 0.5) * Math.PI * 0.15; // Reduced sensitivity
        gsap.to(model.rotation, {
            x: rotatey,
            y: rotatex,
            duration: 0.8,
            ease: "power2.out"
        });
    }
}

window.addEventListener('mousemove', onMouseMove);

// Touch event handler for mobile devices
function onTouchMove(event) {
    if (model && event.touches.length === 1) {
        const touch = event.touches[0];
        const rotatex = (touch.clientX / window.innerWidth - 0.5) * Math.PI * 0.12;
        const rotatey = (touch.clientY / window.innerHeight - 0.5) * Math.PI * 0.12;
        gsap.to(model.rotation, {
            x: rotatey,
            y: rotatex,
            duration: 0.8,
            ease: "power2.out"
        });
    }
}

window.addEventListener('touchmove', onTouchMove);

// Prevent default touch events to block zooming
renderer.domElement.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

renderer.domElement.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// window resizer function
function onWindowResize() {
    const newAspectRatio = window.innerWidth / window.innerHeight;
    camera.aspect = newAspectRatio;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(window.innerWidth, window.innerHeight);

    // Adjust model scale for smaller screens
    if (model) {
        if (window.innerWidth < 768) {
            model.scale.set(0.8, 0.8, 0.8);
        } else {
            model.scale.set(1, 1, 1);
        }
    }
}

window.addEventListener('resize', onWindowResize);

// animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
}
animate();