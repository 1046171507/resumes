/**
 * @function promise 回调函数转promise
 * @example
 * var load_1 = promise();
 * $.get('xx.json', load_1.resolve);
 * load_1.then(function (json) {
 * console.log(json)
 * });
 */
var promise = function() {
  var state = {
      v: 0
    },
    stateV = 0,
    retV = undefined;

  var pm = new Promise(function(resolve, reject) {
    Object.defineProperty(state, "v", {
      get: function() {
        return stateV;
      },
      set: function(newValue) {
        stateV = newValue;
        if (stateV > 0) {
          resolve(retV);
        } else if (stateV < 0) {
          reject(retV);
        }
      }
    });
  });
  pm.resolve = function(val) {
    retV = val;
    state.v = 1;
  };
  pm.reject = function(err) {
    retV = err;
    state.v = -1;
  };
  return pm;
};

/*天空合*/
/*TODO 使用点着色器片源着色器构建*/
var skyBoxMaterial = function(argObj, cb) {
  if (Array.isArray(argObj.map)) {
    var skyCubeMap = new THREE.CubeTextureLoader().load(argObj.map, cb);
    //format：表示加载的图片的格式，这个参数可以取值THREE.RGBAFormat，RGBFormat等。THREE.RGBAFormat表示每个像素点要使用四个分量表示，分别是红、绿、蓝、透明来表示。RGBFormat则不使用透明，也就是说纹理不会有透明的效果。
    skyCubeMap.format = THREE.RGBFormat;
    //Mapping：是一个THREE.UVMapping()类型，它表示的是纹理坐标
    //skyCubeMap.mapping = THREE.CubeReflectionMapping;
    //skyCubeMap.encoding = THREE.sRGBEncoding;

    var shader = THREE.ShaderLib["cube"];
    shader.uniforms["tCube"].value = skyCubeMap;
  } else {
    var skyCubeMap = new THREE.TextureLoader().load(argObj.map, cb);
    //THREE.LinearFilter在纹理基层上执行线性过滤
    //THREE.LinearMipMapNearestFilter选择最临近的mip层，并执行线性过滤
    //minFilter属性：指定纹理如何缩小。默认值：THREE.LinearMipMapLinearFilter,这是OpenGL的基本概念。当您不设置的时候，它会取默认值。

    skyCubeMap.magFilter = THREE.LinearFilter;
    //magFilter属性：指定纹理如何放大。默认值：THREE.LinearFilter,这是OpenGL的基本概念。当您不设置的时候，它会取默认值。
    skyCubeMap.minFilter = THREE.LinearMipMapLinearFilter;
    //skyCubeMap.mapping = THREE.EquirectangularReflectionMapping;
    //skyCubeMap.encoding = THREE.sRGBEncoding;

    var shader = THREE.ShaderLib["equirect"];
    shader.uniforms["tEquirect"].value = skyCubeMap;
  }

  //对非内置材料启用代码注入
  Object.defineProperty(shader, "map", {
    get: function() {
      return this.uniforms.tEquirect.value;
    }
  });

  var skyBoxMaterial = new THREE.ShaderMaterial({
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader,
    uniforms: shader.uniforms,
    depthWrite: false,
    side: THREE.BackSide /*THREE.DoubleSide*/
  });
  return skyBoxMaterial;
};

/*导出**/
var save = function(blob, filename) {
  var link = document.createElement("a");
  link.style.display = "none";
  document.body.appendChild(link);

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  document.body.removeChild(link);
};

var saveString = function(text, filename) {
  save(
    new Blob([text], {
      type: "text/plain"
    }),
    filename
  );
};

var saveArrayBuffer = function saveArrayBuffer(buffer, filename) {
  save(
    new Blob([buffer], {
      type: "application/octet-stream"
    }),
    filename
  );
};

/*导出gltf文件*/
var exportGLTF = function(input, filename) {
  var _filename = (filename || input.name || "export") + ".gltf";

  var gltfExporter = new THREE.GLTFExporter();
  var options = {
    trs: true /*导出位置，旋转和缩放而不是每个节点的矩阵*/,
    binary: false /*以二进制（.glb）格式导出*/,
    embedImages: true /*导出嵌入glTF资产的图像*/,
    forcePowerOfTwoTextures: true /*导出图像大小调整为POT大小*/
  };
  gltfExporter.parse(
    input,
    function(result) {
      var output = JSON.stringify(result, null, 2);
      saveString(output, _filename);
    },
    options
  );
};
/*导出glb文件*/
var exportGLB = function(input, filename) {
  var _filename = (filename || input.name || "export") + ".glb";

  var gltfExporter = new THREE.GLTFExporter();
  var options = {
    trs: true,
    binary: true,
    embedImages: true,
    forcePowerOfTwoTextures: true
  };
  gltfExporter.parse(
    input,
    function(result) {
      saveArrayBuffer(result, _filename);
    },
    options
  );
};
/*导出obj文件*/
var exportOBJ = function(input, filename) {
  var _filename = (filename || input.name || "export") + ".obj";

  var exporter = new THREE.OBJExporter();
  var result = exporter.parse(input);
  saveString(result, _filename);
};
/*导出dae文件*/
var exportDAE = function(input, filename) {
  var _filename = (filename || input.name || "export") + ".dae";

  var exporter = new THREE.ColladaExporter();
  var result = exporter.parse(input);
  saveString(result.data, _filename);
  result.textures.forEach(function(tex) {
    saveArrayBuffer(tex.data, `${tex.name}.${tex.ext}`);
  });
};

export { promise, skyBoxMaterial, exportGLTF, exportGLB, exportOBJ, exportDAE };
