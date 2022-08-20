import colorMaskFrag from './shaders/colorMaskFrag.glsl';
import colorMaskVert from './shaders/colorMaskVert.glsl';
import fragParts from './shaders/rhombusFragParts.glsl';
import fragDefine from './shaders/rhombusFragParts_define.glsl';
import vertCalcNormal from './shaders/rhombusVertParts_calcNormal.glsl';
import vertCalcPosition from './shaders/rhombusVertParts_calcPosition.glsl';
import vertDefine from './shaders/rhombusVertParts_define.glsl';
import vertReplaceNormal from './shaders/rhombusVertParts_replaceNormal.glsl';
import vertReplacePosition from './shaders/rhombusVertParts_replacePosition.glsl';

export const shaders = {
	vertCalcNormal,
	vertCalcPosition,
	vertDefine,
	vertReplaceNormal,
	vertReplacePosition,
	fragDefine,
	fragParts,
	colorMaskVert,
	colorMaskFrag
}
