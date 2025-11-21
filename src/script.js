// ===============================
// canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// ===============================
// パラメータ
const params = {
  A: 4,
  B: 10,
  C: 50,
  X: 64,
  zoomPercent: 1360,
  offsetX: 75,
  offsetY: 285,
  showA: true,
  showB: true,
  showC: true,
  showC1: true,
};
let zoom = params.zoomPercent / 100;

// ===============================
// canvas 操作: ドラッグ & ズーム
let isDragging = false,
  startX = 0,
  startY = 0,
  startOffsetX = 0,
  startOffsetY = 0;

canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  startOffsetX = params.offsetX;
  startOffsetY = params.offsetY;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  params.offsetX = startOffsetX + (e.clientX - startX);
  params.offsetY = startOffsetY + (e.clientY - startY);
  updateInputs();
  draw();
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  canvas.style.cursor = "grab";
});
canvas.addEventListener("mouseleave", () => {
  isDragging = false;
  canvas.style.cursor = "grab";
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const mx = e.offsetX,
    my = e.offsetY;
  params.offsetX = mx - (mx - params.offsetX) * factor;
  params.offsetY = my - (my - params.offsetY) * factor;
  zoom *= factor;
  params.zoomPercent = Math.round(zoom * 100);
  updateInputs();
  draw();
});

// ===============================
// 描画関数
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  // 座標範囲
  const xMin = Math.floor(-params.offsetX / zoom);
  const xMax = Math.ceil((canvas.width - params.offsetX) / zoom);
  const yMin = Math.floor(-params.offsetY / zoom);
  const yMax = Math.ceil((canvas.height - params.offsetY) / zoom);

  ctx.beginPath();

  // 縦線（x方向グリッド）
  for (let x = xMin; x <= xMax; x++) {
    const px = params.offsetX + x * zoom;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvas.height);
  }

  // 横線（y方向グリッド）
  for (let y = yMin; y <= yMax; y++) {
    const py = params.offsetY - y * zoom;
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
  }

  ctx.stroke();
  ctx.setLineDash([]);

  // ======================
  // ラベル描画
  ctx.fillStyle = "black";
  ctx.font = "12px sans-serif";

  // xラベル
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const xStep = Math.max(
    1,
    Math.ceil((ctx.measureText("0000").width + 6) / zoom)
  );
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    const px = params.offsetX + x * zoom;
    ctx.fillText(x, px, params.offsetY + 2);
  }

  // yラベル
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const yStep = Math.max(1, Math.ceil((12 + 4) / zoom));
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    const py = params.offsetY - y * zoom;
    if (py >= 0 && py <= canvas.height) ctx.fillText(y, params.offsetX - 2, py);
  }
}

function drawAxes() {
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, params.offsetY);
  ctx.lineTo(canvas.width, params.offsetY);
  ctx.moveTo(params.offsetX, 0);
  ctx.lineTo(params.offsetX, canvas.height);
  ctx.stroke();
}

function drawLine(f, color = "red") {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let px = 0, started = false; px <= canvas.width; px++) {
    const x = (px - params.offsetX) / zoom,
      y = f(x),
      py = params.offsetY - y * zoom;
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawVerticalLine(x, color = "blue") {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const px = params.offsetX + x * zoom;
  ctx.beginPath();
  ctx.moveTo(px, 0);
  ctx.lineTo(px, canvas.height);
  ctx.stroke();
}

// ===============================
// 交点と解の計算
function drawIntersections() {
  const lines = [
    { type: "y", f: (x) => 0, show: true, name: "a0" },
    { type: "y", f: (x) => params.A, show: params.showA, name: "a1" },
    { type: "y", f: (x) => (x - params.B) / 5, show: params.showB, name: "b0" },
    { type: "y", f: (x) => x / 5, show: true, name: "b1" },
    { type: "x", x: (params.X - params.C) / 2, show: params.showC, name: "c0" },
    { type: "x", x: params.X / 2, show: params.showC1, name: "c1" },
  ];
  let alpha = null,
    delta = null;
  ctx.fillStyle = "black";
  ctx.font = "12px sans-serif";

  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const l1 = lines[i],
        l2 = lines[j];
      if (!l1.show || !l2.show) continue;
      let x, y;
      if (l1.type === "y" && l2.type === "y") {
        let found = false;
        for (let xi = -1000; xi <= 1000; xi += 0.1) {
          if (Math.abs(l1.f(xi) - l2.f(xi)) < 1e-6) {
            x = xi;
            y = l1.f(xi);
            found = true;
            break;
          }
        }
        if (!found) continue;
      } else if (l1.type === "y" && l2.type === "x") {
        x = l2.x;
        y = l1.f(x);
      } else if (l1.type === "x" && l2.type === "y") {
        x = l1.x;
        y = l2.f(x);
      } else continue;
      const px = params.offsetX + x * zoom,
        py = params.offsetY - y * zoom;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
      ctx.fill();
      let label = "";
      if (
        (l1.name === "a0" && l2.name === "b1") ||
        (l1.name === "b1" && l2.name === "a0")
      )
        label = "γ";
      else if (
        (l1.name === "a0" && l2.name === "b0") ||
        (l1.name === "b0" && l2.name === "a0")
      ) {
        label = "α";
        alpha = { x, y };
      } else if (
        (l1.name === "a1" && l2.name === "b1") ||
        (l1.name === "b1" && l2.name === "a1")
      ) {
        label = "δ";
        delta = { x, y };
      } else if (
        (l1.name === "a1" && l2.name === "b0") ||
        (l1.name === "b0" && l2.name === "a1")
      )
        label = "β";
      if (label) ctx.fillText(label, px + 10, py - 10);
    }
  }

  document.getElementById("calcResult").textContent =
    alpha && delta
      ? `解集合の格子の個数=${Math.round((alpha.x + 1) * (delta.y + 1))}`
      : "解集合の格子の個数= -";
}

// ===============================
// 描画まとめ
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawAxes();
  drawLine((x) => 0, "red");
  if (params.showA) drawLine((x) => params.A, "orange");
  if (params.showB) drawLine((x) => (x - params.B) / 5, "green");
  drawLine((x) => x / 5, "blue");
  if (params.showC) drawVerticalLine((params.X - params.C) / 2, "purple");
  if (params.showC1) drawVerticalLine(params.X / 2, "magenta");
  drawIntersections();
}

// ===============================
// GUI 入力連動
function bindSliderNumber(rangeId, numId, param) {
  const range = document.getElementById(rangeId),
    num = document.getElementById(numId);
  range.addEventListener("input", (e) => {
    params[param] = Number(e.target.value);
    num.value = e.target.value;
    draw();
  });
  num.addEventListener("input", (e) => {
    let v = Number(e.target.value);
    params[param] = v;
    range.value = v;
    draw();
  });
}
bindSliderNumber("rangeA", "numA", "A");
bindSliderNumber("rangeB", "numB", "B");
bindSliderNumber("rangeC", "numC", "C");
bindSliderNumber("rangeX", "numX", "X");

document.getElementById("chkA").addEventListener("change", (e) => {
  params.showA = e.target.checked;
  draw();
});
document.getElementById("chkB").addEventListener("change", (e) => {
  params.showB = e.target.checked;
  draw();
});
document.getElementById("chkC").addEventListener("change", (e) => {
  params.showC = e.target.checked;
  draw();
});
document.getElementById("chkX").addEventListener("change", (e) => {
  params.showC1 = e.target.checked;
  draw();
});

["zoomInput", "offsetXInput", "offsetYInput"].forEach((id) => {
  document.getElementById(id).addEventListener("input", (e) => {
    if (id === "zoomInput") {
      zoom = Number(e.target.value) / 100;
      params.zoomPercent = Number(e.target.value);
    } else if (id === "offsetXInput") params.offsetX = Number(e.target.value);
    else params.offsetY = Number(e.target.value);
    draw();
  });
});

// GUI表示/非表示
document.getElementById("toggleGui").addEventListener("click", () => {
  const content = document.getElementById("guiContent");
  content.style.display = content.style.display === "none" ? "block" : "none";
});

// 初期描画
function updateInputs() {
  document.getElementById("zoomInput").value = params.zoomPercent;
  document.getElementById("offsetXInput").value = Math.round(params.offsetX);
  document.getElementById("offsetYInput").value = Math.round(params.offsetY);
}
updateInputs();
draw();
