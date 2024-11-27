//
// 応用プログラミング 第9,10回 自由課題 (ap0901.js)
// G284092022 五十嵐健翔
//
"use strict"; // 厳格モード

// ライブラリをモジュールとして読み込む
import * as THREE from "three";
import { OrbitControls } from 'three/addons';
import { GUI } from "ili-gui";
export const origin = new THREE.Vector3();

// ３Ｄページ作成関数の定義
function init() {
  // 制御変数の定義
  const param = {
    axes: true, // 座標軸
  };

  // GUIコントローラの設定
  const gui = new GUI();
  gui.add(param, "axes").name("座標軸");

  // シーン作成
  const scene = new THREE.Scene();

  // 座標軸の設定
  const axes = new THREE.AxesHelper(18);
  scene.add(axes);

    // 球の作成
  const seg = 12; // 円や円柱の分割数
  const r = 10; //半径
  const Earth = new THREE.Group();
  {
    const sphereGeometry = new THREE.SphereGeometry(r,seg*2,seg*2);
    const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x008040 });
    const sphere = new THREE.Mesh(sphereGeometry,sphereMaterial);
    Earth.add(sphere);
    
    const w = 1;
    let h = 5;
    const d = 1;
    for(let i = 0;i<Math.PI;i+=0.5){
      for(let theta=0;theta<2*Math.PI;theta+=0.3){
        h+=0.01;
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(w,h,d),
          new THREE.MeshLambertMaterial({
            color:0x408080
          })
        );
        //theta=(theta+0.01)%(2*Math.PI)
        building.position.set(
          r*Math.sin(theta),
          r*Math.cos(theta),
          0//r*Math.sin(i)
        );
        building.rotation.z=-(theta)%(2*Math.PI);
        //building.rotation.x=-i%(2*Math.PI);
        //building.rotation.y=i%(2*Math.PI);
        Earth.add(building);  
      }
    }
  }
  
  scene.add(Earth);
  // ロボット作成
  const Robot = new THREE.Group()
  const metalMaterial = new THREE.MeshPhongMaterial(
    {color: 0x707777, shininess: 60, specular: 0x222222 });
  const redMaterial = new THREE.MeshBasicMaterial({color: 0xc00000});
  const legRad = 0.5; // 脚の円柱の半径
  const legLen = 2; // 脚の円柱の長さ
  const legSep = 1.2; // 脚の間隔
  const bodyW = 2.5; // 胴体の幅
  const bodyH = 2; // 胴体の高さ
  const bodyD = 2; // 胴体の奥行
  const armRad = 0.4; // 腕の円柱の半径
  const armLen = 2.4; // 腕の円柱の長さ
  const headside = 1;//頭の辺の長さ
  const legGeometry
  = new THREE.CylinderGeometry(legRad, legRad, legLen, seg, seg);
  const legR = new THREE.Mesh(legGeometry, metalMaterial);
  legR.position.set(-legSep/2, legLen/2, 0);
  Robot.add(legR);
  const legL = legR.clone();
  legL.position.set(legSep/2, legLen/2, 0);
  Robot.add(legL);
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(bodyW,bodyH,bodyD),
    metalMaterial
  );
  body.position.y=legLen+bodyH/2;
  Robot.add(body);
  const armGeometry
  = new THREE.CylinderGeometry(armRad, armRad, armLen, seg, seg);
  const armR = new THREE.Mesh(armGeometry,metalMaterial);
  armR.position.set(-(armRad+bodyW/2),legLen+bodyH-armLen/2,0)
  Robot.add(armR);
  const armL = armR.clone();
  armL.position.set((armRad+bodyW/2),legLen+bodyH-armLen/2,0)
  Robot.add(armL);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(headside,headside,headside),
    metalMaterial
  );
  head.position.y=legLen+bodyH+headside/2;
  Robot.add(head);

  Robot.position.z=3;

  scene.add(Robot);

  // カメラの作成
  const camera = new THREE.PerspectiveCamera(
    50, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(10,20,30);
  camera.lookAt(0,0,0);

  // レンダラの設定
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, innerHeight);
    document.getElementById("output").appendChild(renderer.domElement);
    renderer.setClearColor(0x406080);
  
  // カメラコントロール
  const orbitControls = new OrbitControls(camera, renderer.domElement);
  // 描画処理

  // 光源の作成
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(3, 6, 8);
  light.castShadow = true;
  scene.add(light);
  
  let thetaRobo = 0;
  // 描画関数
  const RoboPosition = new THREE.Vector3();
  function render() {
    thetaRobo = (thetaRobo+0.01)%(2*Math.PI);
    Robot.position.z=r*Math.cos(thetaRobo);
    Robot.position.x=r*Math.cos(thetaRobo);
    Robot.position.y=-r*Math.sin(thetaRobo);
    Robot.rotation.x=(thetaRobo+1.5)%(2*Math.PI);
    
    // カメラ制御の更新
    orbitControls.update();
    // 座標軸の表示
    axes.visible = param.axes;
    // 描画
    renderer.render(scene, camera);
    // 次のフレームでの描画要請
    requestAnimationFrame(render);
  }

  // 描画開始
  render();
}

init();