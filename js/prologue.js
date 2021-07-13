//开场相关3D场景
body = document.querySelector('body');
video = document.querySelector('#video');
container = document.querySelector('#three-container');

var texture;
var mouseX = 0;
var mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var cube_count,

  meshes = [],
  materials = [],

  xgrid = 20,
  ygrid = 10;

var raycaster, mouse = new THREE.Vector2(); //鼠标拾取

function init() {
  texture = new THREE.VideoTexture(video);
  raycaster = new THREE.Raycaster();
  //

  var i, j, ux, uy, ox, oy,
    geometry,
    xsize, ysize;

  ux = 1 / xgrid;
  uy = 1 / ygrid;

  xsize = 480 / xgrid;
  ysize = 237 / ygrid;

  var parameters = {
    color: 0xffffff,
    map: texture
  };

  cube_count = 0;

  for(i = 0; i < xgrid; i++) {
    for(j = 0; j < ygrid; j++) {

      ox = i;
      oy = j;

      geometry = new THREE.BoxBufferGeometry(xsize, ysize, xsize);

      change_uvs(geometry, ux, uy, ox, oy);

      materials[cube_count] = new THREE.MeshLambertMaterial(parameters);

      var material = materials[cube_count];

      material.hue = i / xgrid;
      material.saturation = 1 - j / ygrid;

      material.color.setHSL(material.hue, material.saturation, 0.5);

      var mesh = new THREE.Mesh(geometry, material);

      mesh.position.x = (i - xgrid / 2) * xsize;
      mesh.position.y = (j - ygrid / 2) * ysize;
      mesh.position.z = 0;

      mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;

      scene.add(mesh);

      mesh.dx = 0.001 * (0.5 - Math.random());
      mesh.dy = 0.001 * (0.5 - Math.random());

      meshes[cube_count] = mesh;

      cube_count += 1;

    }
  };

  document.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('touchmove', onDocumentMouseMove, false);

  document.addEventListener('mousemove', onTouchMove, false);
  document.addEventListener('touchmove', onTouchMove, false);
};

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function change_uvs(geometry, unitx, unity, offsetx, offsety) {

  var uvs = geometry.attributes.uv.array;

  for(var i = 0; i < uvs.length; i += 2) {

    uvs[i] = (uvs[i] + offsetx) * unitx;
    uvs[i + 1] = (uvs[i + 1] + offsety) * unity;

  }

};

function onDocumentMouseMove(event) {

  mouseX = (event.clientX - windowHalfX);
  mouseY = (event.clientY - windowHalfY) * 0.3;

};

var m = 0.2; //加快速度

var h, counter = 1;

function animate() {
  if(counter == 2600 * m || state.msg == '开始撤出开场3D视屏') {
    animateOut();
  } else {
    requestAnimationFrame(animate);
    render();
  }
};

eventOne(body, 'click', startWithdraw);

function startWithdraw() {
  if(counter > 800 * m) {
    state.msg = '开始撤出开场3D视屏'
  } else {
    eventOne(body, 'click', startWithdraw);
  }
};

function render() {

  var time = Date.now() * 0.00005 / m;

  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;

  camera.lookAt(scene.position);

  for(var i = 0; i < cube_count; i++) {

    var material = materials[i];

    h = (360 * (material.hue + time) % 360) / 360;
    material.color.setHSL(h, material.saturation, 0.5);

  }

  if(counter % (1000 * m) > (200 * m)) {

    for(var i = 0; i < cube_count; i++) {

      var mesh = meshes[i];

      mesh.rotation.x += 10 * mesh.dx / m;
      mesh.rotation.y += 10 * mesh.dy / m;

      mesh.position.x += 200 * mesh.dx / m;
      mesh.position.y += 200 * mesh.dy / m;
      mesh.position.z += 400 * mesh.dx / m;

    }

  }

  if(counter % (1000 * m) === 0) {

    for(var i = 0; i < cube_count; i++) {

      mesh = meshes[i];

      mesh.dx *= -1;
      mesh.dy *= -1;

    }

  }

  counter++;
}

var counterOut = 1;

function animateOut() {
  if(counterOut > (400 * m)) {
    renderOutEnd();
    state.msg = '撤出开场3D视屏完成';
    state.code++;
  } else {
    requestAnimationFrame(animateOut);
    renderOutIn();
  }
};

function renderOutIn() {
  for(var i = 0; i < cube_count; i++) {

    var mesh = meshes[i];
    mesh.position.x += 10000 * mesh.dx / m;
    mesh.position.y += 10000 * mesh.dy / m;
  }
  counterOut++;

};

function renderOutEnd() {
  for(var i = 0; i < cube_count; i++) {
    var mesh = meshes[i];
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  texture.dispose();
  video.remove();

  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('touchmove', onDocumentMouseMove, false);
  document.removeEventListener('mousemove', onTouchMove, false);
  document.removeEventListener('touchmove', onTouchMove, false);
};

var scene1 = function() {
  init();
  animate();
};

function onTouchMove(event) {

  var x, y;

  if(event.changedTouches) {

    x = event.changedTouches[0].pageX;
    y = event.changedTouches[0].pageY;

  } else {

    x = event.clientX;
    y = event.clientY;

  }

  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = -(y / window.innerHeight) * 2 + 1;

  checkIntersection();

}
var checkMesh;

function checkIntersection() {

  if(!meshes.length) return;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(meshes);

  if(intersects.length > 0) {
    if(checkMesh != intersects[0].object) {
      checkMesh && checkMesh.scale.set(1, 1, 1);
      checkMesh = intersects[0].object;
      checkMesh.scale.set(2, 2, 2);
    }
  } else {
    checkMesh && checkMesh.scale.set(1, 1, 1);
    checkMesh = undefined
  }
}

export default scene1;