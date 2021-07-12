/**
 * 冯氏光照模型
 */
import {glMatrix, mat4} from "gl-matrix";
import verticesData from "../../data/cube";
import Shader from "../../util/shader";
import Camera, {Camera_Movement} from "../../util/camera";
import {resizeCanvas} from "../../util/utilFun";

const vertex_source =
    `#version 300 es

    in vec3  a_pos;

    uniform mat4 projection;
    uniform mat4 view;
    uniform mat4 model;

    void main() {
        gl_Position = projection * view * model * vec4(a_pos, 1.0);
    }
`;

const fragment_source =
    `#version 300 es
    precision highp float;

    out vec4 FragColor;

    uniform vec3 u_objColor; // 物体颜色
    uniform vec3 u_lightColor; // 光照颜色
    float ambientStrength = 0.1; // 环境光因子

    void main() {
        vec3 ambient = ambientStrength * u_lightColor;
        vec3 result = u_objColor * ambient;
        FragColor = vec4(result, 1.0);
    }
`;

const draw = (gl: WebGL2RenderingContext) => {
    const shader = new Shader(gl, vertex_source, fragment_source);

    // vao
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // vbo
    const vbo = gl.createBuffer();
    const posAttLocation = gl.getAttribLocation(shader.program, "a_pos");
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesData), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posAttLocation);
    gl.vertexAttribPointer(posAttLocation, 3, gl.FLOAT, false, 0, 0);

    // uniform
    shader.useProgram();
    const model = mat4.create();
    shader.setMat4("model", model);

    shader.setFloat3("u_objColor", 0.36, 0.42, 0.60);
    shader.setFloat3("u_lightColor", 1.0, 1.0, 1.0);

    const camera = new Camera([0, 1, 4]);
    camera.mouseSensitivity = 0.04;
    var deltaTime = 0.01;
    var lastFrame = 0;
    const drawScene = (time: number) => {
        resizeCanvas(gl);

        const currentFrame = time;
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;

        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(vao);
        shader.useProgram();
        const view = camera.getViewMatrix();
        shader.setMat4("view", view);

        const projection = mat4.perspective(mat4.create(), glMatrix.toRadian(camera.zoom), gl.canvas.width / gl.canvas.height, 0.1, 100);
        shader.setMat4("projection", projection);

        gl.drawArrays(gl.TRIANGLES, 0, 36);

        requestAnimationFrame(drawScene);
    };

    window.addEventListener("keydown", (event: KeyboardEvent) => {
        switch (event.key) {
            case "w":
                camera.processKeyboard(Camera_Movement.FORWARD, deltaTime * 0.001);
                break;
            case "s":
                camera.processKeyboard(Camera_Movement.BACKWARD, deltaTime * 0.001);
                break;
            case "a":
                camera.processKeyboard(Camera_Movement.LEFT, deltaTime * 0.001);
                break;
            case "d":
                camera.processKeyboard(Camera_Movement.RIGHT, deltaTime * 0.001);
                break;
            default:
                break;
        }
    });

    window.addEventListener("wheel", (event: WheelEvent) => {
        camera.processMouseScroll(event.deltaY * 0.01);
    });

    window.addEventListener("mousemove", (event: MouseEvent) => {
        camera.processMouseMovement(event.movementX, event.movementY);
    });

    requestAnimationFrame(drawScene);
};

export default draw;
