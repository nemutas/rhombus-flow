import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';
import { Mouse3d } from '../scripts/Mouse3d';
import { Assets, TCanvasBase } from '../scripts/TCanvasBase';
import { publicPath } from '../scripts/utils';
import { ColorMaskPass } from './ColorMaskPass';
import { FxaaPass } from './fxaaPass';
import { shaders } from './shaderChunk';
import { Simulator } from './Simulator';

export class TCanvas extends TCanvasBase {
	private WIDTH = 256 as const
	private HEIGHT = 128 as const

	private mouse3d!: Mouse3d
	private simulator!: Simulator
	private scaleUniforms: { [uniform: string]: THREE.IUniform<any> } = {
		u_positionTexture: { value: null },
		u_prevPositionTexture: { value: null }
	}

	private fxaa?: FxaaPass
	private colorMask?: ColorMaskPass

	private datas = {
		visibleStats: false,
		stats: () => {
			this.datas.visibleStats = !this.datas.visibleStats
			this.visibleStats(this.datas.visibleStats ? 'visible' : 'hidden')
		},
		enabledAnimation: true,
		toggleAnimation: () => (this.datas.enabledAnimation = !this.datas.enabledAnimation)
	}

	private assets: Assets = {
		envMap: { path: publicPath('/resources/studio_small_08_1k.hdr') },
		image: { path: publicPath('/resources/wlop5.jpg') }
	}

	constructor(parentNode: ParentNode) {
		super(parentNode)

		this.loadAssets(this.assets).then(() => {
			this.setScene()
			this.createSimulator()
			this.createLight()
			this.createMesh()
			this.createPostProcessing()
			this.setResizeCallback()
			this.addEvent()
			this.setDispose()
			this.animate(this.update)
		})
	}

	private setScene = () => {
		this.scene.background = new THREE.Color('#fefefe')
		this.camera.position.set(0, 3, 15)
		const controls = this.setOrbitControls(0.1)
		controls.minAzimuthAngle = 0
		controls.maxAzimuthAngle = 0
		controls.maxPolarAngle = Math.PI / 2
		controls.enablePan = false
		controls.minDistance = 3
		controls.maxDistance = 16
		this.mouse3d = new Mouse3d(this.camera)

		this.setStats()
		this.visibleStats('hidden')

		this.gui.open(false)
		this.gui.add(this.datas, 'stats').name('Stats')
	}

	private createSimulator = () => {
		this.simulator = new Simulator(this.renderer, this.WIDTH, this.HEIGHT)
	}

	private createLight = () => {
		const directionalLight = new THREE.DirectionalLight()
		directionalLight.intensity = 1
		directionalLight.position.set(0, 10, 0)
		directionalLight.castShadow = true
		directionalLight.shadow.camera.far = 30
		const edgeX = 60
		const edgeY = 30
		directionalLight.shadow.camera.top = edgeY / 2
		directionalLight.shadow.camera.bottom = -edgeY / 2
		directionalLight.shadow.camera.left = -edgeX / 2
		directionalLight.shadow.camera.right = edgeX / 2
		directionalLight.shadow.mapSize.set(4096, 2048)
		directionalLight.name = 'directionalLight'
		this.scene.add(directionalLight)

		// const helper = new THREE.CameraHelper(directionalLight.shadow.camera)
		// this.scene.add(helper)
	}

	private customMaterial = (material: THREE.Material, isDepthMaterial = false) => {
		material.onBeforeCompile = shader => {
			// uniforms
			shader.uniforms.u_positionTexture = this.scaleUniforms.u_positionTexture
			shader.uniforms.u_prevPositionTexture = this.scaleUniforms.u_prevPositionTexture
			// vertex
			shader.vertexShader = shader.vertexShader.replace('#include <common>', shaders.vertDefine)
			shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', shaders.vertCalcPosition)
			if (!isDepthMaterial) {
				shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', shaders.vertCalcNormal)
				shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', shaders.vertReplaceNormal)
			}
			shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', shaders.vertReplacePosition)
			// fragment
			if (!isDepthMaterial) {
				shader.fragmentShader = shader.fragmentShader.replace('#define STANDARD', shaders.fragDefine)
				shader.fragmentShader = shader.fragmentShader.replace('#include <output_fragment>', shaders.fragParts)
			}
		}
	}

	private createMesh = () => {
		const amount = this.WIDTH * this.HEIGHT

		const scale = 0.07
		const geometry = new THREE.OctahedronGeometry()
		geometry.applyMatrix4(new THREE.Matrix4().makeScale(1 * scale, 1 * scale, 6 * scale))
		geometry.setAttribute('simulatorUv', this.simulator.uv)

		const material = new THREE.MeshStandardMaterial({
			color: '#5c5c5c',
			metalness: 0.9,
			roughness: 0.2,
			envMap: this.assets.envMap.data as THREE.Texture,
			envMapIntensity: 0.02
		})
		this.customMaterial(material)

		const depthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })
		this.customMaterial(depthMaterial, true)

		const mesh = new THREE.InstancedMesh(geometry, material, amount)
		mesh.customDepthMaterial = depthMaterial
		mesh.castShadow = true
		mesh.receiveShadow = true

		const dummy = new THREE.Object3D()
		;[...Array(amount)].forEach((_, i) => mesh.setMatrixAt(i, dummy.matrix))

		this.scene.add(mesh)

		const shadowGeometry = new THREE.PlaneGeometry(60, 30)
		const shadowMaterial = new THREE.ShadowMaterial({ color: '#000', opacity: 0.2 })
		const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial)
		shadowMesh.receiveShadow = true
		shadowMesh.rotation.x = -Math.PI / 2
		shadowMesh.position.y = -6.5

		this.scene.add(shadowMesh)

		const d = {
			receiveShadow: () => {
				mesh.receiveShadow = !mesh.receiveShadow
			}
		}
		this.gui.add(d, 'receiveShadow').name('Receive Shadow')
	}

	private createPostProcessing = () => {
		const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader)
		this.effectComposer.addPass(gammaCorrectionPass)

		this.fxaa = new FxaaPass(this.size.width, this.size.height)
		this.effectComposer.addPass(this.fxaa.pass)

		this.colorMask = new ColorMaskPass(this.assets.image.data as THREE.Texture, this.size.aspect, this.gui)
		this.effectComposer.addPass(this.colorMask.pass)
	}

	private setResizeCallback = () => {
		this.resizeCallback = () => {
			const { width, height, aspect } = this.size
			this.fxaa?.update(width, height)
			this.colorMask?.updateTextureScale(aspect)
		}
	}

	private mouse = new THREE.Vector3()

	private update = () => {
		const dt = this.clock.getDelta()

		const mousePos = this.mouse3d.position
		mousePos.y = Math.max(-3, mousePos.y)
		this.mouse.lerp(mousePos, 0.2)

		if (this.datas.enabledAnimation) {
			this.simulator.update(dt, this.mouse)
			this.scaleUniforms.u_positionTexture.value = this.simulator.texturePosition
			this.scaleUniforms.u_prevPositionTexture.value = this.simulator.texturePrevPosition
		}
	}

	private addEvent = () => {
		window.addEventListener('keydown', this.handlekKeydown)
	}

	private handlekKeydown = (e: KeyboardEvent) => {
		if (e.code === 'Space') {
			this.datas.toggleAnimation()
		}
	}

	private setDispose = () => {
		this.disposeCallback = () => {
			this.mouse3d.dispose()
			window.removeEventListener('keydown', this.handlekKeydown)
		}
	}
}
