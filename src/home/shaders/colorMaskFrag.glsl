uniform sampler2D tDiffuse;
uniform sampler2D u_texture;
uniform vec2 u_uvScale;
uniform float u_textureMix;
varying vec2 v_uv;

void main() {
  vec4 tex = texture2D(tDiffuse, v_uv);

  if (abs(tex.a - 0.9) < 0.1) {
    float v = tex.b; // 0~1の明度(Value)
    float ratio = smoothstep(0.0, 0.2, v) + 0.4;
    ratio = clamp(ratio, 0.0, 1.0);

    vec2 uv = (v_uv - 0.5) * u_uvScale + 0.5;
    uv += tex.xy * 0.02;
    tex = texture2D(u_texture, uv);
    tex += v;

    vec4 orgColor = vec4(vec3(v), 1.0);
    tex = mix(orgColor, tex, u_textureMix * ratio);
  }

  gl_FragColor = tex;
}