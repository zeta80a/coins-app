// ===============================
// Web Component: CoinsApp
// ===============================
class CoinsApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Internal State (previously global params)
    this.params = {
      A: 30,
      B: 40,
      C: 50,
      X: 120,
      zoomPercent: 1363,
      offsetX: -315,
      offsetY: 217,
      showA: true,
      showB: true,
      showC: true,
      showC1: true,
    };
    this.zoom = this.params.zoomPercent / 100;

    // Dragging state
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.startOffsetX = 0;
    this.startOffsetY = 0;
  }

  static get CONSTANTS() {
    return {
      SLOPE_DENOMINATOR: 5,
      POINT_RADIUS: 2.5,
      LABEL_OFFSET: 10,
      GRID_MIN_SPACING: 20,
    };
  }

  connectedCallback() {
    this.render();
    this.canvas = this.shadowRoot.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.setupEventListeners();
    this.updateInputs();
    this.draw();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }
        /* Canvas Container */
        #canvas-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: calc(100% - 40px);
        }
        #finalResultContainer {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          padding: 10px;
          background: #f0f0f0;
          border-top: 1px solid #ccc;
        }
        canvas {
          border: 1px solid black;
          cursor: grab;
          display: block;
          background: white;
        }

        /* Panels */
        #mainPanelWrapper {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 9999;
          background: rgba(255, 255, 255, 0.95);
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          font-family: sans-serif;
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
          display: none;
        }
        #resultPanelWrapper {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 9999;
          background: rgba(255, 255, 255, 0.95);
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          font-family: sans-serif;
          display: block;
        }
        #resultContent {
          display: block;
        }
        #ldPanelWrapper {
          position: absolute;
          top: 10px;
          right: 110px;
          z-index: 9999;
          background: rgba(255, 255, 255, 0.95);
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          font-family: sans-serif;
          display: block;
        }
        #ldContent {
          display: block;
        }

        /* Result Items */
        .result-row {
          margin-top: 5px;
          font-weight: bold;
        }
        .result-row-large {
          margin-top: 10px;
          font-weight: bold;
        }
        .result-highlight {
          color: blue;
        }
      </style>

      <!-- Canvas -->
      <div id="canvas-container">
        <canvas id="canvas" width="600" height="300"></canvas>
      </div>
      <div id="finalResultContainer">解の格子の個数 = -</div>

      <!-- Main Control Panel -->
      <div id="mainPanelWrapper">
        <button id="toggleGui">pannel</button>
        <div id="guiContent" style="display: none">
          <div>
            <label>A <input type="checkbox" id="chkA" ${
              this.params.showA ? "checked" : ""
            } /></label>
            <input type="range" id="rangeA" min="0" max="50" value="${
              this.params.A
            }" />
            <input type="number" id="numA" min="0" max="50" value="${
              this.params.A
            }" />
          </div>
          <div>
            <label>B <input type="checkbox" id="chkB" ${
              this.params.showB ? "checked" : ""
            } /></label>
            <input type="range" id="rangeB" min="0" max="50" value="${
              this.params.B
            }" />
            <input type="number" id="numB" min="0" max="50" value="${
              this.params.B
            }" />
          </div>
          <div>
            <label>C <input type="checkbox" id="chkC" ${
              this.params.showC ? "checked" : ""
            } /></label>
            <input type="range" id="rangeC" min="0" max="50" value="${
              this.params.C
            }" />
            <input type="number" id="numC" min="0" max="50" value="${
              this.params.C
            }" />
          </div>
          <div>
            <label>X <input type="checkbox" id="chkX" ${
              this.params.showC1 ? "checked" : ""
            } /></label>
            <input type="range" id="rangeX" min="1" max="150" value="${
              this.params.X
            }" />
            <input type="number" id="numX" min="1" max="150" value="${
              this.params.X
            }" />
          </div>
          <div>
            Zoom(%):
            <input type="number" id="zoomInput" value="${
              this.params.zoomPercent
            }" min="10" max="1000" />
          </div>
          <div>OffsetX: <input type="number" id="offsetXInput" value="${
            this.params.offsetX
          }" /></div>
          <div>
            OffsetY: <input type="number" id="offsetYInput" value="${
              this.params.offsetY
            }" />
          </div>
        </div>
      </div>

      <!-- Result Panel (L_D) -->
      <div id="resultPanelWrapper">
        <button id="toggleResult">L_D</button>
        <div id="resultContent">
          <div id="dResult" class="result-row-large"></div>
          <div id="HDResult" class="result-row"></div>
          <div id="hDResult" class="result-row"></div>
          <div id="calcResult" class="result-row"></div>
          <div id="trapezoidResult" class="result-row"></div>
          <div id="ldResult" class="result-row result-highlight"></div>
        </div>
      </div>

      <!-- L_d Panel -->
      <div id="ldPanelWrapper">
        <button id="toggleLd">L_d</button>
        <div id="ldContent">
          <div id="lowerDResult" class="result-row-large"></div>
          <div id="lowerHdResult" class="result-row"></div>
          <div id="lowerhdResult" class="result-row"></div>
          <div id="lowerPdResult" class="result-row"></div>
          <div id="lowerTdResult" class="result-row"></div>
          <div id="lowerLdResult" class="result-row result-highlight"></div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    this.setupCanvasEvents();
    this.setupUIEvents();
    this.setupInputBindings();
  }

  setupCanvasEvents() {
    const canvas = this.canvas;

    canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startOffsetX = this.params.offsetX;
      this.startOffsetY = this.params.offsetY;
      canvas.style.cursor = "grabbing";
    });

    canvas.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      this.params.offsetX = this.startOffsetX + (e.clientX - this.startX);
      this.params.offsetY = this.startOffsetY + (e.clientY - this.startY);
      this.updateInputs();
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
      this.params.offsetX = mx - (mx - this.params.offsetX) * factor;
      this.params.offsetY = my - (my - this.params.offsetY) * factor;
      this.zoom *= factor;
      this.params.zoomPercent = Math.round(this.zoom * 100);
      this.updateInputs();
      this.draw();
    });
  }

  setupUIEvents() {
    const shadow = this.shadowRoot;

    // Toggle GUI
    shadow.getElementById("toggleGui").addEventListener("click", () => {
      const content = shadow.getElementById("guiContent");
      content.style.display =
        content.style.display === "none" ? "block" : "none";
    });

    // Toggle Result
    shadow.getElementById("toggleResult").addEventListener("click", () => {
      const content = shadow.getElementById("resultContent");
      content.style.display =
        content.style.display === "none" ? "block" : "none";
    });

    // Toggle L_d
    shadow.getElementById("toggleLd").addEventListener("click", () => {
      const content = shadow.getElementById("ldContent");
      content.style.display =
        content.style.display === "none" ? "block" : "none";
    });
  }

  setupInputBindings() {
    const shadow = this.shadowRoot;

    // Bind Sliders & Numbers
    const bindSliderNumber = (rangeId, numId, param) => {
      const range = shadow.getElementById(rangeId);
      const num = shadow.getElementById(numId);

      range.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        this.params[param] = val;
        num.value = val;
        this.draw();
      });
      num.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        this.params[param] = val;
        range.value = val;
        this.draw();
      });
    };

    bindSliderNumber("rangeA", "numA", "A");
    bindSliderNumber("rangeB", "numB", "B");
    bindSliderNumber("rangeC", "numC", "C");
    bindSliderNumber("rangeX", "numX", "X");

    // Checkboxes
    shadow.getElementById("chkA").addEventListener("change", (e) => {
      this.params.showA = e.target.checked;
      this.draw();
    });
    shadow.getElementById("chkB").addEventListener("change", (e) => {
      this.params.showB = e.target.checked;
      this.draw();
    });
    shadow.getElementById("chkC").addEventListener("change", (e) => {
      this.params.showC = e.target.checked;
      this.draw();
    });
    shadow.getElementById("chkX").addEventListener("change", (e) => {
      this.params.showC1 = e.target.checked;
      this.draw();
    });

    // Other Inputs
    const inputHandlers = {
      zoomInput: (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        this.zoom = n / 100;
        this.params.zoomPercent = n;
      },
      offsetXInput: (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        this.params.offsetX = n;
      },
      offsetYInput: (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        this.params.offsetY = n;
      },
    };

    Object.keys(inputHandlers).forEach((id) => {
      const el = shadow.getElementById(id);
      if (el) {
        el.addEventListener("input", (e) => {
          inputHandlers[id](e.target.value);
          this.draw();
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

    if (zoomInput) zoomInput.value = this.params.zoomPercent;
    if (offsetXInput) offsetXInput.value = Math.round(this.params.offsetX);
    if (offsetYInput) offsetYInput.value = Math.round(this.params.offsetY);

    const updateField = (id, val) => {
      const el = shadow.getElementById(id);
      if (el) el.value = val;
    };

    updateField("rangeA", this.params.A);
    updateField("numA", this.params.A);
    updateField("rangeB", this.params.B);
    updateField("numB", this.params.B);
    updateField("rangeC", this.params.C);
    updateField("numC", this.params.C);
    updateField("rangeX", this.params.X);
    updateField("numX", this.params.X);

    const updateCheck = (id, val) => {
      const el = shadow.getElementById(id);
      if (el) el.checked = val;
    };
    updateCheck("chkA", this.params.showA);
    updateCheck("chkB", this.params.showB);
    updateCheck("chkC", this.params.showC);
    updateCheck("chkX", this.params.showC1);
  }

  // --- Drawing Logic ---

  draw() {
    if (!this.ctx) return;
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.drawGrid();
    this.drawAxes();
    this.drawLinearFunction(0, 0, "red"); // y = 0
    if (this.params.showA) this.drawLinearFunction(0, this.params.A, "orange"); // y = A

    const slope = 1 / CoinsApp.CONSTANTS.SLOPE_DENOMINATOR;
    if (this.params.showB)
      this.drawLinearFunction(slope, -this.params.B * slope, "green"); // y = (x - B)/5

    this.drawLinearFunction(slope, 0, "blue"); // y = x/5

    if (this.params.showC)
      this.drawVerticalLine((this.params.X - this.params.C) / 2, "purple");
    if (this.params.showC1) this.drawVerticalLine(this.params.X / 2, "magenta");
    this.drawIntersections();
  }

  drawGrid() {
    this.drawGridLines();
    this.drawAxisLabels();
  }

  drawGridLines() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    const pxStartX = -50;
    const pxEndX = width + 50;

    // Calculate grid step to keep lines at least ~20px apart
    const minPixelSpacing = CoinsApp.CONSTANTS.GRID_MIN_SPACING;
    let gridStep = 1;
    while (gridStep * this.zoom < minPixelSpacing) {
      if (gridStep === 1) gridStep = 2;
      else if (gridStep === 2) gridStep = 5;
      else if (gridStep === 5) gridStep = 10;
      else gridStep += 10; // Simple increment for larger steps, or could use powers of 10
    }

    // Align start to gridStep
    const worldXStart =
      Math.ceil((pxStartX - this.params.offsetX) / this.zoom / gridStep) *
      gridStep;
    const worldXEnd =
      Math.floor((pxEndX - this.params.offsetX) / this.zoom / gridStep) *
      gridStep;

    ctx.beginPath();
    for (let wx = worldXStart; wx <= worldXEnd; wx += gridStep) {
      const px = Math.round(this.params.offsetX + wx * this.zoom) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
    }
    ctx.stroke();

    const pyStartY = -50;
    const pyEndY = height + 50;
    const worldYStart =
      Math.ceil((this.params.offsetY - pyEndY) / this.zoom / gridStep) *
      gridStep;
    const worldYEnd =
      Math.floor((this.params.offsetY - pyStartY) / this.zoom / gridStep) *
      gridStep;

    ctx.beginPath();
    for (let wy = worldYStart; wy <= worldYEnd; wy += gridStep) {
      const py = Math.round(this.params.offsetY - wy * this.zoom) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
    }
    ctx.stroke();

    ctx.setLineDash([]);
  }

  drawAxisLabels() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const pxStartX = -50;
    const pxEndX = width + 50;
    const pyStartY = -50;
    const pyEndY = height + 50;

    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";

    // x labels
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const approxLabelWidth = ctx.measureText("0000").width + 6;
    const xStep = Math.max(1, Math.ceil(approxLabelWidth / this.zoom));
    let labelY = Math.round(this.params.offsetY + 2);
    labelY = Math.max(2, Math.min(height - 12, labelY));
    const xLabelStart =
      Math.ceil((pxStartX - this.params.offsetX) / this.zoom / xStep) * xStep;
    const xLabelEnd =
      Math.floor((pxEndX - this.params.offsetX) / this.zoom / xStep) * xStep;
    for (let x = xLabelStart; x <= xLabelEnd; x += xStep) {
      const px = Math.round(this.params.offsetX + x * this.zoom);
      if (px >= -50 && px <= width + 50) ctx.fillText(x, px, labelY);
    }

    // y labels
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const yStep = Math.max(1, Math.ceil((12 + 4) / this.zoom));
    const axisProposedX = Math.round(this.params.offsetX - 4);
    const padding = 4;
    const yLabelStart =
      Math.ceil((this.params.offsetY - pyEndY) / this.zoom / yStep) * yStep;
    const yLabelEnd =
      Math.floor((this.params.offsetY - pyStartY) / this.zoom / yStep) * yStep;
    for (let y = yLabelStart; y <= yLabelEnd; y += yStep) {
      const py = Math.round(this.params.offsetY - y * this.zoom);
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
    ctx.moveTo(0, this.params.offsetY);
    ctx.lineTo(width, this.params.offsetY);
    ctx.moveTo(this.params.offsetX, 0);
    ctx.lineTo(this.params.offsetX, height);
    ctx.stroke();
  }

  /**
   * Draws a linear function y = mx + c
   */
  drawLinearFunction(m, c, color = "red") {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    // Calculate visible world bounds
    const worldXMin = (0 - this.params.offsetX) / this.zoom;
    const worldXMax = (width - this.params.offsetX) / this.zoom;

    // Calculate y at boundaries
    const y1 = m * worldXMin + c;
    const y2 = m * worldXMax + c;

    // Convert to pixel coordinates
    const px1 = 0;
    const py1 = this.params.offsetY - y1 * this.zoom;
    const px2 = width;
    const py2 = this.params.offsetY - y2 * this.zoom;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
  }

  // Kept for H_D line drawing which is horizontal (m=0)
  drawHorizontalLine(y, color) {
    this.drawLinearFunction(0, y, color);
  }

  drawVerticalLine(x, color = "blue") {
    const ctx = this.ctx;
    const { height } = this.canvas;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const px = this.params.offsetX + x * this.zoom;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
  }

  drawIntersections() {
    // Calculate intersections
    const { points, lines } = this.calculateIntersections();

    // Calculate metrics (values and dynamic points)
    const metrics = this.calculateMetrics(points);

    // Draw static intersections
    this.drawIntersectionPoints(points);

    // Draw dynamic elements (H_D line, beta, delta)
    this.drawDynamicElements(metrics);

    // Update DOM results
    this.updateResultPanel(metrics);
  }

  calculateMetrics(points) {
    const { alpha, xi, eta } = points;
    const K = CoinsApp.CONSTANTS.SLOPE_DENOMINATOR;
    const metrics = {
      D: null,
      H_D: null,
      h_D: null,
      P_D: null,
      T_D: null,
      L_D: null,
      d: null,
      H_d: null,
      h_d: null,
      P_d: null,
      T_d: null,
      L_d: null,
      finalResult: null,
      dynamicPoints: { beta: null, delta: null },
    };

    // --- Upper (L_D) Calculation ---
    if (xi) {
      metrics.D = Math.min(K * this.params.A + this.params.B, Math.floor(xi.x));
    }

    if (alpha && metrics.D !== null) {
      metrics.h_D = Math.max(0, Math.floor((metrics.D - alpha.x + K) / K));
    }

    if (metrics.D !== null) {
      metrics.H_D = Math.min(this.params.A, Math.floor(metrics.D / K));

      // Calculate beta and delta coordinates
      // b0: x = K * y + B
      const x_b0 = K * metrics.H_D + this.params.B;
      metrics.dynamicPoints.beta = { x: x_b0, y: metrics.H_D };

      // b1: x = K * y
      const x_b1 = K * metrics.H_D;
      metrics.dynamicPoints.delta = { x: x_b1, y: metrics.H_D };
    }

    const delta = metrics.dynamicPoints.delta;
    if (alpha && delta) {
      metrics.P_D = Math.round((alpha.x + 1) * (delta.y + 1));
    }

    if (metrics.h_D !== null && metrics.D !== null && alpha && delta) {
      const val =
        ((delta.y - metrics.h_D + 1) *
          (K * (delta.y + metrics.h_D) - 2 * (metrics.D - alpha.x))) /
        2;
      metrics.T_D = Math.round(val);
    }

    if (metrics.P_D !== null && metrics.T_D !== null) {
      metrics.L_D = metrics.P_D - metrics.T_D;
    }

    // --- Lower (L_d) Calculation ---
    if (eta) {
      const val = Math.min(
        K * this.params.A + this.params.B,
        Math.max(-1, Math.floor(eta.x + 0.5) - 1)
      );
      metrics.d = val;
      metrics.H_d = Math.min(this.params.A, Math.floor(val / K));

      if (alpha) {
        metrics.h_d = Math.max(0, Math.floor((val - alpha.x + K) / K));
        metrics.P_d = Math.round((alpha.x + 1) * (metrics.H_d + 1));
        metrics.T_d = Math.round(
          ((metrics.H_d - metrics.h_d + 1) *
            (K * (metrics.H_d + metrics.h_d) - 2 * (val - alpha.x))) /
            2
        );
        metrics.L_d = metrics.P_d - metrics.T_d;
      }
    }

    // --- Final Result ---
    if (metrics.L_D !== null && metrics.L_d !== null) {
      metrics.finalResult = metrics.L_D - metrics.L_d;
    }

    return metrics;
  }

  drawDynamicElements(metrics) {
    if (metrics.H_D === null) return;

    const ctx = this.ctx;
    const { beta, delta } = metrics.dynamicPoints;

    // Draw H_D line
    this.drawHorizontalLine(metrics.H_D, "cyan");

    ctx.fillStyle = "red";
    ctx.font = "12px sans-serif";

    // Draw beta
    if (beta) {
      const px = this.params.offsetX + beta.x * this.zoom;
      const py = this.params.offsetY - beta.y * this.zoom;
      ctx.beginPath();
      ctx.arc(px, py, CoinsApp.CONSTANTS.POINT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillText(
        "β",
        px + CoinsApp.CONSTANTS.LABEL_OFFSET,
        py - CoinsApp.CONSTANTS.LABEL_OFFSET
      );
    }

    // Draw delta
    if (delta) {
      const px = this.params.offsetX + delta.x * this.zoom;
      const py = this.params.offsetY - delta.y * this.zoom;
      ctx.beginPath();
      ctx.arc(px, py, CoinsApp.CONSTANTS.POINT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillText(
        "δ",
        px + CoinsApp.CONSTANTS.LABEL_OFFSET,
        py - CoinsApp.CONSTANTS.LABEL_OFFSET
      );
    }

    ctx.fillStyle = "black"; // Restore
  }

  updateResultPanel(metrics) {
    const shadow = this.shadowRoot;

    const setText = (id, text) => {
      const el = shadow.getElementById(id);
      if (el) el.textContent = text;
    };

    // Upper Panel
    setText("dResult", metrics.D !== null ? `D=${metrics.D}` : "D= -");
    setText("hDResult", metrics.h_D !== null ? `h_D=${metrics.h_D}` : "h_D= -");
    setText("HDResult", metrics.H_D !== null ? `H_D=${metrics.H_D}` : "H_D= -");
    setText(
      "calcResult",
      metrics.P_D !== null ? `P_D=${metrics.P_D}` : "P_D= -"
    );
    setText(
      "trapezoidResult",
      metrics.T_D !== null ? `T_D=${metrics.T_D}` : "T_D= -"
    );
    setText("ldResult", metrics.L_D !== null ? `L_D=${metrics.L_D}` : "L_D= -");

    // Lower Panel
    setText("lowerDResult", metrics.d !== null ? `d=${metrics.d}` : "d= -");
    setText(
      "lowerHdResult",
      metrics.H_d !== null ? `H_d=${metrics.H_d}` : "H_d= -"
    );
    setText(
      "lowerhdResult",
      metrics.h_d !== null ? `h_d=${metrics.h_d}` : "h_d= -"
    );
    setText(
      "lowerPdResult",
      metrics.P_d !== null ? `P_d=${metrics.P_d}` : "P_d= -"
    );
    setText(
      "lowerTdResult",
      metrics.T_d !== null ? `T_d=${metrics.T_d}` : "T_d= -"
    );
    setText(
      "lowerLdResult",
      metrics.L_d !== null ? `L_d=${metrics.L_d}` : "L_d= -"
    );

    // Final Result
    setText(
      "finalResultContainer",
      metrics.finalResult !== null
        ? `解の格子の個数 = ${metrics.finalResult}`
        : "解の格子の個数 = -"
    );
  }

  calculateIntersections() {
    const lines = this.getLines();

    const points = {
      alpha: null,
      delta: null, // Will be calculated in updateResults if needed (beta/delta logic)
      xi: null,
      eta: null,
      others: [],
    };

    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const l1 = lines[i],
          l2 = lines[j];
        if (!l1.show || !l2.show) continue;
        let x, y;

        if (l1.type === "y" && l2.type === "y") {
          if (Math.abs(l1.m - l2.m) < 1e-9) continue; // Parallel
          x = (l2.c - l1.c) / (l1.m - l2.m);
          y = l1.m * x + l1.c;
        } else if (l1.type === "y" && l2.type === "x") {
          x = l2.x;
          y = l1.m * x + l1.c;
        } else if (l1.type === "x" && l2.type === "y") {
          x = l1.x;
          y = l2.m * x + l2.c;
        } else {
          continue; // Both x lines (parallel)
        }

        const point = { x, y, label: "" };
        const key = [l1.name, l2.name].sort().join("-");

        switch (key) {
          case "a0-b1":
            point.label = "γ";
            break;
          case "a0-b0":
            point.label = "α";
            points.alpha = { x, y };
            break;
          case "a1-c1":
            point.label = "ξ";
            points.xi = { x, y };
            break;
          case "a1-c0":
            point.label = "η";
            points.eta = { x, y };
            break;
          // case "a1-b1": point.label = "δ"; break; // Handled specially
          // case "a1-b0": point.label = "β"; break; // Handled specially
        }

        points.others.push(point);
      }
    }
    return { points, lines };
  }

  drawIntersectionPoints(points) {
    const ctx = this.ctx;
    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";

    points.others.forEach((p) => {
      const px = this.params.offsetX + p.x * this.zoom;
      const py = this.params.offsetY - p.y * this.zoom;

      ctx.beginPath();
      ctx.arc(px, py, CoinsApp.CONSTANTS.POINT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      if (p.label)
        ctx.fillText(
          p.label,
          px + CoinsApp.CONSTANTS.LABEL_OFFSET,
          py - CoinsApp.CONSTANTS.LABEL_OFFSET
        );
    });
  }
  getLines() {
    return [
      { type: "y", f: (x) => 0, show: true, name: "a0", m: 0, c: 0 },
      {
        type: "y",
        f: (x) => this.params.A,
        show: this.params.showA,
        name: "a1",
        m: 0,
        c: this.params.A,
      },
      {
        type: "y",
        f: (x) => (x - this.params.B) / CoinsApp.CONSTANTS.SLOPE_DENOMINATOR,
        show: this.params.showB,
        name: "b0",
        m: 1 / CoinsApp.CONSTANTS.SLOPE_DENOMINATOR,
        c: -this.params.B / CoinsApp.CONSTANTS.SLOPE_DENOMINATOR,
      },
      {
        type: "y",
        f: (x) => x / CoinsApp.CONSTANTS.SLOPE_DENOMINATOR,
        show: true,
        name: "b1",
        m: 1 / CoinsApp.CONSTANTS.SLOPE_DENOMINATOR,
        c: 0,
      },
      {
        type: "x",
        x: (this.params.X - this.params.C) / 2,
        show: this.params.showC,
        name: "c0",
      },
      {
        type: "x",
        x: this.params.X / 2,
        show: this.params.showC1,
        name: "c1",
      },
    ];
  }
}

customElements.define("coins-app", CoinsApp);
