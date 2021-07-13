import scene1 from './prologue.js'; //开场相关3D场景
import scene2 from './title.js'; //加入'个人简历'字
import scene3 from './content.js'; //加入'个人简历'
state.events.push(scene1);
state.events.push(scene2);
state.events.push(scene3);

body = document.querySelector('body');
video = document.querySelector('#video');
container = document.querySelector('#three-container');

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
if(window.browserInfo.mobile) {
  camera.position.z = 1600;
} else {
  camera.position.z = 500;
};

var light = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(light);
window.lights = [];
lights[0] = new THREE.PointLight(0xff0000, 1, 0);
lights[1] = new THREE.PointLight(0x00ff00, 1, 0);
lights[2] = new THREE.PointLight(0x0000ff, 1, 0);

lights[0].position.set(0, 200, 0);
lights[1].position.set(100, 200, 100);
lights[2].position.set(-100, -200, -100);

scene.add(lights[0]);
scene.add(lights[1]);
scene.add(lights[2]);

renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.gammaOutput = true;
//renderer.gammaFactor = 2.2;
//renderer.autoClear = false;
//
//renderer.shadowMap.enabled = true;
//renderer.shadowMap.type = THREE.PCFShadowMap;
container.appendChild(renderer.domElement);

doc.ready(function() {
  if(WEBGL.isWebGLAvailable() === false) {
    document.body.appendChild(WEBGL.getWebGLErrorMessage());
  };

  eventOne('body', 'click', function() {
    video.style.opacity = 0;
    container.style.opacity = 1;
    state.msg = '视屏切换为3D';
    state.code++;
  });
});

stats = new Stats();
container.appendChild(stats.dom);

function animate() {
  requestAnimationFrame(animate);
  stats.update();
  renderer.render(scene, camera);
};

animate();