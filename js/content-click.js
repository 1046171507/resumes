var meshes = [];
var clickTarget = undefined;
var raycaster, mouse = new THREE.Vector2(); //鼠标拾取

var interaction = function(arg) {
  userSetName(arg.phone, 'phone');
  userSetName(arg.email, 'email');
  userSetName(arg.site, 'site');
  userSetName(arg.html, 'html');
  raycaster = new THREE.Raycaster();
  window.addEventListener('mousemove', onTouchMove);
  window.addEventListener('touchmove', onTouchMove);
  container.addEventListener('click', onClickTarget);
  container.addEventListener('touchstart', onClickTarget);
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

};

function checkIntersection() {
  if(!meshes.length) return;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(meshes);

  if(intersects.length > 0) {
    container.style.cursor = 'pointer';
    clickTarget = intersects[0].object.userData.name
  } else {
    container.style.cursor = 'default';
    clickTarget = undefined;
  }
};

function onClickTarget(event) {
  onTouchMove(event);
  var oa = document.createElement("a");
  var ospan = document.createElement("span");
  oa.appendChild(ospan);
  body.appendChild(oa);
  switch(clickTarget) {
    case 'phone':
      oa.href = 'tel:13260539108';
      if(browserInfo.pc) {
        oa.target="_blank";
        //oa.href = 'mqqwpa://im/chat?chat_type=wpa&uin=1046171507&version=1&src_type=web&web_src=oicqzone.com';
        oa.href = "https://wpa.qq.com/msgrd?v=3&uin=1046171507&site=qq&menu=yes"
      } else {
        oa.href = 'tel:13260539108';
      }
      break;
    case 'email':
      oa.href = 'mailto:1046171507@qq.com';
      break;
    case 'site':
      oa.target = "_blank";
      oa.href = './site2.html';
      ospan.click();
      oa.href = './site.html';
      break;
    case 'html':
      oa.target = "_blank";
      oa.href = './html-resume.html';
      break;
    default:
      break;
  };
  ospan.click();
  oa.remove();
}

function userSetName(mesh, name) {
  mesh.forEach(m => {
    meshes.push(m);
    m.userData.name = name
  });
};

export default interaction;