(function(f) {
  if(typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f()
  } else if(typeof define === "function" && define.amd) {
    define([], f)
  } else {
    var g;
    if(typeof window !== "undefined") {
      g = window
    } else if(typeof global !== "undefined") {
      g = global
    } else if(typeof self !== "undefined") {
      g = self
    } else {
      g = this
    }
    g.youzikuFontLoader = f()
  }
})(function() {

  var youzikuFontLoader = function(argObj, ckFn) {
    // this.accessKey = argObj.accessKey;
    // this.apikey = argObj.apikey;
    // this.content = argObj.content;
    // var yzkReq = new XMLHttpRequest();
    // yzkReq.open("POST", 'http://service.youziku.com/webFont/getFontFace', true);
    // yzkReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // yzkReq.onload = function(event) {
    //   var res = JSON.parse(event.target.response);
    //   if(res.Code == 200) {
    //     var ttfUrl = res["FontFace"].match(/url\('(\S+)'\) format\('truetype'\)/)[1];
    //     fontReq(ttfUrl, ckFn);
    //   } else {
        console.log('有字库网站挂了,只能用静态字库了');
        fontReq('./img/font/1556257376.jpg', ckFn);
    //   }
    // };
    // yzkReq.send('AccessKey=' + this.accessKey + '&Apikey=' + this.apikey + '&Content=' + this.content);

  };

  var fontReq = function(ttfUrl, ckFn) {
    var oReq = new XMLHttpRequest();
    oReq.open("GET", ttfUrl, true);
    oReq.responseType = "arraybuffer";
    oReq.onload = function(oEvent) {
      var font = opentype.parse(oReq.response);
      var result = convert(font);
      var newFont = new THREE.Font(result);
      ckFn && ckFn(newFont);
    };
    oReq.send();
  };

  var convert = function(font) {
    var scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72);
    var result = {};
    result.glyphs = {};
    var restriction = {
      range: null,
      set: null
    };
    font.glyphs.forEach(function(glyph) {
      if(glyph.unicode !== undefined) {
        var glyphCharacter = String.fromCharCode(glyph.unicode);
        var needToExport = true;
        if(restriction.range !== null) {
          needToExport = (glyph.unicode >= restriction.range[0] && glyph.unicode <= restriction.range[1]);
        } else if(restriction.set !== null) {
          needToExport = (restrictCharacterSetInput.value.indexOf(glyphCharacter) != -1);
        }
        if(needToExport) {

          var token = {};
          token.ha = Math.round(glyph.advanceWidth * scale);
          token.x_min = Math.round(glyph.xMin * scale);
          token.x_max = Math.round(glyph.xMax * scale);
          token.o = ""
          // if (reverseTypeface.checked) {
          //反向取孔径
          // glyph.path.commands = reverseCommands(glyph.path.commands);
          // }
          glyph.path.commands.forEach(function(command, i) {
            if(command.type.toLowerCase() === "c") {
              command.type = "b";
            }
            token.o += command.type.toLowerCase();
            token.o += " "
            if(command.x !== undefined && command.y !== undefined) {
              token.o += Math.round(command.x * scale);
              token.o += " "
              token.o += Math.round(command.y * scale);
              token.o += " "
            }
            if(command.x1 !== undefined && command.y1 !== undefined) {
              token.o += Math.round(command.x1 * scale);
              token.o += " "
              token.o += Math.round(command.y1 * scale);
              token.o += " "
            }
            if(command.x2 !== undefined && command.y2 !== undefined) {
              token.o += Math.round(command.x2 * scale);
              token.o += " "
              token.o += Math.round(command.y2 * scale);
              token.o += " "
            }
          });
          result.glyphs[String.fromCharCode(glyph.unicode)] = token;
        }
      };
    });
    result.familyName = font.familyName;
    result.ascender = Math.round(font.ascender * scale);
    result.descender = Math.round(font.descender * scale);
    result.underlinePosition = Math.round(font.tables.post.underlinePosition * scale);
    result.underlineThickness = Math.round(font.tables.post.underlineThickness * scale);
    result.boundingBox = {
      "yMin": Math.round(font.tables.head.yMin * scale),
      "xMin": Math.round(font.tables.head.xMin * scale),
      "yMax": Math.round(font.tables.head.yMax * scale),
      "xMax": Math.round(font.tables.head.xMax * scale)
    };
    result.resolution = 1000;
    result.original_font_information = font.tables.name;
    if(font.styleName.toLowerCase().indexOf("bold") > -1) {
      result.cssFontWeight = "bold";
    } else {
      result.cssFontWeight = "normal";
    };
    if(font.styleName.toLowerCase().indexOf("italic") > -1) {
      result.cssFontStyle = "italic";
    } else {
      result.cssFontStyle = "normal";
    };
    return result;
  };

  var reverseCommands = function(commands) {

    var paths = [];
    var path;

    commands.forEach(function(c) {
      if(c.type.toLowerCase() === "m") {
        path = [c];
        paths.push(path);
      } else if(c.type.toLowerCase() !== "z") {
        path.push(c);
      } else {
        var m = paths[paths.length - 1][0];
        var z = {
          type: "L",
          x: m.x,
          y: m.y
        };
        path.push(z);
      }
    });

    var reversed = [];
    paths.forEach(function(p) {
      var result = {
        "type": "m",
        "x": p[p.length - 1].x,
        "y": p[p.length - 1].y
      };
      reversed.push(result);

      for(var i = p.length - 1; i > 0; i--) {
        var command = p[i];
        result = {
          "type": command.type
        };
        if(command.x2 !== undefined && command.y2 !== undefined) {
          result.x1 = command.x2;
          result.y1 = command.y2;
          result.x2 = command.x1;
          result.y2 = command.y1;
        } else if(command.x1 !== undefined && command.y1 !== undefined) {
          result.x1 = command.x1;
          result.y1 = command.y1;
        }
        result.x = p[i - 1].x;
        result.y = p[i - 1].y;
        reversed.push(result);
      }

    });

    return reversed;

  };

  return youzikuFontLoader;
});