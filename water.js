// Vertex shader program
const vsSource = `precision highp float;
    attribute vec4 aVertexPosition;
    varying highp vec2 vPosition;
    uniform vec2 canvas_size;
    void main() {
        gl_Position = aVertexPosition;
        vPosition = aVertexPosition.xy * .5 + vec2(.5, .5);
        vPosition.x *= canvas_size.x;
        vPosition.y *= canvas_size.y;
    }
`;
var glsl_uniforms = ""
for(var e of document.getElementsByTagName("input")) {
    if (e.hasAttribute("data-coloris")) {
        glsl_uniforms += "uniform vec3 " + e.id + ";";
    } else {
        glsl_uniforms += "uniform float " + e.id + ";";
    }
}

const fsSource = `precision highp float;` + glsl_funcs + glsl_uniforms + `
varying highp vec2 vPosition;

void main() {
    float water = snoice_o(vPosition, 0.01, 5) * .4 + .5;
    float hex = smoothstep(0.0, hex_smooth_step / 100.0, (hex(getHex(vPosition / hex_size).xy) - hex_line_width / 200.0) * 5.0);
    float foam = snoise((vPosition + vec2(1219821.5, 1287312.0)) * .004) - .5;
    foam = smoothstep(0.1, 0.0, abs(foam));
    foam *= smoothstep(0.0, 0.5, snoise((vPosition + vec2(12121.5, 12812.0)) * .005));
    foam += smoothstep(0.8, 1.0, snoise((vPosition + vec2(12971.5, 18732.0)) * 0.01)) * 1.0;
    foam += snoise((vPosition + vec2(129821.5, 187312.0)) * 1.0) * .15;
    foam *= foam_level / 100.0;

    vec3 color = mix(water_light, water_dark, water);
    color = mix(color, hex_color, hex);
    color = mix(color, foam_color, foam);
    gl_FragColor = vec4(color, 1.0);
    //gl_FragColor = vec4(vec3(foam, foam, foam), 1.0);
}
`;

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    document.body.innerText = `Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`;
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        document.body.innerText = `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`;
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initBuffers(gl) {
  const positionBuffer = initPositionBuffer(gl);

  return {
    position: positionBuffer,
  };
}

function initPositionBuffer(gl) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}

function drawScene(gl, programInfo, buffers) {
    var dpi = document.getElementById("dpi").value;
    document.querySelector('canvas').width = Math.max(1, parseFloat(document.getElementById("canvas_width").value) * dpi);
    document.querySelector('canvas').height = Math.max(1, parseFloat(document.getElementById("canvas_height").value) * dpi);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    gl.useProgram(programInfo.program);
    gl.uniform2fv(gl.getUniformLocation(programInfo.program, "canvas_size"), [parseFloat(document.getElementById("canvas_width").value) * 100.0, parseFloat(document.getElementById("canvas_height").value * 100.0)]);
    gl.viewport(0, 0, document.querySelector('canvas').width, document.querySelector('canvas').height);
    for(var e of document.getElementsByTagName("input")) {
        var loc = gl.getUniformLocation(programInfo.program, e.id);
        if (loc !== null) {
            if (e.hasAttribute("data-coloris")) {
                var col = parseInt(e.value.substr(1), 16);
                gl.uniform3fv(loc, [((col >> 16) & 0xFF) / 0xFF, ((col >> 8) & 0xFF) / 0xFF, ((col >> 0) & 0xFF) / 0xFF]);
            } else {
                gl.uniform1f(loc, e.value);
            }
        }
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

const gl = document.querySelector('canvas').getContext('webgl');
const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
const programInfo = {
  program: shaderProgram,
  attribLocations: {
    vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
  },
};

const buffers = initBuffers(gl);

Coloris({
  themeMode: 'dark',
  alpha: false
});

drawScene(gl, programInfo, buffers);

for(var e of document.getElementsByTagName("input")) {
    e.oninput = function() { drawScene(gl, programInfo, buffers); };
}