/*轨道控制*/
import "./OrbitControls.js";
import { skyBoxMaterial } from './user-defined.js';
import './Lensflare.js';

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
var skyBoxInit = function() {
  var skyBox = new THREE.Mesh(new THREE.BoxGeometry(2048, 2048, 2048), skyBoxMaterial({
    map: urls,
  }));
  scene.add(skyBox);
};

//光晕
function lensflareInit(color, positions) {
  var textureLoader = new THREE.TextureLoader();

  var textureFlare0 = textureLoader.load('./img/lensflare0.png');
  var textureFlare3 = textureLoader.load('./img/lensflare3.png');

  var light = new THREE.PointLight(color, 0.5, 0);
  light.color.set(color);
  light.position.set(positions.x, positions.y, positions.z);
  scene.add(light);
  var lensflare = new THREE.Lensflare();
  lensflare.addElement(new THREE.LensflareElement(textureFlare0, 700, 0, light.color));
  lensflare.addElement(new THREE.LensflareElement(textureFlare3, 60, 0.6));
  lensflare.addElement(new THREE.LensflareElement(textureFlare3, 70, 0.7));
  lensflare.addElement(new THREE.LensflareElement(textureFlare3, 120, 0.9));
  lensflare.addElement(new THREE.LensflareElement(textureFlare3, 70, 1));
  light.add(lensflare);
};

var init = function() {
  /*TODO 鼠标滚轮控制*/
  var mouseControls = new THREE.OrbitControls(camera, renderer.domElement);
  mouseControls.target.copy(scene.position);
  mouseControls.maxDistance = 1600;
  mouseControls.update();
  /*鼠标滚轮控制END*/

  youzikuFontLoader({
      accessKey: '251359cd40c648f0a307e011db03b9f1',
      apikey: 'bfe88d45fcebd2f7483f758336f1ea6f',
      content: '个人简历'
    },
    function(font) {
      // console.log(font);
      var text = "个人简历";
      var shapes = font.generateShapes(text, 5);
      var geometry = new THREE.ShapeBufferGeometry(shapes);
      geometry.computeBoundingBox();
      var xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
      var yMid = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
      //geometry.translate(xMid, 0, 0);
      //geometry.center();

      //线框平面字
      function LineGeometry() {
        var matDark = new THREE.LineBasicMaterial({
          color: 0x006699,
          side: THREE.DoubleSide
        });
        //geometry.computeBoundingBox();
        //var xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        //var yMid = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);

        var holeShapes = [];
        for(var i = 0; i < shapes.length; i++) {
          var shape = shapes[i];
          if(shape.holes && shape.holes.length > 0) {
            for(var j = 0; j < shape.holes.length; j++) {
              var hole = shape.holes[j];
              holeShapes.push(hole);
            }
          }
        };
        shapes.push(...holeShapes);

        var lineText = new THREE.Group();

        for(var i = 0; i < shapes.length; i++) {
          (function() {
            var shape = shapes[i];
            var points = shape.getPoints();
            var geometry = new THREE.BufferGeometry();
            var lineMesh = new THREE.Line(geometry, matDark);
            lineMesh.userData.pointsAll = points;
            var pointsAll = lineMesh.userData.pointsAll;
            var points = pointsAll.slice(0, Math.ceil(pointsAll.length / 100 * 100));
            lineMesh.geometry.setFromPoints(points);
            lineMesh.geometry.translate(xMid, yMid, 0);
            lineText.add(lineMesh);
          })()
        };

        lineText.scale.set(20, 20, 20);
        scene.add(lineText);
        console.log(lineText)
        var UpCount = 1;
        var render = function() {
          UpCount++;
          if(UpCount <= 100) {
            requestAnimationFrame(render);
            lineText.children.forEach(lineMesh => {
              var pointsAll = lineMesh.userData.pointsAll;
              var points = pointsAll.slice(0, Math.ceil(pointsAll.length / 100 * UpCount));
              lineMesh.geometry.setFromPoints(points);

              lineMesh.geometry.translate(xMid, yMid, 0);
            })
          } else {
            PlaneGeometry();
            scene.remove(lineText);
          }
        };
        render();
      };

      function PlaneGeometry() {
        var matLite = new THREE.MeshPhongMaterial({
          color: 0x006699,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        });
        var text = new THREE.Mesh(geometry, matLite);
        text.geometry.translate(xMid, yMid, 0);
        text.scale.set(20, 20, 20);
        scene.add(text);
        var UpCount = 1;
        var render = function() {
          UpCount++;
          if(UpCount <= 10) {
            requestAnimationFrame(render);
          } else {
            TextGeometry();
            text.material.dispose();
            scene.remove(text);
          }
        };
        render();
      };

      function TextGeometry() {
        var textGeo = new THREE.TextGeometry(text, {
          font: font, //字体，默认是'helvetiker'，需对应引用的字体文件
          size: 5, //字号大小，一般为大写字母的高度
          height: 1, //文字的厚度
          weight: 'normal', //值为'normal'或'bold'，表示是否加粗
          style: 'normal', //值为'normal'或'italics'，表示是否斜体
          bevelThickness: 0.1, //倒角厚度
          bevelSize: 0.1, //倒角宽度
          curveSegments: 3, //弧线分段数，使得文字的曲线更加光滑
          bevelEnabled: true, //布尔值，是否使用倒角，意为在边缘处斜切
        });
        textGeo.center();

        var shaderMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          vertexColors: THREE.VertexColors,
          morphTargets: true
        });

        var geometry = textGeo.clone();

        var tessellateModifier = new THREE.TessellateModifier(8);
        for(var i = 0; i < 6; i++) {
          tessellateModifier.modify(geometry);
        };

        geometry = new THREE.BufferGeometry().fromGeometry(geometry);
        geometry = new THREE.Geometry().fromBufferGeometry(geometry);

        //      geometry.translate(xMid, yMid, 0);

        var vertices = geometry.vertices;
        var verticesNew = [];
        verticesNew.length = vertices.length;
        for(var v = 0; v < geometry.faces.length; v++) {
          (function() {
            var face = geometry.faces[v];

            var color = new THREE.Color();
            var h = 0.4 + 0.155 * Math.random();
            var s = 0.5 + 0.5 * Math.random();
            var l = 0.3 + 0.5 * Math.random();
            color.setHSL(h, s, l);
            face.vertexColors[0] = color;
            face.vertexColors[1] = color;
            face.vertexColors[2] = color;

            var faceNormal = face.normal.clone().multiplyScalar(Math.random() * 2);
            verticesNew[face['a']] = vertices[face['a']].clone().add(faceNormal);
            verticesNew[face['b']] = vertices[face['b']].clone().add(faceNormal);
            verticesNew[face['c']] = vertices[face['c']].clone().add(faceNormal);
          })();
        };

        geometry.morphTargets.push({
          name: "target1",
          vertices: verticesNew
        });

        geometry = new THREE.BufferGeometry().fromGeometry(geometry);

        ////
        var textMesh = new THREE.Mesh(geometry, shaderMaterial);
        //      textMesh.geometry.translate(xMid, yMid, 0);
        textMesh.scale.set(20, 20, 1);
        scene.add(textMesh);

        var UpCount = 1;
        var render = function() {
          UpCount++;
          if(UpCount <= 20) {
            requestAnimationFrame(render);
            textMesh.scale.set(20, 20, UpCount);
          } else {
            renderTextAnimation(textMesh);
          }
        };
        render();
        console.log(textMesh)
        //renderTextAnimation(textMesh);
      };

      LineGeometry();
      //PlaneGeometry();
      //TextGeometry();
    });

  //renderScene();
};

//var renderScene = function() {
//requestAnimationFrame(renderScene);
//};

var amplitude = 0;
var clock = new THREE.Clock();
var time = 0;

var renderTextAnimation = function(textMesh) {

  requestAnimationFrame(function() {
    renderTextAnimation(textMesh);
  });

  var delta = clock.getDelta();
  time += delta;
  amplitude = Math.abs(Math.sin(time * 0.5));
  textMesh.morphTargetInfluences[0] = amplitude;
  if(time > 2) {
    scale1Fn(textMesh);
    if(!stateChangeB) {
      stateChange();
      stateChangeB = true;
    }
  };
};

var scale1 = 20;
var scale1Fn = function(textMesh) {
  if(scale1 > 3) {
    scale1 -= 0.5;
    textMesh.scale.set(scale1, scale1, scale1);
    textMesh.position.y += 150 / (20 - 3) / 2;
  }
};

var stateChangeB = false;

function stateChange() {
  state.msg = '标题文字即将到位';
  state.code++;
  stateChangeB = true;
};

function scene2() {
  renderer.domElement.style.opacity = 0;
  lights.forEach(light => {
    scene.remove(light);
  });

  var opacityN = 0;
  if(window.browserInfo.mobile) {
    camera.position.set(0, 0, 1600);
  } else {
    camera.position.set(0, 0, 500);
  }
  var render = function() {
    opacityN += 5;
    if(opacityN <= 100) {
      requestAnimationFrame(render);
      renderer.domElement.style.opacity = opacityN / 100;
    }
  };
  render();

  skyBoxInit();
  lensflareInit(0x01ff67, {
    x: 908,
    y: 310,
    z: 1024
  });
  lensflareInit(0xff0101, {
    x: 1024,
    y: 342,
    z: -793
  });
  lensflareInit(0xfbff00, {
    x: -1024,
    y: 290,
    z: -918
  });
  lensflareInit(0x0400ff, {
    x: -228,
    y: 136,
    z: 1024
  });

  init();
};

export default scene2;