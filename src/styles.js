export const styles = `
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
`;
