uniform sampler2D u_defaultTexturePos;
uniform float u_time;
uniform vec3 u_mouse;

#include '../../scripts/glsl/noise/curl.glsl'

const float dieSpeed = 0.97;

void main()	{
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec4 tmpPos = texture2D(texturePos, uv);
  vec3 pos = tmpPos.xyz;
  float life = tmpPos.w;

  if(life < 0.01) {
    vec4 def = texture2D(u_defaultTexturePos, uv);
    pos = def.xyz + u_mouse;
    life = 0.5 + fract(def.w * 21.4131 + u_time);
  }

  float speed = 1.0 - clamp(life, 0.0, 1.0);
  speed = pow(speed, 2.0);
  speed = 0.005 + speed * 0.015;

  pos += curl(pos * 0.1, u_time * 0.2, pow(life, 0.1)) * speed;

	gl_FragColor = vec4(pos, life * dieSpeed);
}