let handPose;
let video;
let hands = [];
let orbitAngles = { x: 0, y: 0 };
let prevThumb = null;

let v = [];
let cols = 360, rows = 20;
let t_D = (180 * 15) / cols;
let r_D = 1 / rows;

let sliders = {};

function preload() {
  handPose = ml5.handPose();
}

function setup() {
  let p = select('#canvas-parent');
  let canvas = createCanvas(p.width, p.height, WEBGL);
  canvas.parent('canvas-parent');
  
  colorMode(HSB);
  angleMode(DEGREES);

  // Initialize Video with a callback
  video = createCapture(VIDEO, function(stream) {
    console.log("Camera Stream Started");
    select('#cam-status').hide(); // Hide the "waiting" text
  });
  
  video.size(640, 480);
  
  // Attach video to the bento box
  video.parent('camera-container');

  handPose.detectStart(video, gotHands);
  
  initUI();
}

function draw() {
  background(10);

  // Interaction Logic
  if (hands.length > 0) {
    let hand = hands[0];
    let thumb = hand.keypoints[4];
    let wrist = hand.keypoints[0];
    let index = hand.keypoints[8];

    // 1. Rotation Logic (Thumb movement)
    if (thumb && prevThumb) {
      orbitAngles.y -= (thumb.x - prevThumb.x) * 0.2;
      orbitAngles.x += (thumb.y - prevThumb.y) * 0.2;
    }
    prevThumb = thumb ? {x: thumb.x, y: thumb.y} : null;

    // 2. Bloom Logic (Distance between wrist and index)
    let d = dist(wrist.x, wrist.y, index.x, index.y);
    if (d > 150) {
      updateSliders(2.3, 7.7, 3.6, 2.3, 0.7); // Open
    } else {
      updateSliders(10, 4.4, 2.45, -3.2, 1.5); // Closed
    }
  }

  // Render Lotus
  rotateX(orbitAngles.x - 45);
  rotateY(orbitAngles.y);
  
  scale(min(width, height) / 900);
  renderFlower();
}

function updateSliders(o, d, a, c1, c2) {
  sliders.opening.value(lerp(sliders.opening.value(), o, 0.1));
  sliders.density.value(lerp(sliders.density.value(), d, 0.1));
  sliders.align.value(lerp(sliders.align.value(), a, 0.1));
  sliders.c1.value(lerp(sliders.c1.value(), c1, 0.1));
  sliders.c2.value(lerp(sliders.c2.value(), c2, 0.1));
}

function renderFlower() {
  v = [];
  let openVal = sliders.opening.value();
  let densVal = sliders.density.value();
  let aligVal = sliders.align.value();
  let c1Val = sliders.c1.value();
  let c2Val = sliders.c2.value();

  for (let r = 0; r <= rows; r++) {
    let row = [];
    for (let theta = 0; theta <= cols; theta++) {
      let phi = (180 / openVal) * Math.exp(-theta * t_D / (densVal * 180));
      let petalCut = 0.5 + abs(sin(aligVal * theta * t_D)) / 2;
      let hangDown = c1Val * pow(r * r_D, 2) * pow(c2Val * r * r_D - 1, 2) * sin(phi);

      let pX = 300 * petalCut * (r * r_D * sin(phi) + hangDown * cos(phi)) * sin(theta * t_D);
      let pY = -300 * petalCut * (r * r_D * cos(phi) - hangDown * sin(phi));
      let pZ = 300 * petalCut * (r * r_D * sin(phi) + hangDown * cos(phi)) * cos(theta * t_D);
      row.push(createVector(pX, pY, pZ));
    }
    v.push(row);
  }

  for (let r = 0; r < v.length - 1; r++) {
    for (let theta = 0; theta < v[r].length - 1; theta++) {
      fill(340, map(r, 0, rows, 10, 80), 100);
      noStroke();
      beginShape();
      vertex(v[r][theta].x, v[r][theta].y, v[r][theta].z);
      vertex(v[r + 1][theta].x, v[r + 1][theta].y, v[r + 1][theta].z);
      vertex(v[r + 1][theta + 1].x, v[r + 1][theta + 1].y, v[r + 1][theta + 1].z);
      vertex(v[r][theta + 1].x, v[r][theta + 1].y, v[r][theta + 1].z);
      endShape(CLOSE);
    }
  }
}

function gotHands(results) { hands = results; }

function initUI() {
  let ui = select('#controls-overlay');
  const createS = (lab, min, max, val, step) => {
    createDiv(lab).parent(ui).class('valLab');
    let s = createSlider(min, max, val, step).parent(ui).class('Slider');
    return s;
  };
  sliders.opening = createS('Bloom', 1, 10, 10, 0.1);
  sliders.density = createS('Density', 1, 20, 4.4, 0.1);
  sliders.align = createS('Align', 0, 6, 2.45, 0.05);
  sliders.c1 = createS('Curve A', -6, 6, -3.2, 0.1);
  sliders.c2 = createS('Curve B', 0.5, 1.5, 1.5, 0.1);
}

function windowResized() {
  let p = select('#canvas-parent');
  resizeCanvas(p.width, p.height);
}