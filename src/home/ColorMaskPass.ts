import GUI from 'lil-gui';
import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { shaders } from './shaderChunk';

export class ColorMaskPass {
	pass!: ShaderPass

	constructor(private texture: THREE.Texture, private canvasAspect: number, private gui: GUI) {
		this.init()
	}

	private init = () => {
		const shader: THREE.Shader = {
			uniforms: {
				tDiffuse: { value: null },
				u_texture: { value: this.texture },
				u_uvScale: { value: this.calcCoveredTextureScale(this.texture, this.canvasAspect) },
				u_textureMix: { value: 1 }
			},
			vertexShader: shaders.colorMaskVert,
			fragmentShader: shaders.colorMaskFrag
		}
		this.pass = new ShaderPass(shader)

		const d = {
			mixTexture: () => {
				this.pass.uniforms.u_textureMix.value = this.pass.uniforms.u_textureMix.value === 0 ? 1 : 0
			}
		}
		this.gui.add(d, 'mixTexture').name('Mix Texture')
	}

	updateTextureScale = (canvasAspect: number) => {
		const { u_texture, u_uvScale } = this.pass.uniforms
		this.calcCoveredTextureScale(u_texture.value, canvasAspect, u_uvScale.value)
	}

	private calcCoveredTextureScale = (texture: THREE.Texture, aspect: number, target?: THREE.Vector2) => {
		const result = target ?? new THREE.Vector2()
		const imageAspect = texture.image.width / texture.image.height

		if (aspect < imageAspect) result.set(aspect / imageAspect, 1)
		else result.set(1, imageAspect / aspect)

		return result
	}

	update = () => {}
}
