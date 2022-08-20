#include <output_fragment>
// -----------------------------
vec3 hsv = rgb2hsv(outgoingLight);
gl_FragColor = vec4(v_normal.xy, hsv.b, 0.9);