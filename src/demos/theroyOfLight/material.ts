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
     out vec3 v_pos;
 
     uniform mat4 projection;
     uniform mat4 view;
     uniform mat4 model;
 
     void main() {
         gl_Position = projection * view * model * vec4(a_pos, 1.0);
         v_normal = a_normal;
         v_pos = (model * vec4(a_pos, 1.0)).xyz;
     }
 `;

const fragment_source =
    `#version 300 es
    precision highp float;

    in vec3 v_normal;
    in vec3 v_pos;

    out vec4 FragColor;

    // uniform vec3 u_lightDirection; // 光照方向
    uniform vec3 viewPos; // 摄像机位置

    struct Material {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        float shininess;
    };

    struct Light {
        vec3 direction;
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
    };
    
    uniform Material material;
    uniform Light light;

    void main() {
        // 环境光照
        vec3 ambient = material.ambient * light.ambient;
        
        // 漫反射
        vec3 lightDirectionReverse = normalize(-light.direction);
        vec3 normal = normalize(v_normal);
        float diffuseStrength = max(dot(normal, lightDirectionReverse), 0.0);
        vec3 diffuse = light.diffuse * (diffuseStrength * material.diffuse);

        // 镜面光照
        vec3 viewDir = normalize(viewPos - v_pos);
        vec3 reflectDir = reflect(light.direction, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        vec3 specular = light.specular * (spec * material.specular);

        vec3 result = ambient + diffuse + specular;
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

    shader.setFloat3("material.ambient", 1, 0.5, 0.31);
    shader.setFloat3("material.diffuse", 1, 0.5, 0.31);
    shader.setFloat3("material.specular", 0.5, 0.5, 0.5);
    shader.setFloat("material.shininess", 32);

    shader.setFloat3("light.ambient",  0.2, 0.2, 0.2);
    shader.setFloat3("light.diffuse",  0.5, 0.5, 0.5); // 将光照调暗了一些以搭配场景
    shader.setFloat3("light.specular", 1.0, 1.0, 1.0); 
    shader.setFloat3("light.direction", 1.0, -0.5, -1.0);

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

        shader.setFloat3("viewPos", camera.position[0], camera.position[1], camera.position[2]);

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
