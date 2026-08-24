class Basic3d {
  static async run(env) {
    const target = (env && env.container) || document.getElementById("app-root") || document.body;
    target.innerHTML = "";

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%; height:100%; display:block;";
    target.appendChild(canvas);

    let THREE = globalThis.THREE;
    if (!THREE && typeof ThreeJSLoader !== "undefined" && ThreeJSLoader.load) {
      try { THREE = await ThreeJSLoader.load(); } catch(e){}
    }

    if (THREE) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);

      const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const material = new THREE.MeshNormalMaterial({ wireframe: false });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      camera.position.z = 3.5;

      const animate = function() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.015;
        renderer.render(scene, camera);
      };
      animate();

      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    } else {
      // 2D Canvas Fallback
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      let angle = 0;

      function render2D() {
        ctx.fillStyle = "#070a13";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);
        ctx.strokeStyle = "#00f2fe";
        ctx.lineWidth = 3;
        ctx.strokeRect(-60, -60, 120, 120);
        ctx.restore();
        angle += 0.02;
        requestAnimationFrame(render2D);
      }
      render2D();
    }
  }
}

globalThis.Basic3d = Basic3d;
if (typeof module !== "undefined" && module.exports) module.exports = Basic3d;