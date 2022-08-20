import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

export class FxaaPass {
	pass!: ShaderPass

	constructor() {
		this.init()
	}

	private init = () => {
		this.pass = new ShaderPass(FXAAShader)
	}

	update = (width: number, height: number) => {
		this.pass.uniforms.resolution.value.set(1 / width, 1 / height)
	}
}
