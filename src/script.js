// ===============================
// パラメータ (Shared State)
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

// Helper to trigger redraw
function requestDraw() {
  const wrapper = document.querySelector("canvas-wrapper");
  if (wrapper && wrapper.draw) {
    wrapper.draw();
  }
}

// ===============================
// Web Component: CanvasWrapper
class CanvasWrapper extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.startOffsetX = 0;
    this.startOffsetY = 0;
  }

  connectedCallback() {
    this.render();
    this.canvas = this.shadowRoot.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.setupEventListeners();
    this.draw();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100%;
        }
        canvas {
          border: 1px solid black;
          cursor: grab;
          display: block;
          background: white;
        }
      </style>
      <canvas id="canvas" width="600" height="300"></canvas>
    `;
  }

  setupEventListeners() {
    const canvas = this.canvas;

    canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startOffsetX = params.offsetX;
      this.startOffsetY = params.offsetY;
      canvas.style.cursor = "grabbing";
    });

    canvas.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      params.offsetX = this.startOffsetX + (e.clientX - this.startX);
      params.offsetY = this.startOffsetY + (e.clientY - this.startY);
      this.updatePanelInputs();
      this.draw();
    });

    canvas.addEventListener("mouseup", () => {
      this.isDragging = false;
      canvas.style.cursor = "grab";
    });
    canvas.addEventListener("mouseleave", () => {
      this.isDragging = false;
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
      this.updatePanelInputs();
      this.draw();
    });
  }

  updatePanelInputs() {
    const panel = document.getElementById("panel");
    if (panel && panel.updateInputs) {
      panel.updateInputs();
    }
  }

  draw() {
    if (!this.ctx) return;
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.drawGrid();
    this.drawAxes();
    this.drawLine((x) => 0, "red");
    if (params.showA) this.drawLine((x) => params.A, "orange");
    if (params.showB) this.drawLine((x) => (x - params.B) / 5, "green");
    this.drawLine((x) => x / 5, "blue");
    if (params.showC)
      this.drawVerticalLine((params.X - params.C) / 2, "purple");
    if (params.showC1) this.drawVerticalLine(params.X / 2, "magenta");
    this.drawIntersections();
  }

  drawGrid() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    const pxStartX = -50;
    const pxEndX = width + 50;
    const worldXStart = Math.ceil((pxStartX - params.offsetX) / zoom);
    const worldXEnd = Math.floor((pxEndX - params.offsetX) / zoom);
    ctx.beginPath();
    for (let wx = worldXStart; wx <= worldXEnd; wx++) {
      const px = Math.round(params.offsetX + wx * zoom) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
    }
    ctx.stroke();

    const pyStartY = -50;
    const pyEndY = height + 50;
    const worldYStart = Math.ceil((params.offsetY - pyEndY) / zoom);
    const worldYEnd = Math.floor((params.offsetY - pyStartY) / zoom);
    ctx.beginPath();
    for (let wy = worldYStart; wy <= worldYEnd; wy++) {
      const py = Math.round(params.offsetY - wy * zoom) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
    }
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";

    // x labels
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const approxLabelWidth = ctx.measureText("0000").width + 6;
    const xStep = Math.max(1, Math.ceil(approxLabelWidth / zoom));
    let labelY = Math.round(params.offsetY + 2);
    labelY = Math.max(2, Math.min(height - 12, labelY));
    const xLabelStart =
      Math.ceil((pxStartX - params.offsetX) / zoom / xStep) * xStep;
    const xLabelEnd =
      Math.floor((pxEndX - params.offsetX) / zoom / xStep) * xStep;
    for (let x = xLabelStart; x <= xLabelEnd; x += xStep) {
      const px = Math.round(params.offsetX + x * zoom);
      if (px >= -50 && px <= width + 50) ctx.fillText(x, px, labelY);
    }

    // y labels
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const yStep = Math.max(1, Math.ceil((12 + 4) / zoom));
    const axisProposedX = Math.round(params.offsetX - 4);
    const padding = 4;
    const yLabelStart =
      Math.ceil((params.offsetY - pyEndY) / zoom / yStep) * yStep;
    const yLabelEnd =
      Math.floor((params.offsetY - pyStartY) / zoom / yStep) * yStep;
    for (let y = yLabelStart; y <= yLabelEnd; y += yStep) {
      const py = Math.round(params.offsetY - y * zoom);
      if (py >= -50 && py <= height + 50) {
        const txt = String(y);
        const w = ctx.measureText(txt).width;
        const drawX = Math.min(
          Math.max(axisProposedX, Math.ceil(w) + padding),
          width - padding
        );
        ctx.fillText(txt, drawX, py);
      }
    }
  }

  drawAxes() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, params.offsetY);
    ctx.lineTo(width, params.offsetY);
    ctx.moveTo(params.offsetX, 0);
    ctx.lineTo(params.offsetX, height);
    ctx.stroke();
  }

  drawLine(f, color = "red") {
    const ctx = this.ctx;
    const { width } = this.canvas;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const step = Math.max(1, Math.round(1 / Math.max(zoom, 0.0001)));
    let started = false;
    for (let px = 0; px <= width; px += step) {
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

  drawVerticalLine(x, color = "blue") {
    const ctx = this.ctx;
    const { height } = this.canvas;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const px = params.offsetX + x * zoom;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
  }

  drawIntersections() {
    const ctx = this.ctx;
    const { width } = this.canvas;
    const lines = [
      { type: "y", f: (x) => 0, show: true, name: "a0" },
      { type: "y", f: (x) => params.A, show: params.showA, name: "a1" },
      {
        type: "y",
        f: (x) => (x - params.B) / 5,
        show: params.showB,
        name: "b0",
      },
      { type: "y", f: (x) => x / 5, show: true, name: "b1" },
      {
        type: "x",
        x: (params.X - params.C) / 2,
        show: params.showC,
        name: "c0",
      },
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
          const xMin = Math.floor(-params.offsetX / zoom);
          const xMax = Math.ceil((width - params.offsetX) / zoom);
          let found = false;
          const step = 0.5;
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
        else if (
          (l1.name === "a1" && l2.name === "c1") ||
          (l1.name === "c1" && l2.name === "a1")
        )
          label = "ξ";
        if (label) ctx.fillText(label, px + 10, py - 10);
      }
    }

    const resultText =
      alpha && delta
        ? `解集合の格子の個数=${Math.round((alpha.x + 1) * (delta.y + 1))}`
        : "解集合の格子の個数= -";

    const panel = document.getElementById("panel");
    if (panel && panel.updateResult) {
      panel.updateResult(resultText);
    }
  }
}

customElements.define("canvas-wrapper", CanvasWrapper);

// ===============================
// Web Component: ControlPanel
class ControlPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.updateInputs();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 10px;
          left: 10px;
          z-index: 9999;
          background: rgba(255, 255, 255, 0.95);
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          font-family: sans-serif;
          display: block;
        }
        label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        input[type="number"] {
          width: 56px;
        }
        input[type="checkbox"] {
          margin-left: 6px;
        }
        #guiContent {
          display: block;
        }
      </style>
      <button id="toggleGui">pannel</button>
      <div id="guiContent">
        <div>
          <label>A <input type="checkbox" id="chkA" checked /></label>
          <input type="range" id="rangeA" min="0" max="50" value="25" />
          <input type="number" id="numA" min="0" max="50" value="25" />
        </div>
        <div>
          <label>B <input type="checkbox" id="chkB" checked /></label>
          <input type="range" id="rangeB" min="0" max="50" value="40" />
          <input type="number" id="numB" min="0" max="50" value="40" />
        </div>
        <div>
          <label>C <input type="checkbox" id="chkC" checked /></label>
          <input type="range" id="rangeC" min="0" max="50" value="50" />
          <input type="number" id="numC" min="0" max="50" value="50" />
        </div>
        <div>
          <label>X <input type="checkbox" id="chkX" checked /></label>
          <input type="range" id="rangeX" min="1" max="150" value="120" />
          <input type="number" id="numX" min="1" max="150" value="120" />
        </div>
        <div>
          Zoom(%):
          <input type="number" id="zoomInput" value="870" min="10" max="1000" />
        </div>
        <div>OffsetX: <input type="number" id="offsetXInput" value="86" /></div>
        <div>
          OffsetY: <input type="number" id="offsetYInput" value="249" />
        </div>
        <div id="calcResult" style="margin-top: 10px; font-weight: bold"></div>
      </div>
    `;
  }

  setupEventListeners() {
    const shadow = this.shadowRoot;

    // Toggle GUI
    shadow.getElementById("toggleGui").addEventListener("click", () => {
      const content = shadow.getElementById("guiContent");
      content.style.display =
        content.style.display === "none" ? "block" : "none";
    });

    // Bind Sliders & Numbers
    const bindSliderNumber = (rangeId, numId, param) => {
      const range = shadow.getElementById(rangeId);
      const num = shadow.getElementById(numId);

      range.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        params[param] = val;
        num.value = val;
        requestDraw();
      });
      num.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        params[param] = val;
        range.value = val;
        requestDraw();
      });
    };

    bindSliderNumber("rangeA", "numA", "A");
    bindSliderNumber("rangeB", "numB", "B");
    bindSliderNumber("rangeC", "numC", "C");
    bindSliderNumber("rangeX", "numX", "X");

    // Checkboxes
    shadow.getElementById("chkA").addEventListener("change", (e) => {
      params.showA = e.target.checked;
      requestDraw();
    });
    shadow.getElementById("chkB").addEventListener("change", (e) => {
      params.showB = e.target.checked;
      requestDraw();
    });
    shadow.getElementById("chkC").addEventListener("change", (e) => {
      params.showC = e.target.checked;
      requestDraw();
    });
    shadow.getElementById("chkX").addEventListener("change", (e) => {
      params.showC1 = e.target.checked;
      requestDraw();
    });

    // Other Inputs
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
      const el = shadow.getElementById(id);
      if (el) {
        el.addEventListener("input", (e) => {
          inputHandlers[id](e.target.value);
          requestDraw();
        });
      }
    });
  }

  updateInputs() {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    const zoomInput = shadow.getElementById("zoomInput");
    const offsetXInput = shadow.getElementById("offsetXInput");
    const offsetYInput = shadow.getElementById("offsetYInput");

    if (zoomInput) zoomInput.value = params.zoomPercent;
    if (offsetXInput) offsetXInput.value = Math.round(params.offsetX);
    if (offsetYInput) offsetYInput.value = Math.round(params.offsetY);
  }

  updateResult(text) {
    const el = this.shadowRoot.getElementById("calcResult");
    if (el) el.textContent = text;
  }
}

customElements.define("control-panel", ControlPanel);

// Initial draw is handled by CanvasWrapper connectedCallback
