const o="仅供参考";function t(){const e=localStorage.getItem("dse_watermark");return e?JSON.parse(e):{text:o,enabled:!0}}function a(e){localStorage.setItem("dse_watermark",JSON.stringify(e))}function s(){return t().enabled?`
    .wm-container {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .wm-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(4, 1fr);
      width: 120%; height: 120%; margin: -5% 0 0 -5%;
      transform: rotate(-20deg);
    }
    .wm-cell {
      display: flex; align-items: center; justify-content: center;
      opacity: 0.08;
    }
    .wm-cell span {
      font-size: 28px; color: #666; font-weight: 500;
      white-space: nowrap; user-select: none;
    }
    .wm-meta {
      position: fixed; bottom: 12px; right: 16px;
      font-size: 10px; color: #999; z-index: 10000;
      pointer-events: none; font-family: monospace;
    }
    @media print {
      .wm-container { position: fixed; }
    }
  `:""}function c(){const e=t();if(!e.enabled)return"";const n=new Date().toLocaleString("zh-CN"),i=localStorage.getItem("dse_username")||"管理员";return`<div class="wm-container"><div class="wm-grid">${Array.from({length:16},()=>`<div class="wm-cell"><span>${e.text}</span></div>`).join("")}</div></div><div class="wm-meta">${i} · ${n}</div>`}export{s as a,c as b,t as g,a as s};
