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

  // バッチで縦線を描画（複数の短いパスをまとめて stroke することで高速化）
  const pxStartX = -50;
  const pxEndX = canvas.width + 50;
  const worldXStart = Math.ceil((pxStartX - params.offsetX) / zoom);
  const worldXEnd = Math.floor((pxEndX - params.offsetX) / zoom);
  ctx.beginPath();
  for (let wx = worldXStart; wx <= worldXEnd; wx++) {
    const px = Math.round(params.offsetX + wx * zoom) + 0.5;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvas.height);
  }
  ctx.stroke();

  // 横線をバッチ描画
  const pyStartY = -50;
  const pyEndY = canvas.height + 50;
  const worldYStart = Math.ceil((params.offsetY - pyEndY) / zoom);
  const worldYEnd = Math.floor((params.offsetY - pyStartY) / zoom);
  ctx.beginPath();
  for (let wy = worldYStart; wy <= worldYEnd; wy++) {
    const py = Math.round(params.offsetY - wy * zoom) + 0.5;
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
  }
  ctx.stroke();

  ctx.setLineDash([]);

  // ======================
  // ラベル描画（既存ロジックを維持しつつ、描画範囲を狭める）
  ctx.fillStyle = "black";
  ctx.font = "12px sans-serif";

  // xラベル
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const approxLabelWidth = ctx.measureText("0000").width + 6;
  const xStep = Math.max(1, Math.ceil(approxLabelWidth / zoom));
  let labelY = Math.round(params.offsetY + 2);
  labelY = Math.max(2, Math.min(canvas.height - 12, labelY));
  const xLabelStart =
    Math.ceil((pxStartX - params.offsetX) / zoom / xStep) * xStep;
  const xLabelEnd =
    Math.floor((pxEndX - params.offsetX) / zoom / xStep) * xStep;
  for (let x = xLabelStart; x <= xLabelEnd; x += xStep) {
    const px = Math.round(params.offsetX + x * zoom);
    if (px >= -50 && px <= canvas.width + 50) ctx.fillText(x, px, labelY);
  }

  // yラベル
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const yStep = Math.max(1, Math.ceil((12 + 4) / zoom));
  let labelX = Math.round(params.offsetX - 4);
  labelX = Math.max(4, Math.min(canvas.width - 4, labelX));
  const yLabelStart =
    Math.ceil((params.offsetY - pyEndY) / zoom / yStep) * yStep;
  const yLabelEnd =
    Math.floor((params.offsetY - pyStartY) / zoom / yStep) * yStep;
  for (let y = yLabelStart; y <= yLabelEnd; y += yStep) {
    const py = Math.round(params.offsetY - y * zoom);
    if (py >= -50 && py <= canvas.height + 50) {
      ctx.fillText(y, labelX, py);
    }
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
  // ピクセル単位の全走査は重いので、ズームに合わせて間引き（zoom >=1 -> step=1px, zoom<1 -> step>1）
  const step = Math.max(1, Math.round(1 / Math.max(zoom, 0.0001)));
  let started = false;
  for (let px = 0; px <= canvas.width; px += step) {
    const x = (px - params.offsetX) / zoom;
    const y = f(x);
    const py = params.offsetY - y * zoom;
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
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
        // 表示されている範囲内だけを探索して交点を探す（粗探索）。
        const xMin = Math.floor(-params.offsetX / zoom);
        const xMax = Math.ceil((canvas.width - params.offsetX) / zoom);
        let found = false;
        const step = 0.5; // 十分小さければほとんどの場合見つかる
        for (let xi = xMin; xi <= xMax; xi += step) {
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

// 入力ハンドラをマップ化して明示的に処理する（可読性と堅牢性向上）
const inputHandlers = {
  zoomInput: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    zoom = n / 100;
    params.zoomPercent = n;
  },
  offsetXInput: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    params.offsetX = n;
  },
  offsetYInput: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    params.offsetY = n;
  },
};

Object.keys(inputHandlers).forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", (e) => {
    inputHandlers[id](e.target.value);
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
