var THREEToGaoDeMesh = function (mesh) {
  var geometry = mesh.geometry;
  var material = mesh.material[0] || mesh.material;
  if (!geometry.isBufferGeometry) {
    geometry = new THREE.BufferGeometry().fromGeometry(geometry);
  } else {
    if (geometry.attributes.uv.count / 2 != geometry.attributes.position.count / 3) {
      geometry = new THREE.Geometry().fromBufferGeometry(geometry);
      geometry = new THREE.BufferGeometry().fromGeometry(geometry);
    }
  };

  var gdMesh = new AMap.Object3D.MeshAcceptLights();
  geometryToGaoDe(geometry, material.color, material.opacity, gdMesh);
  if (material.map) {
    var t = function () {
      setTimeout(function () {
        if (material.map.isCanvasTexture) {
          gdMesh.textures.push(material.map.image);
          gdMesh.needUpdate = true;
          gdMesh.reDraw();
        } else if (material.map.image && material.map.image.currentSrc) {
          gdMesh.textures.push(material.map.image.currentSrc);
          gdMesh.needUpdate = true;
          gdMesh.reDraw();
        } else {
          t();
        };
      }, 60);
    };
    t();
  };
  gdMesh.DEPTH_TEST = material.depthTest;
  gdMesh.backOrFront = 'both'; //开启两面显示
  gdMesh.transparent = material.opacity < 1;

  return gdMesh;
};

function geometryToGaoDe(geometry, color, opacity, gdMesh) {
  if (typeof opacity == undefined) opacity = 1;
  var vecticesF3 = geometry.attributes.position;
  var vecticesNormal3 = geometry.attributes.normal;
  var vecticesUV2 = geometry.attributes.uv;
  var vectexCount = vecticesF3.count;

  var geometry = gdMesh.geometry;

  if (vecticesF3) geometry.vertices.length = vecticesF3.array.length;
  if (vecticesNormal3) geometry.vertexNormals.length = vecticesNormal3.array.length;
  if (vecticesUV2) geometry.vertexUVs.length = vecticesUV2.array.length;
  if (color) geometry.vertexColors.length = vectexCount * 4;

  for (var j = 0; j < vectexCount; j += 1) {
    var s = j * 3;
    geometry.vertices[s] = vecticesF3.array[s];
    geometry.vertices[s + 1] = vecticesF3.array[s + 2];
    geometry.vertices[s + 2] = -vecticesF3.array[s + 1];
    if (vecticesNormal3) {
      geometry.vertexNormals[s] = vecticesNormal3.array[s];
      geometry.vertexNormals[s + 1] = vecticesNormal3.array[s + 2];
      geometry.vertexNormals[s + 2] = -vecticesNormal3.array[s + 1];
    };
    if (vecticesUV2) {
      geometry.vertexUVs[j * 2] = vecticesUV2.array[j * 2];
      geometry.vertexUVs[j * 2 + 1] = 1 - vecticesUV2.array[j * 2 + 1];
    };
    if (color) {
      geometry.vertexColors[j * 4] = color.r;
      geometry.vertexColors[j * 4 + 1] = color.g;
      geometry.vertexColors[j * 4 + 2] = color.b;
      geometry.vertexColors[j * 4 + 3] = opacity;
    };
  };

  return geometry;
};