export const voronoiVertShader = `
varying vec2 v_uv;

void main()
{
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const voronoiFragShader = `
// Author: @patriciogv
// Title: CellularNoise

varying vec2 v_uv;

uniform float u_scale;

vec2 random2( vec2 p ) 
{
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() 
{
    // Tile the space
    vec2 wholeUV = floor(v_uv * u_scale);
    vec2 fractionalUV = fract(v_uv * u_scale);

    float minDist = 1.0;  // minimum distance

    for (int y = -1; y <= 1; y++) 
    {
        for (int x = -1; x <= 1; x++) 
        {
            // Neighbor place in the grid
            vec2 neighbor = vec2(float(x), float(y));

            // Random position from current + neighbor place in the grid
            vec2 point = random2(wholeUV + neighbor);

			// Animate the point
            // point = 0.5 + 0.5*sin(u_time + 6.2831*point);

			// Vector between the pixel and the point
            vec2 diff = neighbor + point - fractionalUV;

            // Distance to the point
            float dist = length(diff);

            // Keep the closer distance
            minDist = min(minDist, dist);
        }
    }

    // Draw the min distance (distance field)
    vec3 color = vec3(minDist);

    gl_FragColor = vec4(color,1.0);
}
`