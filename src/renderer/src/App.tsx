import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import "./assets/main.css"; // Assuming you might want some global styles

// TODO: Might just be easier to get the glb and animations setup correctly in Blender and export them together so that it's easy to load properly

// Import assets to get their URLs
// import modelAssetUrl from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/source/MIKU VOCALOID RIGGED.glb";
import modelAssetUrl from "./assets/threejs/models/test.glb";

import angryAnimUrl from "./assets/threejs/animations/Angry.fbx";
import fallingAnimUrl from "./assets/threejs/animations/Falling.fbx";
import hipHopAnimUrl from "./assets/threejs/animations/Hip Hop Dancing.fbx";
import jumpAnimUrl from "./assets/threejs/animations/Jump.fbx";
import rumbaAnimUrl from "./assets/threejs/animations/Rumba Dancing.fbx";

// Import texture assets
import texture0_3Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_0_3.png";
import texture1_8Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_1_8.png";
import texture2_4Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_2_4.png";
import texture3_9Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_3_9.png";
import texture4_11Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_4_11.png";
import texture5_6Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_5_6.png";
import texture6_10Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_6_10.png";
import texture7_5Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_7_5.png";
import texture8_12Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_8_12.png";
import texture9_1Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_9_1.png";
import texture10_0Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_10_0.png";
import texture11_13Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_11_13.png";
import texture12_2Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_12_2.png";
import texture13_7Url from "./assets/threejs/models/miku-hatsune-vocaloid-rigged/textures/Image_13_7.png";

// Animation files information
const animationFiles = [
  { name: "Angry", path: angryAnimUrl },
  { name: "Falling", path: fallingAnimUrl },
  {
    name: "Hip Hop Dancing",
    path: hipHopAnimUrl,
  },
  { name: "Jump", path: jumpAnimUrl },
  {
    name: "Rumba Dancing",
    path: rumbaAnimUrl,
  },
];

// const modelPath =
// "./assets/threejs/models/miku-hatsune-vocaloid-rigged/source/MIKU VOCALOID RIGGED.glb";
const modelPath = modelAssetUrl;

function App(): React.JSX.Element {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [animationActions, setAnimationActions] = useState<
    Record<string, THREE.AnimationAction>
  >({});
  const [currentAnimation, setCurrentAnimation] = useState<string>("");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xdddddd); // Removed for transparency

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 3); // Adjusted camera position

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Added alpha: true
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Texture mapping for LoadingManager
    const textureUrlMap: Record<string, string> = {
      "Image_0_3.png": texture0_3Url,
      "Image_1_8.png": texture1_8Url,
      "Image_2_4.png": texture2_4Url,
      "Image_3_9.png": texture3_9Url,
      "Image_4_11.png": texture4_11Url,
      "Image_5_6.png": texture5_6Url,
      "Image_6_10.png": texture6_10Url,
      "Image_7_5.png": texture7_5Url,
      "Image_8_12.png": texture8_12Url,
      "Image_9_1.png": texture9_1Url,
      "Image_10_0.png": texture10_0Url,
      "Image_11_13.png": texture11_13Url,
      "Image_12_2.png": texture12_2Url,
      "Image_13_7.png": texture13_7Url,
    };

    // LoadingManager to handle texture paths
    const loadingManager = new THREE.LoadingManager();
    loadingManager.setURLModifier((url) => {
      console.log("Loading URL for textures?:", url);

      // url will be the original path from the GLTF file, e.g., "textures/Image_0_3.png" or "Image_0_3.png"
      // We need to extract the base filename to match our map.
      const fileName = url.substring(url.lastIndexOf("/") + 1);
      if (textureUrlMap[fileName]) {
        return textureUrlMap[fileName];
      }
      return url;
    });

    // GLTF Loader
    const gltfLoader = new GLTFLoader(loadingManager); // Pass the manager
    gltfLoader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1, 1, 1); // Adjust scale if necessary
        model.position.set(0, 0, 0); // Adjust position if necessary
        scene.add(model);

        // Removed material logging for now

        const newMixer = new THREE.AnimationMixer(model);
        setMixer(newMixer);
        const actions: Record<string, THREE.AnimationAction> = {};

        // FBX Loader for animations
        const fbxLoader = new FBXLoader(loadingManager); // Pass the same manager
        let animationsLoaded = 0;

        animationFiles.forEach((animFile) => {
          fbxLoader.load(
            animFile.path,
            (fbx) => {
              const animationClip = fbx.animations[0];
              if (animationClip) {
                const action = newMixer.clipAction(animationClip);
                actions[animFile.name] = action;
              }
              animationsLoaded++;
              if (animationsLoaded === animationFiles.length) {
                setAnimationActions(actions);
                if (animationFiles.length > 0) {
                  setCurrentAnimation(animationFiles[0].name);
                  actions[animationFiles[0].name]?.play();
                }
              }
            },
            undefined,
            (error) => {
              console.error(`Error loading animation ${animFile.name}:`, error);
            }
          );
        });
      },
      undefined,
      (error) => {
        console.error("Error loading GLB model:", error);
      }
    );

    // Animation loop
    const animate = (): void => {
      requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if (mixer && !isPaused) {
        mixer.update(delta);
      }
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = (): void => {
      if (currentMount) {
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Dispose materials and geometries if necessary
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // CRITICAL: Ensure this effect runs only once on mount

  useEffect(() => {
    if (!mixer || Object.keys(animationActions).length === 0) return;

    Object.values(animationActions).forEach((action) => action.stop());
    const currentAction = animationActions[currentAnimation];
    if (currentAction) {
      currentAction.play();
      if (isPaused) {
        currentAction.paused = true; // Ensure new animation respects pause state
      } else {
        currentAction.paused = false;
      }
    }
  }, [currentAnimation, animationActions, mixer, isPaused]);

  const handleAnimationChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setCurrentAnimation(event.target.value);
  };

  const togglePause = (): void => {
    setIsPaused(!isPaused);
    if (mixer && animationActions[currentAnimation]) {
      const action = animationActions[currentAnimation];
      if (action.isRunning() && !isPaused) {
        // If running and about to pause
        action.paused = true;
      } else {
        // If paused or not running and about to play
        action.paused = false;
        if (!action.isRunning()) {
          // If it wasn't running, play it
          action.play();
        }
      }
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "10px",
          backgroundColor: "transparent",
        }}
      >
        <label htmlFor="animation-select" style={{ marginRight: "10px" }}>
          Choose Animation:
        </label>
        <select
          id="animation-select"
          value={currentAnimation}
          onChange={handleAnimationChange}
          style={{ marginRight: "20px" }}
        >
          {animationFiles.map((anim) => (
            <option key={anim.name} value={anim.name}>
              {anim.name}
            </option>
          ))}
        </select>
        <button onClick={togglePause}>
          {isPaused ? "Resume" : "Pause"} Animation
        </button>
      </div>
      <div
        ref={mountRef}
        style={{
          flexGrow: 1,
          width: "100%",
          height: "calc(100% - 50px)" /* Adjust based on control bar height */,
        }}
      />
    </div>
  );
}

export default App;
