attribute vec2 simulatorUv;
uniform sampler2D u_positionTexture;
uniform sampler2D u_prevPositionTexture;
varying vec3 v_normal;

const vec3 BASIC_VECTOR = normalize(vec3(0.0, 0.0, 1.0));

#include '../../scripts/glsl/math/quatarnion.glsl'

vec3 displace(vec3 pos) {
  vec3 result = pos;

  vec4 positionInfo = texture2D(u_positionTexture, simulatorUv);
  vec4 prevPositionInfo = texture2D(u_prevPositionTexture, simulatorUv);

  // -----------------
  // scale
  float scale = smoothstep(0.1, 0.3, positionInfo.w);
  result.xy *= scale;
  result.z *= pow(scale, 0.2);

  // -----------------
  // rotation
  vec3 dir = normalize(positionInfo.xyz - prevPositionInfo.xyz);
  vec3 rotateAxis = normalize(cross(BASIC_VECTOR, dir));

  if (0.0 < length(rotateAxis)) {
    // calc angle
    float c = dot(BASIC_VECTOR, dir);
    float angle = acos(c);
    // rotate using Quaternion
    Quaternion q = axisAngle(rotateAxis, angle);
    result = rotate(result, q);
  }

  // -----------------
  // position
  result += positionInfo.xyz;

  return result;
}

vec3 orthogonal(vec3 v) {
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)
  : vec3(0.0, -v.z, v.y));
}

vec3 recalcNormals(vec3 newPos) {
  float offset = 0.001;
  vec3 tangent = orthogonal(normal);
  vec3 bitangent = normalize(cross(normal, tangent));
  vec3 neighbour1 = position + tangent * offset;
  vec3 neighbour2 = position + bitangent * offset;

  vec3 displacedNeighbour1 = displace(neighbour1);
  vec3 displacedNeighbour2 = displace(neighbour2);

  vec3 displacedTangent = displacedNeighbour1 - newPos;
  vec3 displacedBitangent = displacedNeighbour2 - newPos;

  return normalize(cross(displacedTangent, displacedBitangent));
}
// ------------------------------------
#include <common>