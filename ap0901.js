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
    axes: false, // 座標軸
    Earth: true, //地球
    follow:false,//追跡
    course:false //コース
    
  };

  // GUIコントローラの設定
  const gui = new GUI();
  gui.add(param, "axes").name("座標軸");
  gui.add(param,"Earth").name("地球");
  gui.add(param,"follow").name("追跡");
  gui.add(param,"course").name("コース");

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
    const buildings = new THREE.Group();
    {
      for(let i = 0;i<Math.PI;i+=0.5){
        for(let theta=0;theta<2*Math.PI;theta+=0.5){
          h+=0.01;
          const building = new THREE.Mesh(
            new THREE.BoxGeometry(w,h,d),
            new THREE.MeshLambertMaterial({
              color:0x408080
            })
          );
          //theta=(theta+0.01)%(2*Math.PI)
          building.position.set(
            r*Math.sin(theta+i),
            r*Math.cos(theta+i),
            r*Math.sin(i)-5
          );
          building.rotation.z=-(theta+i)%(2*Math.PI);
          //building.rotation.x=-i%(2*Math.PI);
          //building.rotation.y=i%(2*Math.PI);
          // building.geometry.computeBoundingBox();
          buildings.add(building); 
        }
      }
      Earth.add(buildings);
    }
  }
  
  
  scene.add(Earth);

  // 自動操縦コースの設定
  // 制御点
  //r=10
  const cr = r+2.0;
  const controlPoints = [
    [0, cr, 0],
    [0, Math.sqrt(cr*cr-8*8), 8],
    [8, Math.sqrt(cr*cr-8*8), 0],
    [5, Math.sqrt(cr*cr-(5*5+4*4)), -4],
    [-5,Math.sqrt(cr*cr-(5*5+4*4)) , -4],
    [-7, 0, Math.sqrt(cr*cr-7*7)],
    [6, -3, Math.sqrt(cr*cr-3*3-6*6)],
    [8, -4, Math.sqrt(cr*cr-(8*8+4*4))],
    [-5, 0, Math.sqrt(cr*cr-5*5)],
  ]
  const p0 = new THREE.Vector3();//p0,p1を用意
  const p1 = new THREE.Vector3();
  const course = new THREE.CatmullRomCurve3(
    controlPoints.map((p,i)=>{
      p0.set(...p);//制御点の配列からp0を取り出す
      p1.set(...controlPoints[(i+1)%controlPoints.length]);//p0の次の点をp1に指定
      return [
        (new THREE.Vector3()).copy(p0),
        (new THREE.Vector3()).lerpVectors(p0,p1,1/3),
        (new THREE.Vector3()).lerpVectors(p0,p1,2/3),//p0とp1の間の1/3と2/3を計算
      ];
    }).flat(),true
  );
  // コースの描画
  const points = course.getPoints(300);
  const courseObject = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({color:"red"})
  );
  scene.add(courseObject);


  // ロボット作成
  const Robot = new THREE.Group();
  const metalMaterial = new THREE.MeshPhongMaterial(
    {color: 0x707777, shininess: 60, specular: 0x222222 });
  
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
  //body.geometry.computeBoundingRobot();
  Robot.position.z=3;
  
  scene.add(Robot);

  //ビルの衝突
  // function breakCheck(){
  //   let hit = false;
  //   const box = Robot.geometry.boundingRobot.clone();
  //   box.translate(Robot.position);
  //   buildings.children.forEach((building) =>{
  //     if(!hit && building.visible){
  //       let bill = building.geometry.boundingBox.clone();
  //       box.translate(buildings.position);
  //       box.translate(building.position);
  //       if(bill.intersectsRobot(box)){
  //         hit = true;
  //         building.visible = false;
  //       }
  //     }
  //   });
    
  // }

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
  
  // let thetaRobo1 = 0;
  // let thetaRobo2 = Math.PI/2;
  Robot.position.set(
    0,0,0
  );
  // 描画関数
  const clock = new THREE.Clock();
  const cameraPosition = new THREE.Vector3();
  const roboPosition = new THREE.Vector3();
  const roboTarget = new THREE.Vector3();
  
  function render() {
    const elapsedTime = clock.getElapsedTime()/30;
    course.getPointAt(elapsedTime%1,roboPosition);
    Robot.position.copy(roboPosition);
    course.getPointAt((elapsedTime+0.01)%1,roboTarget);
    Robot.lookAt(roboTarget);

    // thetaRobo1 = (thetaRobo1+0.01)%(2*Math.PI);
    // thetaRobo2 = (thetaRobo2+0.01)%(2*Math.PI);
    // Robot.position.z=r*Math.cos(thetaRobo2);
    // Robot.position.y=-r*Math.sin(thetaRobo2);//*Math.sin(thetaRobo1);
    // Robot.rotation.x=(thetaRobo1+Math.PI)%(2*Math.PI);


    // Robot.position.x=r*Math.cos(thetaRobo2)*Math.cos(thetaRobo1);
    //Robot.rotation.z=(thetaRobo2-1.5)%(2*Math.PI);
    
    
    
    // breakCheck();
    // カメラ制御の更新
    orbitControls.update();
    //カメラ追従
    if(param.follow){
      cameraPosition.lerpVectors(roboTarget,roboPosition,4);
      cameraPosition.y+=legLen+bodyH+headside;
      cameraPosition.z+=3;
      cameraPosition.x-=3;
      camera.position.copy(cameraPosition);
      camera.lookAt(Robot.position);
      camera.up.set(0,1,0);
    }else{
      camera.position.set(10,12,10);//上の方から
      camera.lookAt(Robot.position);
      camera.up.set(0,1,0)//カメラの上をy軸正の向きにする
    }
    // 座標軸の表示
    axes.visible = param.axes;
    //地球表示
    Earth.visible = param.Earth;
    //コース表示
    courseObject.visible = param.course;
    // 描画
    renderer.render(scene, camera);
    // 次のフレームでの描画要請
    requestAnimationFrame(render);
  }

  // 描画開始
  render();
}

init();