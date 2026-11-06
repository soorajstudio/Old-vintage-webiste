import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Reliquary3DViewer {
  constructor(canvasContainerId, onProgress, onLoadComplete, onError) {
    this.container = document.getElementById(canvasContainerId);
    this.onProgress = onProgress;
    this.onLoadComplete = onLoadComplete;
    this.onError = onError;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.loader = new GLTFLoader();

    this.currentModel = null;
    this.currentModelData = null;
    this.pedestal = null;
    this.particles = null;

    // Lighting rig
    this.ambientLight = null;
    this.keyLight = null;
    this.fillLight = null;
    this.rimLight = null;
    this.hearthLight1 = null;
    this.hearthLight2 = null;

    // Settings
    this.isRotating = true;
    this.rotationSpeed = 0.008;
    this.isWireframe = false;
    this.currentLightingPreset = 'hearth';
    this.materialPatina = 0.5;
    this.arcaneTint = 'none';

    // Model cache
    this.cache = new Map();

    this.clock = new THREE.Clock();
    this.reqId = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e0a08);
    this.scene.fog = new THREE.FogExp2(0x0e0a08, 0.04);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.5, 3.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // For screenshots
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.88;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 50;

    this.setupLighting();
    this.setupPedestal();
    this.setupEmbers();

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.animate();
  }

  setupLighting() {
    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffeedd, 0.5);
    this.scene.add(this.ambientLight);

    // Key Light (Main warm lantern/torch)
    this.keyLight = new THREE.DirectionalLight(0xffdfa8, 2.0);
    this.keyLight.position.set(4, 6, 4);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.bias = -0.001;
    this.scene.add(this.keyLight);

    // Fill Light (Subtle cool shadow fill)
    this.fillLight = new THREE.DirectionalLight(0x7da5d8, 0.6);
    this.fillLight.position.set(-4, 3, -3);
    this.scene.add(this.fillLight);

    // Rim Light (Highlighting vintage silhouette)
    this.rimLight = new THREE.DirectionalLight(0xd4af37, 1.2);
    this.rimLight.position.set(0, -3, -4);
    this.scene.add(this.rimLight);

    // Flickering Hearth Point Lights
    this.hearthLight1 = new THREE.PointLight(0xff7722, 2.5, 8);
    this.hearthLight1.position.set(1.5, -0.2, 1.5);
    this.scene.add(this.hearthLight1);

    this.hearthLight2 = new THREE.PointLight(0xffaa44, 1.8, 6);
    this.hearthLight2.position.set(-1.8, 0.8, -1.2);
    this.scene.add(this.hearthLight2);

    this.applyLightingPreset('hearth');
  }

  applyLightingPreset(preset) {
    this.currentLightingPreset = preset;
    if (preset === 'hearth') {
      // Warm Candlelight & Hearthfire
      this.scene.background.set(0x0e0a08);
      this.scene.fog.color.set(0x0e0a08);
      this.ambientLight.color.set(0x402518);
      this.ambientLight.intensity = 0.8;
      this.keyLight.color.set(0xffb766);
      this.keyLight.intensity = 2.4;
      this.fillLight.color.set(0x8a4520);
      this.fillLight.intensity = 0.5;
      this.rimLight.color.set(0xff9933);
      this.rimLight.intensity = 1.0;
      this.hearthLight1.intensity = 2.5;
      this.hearthLight2.intensity = 1.8;
    } else if (preset === 'moonlight') {
      // Mystic Moonlit Crypt
      this.scene.background.set(0x060911);
      this.scene.fog.color.set(0x060911);
      this.ambientLight.color.set(0x1a2b4c);
      this.ambientLight.intensity = 0.7;
      this.keyLight.color.set(0x90b8f8);
      this.keyLight.intensity = 2.2;
      this.fillLight.color.set(0x2a3d60);
      this.fillLight.intensity = 0.9;
      this.rimLight.color.set(0x60a5fa);
      this.rimLight.intensity = 1.5;
      this.hearthLight1.intensity = 0.2;
      this.hearthLight2.intensity = 0.2;
    } else if (preset === 'arcane') {
      // Arcane Ethereal Resonator
      this.scene.background.set(0x0a0614);
      this.scene.fog.color.set(0x0a0614);
      this.ambientLight.color.set(0x38184c);
      this.ambientLight.intensity = 0.8;
      this.keyLight.color.set(0xc084fc);
      this.keyLight.intensity = 2.2;
      this.fillLight.color.set(0x2dd4bf);
      this.fillLight.intensity = 1.2;
      this.rimLight.color.set(0xf472b6);
      this.rimLight.intensity = 1.8;
      this.hearthLight1.intensity = 1.0;
      this.hearthLight2.intensity = 1.0;
    } else if (preset === 'sunlight') {
      // High Antiquarium Daylight
      this.scene.background.set(0x141210);
      this.scene.fog.color.set(0x141210);
      this.ambientLight.color.set(0xfff4e6);
      this.ambientLight.intensity = 1.0;
      this.keyLight.color.set(0xfffaed);
      this.keyLight.intensity = 2.6;
      this.fillLight.color.set(0xd8d0c5);
      this.fillLight.intensity = 0.8;
      this.rimLight.color.set(0xc5a059);
      this.rimLight.intensity = 0.8;
      this.hearthLight1.intensity = 0.2;
      this.hearthLight2.intensity = 0.2;
    }
  }

  setupPedestal() {
    const group = new THREE.Group();

    // Runic Stone Pedestal Base
    const baseGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.12, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1b1411,
      roughness: 0.85,
      metalness: 0.15
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.06;
    base.receiveShadow = true;
    group.add(base);

    // Ornate Gilded Brass Rim
    const rimGeo = new THREE.TorusGeometry(1.42, 0.02, 16, 64);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xc5a059,
      roughness: 0.35,
      metalness: 0.85
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.005;
    group.add(rim);

    // Inner Glowing Runic Ring
    const innerRingGeo = new THREE.RingGeometry(0.8, 0.86, 64);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.position.y = 0.008;
    group.add(innerRing);

    group.position.y = -0.6;
    this.pedestal = group;
    this.scene.add(this.pedestal);
  }

  setupEmbers() {
    const particleCount = 75;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = Math.random() * 3 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      scales[i] = Math.random() * 0.05 + 0.02;
      opacities[i] = Math.random() * 0.7 + 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 200, 100, 1)');
    grad.addColorStop(0.4, 'rgba(230, 120, 30, 0.8)');
    grad.addColorStop(1, 'rgba(180, 50, 10, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.12,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffaa44
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  loadRelic(modelData) {
    if (this.currentModelData && this.currentModelData.id === modelData.id) {
      return;
    }

    this.currentModelData = modelData;

    // Remove existing model from scene
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel = null;
    }

    // Resolve absolute URL relative to current location (works seamlessly on GitHub Pages subpaths)
    const url = new URL(modelData.file, window.location.href).href;

    // Check cache
    if (this.cache.has(modelData.file)) {
      const cached = this.cache.get(modelData.file);
      this.instantiateModel(cached.clone(), modelData);
      if (this.onLoadComplete) this.onLoadComplete(modelData);
      return;
    }

    // Load fresh GLB
    this.loader.load(
      url,
      (gltf) => {
        this.cache.set(modelData.file, gltf.scene);
        this.instantiateModel(gltf.scene.clone(), modelData);
        if (this.onLoadComplete) this.onLoadComplete(modelData);
      },
      (xhr) => {
        if (xhr.lengthComputable && this.onProgress) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          this.onProgress(percent, xhr.loaded, xhr.total);
        }
      },
      (error) => {
        console.error("Failed to load relic:", url, error);
        if (this.onError) this.onError(error, modelData);
      }
    );
  }

  instantiateModel(scene, modelData) {
    this.currentModel = scene;

    // Enable shadows and gather geometry stats
    let totalTriangles = 0;
    let totalVertices = 0;

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.geometry) {
          if (child.geometry.index) {
            totalTriangles += child.geometry.index.count / 3;
          } else if (child.geometry.attributes.position) {
            totalTriangles += child.geometry.attributes.position.count / 3;
          }
          if (child.geometry.attributes.position) {
            totalVertices += child.geometry.attributes.position.count;
          }
        }

        // Preserve original materials for tint/wireframe adjustments
        if (!child.userData.origMaterial) {
          child.userData.origMaterial = child.material;
        }
      }
    });

    modelData.polycount = Math.round(totalTriangles);
    modelData.vertices = Math.round(totalVertices);

    // Compute exact bounding box and re-center to origin
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Adjust position so bottom of object sits directly on the pedestal top
    scene.position.x = -center.x;
    scene.position.y = -box.min.y - 0.55;
    scene.position.z = -center.z;

    const wrapper = new THREE.Group();
    wrapper.add(scene);
    this.currentModel = wrapper;
    this.scene.add(this.currentModel);

    // Auto-fit camera framing
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.55;
    cameraZ = Math.max(cameraZ, 1.2);

    // Animate camera gently to new position
    const targetPos = new THREE.Vector3(cameraZ * 0.8, cameraZ * 0.45, cameraZ * 1.05);
    this.camera.position.copy(targetPos);
    this.controls.target.set(0, (size.y * 0.35) - 0.3, 0);
    this.controls.minDistance = cameraZ * 0.2;
    this.controls.maxDistance = cameraZ * 4.5;
    this.controls.update();

    // Adjust pedestal size to match model footprint
    const footprint = Math.max(size.x, size.z) * 0.75;
    const pedestalScale = Math.max(footprint, 0.8);
    this.pedestal.scale.set(pedestalScale, 1, pedestalScale);
    this.pedestal.position.y = -0.58;

    this.applyMaterialTweaks();
  }

  applyMaterialTweaks() {
    if (!this.currentModel) return;

    this.currentModel.traverse((child) => {
      if (child.isMesh && child.material) {
        if (this.isWireframe) {
          child.material.wireframe = true;
        } else {
          child.material.wireframe = false;
        }

        // Apply patina / roughness if Standard/Physical material
        if (child.material.roughness !== undefined) {
          child.material.roughness = this.materialPatina;
        }

        // Arcane tint
        if (this.arcaneTint === 'ruby') {
          child.material.color = new THREE.Color(0xff4455);
        } else if (this.arcaneTint === 'gold') {
          child.material.color = new THREE.Color(0xffd700);
        } else if (this.arcaneTint === 'emerald') {
          child.material.color = new THREE.Color(0x34d399);
        } else if (this.arcaneTint === 'astral') {
          child.material.color = new THREE.Color(0x60a5fa);
        } else if (this.arcaneTint === 'void') {
          child.material.color = new THREE.Color(0x818cf8);
        } else if (child.userData.origMaterial && child.userData.origMaterial.color) {
          child.material.color = child.userData.origMaterial.color.clone();
        }
      }
    });
  }

  toggleWireframe(enabled) {
    this.isWireframe = enabled;
    this.applyMaterialTweaks();
  }

  setPatina(value) {
    this.materialPatina = parseFloat(value);
    this.applyMaterialTweaks();
  }

  setArcaneTint(tintName) {
    this.arcaneTint = tintName;
    this.applyMaterialTweaks();
  }

  resetView() {
    if (!this.currentModel) return;
    const box = new THREE.Box3().setFromObject(this.currentModel);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraZ = Math.max(Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.55, 1.2);

    this.camera.position.set(cameraZ * 0.8, cameraZ * 0.45, cameraZ * 1.05);
    this.controls.target.set(0, (size.y * 0.35) - 0.3, 0);
    this.controls.update();
  }

  captureDaguerreotype() {
    // Render current scene
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Create styled vintage snapshot canvas
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 1080;
    snapCanvas.height = 1080;
    const ctx = snapCanvas.getContext('2d');

    // Vintage parchment border
    ctx.fillStyle = '#1c1613';
    ctx.fillRect(0, 0, 1080, 1080);

    const img = new Image();
    img.onload = () => {
      // Draw 3D render inside border
      ctx.drawImage(img, 60, 60, 960, 840);

      // Ornate inner gold border
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 50, 980, 980);

      ctx.strokeStyle = '#8c6d3b';
      ctx.lineWidth = 1;
      ctx.strokeRect(56, 56, 968, 968);

      // Antique label bottom plaque
      ctx.fillStyle = '#2a1f1a';
      ctx.fillRect(80, 920, 920, 80);
      ctx.strokeRect(80, 920, 920, 80);

      ctx.font = 'bold 28px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#e5c158';
      ctx.textAlign = 'center';
      const title = this.currentModelData ? this.currentModelData.title : 'Ancient Relic';
      ctx.fillText(title.toUpperCase(), 540, 955);

      ctx.font = 'italic 16px "Cormorant Garamond", serif';
      ctx.fillStyle = '#b8a07c';
      const sub = this.currentModelData ? this.currentModelData.subtitle : 'Chronicles of Eldoria';
      ctx.fillText(sub, 540, 982);

      // Download snapshot
      const link = document.createElement('a');
      link.download = `relic-${this.currentModelData ? this.currentModelData.id : 'snapshot'}.png`;
      link.href = snapCanvas.toDataURL('image/png');
      link.click();
    };
    img.src = dataUrl;
  }

  onWindowResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.reqId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Controls update
    this.controls.update();

    // Auto rotate model
    if (this.isRotating && this.currentModel) {
      this.currentModel.rotation.y += this.rotationSpeed;
    }

    // Gentle candle flicker on point lights
    if (this.currentLightingPreset === 'hearth') {
      const flicker1 = Math.sin(elapsedTime * 6.0) * 0.15 + Math.cos(elapsedTime * 13.0) * 0.1;
      const flicker2 = Math.cos(elapsedTime * 5.0) * 0.12 + Math.sin(elapsedTime * 17.0) * 0.08;
      this.hearthLight1.intensity = 2.4 + flicker1;
      this.hearthLight2.intensity = 1.7 + flicker2;
    }

    // Drift ember particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += delta * 0.25; // drift upward
        positions[i] += Math.sin(elapsedTime + i) * 0.002;
        if (positions[i + 1] > 2.8) {
          positions[i + 1] = -0.5;
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.reqId) cancelAnimationFrame(this.reqId);
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
