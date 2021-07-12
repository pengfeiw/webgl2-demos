/**
 * 冯氏光照模型
 */
import {glMatrix, mat4} from "gl-matrix";
import {vertices, normals} from "../../data/cube";
import Shader from "../../util/shader";
import Camera, {Camera_Movement} from "../../util/camera";
import {resizeCanvas} from "../../util/utilFun";

const vertex_source =
    `#version 300 es

    in vec3  a_pos;
    in vec3 a_normal;

    out vec3 v_normal;

    uniform mat4 projection;
    uniform mat4 view;
    uniform mat4 model;

    void main() {
        gl_Position = projection * view * model * vec4(a_pos, 1.0);
        v_normal = a_normal;
    }
`;

const fragment_source =
    `#version 300 es
    precision highp float;

    in vec3 v_normal;

    out vec4 FragColor;

    uniform vec3 u_objColor; // 物体颜色
    uniform vec3 u_lightColor; // 光照颜色
    uniform vec3 u_lightDirection; // 光照方向
    float ambientStrength = 0.1; // 环境光因子

    void main() {
        // 环境光照
        vec3 ambient = ambientStrength * u_lightColor;
        
        // 漫反射
        vec3 lightDirectionReverse = normalize(vec3(-u_lightDirection.x, -u_lightDirection.y, -u_lightDirection.z));
        vec3 normal = normalize(v_normal);
        float diffuseStrength = max(dot(normal, lightDirectionReverse), 0.0);
        vec3 diffuse = diffuseStrength * u_lightColor;

        vec3 result = u_objColor * (ambient + diffuse);
        FragColor = vec4(result, 1.0);
    }
`;

const draw = (gl: WebGL2RenderingContext) => {
    const shader = new Shader(gl, vertex_source, fragment_source);

    // vao
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // vbo
    const posVbo = gl.createBuffer();
    const posAttLocation = gl.getAttribLocation(shader.program, "a_pos");
    gl.bindBuffer(gl.ARRAY_BUFFER, posVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posAttLocation);
    gl.vertexAttribPointer(posAttLocation, 3, gl.FLOAT, false, 0, 0);

    const normalVbo = gl.createBuffer();
    const normalAttLocation = gl.getAttribLocation(shader.program, "a_normal");
    gl.bindBuffer(gl.ARRAY_BUFFER, normalVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalAttLocation);
    gl.vertexAttribPointer(normalAttLocation, 3, gl.FLOAT, false, 0, 0);

    // uniform
    shader.useProgram();
    const model = mat4.create();
    shader.setMat4("model", model);

    shader.setFloat3("u_objColor", 0.36, 0.42, 0.60);
    shader.setFloat3("u_lightColor", 1.0, 1.0, 1.0);
    shader.setFloat3("u_lightDirection", 1.0, -0.5, -1.0);

    const camera = new Camera([0, 1, 4]);
    camera.mouseSensitivity = 0.02;
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
