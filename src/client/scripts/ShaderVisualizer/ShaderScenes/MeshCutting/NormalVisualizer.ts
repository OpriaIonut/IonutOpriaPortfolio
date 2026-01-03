export const normalVisualizerVert = `
varying vec3 v_norm;
varying vec3 v_normW;

void main()
{
    v_norm = normal;
    v_normW = (modelMatrix * vec4(normal, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const normalVisualizerFrag = `
varying vec3 v_norm;
varying vec3 v_normW;

void main()
{
    gl_FragColor = vec4(v_norm, 1.0);
}
`;