import "./OrbitControls.js";
import interaction from "./content-click.js";

(function() {
  /**
   * @author alteredq / http://alteredqualia.com/
   */

  THREE.SceneUtils = {

    createMultiMaterialObject: function(geometry, materials) {

      var group = new THREE.Group();

      for(var i = 0, l = materials.length; i < l; i++) {

        group.add(new THREE.Mesh(geometry, materials[i]));

      }

      return group;

    },

    detach: function(child, parent, scene) {

      child.applyMatrix(parent.matrixWorld);
      parent.remove(child);
      scene.add(child);

    },

    attach: function(child, scene, parent) {

      child.applyMatrix(new THREE.Matrix4().getInverse(parent.matrixWorld));

      scene.remove(child);
      parent.add(child);

    }

  };
})();

var phoneMesh, EmailMesh, SiteMesh, htmlResume;
var interactionObj;

var urls = (function(path, urls = [], format) {
  return [
    path + urls[0] + format,
    path + urls[1] + format,
    path + urls[2] + format,
    path + urls[3] + format,
    path + urls[4] + format,
    path + urls[5] + format
  ]
})("./img/", ['px', 'nx', 'py', 'ny', 'pz', 'nz'], '.jpg');

var planeInit = function() {
  /*创建平面*/
  var planeGeometry = new THREE.PlaneGeometry(240, 360);
  var planeMaterial = new THREE.MeshPhongMaterial({
    color: 0x666666,
    //side: THREE.DoubleSide
  });
  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.name = 'plane';
  //plane.receiveShadow = true; /*承接阴影*/

  plane.position.z = -10;
  scene.add(plane);
  var reflectionCube = new THREE.CubeTextureLoader().load(urls);
  reflectionCube.format = THREE.RGBFormat;
  plane.material.envMap = reflectionCube;
  //plane.material.emissiveIntensity = 0.1;
  //plane.material.shininess = 0.1;
  plane.material.needsUpdate = true;
  return plane;
};

var textInit = function() {
  var rowAll = rowAllFn(5, 14, 220, 320);

  var theRow = 0,
    theCol = 0;

  var s = 0;
  var textG = new THREE.Group();
  textG.position.set(-108, -180, 0);
  scene.add(textG);
  TextMain('姓姓名:王利　性别:男　 年龄:32　 学历:自考本科\n', 12);
  s = textG.children.length;
  TextMain('居住地:武汉洪山区　  ', 10);
  SiteMesh = textG.children.slice(s);
  s = textG.children.length;
  TextMain('电话:13260539108\n', 10);
  phoneMesh = textG.children.slice(s);
  s = textG.children.length;
  TextMain('E-mail:1046171507@qq.com', 10);
  EmailMesh = textG.children.slice(s);
  TextMain('  工作年限:5年 \n', 10);
  TextMain('职位方向:Vue webGL GIS BIM\n期望薪资:20K　  工作状态:在职(一周到岗)', 10);
  s = textG.children.length;
  TextMain('\n\n              『html版简历』\n', 12);
  // TextMain('   (做之前没考虑英文大小不定,做的有点糙)\n\n', 8);
  htmlResume = textG.children.slice(s);
  TextMain('自我评价:我是一个执着于技术的程序员,能够发散式思考,灵活解决项目上的问题;熟练使用THREE,Vue,H5,CSS3-3d,Js,es6,svg,canvas,ECharts;熟悉Create.js,D3.js;熟练webpack(做过从零开始搭建的那种), node.js(写过node工具), github(VScode GitLens);\n\n', 10);
  TextMain('历经公司:\n2019-12~至今  中国系统(武汉研发中心);\n2018-02~2019-11  北京蜂向科技研发中心;\n2016-09~2018-01 东湖大数据交易中心;\n2015-05~2016-08 良印科技(北京外包);\n2013-05~2014-12 北京清华医院', 10);
  interactionObj = {
    phone: phoneMesh,
    email: EmailMesh,
    site: SiteMesh,
    html: htmlResume
  };
  interaction(interactionObj);

  //var reflectionCube = new THREE.CubeTextureLoader().load(urls);
  //reflectionCube.format = THREE.RGBFormat;
  ///*设置自发光*/
  //reflectionMesh.material.emissive.setHex(0xffffff);
  ///*设置镜面反射*/
  //reflectionMesh.material.specular.setHex(0xffffff);
  ///*设置环境贴图*/
  //reflectionMesh.material.envMap = reflectionCube;
  ///*更新材质参数*/
  //reflectionMesh.material.needsUpdate = true;

  //Object.values(interactionObj).flat().forEach((mesh) => {
  //  mesh.material.envMap = reflectionCube;
  //  mesh.material.needsUpdate = true;
  //});

  var UpCount = 0;
  var textGCL = textG.children.length;
  var textGCR = 0;
  var textGCRB = 1;
  var minR = Math.PI / 180 * 15,
    maxR = minR * -1;
  var render = function() {
    UpCount++;
    requestAnimationFrame(render);
    if(UpCount < textGCL) {
      textG.children[UpCount].visible = true;
    } else if(UpCount > textGCL * 1.2) {
      if(textGCR > minR || textGCR < maxR) textGCRB *= -1;
      textG.children.forEach(c => {
        textGCR += 0.00003 * textGCRB;
        c.rotation.y = textGCR;
      });
    }
    if(UpCount == textGCL) {
      spriteT();
    }
  };
  render();

  function spriteT() {
    var spriteMap = new THREE.TextureLoader().load('./img/t-l.png');

    var spriteMaterial = new THREE.SpriteMaterial({
      map: spriteMap,
      color: 0xffffff
    });

    var sprite_t = new THREE.Sprite(spriteMaterial);
    sprite_t.scale.set(100, 100, 1);
    sprite_t.position.set(0, 295, 0);
    textG.add(sprite_t);

    var sprite_t2 = sprite_t.clone();
    sprite_t2.position.set(0, 282, 0);
    textG.add(sprite_t2);

    var spriteMap = new THREE.TextureLoader().load('./img/t-r.png');

    var spriteMaterial = new THREE.SpriteMaterial({
      map: spriteMap,
      color: 0xffffff
    });

    var sprite_t = new THREE.Sprite(spriteMaterial);
    sprite_t.scale.set(100, 100, 1);
    sprite_t.position.set(178, 295, 0);
    textG.add(sprite_t);
    var sprite_t2 = sprite_t.clone();
    sprite_t2.position.set(144, 225, 0);
    textG.add(sprite_t2);
  };

  function TextMain(texts, size) {
    var textArr = texts.split('');
    textArr.forEach(t => {
      if(t == '\n') {
        theRow++;
        theCol = 0;
      } else {
        if(theCol + 1 >= rowAll[0].length) {
          theRow++;
          theCol = 0;
        };
        if(t == ' ' || t == '　') {
          theCol++;
        } else if(/[\u2E80-\u9FFFmMWGQHD\@]/.test(t)) {
          var sprite = generateText(t, size, 'cn');
          //sprite.material.color.setHSL(0.5 + theCol / rowAll[0].length / 2, 1 - theRow / rowAll.length, 0.5);
          sprite.position.set(...rowAll[theRow][theCol]);
          sprite.position.x += 3;
          sprite.visible = false;
          textG.add(sprite);
          theCol += 2;
        } else {
          var sprite = generateText(t, size, 'en');
          //sprite.material.color.setHSL(0.5 + theCol / rowAll[0].length / 2, 1 - theRow / rowAll.length, 0.5);
          sprite.position.set(...rowAll[theRow][theCol]);
          sprite.visible = false;
          textG.add(sprite);
          theCol++;
        }

      }
    });
  };
}

function rowAllFn(xi, yi, w, h) {
  var rowAll = [];
  var wc = Math.floor(w / xi),
    hc = Math.floor(h / yi);
  for(var i = 0; i < hc; i++) {
    var col = [];
    rowAll.push(col);
    for(var j = 0; j < wc; j++) {
      col.push([j * xi, (hc - i) * yi, 0])
    }
  };
  return rowAll;
};

function generateText(text, size, l) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  if(l == 'en') {
    canvas.width = 16 * 8;
    canvas.height = 32 * 8;
  } else {
    canvas.width = 32 * 8;
    canvas.height = 32 * 8;
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  ctx.font = "160pt arial bold";

  if(l == 'en') {
    ctx.fillText(text, 1 * 8, 24 * 8);
  } else {
    ctx.fillText(text, 3 * 8, 24 * 8);
  }

  var map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  var spriteMaterial = new THREE.MeshPhongMaterial({
    map: map,
    color: 0xffffff,
  });

  var cube = new THREE.BoxBufferGeometry(1, 1, 1);

  if(l == 'en') {
    var cube = new THREE.BoxBufferGeometry(size / 2, size, size);
  } else {
    var cube = new THREE.BoxBufferGeometry(size, size, size);
  }
  var sprite = new THREE.Mesh(cube, spriteMaterial);

  return sprite;
};

function init() {
  /*TODO 鼠标滚轮控制*/
  var mouseControls = new THREE.OrbitControls(camera, renderer.domElement);
  mouseControls.target.copy(scene.position);
  mouseControls.update();
  /*鼠标滚轮控制END*/
  planeInit();
  //textInit();

  setTimeout(textInit, 1500);
};

function scene3() {
  init();
};

export default scene3;