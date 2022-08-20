import * as THREE from 'three';
import { GPUComputationRenderer, Variable } from 'three/examples/jsm/misc/GPUComputationRenderer';
import simulatorFrag from './shaders/simulatorFrag.glsl';

type TextureData = { material?: THREE.ShaderMaterial; variable?: Variable }

export class Simulator {
	public uv!: THREE.InstancedBufferAttribute
	private gpuCompute!: GPUComputationRenderer
	private position: TextureData = {}

	constructor(private gl: THREE.WebGLRenderer, private width: number, private height: number) {
		this.init()
		this.setTexturePosition()
		this.setVariableDependencies()
		this.gpuCompute.init()
	}

	private init = () => {
		this.gpuCompute = new GPUComputationRenderer(this.width, this.height, this.gl)
		if (this.gl.capabilities.isWebGL2 === false) {
			this.gpuCompute.setDataType(THREE.HalfFloatType)
		}

		const _uv = []
		const [dx, dy] = [(1 / this.width) * 0.5, (1 / this.height) * 0.5]
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				_uv.push(x / this.width + dx, y / this.height + dy)
			}
		}
		this.uv = new THREE.InstancedBufferAttribute(Float32Array.from(_uv), 2)
	}

	private setTexturePosition = () => {
		// set the default position to texture
		const texture = this.gpuCompute.createTexture()
		const theArray = texture.image.data

		const radiusRange = [0.5, 1.5]

		for (let i = 0; i < theArray.length; i += 4) {
			const r = Math.random() * (radiusRange[1] - radiusRange[0]) + radiusRange[0]
			const theta = Math.random() * Math.PI
			const phi = Math.random() * Math.PI * 2

			theArray[i + 0] = r * Math.sin(theta) * Math.sin(phi)
			theArray[i + 1] = r * Math.cos(theta)
			theArray[i + 2] = r * Math.sin(theta) * Math.cos(phi)
			theArray[i + 3] = Math.random()
		}

		// set fragment shader
		const variable = this.gpuCompute.addVariable('texturePos', simulatorFrag, texture)
		variable.wrapS = THREE.RepeatWrapping
		variable.wrapT = THREE.RepeatWrapping

		// set uniforms
		const material = variable.material
		material.uniforms['u_defaultTexturePos'] = { value: texture.clone() }
		material.uniforms['u_time'] = { value: 0 }
		material.uniforms['u_mouse'] = { value: new THREE.Vector3() }

		this.position = { variable, material }
	}

	private setVariableDependencies = () => {
		this.gpuCompute.setVariableDependencies(this.position.variable!, [
			this.position.variable! /**, this.velocity.variable */
		])
	}

	update = (dt: number, mousePos: THREE.Vector3) => {
		this.position.material!.uniforms.u_time.value += dt
		this.position.material!.uniforms.u_mouse.value.copy(mousePos)
		this.gpuCompute.compute()
	}

	get texturePosition() {
		const target = this.gpuCompute.getCurrentRenderTarget(this.position.variable!) as THREE.WebGLRenderTarget
		return target.texture
	}

	get texturePrevPosition() {
		const target = this.gpuCompute.getAlternateRenderTarget(this.position.variable!) as THREE.WebGLRenderTarget
		return target.texture
	}
}
