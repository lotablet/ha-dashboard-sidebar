//<!-- Card developed by LoTablet - 2025 -->
import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import { until } from "https://unpkg.com/lit-html/directives/until.js?module";
class HaDashboardSidebar extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      cards: { type: Array },
      config: { type: Object },
      _collapsed: { type: Boolean },
      _time: { type: String },
      _showModal: { type: Boolean },
      _selectedEntity: { type: Object },
      _editingText: { type: String },
      _localVolume: { type: Number },
      _localPosition: { type: Number },
      _localTemp:  { type: Number },
      _localFanSpeed: { type: Number },
      _miniEntity: { type: Object },
      _miniPos: { type: Object },
    };
  }

  constructor() {
    super();
    this._collapsed = false;
    this._time = this._getCurrentTime();
    this._showModal = false;
    this._selectedEntity = null;
    this._editingText = '';
    this.config = {};
    this._ghostMaps = [];
    this._localVolume = 0;
    this._localPosition = 0;
    this._localFanSpeed = 0;
    this._localTemp = 0;
    this._expandContent = false;
    this._weatherIcons = {
      'clear-night': {
        icon: '🌙',
        animation: 'twinkle'
      },
      'cloudy': {
        icon: '☁️',
        animation: 'float'
      },
      'fog': {
        icon: '🌫️',
        animation: 'pulse'
      },
      'hail': {
        icon: '🌨️',
        animation: 'bounce'
      },
      'lightning': {
        icon: '⚡',
        animation: 'flash'
      },
      'lightning-rainy': {
        icon: '⛈️',
        animation: 'storm'
      },
      'partlycloudy': {
        icon: '⛅',
        animation: 'float'
      },
      'pouring': {
        icon: '🌧️',
        animation: 'rain'
      },
      'rainy': {
        icon: '🌦️',
        animation: 'rain'
      },
      'snowy': {
        icon: '❄️',
        animation: 'snow'
      },
      'snowy-rainy': {
        icon: '🌨️',
        animation: 'rain'
      },
      'sunny': {
        icon: '☀️',
        animation: 'snow'
      },
      'windy': {
        icon: '💨',
        animation: 'shake'
      },
      'windy-variant': {
        icon: '🌪️',
        animation: 'float'
      },
      'exceptional': {
        icon: '⚠️',
        animation: 'pulse'
      }
    };
  }
  _toggleExpandContent() {
    this._expandContent = !this._expandContent;
    console.warn("EXPAND STATE", this._expandContent);
    this.requestUpdate();
  }
  updated(changedProps) {
    super.updated(changedProps);
    if(changedProps.has('hass')) {
      this.config.entities.forEach(entity => {
        const state = this.hass.states[entity.entity];
        if(!state) return;

        switch(entity.entity.split('.')[0]) {
          case 'climate':
            this._localTemp = state.attributes.temperature || 20;
            break;
          case 'media_player':
            this._localVolume = (state.attributes.volume_level || 0) * 100;
            break;
          case 'cover':
            this._localPosition = state.attributes.current_position || 0;
            break;
          case 'fan':
            this._localFanSpeed = state.attributes.percentage || 0;
            break;
        }
      });
    }
  }
  static async getStubConfig(hass) {
    return {
      type: 'custom:ha-dashboard-sidebar',
      title: 'Sidebar',
      entities: [
        {
          type: 'sensor',
          entity: 'sensor.casa_channel_1_power',
          name: 'Consumo Casa',
          icon: 'mdi:flash',
        },
        {
          type: 'person',
          entity: 'person.lorenzo',
          tracker_entity: 'device_tracker.life360_lorenzo'
        },
        {
          type: 'weather',
          entity: 'weather.home',
        }
      ]
    };
  }
  async firstUpdated() {
    /* stile trasparente al card root */
    const card = this.shadowRoot.querySelector('ha-card');
    if (card) {
      card.style.background = 'transparent';
      card.style.boxShadow  = 'none';
    }

    /* registra ha-map in modo invisibile */
    if (!customElements.get('ha-map')) {
      try {
        const helpers = await window.loadCardHelpers();

        /* prendi tutte le persone con tracker_entity valido */
        const persons = this.config.entities
          .filter(e => e.type === 'person' && e.tracker_entity);

        for (const person of persons) {
          const trackerId = person.tracker_entity;

          /* createCardElement ora restituisce già <hui-map-card> pronto,
             non serve più setConfig */
          const ghostMap = await helpers.createCardElement({
            type: 'map',
            entities: [trackerId]
          });

          ghostMap.hass = this.hass;
          ghostMap.style.display = 'none';

          this.shadowRoot.appendChild(ghostMap);
          console.log(`[sidebar] Ghost map caricata per ${trackerId}`);
        }
      } catch (err) {
        console.error('[sidebar] Errore caricamento ha-map:', err);
      }
    }
  }
  static get styles() {
    return css`
      :host {
        --sidebar-item-size: 56px;
        display: block;
        height: 100%;
      }
      :root {
        --state-icon-active-color: var(--primary-color);
      }
      ha-card {
        height: 100%;
      }
      .custom-card-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 16px;
        font-size: 1.5rem;
      }
      .custom-card-wrapper {
      	display: flex;
      	flex-direction: column;
      	align-items: start;
      	justify-content: center;
      	width: 100%;
      	box-sizing: border-box;
        font-size: 1.5rem;
      }

      .custom-card-wrapper.horizontal.collapsed {
      	width: 56px;
      	height: 56px;
        font-size: 1.5rem;
      }

      .custom-card-wrapper.vertical.collapsed {
      	width: 56px;
      	height: 56px;
        font-size: 1.5rem;
      }

      .header {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px 20px;
        background: var(--card-background-color, #1a1b1e);
        border-bottom: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
        position: relative;
        flex-shrink: 0;
        flex: 0 0 auto;
        z-index: 1;
      }
      .expand-button {
        flex: 0 0 auto;
        text-align: center;
        padding: 10px;
        cursor: pointer;
        font-weight: bold;
        font-size: 15px;
        color: var(--primary-text-color);
        background: var(--card-background-color, #1a1b1e);
        border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
        line-height: 1;
        transform: scaleX(2.5) scaleY(0.8);
      }
      .expand-button:hover {
        background: var(--primary-color, #7289da);
        color: var(--card-background-color, #1a1b1e);
      }
      .content {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .content::-webkit-scrollbar {
        width: 0px;
        height: 0px;
      }

      .content::-webkit-scrollbar-thumb {
        background: transparent;
      }

      .toggle-area {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
        background: transparent;
        z-index: 5;
      }

      .clock {
        font-size: 2.25rem;
        font-weight: 600;
        margin-bottom: 8px;
        transition: all 0.3s;
        color: var(--primary-text-color, #ffffff);
        letter-spacing: -1px;
        z-index: 1;
      }

      .collapsed .clock {
        font-size: 1.5rem;
        letter-spacing: 0;
      }
      .collapsed-clickable-box {
        cursor: pointer;
      }
      .title {
        font-size: 1rem;
        font-weight: 500;
        opacity: 0.7;
        transition: all 0.3s;
        color: var(--primary-text-color, #ffffff);
        margin-bottom: 0;
      }

      .collapsed .title {
        opacity: 0;
        height: 0;
        margin: 0;
      }
      .card {
        border-radius: var(--ha-card-border-radius, 24px);
        padding: 20px;
        transition: all 0.3s;
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
        position: relative;
        overflow: hidden;
        cursor: pointer;
        backdrop-filter: blur(5px);
        color: var(--primary-text-color, #ffffff);
        flex-shrink: 0;
      }

      .collapsed .card {
        padding: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1;
      }

      .card:hover {
        border-color: var(--primary-color);
        transform: translateY(-2px);
      }

      .value {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--primary-text-color, #ffffff);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .label {
        font-size: 0.875rem;
        opacity: 0.7;
        color: var(--primary-text-color, #ffffff);
        transition: all 0.3s;
      }

      .collapsed .label,
      .collapsed .value {
        display: none;
      }

      .icon {
        font-size: 24px;
        color: var(--primary-text-color, #ffffff);
        opacity: 0.9;
        display: none;
        transition: all 0.3s;
      }

      .collapsed .icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .button-row,
      .media-controls,
      .cover-actions {
        display: flex;
        gap: clamp(4px, 1vw, 6px);
        justify-content: center;
        margin-top: 8px;
      }
      .sensor:hover {
        background: transparent;
        border-color: var(--primary-color);
      }
      .sensor {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        height: auto;
        border-radius: 16px;
        background: var(--card-background-color, rgba(255, 255, 255, 0.03));
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
        cursor: pointer;
        transition: all 0.3s;
        color: var(--primary-text-color, #ffffff);
        flex-shrink: 0;
      }
      .light:hover {
        background: transparent;
        border-color: var(--primary-color);
      }
      .light {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-radius: 16px;
        background: var(--card-background-color, rgba(255, 255, 255, 0.03));
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.05));
        cursor: pointer;
        transition: all 0.3s;
        color: var(--primary-text-color, #ffffff);
        flex-shrink: 0;
      }
    	/* Mini-popup: dimensioni “auto-adattive” al contenuto */
      .mini-popup {
        position: absolute;
        background: transparent;
        border: none;
        box-shadow: none;
        z-index: 9999;
        max-width: 90vw;
        padding: 0;
        overflow: visible !important;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: popup-appear 0.3s ease-out forwards;
      }
      @keyframes popup-appear {
        from {
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .mini-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        /* sfondo trasparente */
        background: rgba(0,0,0,0);
        z-index: 9998;
      }
      .mini-popup .card.custom-card,
      .mini-popup .custom-card-wrapper {
        width: auto;
        max-width: 90vw;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    	/* Assicura che slider e pulsanti non escano dal popup */
    	.mini-popup .slider-container,
    	.mini-popup .button-row,
    	.mini-popup .media-controls,
    	.mini-popup .cover-actions {
        width: 100% !important;
        height: 100% !important;
    		overflow: hidden;
    	}

    	/* La “freccia” del popup (puntina) */
    	.mini-popup::after {
    		content: "";
    		position: absolute;
    		top: 12px;
    		left: -8px;
    		border-width: 8px;
    		border-style: solid;
    		border-color: transparent var(--card-background-color, #1a1b1e) transparent transparent;
    	}
      .mini-popup .mini-close:hover {
        color: var(--primary-color);
      }
      .mini-popup .mini-close {
        position: absolute;   /* posizione assoluta all’interno di .mini-popup */
        top: 8px;             /* distanza dal bordo superiore */
        right: 8px;           /* distanza dal bordo destro */
        font-size: 1.2em;     /* dimensione della “×” */
        color: var(--primary-text-color); /* colore in tema */
        cursor: pointer;      /* mano al hover */
        z-index: 10;          /* sopra il contenuto */
        user-select: none;    /* eviti selezione accidentale del simbolo */
      }
      .collapsed .person-info {
        display: none;
      }

      .person-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .avatar-container {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .person-image {
        width: 50px;
        height: 50px;
        border-radius: 16px;
        object-fit: cover;
        margin-right: 12px;
        border: 2px solid var(--primary-color, #7289da);
        transition: filter 0.3s ease, opacity 0.3s ease;
      }
      .person-image.color {
        filter: none;
        opacity: 1;
      }

      .person-image.grayscale {
        filter: grayscale(100%) brightness(0.7);
        opacity: 0.7;
      }
      .person-info {
        display: flex;
        flex-direction: column;
      }

      .person-info .name {
        font-weight: 600;
        font-size: 1rem;
      }

      .person-info .status {
        font-size: 0.875rem;
        opacity: 0.7;
      }

      .presence-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: white;
        border: 2px solid;
      }

      .presence-badge ha-icon {
        --mdc-icon-size: 10px;
        color: #000;
      }

      .presence-badge.home {
        border-color: #4caf50;
      }

      .presence-badge.away {
        border-color: #f44336;
      }
      .sensor-state {
        width: 100%;
        height: 100%;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0 !important;
        padding: 0 !important;
      }

      .collapsed .sensor-state {
        aspect-ratio: 1 / 1;
        width: 36px;
        height: 36px;
        padding: 0 !important;
        border-radius: 0 !important;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sensor-state.active {
        background: var(--primary-color, #7289da);
        color: var(--text-primary-color, white);
        box-shadow: 0 2px 8px rgba(var(--rgb-primary-color, 114, 137, 218), 0.3);
      }

      .weather-icon {
        font-size: 2rem;
        margin-bottom: 8px;
        transition: all 0.3s;
      }

      .collapsed .weather-icon {
        font-size: 1.5rem;
        margin-bottom: 0;
      }

      .weather-icon.twinkle {
        animation: twinkle 2s ease-in-out infinite;
      }

      .weather-icon.float {
        animation: float 3s ease-in-out infinite;
      }

      .weather-icon.pulse {
        animation: pulse 2s ease-in-out infinite;
      }

      .weather-icon.bounce {
        animation: bounce 1s ease-in-out infinite;
      }

      .weather-icon.flash {
        animation: flash 2s ease-in-out infinite;
      }

      .weather-icon.storm {
        animation: storm 3s ease-in-out infinite;
      }

      .weather-icon.rain {
        animation: rain 1s ease-in-out infinite;
      }

      .weather-icon.snow {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1em;
        height: 1em;
        line-height: 0;
        animation: snow-spin 3s linear infinite;
        transform-origin: 50% 50%;
      }
      @keyframes snow-spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      .weather-icon.shake {
        animation: shake 1s ease-in-out infinite;
      }

      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }

      .modal-content {
        background: var(--card-background-color, #1a1b1e);
        border-radius: var(--ha-card-border-radius, 16px);
        padding: 24px;
        width: 100%;
        max-width: 300px;
        max-height: 90vh;
        object-fit: cover;
        overflow-y: auto;
        position: relative;
      }

      .modal-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
      }

      .modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        color: var(--primary-text-color, #ffffff);
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
      }

      .modal-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: var(--primary-text-color, #ffffff);
      }


      .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 8px;
      }

      .status-indicator.home {
        background: var(--state-icon-active-color, #4caf50);
      }

      .status-indicator.away {
        background: var(--warning-color, #ff9800);
      }

      .map-container {
        width: 100%;
        height: 400px;
        border-radius: 8px;
        overflow: hidden;
        margin-top: 16px;
        justify-content: center;
        align-items: center;
      }

      /* New styles for additional entity types */
      .button-row {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }
      .control-button {
        background: var(--primary-color);
        color: var(--text-primary-color);
        border: none;
        border-radius: 0.6em;
        width: 2.4em;
        height: 2.4em;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1.2em;
      }
      .control-button:hover {
        filter: brightness(1.1);
      }

      .control-button:active {
        transform: scale(0.98);
      }

      .slider-container {
        width: 100%;
        margin: 6px auto 8px;
        overflow: hidden;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        transition: all 0.2s;
      }

      .slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }

      .input-field {
        width: 100%;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        padding: 8px;
        color: var(--primary-text-color);
        margin-top: 8px;
      }

      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 24px;
      }

      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--secondary-background-color);
        transition: .4s;
        border-radius: 24px;
      }
      .icon ha-icon {
        color: var(--primary-color);
        --mdc-icon-size: 20px;
      }
      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }

      input:checked + .toggle-slider {
        background-color: var(--primary-color);
      }

      input:checked + .toggle-slider:before {
        transform: translateX(16px);
      }

      .climate-controls {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
      }

      .media-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      .sensor-value-wrapper.collapsed-centered {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }

      .sensor-value-wrapper.collapsed-centered ha-icon {
        font-size: 24px;
      }

      .sensor-value-text {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--primary-text-color, #fff);
      }

      .sensor-value-wrapper.expanded-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        gap: 4px;
        width: 100%;
      }

      .sensor-value-wrapper.expanded-right ha-icon {
        font-size: 20px;
      }

      .sensor-number-text {
        font-size: 1rem;
        font-weight: 600;
        color: var(--primary-text-color, #ffffff);
      }
      ha-icon.on {
        color: var(--state-icon-active-color, var(--primary-color, #fbc02d));
      }
      ha-icon:not(.on) {
        color: var(--disabled-text-color, #666666);  /* grigio neutro */
        opacity: 0.75;                              /* un filo più tenue */
      }
      .sensor-value-wrapper ha-icon:not(.on),
      .sensor-value-wrapper .sensor-value-text {
        color: var(--disabled-text-color, #666666);
      }

      /* === Button card in colonna ======================================== */

      .card.button {
        display: flex;
        flex-direction: column;   /* titolo -> bottone azione */
        align-items: center;      /* centro orizzontale */
        justify-content: center;  /* centro verticale nel box */
        gap: 10px;
      }

      /* Titolo centrato e full-width per avere wrap uniforme */
      .card.button .value {
        text-align: center;
        width: 100%;
        margin: 0;                /* niente offset laterale */
      }

      /* Pulsante di controllo centrato sotto il titolo */
      .card.button .control-button {
        align-self: center;
      }
      .light-header,
      .switch-header,
      .fan-header,
      .cover-header,
      .climate-header,
      .media-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;                 /* spazio tra titolo & toggle */
      }

      /* Toggle centrato (rimuove l’offset laterale) */
      .light-header .toggle-switch,
      .switch-header .toggle-switch,
      .fan-header   .toggle-switch,
      .cover-header .toggle-switch {
        margin: 0;
        align-self: center;
      }
      .card.light,
      .card.switch,
      .card.button,
      .card.fan,
      .card.cover,
      .card.climate,
      .card.media-player {
        padding: 16px 10%;
        height: 100%;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .slider {
        width: 100%;
        -webkit-appearance: none;
        appearance: none;
        height: clamp(3px, 0.6vh, 5px);
        border-radius: 3px;
        background: var(--secondary-background-color);
        outline: none;
      }

      .slider::-webkit-slider-thumb,
      .slider::-moz-range-thumb {
        width: clamp(12px, 2.4em, 18px);
        height: clamp(12px, 2.4em, 18px);
      }

      .control-button ha-icon {
        --mdc-icon-size: 1.2em;
      }

      50% {
        transform: translate(0, -2px);
      }

      75% {
        transform: translateX(2px);
      }

      100% {
        transform: translateY(-3px);
      }
      @keyframes twinkle {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(0.9); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }

      @keyframes flash {
        0%, 49%, 51%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      @keyframes storm {
        0%, 100% { transform: translate(0, 0); }
        25% { transform: translate(-2px, 2px); }
        50% { transform: translate(0, -2px); }
        75% { transform: translate(2px, 2px); }
      }

      @keyframes rain {
        0% { transform: translateY(-3px); }
        50% { transform: translateY(0); }
        100% { transform: translateY(-3px); }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }

      .dashboard.vertical:not(.collapsed) .card.light,
      .dashboard.vertical:not(.collapsed) .card.switch,
      .dashboard.vertical:not(.collapsed) .card.button {
        width: 180px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        align-self: center;
      }

      /* Padding interno proporzionale alla larghezza card */
      .dashboard.vertical:not(.collapsed) .card.fan,
      .dashboard.vertical:not(.collapsed) .card.cover,
      .dashboard.vertical:not(.collapsed) .card.climate,
      .dashboard.vertical:not(.collapsed) .card.media-player {
        padding: 16px 10%;
        height: 240px !important;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .dashboard.vertical:not(.collapsed) .card.cover .cover-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      .dashboard.vertical:not(.collapsed) .card.cover .button-row {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 8px;
      }
      .dashboard.vertical:not(.collapsed) .card.fan {
        padding: 16px 10%;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .dashboard {
        background: var(--card-background-color, #1a1b1e);
        border-radius: var(--ha-card-border-radius, 24px);
        box-shadow: var(--ha-card-box-shadow, 0 8px 32px rgba(0, 0, 0, 0.25));
        width: auto;
        max-height: 80vh;
        overflow: hidden;
        position: relative;
        backdrop-filter: blur(10px);
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
        display: flex;
        flex-direction: column;
        transition: all 0.5s ease, height 0.5s ease, width 0.5s ease;
      }

      /* COLLASSATA VERTICALE */
      .dashboard.collapsed.vertical {
        width: 90px !important;
      }

      .dashboard.expanded-content.vertical {
        max-height: none;
        height: auto;
      }
      .dashboard .content {
        overflow-y: auto !important;
        max-height: 100vh !important;
        flex: 1 1 auto;
      }
      .dashboard.expanded-content.horizontal {
        width: 100%;
        height: auto;
        max-height: 80vh;
      }
      .dashboard.vertical {
        flex-direction: column;
        width: var(--dashboard-width, 300px) !important;
      }
      /* Layout base ORIZZONTALE */
      .dashboard.horizontal {
        flex-direction: row;
        width: 50%;
        height: auto;
        margin: 0 auto;
        max-width: 100%;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        width: auto !important;
        max-width: 90vw !important;
        margin-inline: auto !important;
        position: relative !important;
      }
      .dashboard.horizontal:not(.collapsed):not(.expanded-content) {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        width: auto !important;
        max-width: calc(90vw - 100px) !important; /* lascia 16px di margine a dx/sx */
        margin: 0 auto !important;
        padding: 0 16px; /* spazio interno */
        box-sizing: border-box;
        position: relative !important;
      }
      .dashboard.horizontal .header {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-bottom: none !important;
      }

      .dashboard.horizontal .content {
        display: flex !important;
        flex-direction: row;
        flex-wrap: nowrap;
        white-space: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        gap: 12px;
        scrollbar-width: thin;
        scrollbar-color: var(--primary-color) transparent;
      }

      .dashboard.horizontal .clock {
      	font-size: 2rem;
      	font-weight: 700;
      	margin-bottom: 6px;
      	color: var(--primary-text-color, #ffffff);
      }

      .dashboard.horizontal .title {
      	font-size: 1rem;
      	margin-top: 5px;
      	text-align: center;
      }
      .dashboard.horizontal:not(.collapsed) .card.light,
      .dashboard.horizontal:not(.collapsed) .card.switch,
      .dashboard.horizontal:not(.collapsed) .card.button {
        width: 100px !important;
        min-height: 100px;
        max-height: none;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 12px;
        text-align: center;
      }
      .dashboard.horizontal .card.button .value {
        width: 100%;
        display: flex;
        justify-content: center;     /* centra orizzontalmente */
        align-items: center;         /* centra verticalmente */
        text-align: center;
        margin: 0px auto !important;
      }
      .dashboard.horizontal .weather,
      .dashboard.horizontal .sensor,
      .dashboard.horizontal .person {
        width: 100px;
        height: 100px;
        flex-shrink: 0;
        scroll-snap-align: start;
        flex-direction: column;
        display: flex;
        transform: scale(1);
      }

    	.dashboard.horizontal .card.custom-card .collapsed-clickable-box {
    		width: 100%;
    		height: 100%;
    		display: flex;
    		align-items: center;
    		justify-content: center;
    	}
      .dashboard.horizontal .card.custom-card {
        width: 100px;
        flex-shrink: 0;
        scroll-snap-align: start;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      /* Card larghezza */
      .dashboard.horizontal .climate,
      .dashboard.horizontal .cover,
      .dashboard.horizontal .media-player,
      .dashboard.horizontal .fan {
        display: none;
      }
      .dashboard.horizontal.collapsed .card,
      .dashboard.horizontal.collapsed .sensor,
      .dashboard.horizontal.collapsed .light,
      .dashboard.horizontal.collapsed .button,
      .dashboard.horizontal.collapsed .person,
      .dashboard.horizontal.collapsed .cover,
      .dashboard.horizontal.collapsed .climate,
      .dashboard.horizontal.collapsed .media-player,
      .dashboard.horizontal.collapsed .fan {
        padding: 0;
        margin: 0 auto;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        scroll-snap-align: start;
        display: flex;
      }


      .dashboard.horizontal.collapsed .person img.person-image {
        width: 50px;
        height: 50px;
        margin: 0;
        border-radius: 50%;
        object-fit: cover;
      }

      .dashboard.horizontal.collapsed .person-info {
        display: none !important;
      }

      .dashboard.horizontal .sensor-value-wrapper.expanded-right {
        align-items: center !important; /* da flex-end → center */
        justify-content: center;
        text-align: center;
      }
      .dashboard.horizontal .sensor-number-text {
        text-align: center;
        width: 100%;
      }

      /* Scrollbar estetica */
      .dashboard.horizontal .content::-webkit-scrollbar {
        height: 6px;
      }
      .dashboard.horizontal .content::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        border-radius: 4px;
      }

      /* Expand button */
      .dashboard.horizontal .expand-button {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
      }
      .dashboard:hover .toggle {
        opacity: 1;
      }
      .person {
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 16px;
        padding: 14px 16px;
        margin-bottom: 2px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        transition: background 0.3s, transform 0.3s, box-shadow 0.3s;
        cursor: pointer;
        color: var(--primary-text-color, #ffffff);
        flex-shrink: 0;
      }

      .dashboard:not(.collapsed) .person:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--primary-color);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        transform: scale(1.05);
      }
      .dashboard.collapsed .person {
        padding: 8px;
        margin: 0 auto;
        background: var(--card-background-color, rgba(255,255,255,0.03));
        border-radius: 16px;
        box-sizing: border-box;
      }
      .dashboard.collapsed .collapsed-clickable-box:hover {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        border-color: var(--primary-color);
        box-shadow: 1px 1px 3px var(--primary-color);
        transform: scale(1.05);
      }

      .dashboard.collapsed .person-image {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        margin: 0;
      }
      .dashboard.collapsed .sensor,
      .dashboard.collapsed .weather,
      .dashboard.collapsed .media-player,
      .dashboard.collapsed .fan,
      .dashboard.collapsed .cover,
      .dashboard.collapsed .climate,
      .dashboard.collapsed .button,
      .dashboard.collapsed .light,
      .dashboard.collapsed .input-text,
      .dashboard.collapsed .switch {
        width: 56px;
        height: 56px;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        box-sizing: border-box;
      }
      .dashboard.collapsed .card.button {
        padding: 8px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .dashboard.collapsed .card.button .value,
      .dashboard.collapsed .card.button .control-button {
        display: none;            /* solo l’icona */
      }
      .dashboard.horizontal.collapsed .card.custom-card {
        width: var(--sidebar-item-size);
        height: var(--sidebar-item-size);
        padding: 0;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      /* 3) CUSTOM-CARD in mini-popup = auto-width + max 90vw */
      .mini-popup .card.custom-card {
        width: auto;
        max-width: 90vw;
      }
      .mini-popup .fan {
        width: 200px !important;
        height: 200px !important;
        flex-shrink: 0;
      }
      .mini-popup .cover {
        width: 200px !important;
        height: 200px !important;
        flex-shrink: 0;
      }
      .mini-popup .media-player {
        width: 200px !important;
        height: 200px !important;
        flex-shrink: 0;
      }
      .mini-popup .sensor {
        width: 180px !important;
        height: 180px !important;
        flex-shrink: 0;
      }
      .mini-popup .card.light {
        width: 260px;
        padding: 16px;
        padding-bottom: 32px;     /* spazio extra sotto per non tagliare lo slider */
        box-sizing: border-box;
        overflow: visible;        /* evita clipping */
      }

      .mini-popup .card.light .slider-container {
        width: 100%;
        margin: 10px 0;           /* più separazione verticale */
      }

      .mini-popup .card.light .slider-container:last-of-type {
        margin-bottom: 10px;      /* ancora più spazio sotto l’ultimo slider */
      }

      .mini-popup .card.light .slider {
        width: 100%;
      }

      .mini-popup .card.light .label {
        font-size: 0.9rem;
        margin: 8px 0;            /* un po’ più di spazio anche qui */
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mini-popup .card.light .button-row {
        justify-content: center;
        margin-top: 12px;
      }

      .mini-popup .card.light .light-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;                /* aumenta leggermente il gap tra titolo e toggle */
      }

      .mini-popup .switch {
        width: 100px !important;
        height: 100px !important;
        flex-shrink: 0;
      }

      .mini-popup .card.climate {
        width: 300px;         /* fissa una larghezza confortevole */
      }
      .mini-popup .card.climate .button-row button {
        width: 40px;
        height: 40px;
        font-size: 1.2rem;
        margin: 0 4px;
      }
      .mini-popup .card.climate .slider-container {
        width: 100%;
      }
      .mini-popup .card.climate .slider {
        width: 100%;
      }
      .mini-popup .card.climate .label:last-of-type {
        font-size: 0.9rem;
        margin: 6px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
        width: 100%;
        display: block;
      }
      /* Mantieni icona di chiusura ben visibile */
      .mini-popup .mini-close {
        font-size: 1.2rem;
        top: 8px;
        right: 8px;
      }
      .mini-popup .card {
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        box-shadow: var(--ha-card-box-shadow);
        border-radius: var(--ha-card-border-radius);
        padding: 12px;
        animation: popup-appear 0.3s ease-out forwards;
        overflow: visible !important;
      }
      /* ───────────────────────────────
         Minipopup: flex‐wrap per custom‐card interne
      ───────────────────────────────── */
      .mini-popup .content {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        width: auto !important;
        max-width: 90vw !important;
      }
      .mini-popup ha-card {
        width: auto !important;
      }
    `;
  }


  async _createCustomCard(entity) {
    if (!entity || !entity.card) return;

    const id = entity.card.entity || entity.card.unique_id || JSON.stringify(entity.card);

    if (this._createdCards.has(id)) return;

    if (!window.loadCardHelpers) {
      console.error('[sidebar] Card Helpers not available');
      return;
    }

    try {
      const helpers = await window.loadCardHelpers();
      const card = await helpers.createCardElement(entity.card);

      if (typeof card.setConfig === "function") {
        card.setConfig(entity.card);
      }

      card.hass = this.hass;

      this._createdCards.set(id, card);

      this.requestUpdate(); // <--- importantissimo: forza aggiornamento una volta sola dopo creazione
    } catch (err) {
      console.error('[sidebar] Error loading custom card:', err, entity);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this._updateTime();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this._createdCards.clear();

    if (this._timeInterval) {
      clearInterval(this._timeInterval);
    }
    this._ghostMaps.forEach(m => m.remove());
    this._ghostMaps = [];
  }

  _handleHoldAction(e, config) {
    e.preventDefault();
    e.stopPropagation();

    const action = config.hold_action?.action;

    if (!action) return;

    switch (action) {
      case 'toggle':
        this.hass.callService(config.entity.split('.')[0], 'toggle', { entity_id: config.entity });
        break;
      case 'navigate':
        if (config.hold_action?.navigation_path) {
          window.location.href = config.hold_action.navigation_path;
        }
        break;
      case 'call-service':
        if (config.hold_action?.service) {
          const [domain, service] = config.hold_action.service.split('.');
          this.hass.callService(domain, service, config.hold_action.service_data || {});
        }
        break;
      case 'more-info':
      default:
        this._showMoreInfo(config.entity);
        break;
    }
  }

  _handleAction(e, config) {
    e.stopPropagation();

    const action = config.tap_action?.action || 'more-info';

    switch (action) {
      case 'toggle':
        this.hass.callService(config.entity.split('.')[0], 'toggle', { entity_id: config.entity });
        break;
      case 'navigate':
        if (config.tap_action?.navigation_path) {
          window.location.href = config.tap_action.navigation_path;
        }
        break;
      case 'call-service':
        if (config.tap_action?.service) {
          const [domain, service] = config.tap_action.service.split('.');
          this.hass.callService(domain, service, config.tap_action.service_data || {});
        }
        break;
      case 'more-info':
      default:
        const targetEntity = config.tap_action?.entity || config.entity;
        this._showMoreInfo(targetEntity);
        break;
    }
  }


  _updateTime() {
    this._timeInterval = setInterval(() => {
      this._time = this._getCurrentTime();
    }, 1000);
  }

  _getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString(this.hass?.language || 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  _openMiniPopup(entity, clientX, clientY) {
    this._miniEntity = entity;
    this._miniPos    = { x: clientX + 12, y: clientY - 40 }; // leggero offset
    // chiudi on click fuori
    const onClickAway = (ev) => {
      if (!this.shadowRoot.querySelector('.mini-popup')?.contains(ev.target)) {
        this._closeMiniPopup();
      }
    };
    window.addEventListener('click', onClickAway, { once: true });
  }
  _renderEntityExpanded(entity) {
    const prev = this._collapsed;
    this._collapsed = false;                // forza expanded
    const tpl  = this._renderEntity(entity);
    this._collapsed = prev;                 // ripristina
    return tpl;
  }
  _closeMiniPopup() {
    this._miniEntity = null;
    this._miniPos    = null;
  }

  _capitalize(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  _getTranslation(key, defaultValue) {
    return this.hass?.localize?.(key) || defaultValue;
  }

  _getWeatherIcon(state) {
    return this._weatherIcons[state] || {
      icon: '🌡️',
      animation: 'none'
    };
  }

  _getWeatherState(state) {
    const translations = {
      'clear-night': {
        'en': 'Clear Night',
        'it': 'Notte Serena',
        'de': 'Klare Nacht'
      },
      'cloudy': {
        'en': 'Cloudy',
        'it': 'Nuvoloso',
        'de': 'Bewölkt'
      },
      'fog': {
        'en': 'Fog',
        'it': 'Nebbia',
        'de': 'Nebel'
      },
      'hail': {
        'en': 'Hail',
        'it': 'Grandine',
        'de': 'Hagel'
      },
      'lightning': {
        'en': 'Lightning',
        'it': 'Lampi',
        'de': 'Blitz'
      },
      'lightning-rainy': {
        'en': 'Thunderstorm',
        'it': 'Temporale',
        'de': 'Gewitter'
      },
      'partlycloudy': {
        'en': 'Partly Cloudy',
        'it': 'Parzialmente Nuvoloso',
        'de': 'Teilweise Bewölkt'
      },
      'pouring': {
        'en': 'Pouring',
        'it': 'Diluvio',
        'de': 'Starkregen'
      },
      'rainy': {
        'en': 'Rainy',
        'it': 'Piovoso',
        'de': 'Regnerisch'
      },
      'snowy': {
        'en': 'Snowy',
        'it': 'Nevoso',
        'de': 'Schnee'
      },
      'snowy-rainy': {
        'en': 'Sleet',
        'it': 'Nevischio',
        'de': 'Schneeregen'
      },
      'sunny': {
        'en': 'Sunny',
        'it': 'Soleggiato',
        'de': 'Sonnig'
      },
      'windy': {
        'en': 'Windy',
        'it': 'Ventoso',
        'de': 'Windig'
      },
      'windy-variant': {
        'en': 'Windy',
        'it': 'Ventoso',
        'de': 'Windig'
      },
      'exceptional': {
        'en': 'Exceptional',
        'it': 'Eccezionale',
        'de': 'Außergewöhnlich'
      }
    };

    const language = this.hass?.language || navigator.language || 'en';
    const shortLang = language.split('-')[0];

    return translations[state]?.[shortLang] ||
           translations[state]?.['en'] ||
           this._capitalize(state);
  }
  _createdCards = new Map();

  _showMoreInfo(entityId) {
    if (!this.hass || !entityId) return;

    const event = new Event('hass-more-info', {
      bubbles: true,
      composed: true
    });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }
  _expandContent = false;

  _toggleCollapse() {
    this._collapsed = !this._collapsed;
  }

  _handlePersonClick(entity) {
    this._selectedEntity = entity;
    this._showModal = true;
    this.requestUpdate();
  }

  _closeModal() {
    this._showModal = false;
    this._selectedEntity = null;
    this.requestUpdate();
  }

  _callService(domain, service, entityId, data = {}) {
    this.hass.callService(domain, service, {
      entity_id: entityId,
      ...data
    });
  }

  _renderPersonModal() {
    if (!this._showModal || !this._selectedEntity) return html``;

    const personId = this._selectedEntity.entity;
    const personState = this.hass.states[personId];
    if (!personState) return html``;

    // Recupera configurazione della persona
    const personConfig = this.config.entities.find(e => e.entity === personId);
    const trackerId = personConfig?.tracker_entity;
    const tracker = trackerId ? this.hass.states[trackerId] : null;

    const latitude = tracker?.attributes?.latitude || personState.attributes.latitude;
    const longitude = tracker?.attributes?.longitude || personState.attributes.longitude;
    const gps_accuracy = tracker?.attributes?.gps_accuracy || personState.attributes.gps_accuracy;
    const last_updated = tracker?.last_updated || personState.last_updated;
    const hasLocation = latitude && longitude;

    return html`
      <div class="modal" @click=${this._closeModal}>
        <div class="modal-content" @click=${(e) => e.stopPropagation()}>
          <button class="modal-close" @click=${this._closeModal}>×</button>
          <div class="modal-header" style="display: flex; align-items: center; gap: 16px;">
            <img
              src="${personState.attributes.entity_picture || 'https://www.gravatar.com/avatar/0?d=mp'}"
              alt="${personState.attributes.friendly_name}"
              class="person-image ${personState.state}"
              style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-color);"
            />
            <h2 class="modal-title" style="margin: 0;">${personState.attributes.friendly_name}</h2>
          </div>

          <div class="person-details" style="margin-top: 16px;">
            <div class="person-status" style="display: flex; align-items: center; gap: 8px;">
              <span class="status-indicator ${personState.state}"
                style="width: 10px; height: 10px; border-radius: 50%; background: ${personState.state === 'home' ? '#4caf50' : '#f44336'};"></span>
              <span>${this._capitalize(personState.state)}</span>
            </div>

            ${trackerId ? html`
              <div style="margin-top: 4px;">Source: ${trackerId}</div>
            ` : ''}

            ${hasLocation ? html`
              <div style="margin-top: 4px;">GPS Accuracy: ${gps_accuracy}m</div>
              <div style="margin-top: 4px;">Last Updated: ${new Date(last_updated).toLocaleString()}</div>
              <div class="map-container" style="margin-top: 16px;">
                <ha-map
                  .hass=${this.hass}
                  .entities=${[trackerId]}
                  dark_mode
                  style="width: 100%; height: 300px;"
                ></ha-map>
              </div>
            ` : html`
              <div style="margin-top: 8px;">No location data available</div>
            `}
          </div>
        </div>
      </div>
      <!-- GHOST MAP invisibile, solo se tracker ha lat/lon -->
      ${tracker && tracker.attributes.latitude && tracker.attributes.longitude ? html`
        <ha-card style="width:1px; height:1px; overflow:hidden; opacity:0; pointer-events:none; position:absolute;">
          <hui-map-card
            .hass=${this.hass}
            .config=${{
              type: 'map',
              entities: [trackerId]
            }}
          ></hui-map-card>
        </ha-card>
      ` : ''}
    `;
  }
	_renderEntity(entity) {
		if (!entity) return html``;

		/* -------- collapsed:true / false sul singolo entity -------- */
		if (entity.hasOwnProperty('collapsed')) {
			if (entity.collapsed  === true  && !this._collapsed) return html``;
			if (entity.collapsed  === false &&  this._collapsed) return html``;
		}

		/* -------- CUSTOM CARD -------------------------------------- */
		if (entity.type === 'custom_card') {

			/* ① sidebar COLLAPSED  →   piccola icona‐bottone */
			if (this._collapsed) {
				return html`
					<div class="card custom-card">
						<div class="collapsed-clickable-box"
								 tabindex="0"
								 @click=${(e) => this._handleTapAction(e, entity)}
								 @contextmenu=${(e) => this._handleHoldAction(e, entity)}>
							<div class="icon">${this._renderIcon(entity, 'custom_card')}</div>
						</div>
					</div>`;
			}

			/* ② sidebar espansa  →   renderizza la card vera */
			const id   = entity.card.entity || entity.card.unique_id || JSON.stringify(entity.card);
			const card = this._createdCards.get(id);

			if (card) {
				card.hass = this.hass;
				const applyStyle = !this._collapsed && entity.style;

				return html`
					<div class="custom-card-wrapper" style="${applyStyle ? entity.style : ''}">
						${card}
					</div>`;
			}

			/* (lazy-load se non ancora creata) */
			this._createCustomCard(entity);
			return html``;
		}

		/* -------- ENTITÀ “normali” ---------------------------------- */
		if (!entity.entity) return html``;
		const state  = this.hass.states[entity.entity];
		if (!state)  return html``;

		const domain = entity.entity.split('.')[0];

		switch (domain) {
			case 'weather':       return this._renderWeather(entity);
			case 'person':        return this._renderPerson(entity);
			case 'sensor':        return this._renderSensor(entity);
			case 'cover':         return this._renderCover(entity);
			case 'climate':       return this._renderClimate(entity);
			case 'switch':        return this._renderSwitch(entity);
			case 'script':
			case 'button':        return this._renderButton(entity);
			case 'fan':           return this._renderFan(entity);
			case 'media_player':  return this._renderMediaPlayer(entity);
			case 'light':         return this._renderLight(entity);
			default:              return html``;
		}
	}
  _renderCover(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const position = state.attributes.current_position;
    this._localPosition = position ?? 0;

    if (this._collapsed) {
      return html`
        <div class="card cover">
          <div class="collapsed-clickable-box"
               tabindex="0"
               @click=${(e) => this._handleTapAction(e, config)}
               @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            <div class="icon">
              ${this._renderIcon(config, 'cover')}
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="card cover">
        <div class="value"
             @click=${(e) => {
               e.stopPropagation();
               this._handleTapAction(e, config);
             }}>
          ${config.name || state.attributes.friendly_name}
        </div>

        <div class="label">${this._capitalize(state.state)}</div>

        <div class="cover-actions" style="display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: auto;">
          <div class="button-row">
            ${[
              { icon: 'mdi:arrow-up',    action: 'open_cover'  },
              { icon: 'mdi:stop',        action: 'stop_cover'  },
              { icon: 'mdi:arrow-down',  action: 'close_cover' }
            ].map(btn => html`
              <button class="control-button"
                      title="${btn.action}"
                      @click=${(e) => {
                        e.stopPropagation();
                        this._callService('cover', btn.action, config.entity);
                      }}>
                <ha-icon icon="${btn.icon}"></ha-icon>
              </button>
            `)}
          </div>

          ${position !== undefined ? html`
            <div class="slider-container">
              <input
                type="range"
                class="slider"
                .value=${this._localPosition}
                @input=${e => this._localPosition = Number(e.target.value)}
                @change=${e => this._callService(
                  'cover',
                  'set_cover_position',
                  config.entity,
                  { position: Number(e.target.value) }
                )}
                min="0"
                max="100"
                step="1"
              />
              <div class="label" style="text-align:center; margin-top: 4px;">
                ${this._localPosition}%
              </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  _renderClimate(config) {
      const state = this.hass.states[config.entity];
      if (!state) return html``;

      const {
          temperature,
          current_temperature,
          hvac_modes,
          min_temp,
          max_temp
      } = state.attributes;

      const modeIcons = {
          'off':      'mdi:power',
          'heat':     'mdi:fire',
          'cool':     'mdi:snowflake',
          'auto':     'mdi:autorenew',
          'dry':      'mdi:water-off',
          'fan_only': 'mdi:fan'
      };

      return html`
          <div class="card climate">
              ${this._collapsed ? html`
                  <!-- COLLAPSED: icona-bottone che apre mini-popup -->
                  <div class="collapsed-clickable-box"
                       tabindex="0"
                       @click=${e => this._handleTapAction(e, config)}
                       @contextmenu=${e => this._handleHoldAction(e, config)}>
                      <div class="icon">${this._renderIcon(config, 'climate')}</div>
                  </div>
              ` : html`
                  <!-- ESPANSA -->
                  <div class="value"
                       @click=${e => { e.stopPropagation(); this._handleTapAction(e, config); }}>
                      ${current_temperature}°${state.attributes.temperature_unit}
                  </div>

                  <!-- Titolo statico, senza more-info -->
                  <div class="label">
                      ${config.name || state.attributes.friendly_name}
                  </div>

                  <div class="climate-controls" style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
                      <div class="button-row" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
                          ${hvac_modes?.map(mode => html`
                              <button
                                  class="dash-button ${state.state === mode ? 'active' : ''}"
                                  style="
                                      background:${state.state === mode
                                          ? 'var(--primary-color)'
                                          : '#727272'};
                                      color:var(--text-primary-color,#ffffff);
                                      border:none;border-radius:10px;padding:6px;
                                      width:36px;height:36px;display:inline-flex;
                                      align-items:center;justify-content:center;
                                      cursor:pointer;transition:all .3s ease;"
                                  @click=${e => {
                                      e.stopPropagation();
                                      if (mode === 'off') {
                                          this._callService('climate', 'turn_off', config.entity);
                                      } else {
                                          this._callService(
                                              'climate',
                                              'set_hvac_mode',
                                              config.entity,
                                              { hvac_mode: mode }
                                          );
                                      }
                                  }}
                                  title=${mode === 'off' ? 'Spegni' : this._capitalize(mode)}>
                                  <ha-icon icon="${modeIcons[mode] || 'mdi:help-circle'}"></ha-icon>
                              </button>
                          `)}
                      </div>

                      <div class="slider-container" style="margin-top:10px;width:100%;">
                          <input
                              type="range"
                              class="slider"
                              @click=${e => e.stopPropagation()}
                              .value=${temperature}
                              @change=${e => this._callService(
                                  'climate',
                                  'set_temperature',
                                  config.entity,
                                  { temperature: Number(e.target.value) }
                              )}
                              min=${min_temp}
                              max=${max_temp}
                              step="0.5"
                              style="
                                  -webkit-appearance:none;
                                  appearance:none;
                                  width:100%;
                                  height:6px;
                                  border-radius:4px;
                                  background:var(--secondary-background-color);
                                  outline:none;
                                  cursor:pointer;">
                      </div>

                      <div class="label" style="text-align:center;margin-top:4px;">
                          Target: ${temperature}°${state.attributes.temperature_unit}
                      </div>
                  </div>
              `}
          </div>
      `;
  }
	_changeTemperature(entityId, delta) {
		const state = this.hass.states[entityId];
		if (!state) return;

		if (this._localTemp == null) {
			this._localTemp = state.attributes.temperature || 20;
		}

		let newTemp = this._localTemp + delta;
		const min   = state.attributes.min_temp || 7;
		const max   = state.attributes.max_temp || 35;

		newTemp          = Math.max(min, Math.min(max, newTemp));
		this._localTemp  = newTemp;		// aggiorna subito la variabile locale

		// invia comunque il comando a HA
		this._callService('climate', 'set_temperature', entityId, { temperature:newTemp });
	}
	_renderLight(config) {
		const state = this.hass.states[config.entity];
		if (!state) return html``;

		const isOn = state.state === "on";

		/* -------- capabilità disponibili --------------------------- */
		const supportsBrightness = "brightness" in state.attributes;
		const supportsKelvin     = "color_temp_kelvin" in state.attributes
		                           || (state.attributes.supported_color_modes ?? [])
		                                 .some(m => ["color_temp","kelvin"].includes(m));
		const supportsColor      = (state.attributes.supported_color_modes ?? [])
		                                 .some(m => ["rgb","rgbw","rgbww","hs"].includes(m));

		/* -------- compatta se non ci sono controlli extra ---------- */
		const compact = !supportsBrightness && !supportsKelvin && !supportsColor;

		/* -------- buffer locali (evita slider bounce) -------------- */
		if (supportsBrightness) {
			if (this._localBrightness == null || !isOn) {
				this._localBrightness = isOn && state.attributes.brightness
					? Math.round((state.attributes.brightness / 255) * 100)
					: 0;                // reset a 0 se la luce è off
			}
		}
		if (supportsKelvin) {
			if (this._localKelvin == null || !isOn) {
				this._localKelvin = isOn
					? (state.attributes.color_temp_kelvin || 4000)
					: 4000;             // default a metà scala quando off
			}
		}

		/* -------- modalità COLLAPSED ------------------------------- */
		if (this._collapsed) {
			return html`
				<div class="card light${compact ? ' compact' : ''}">
					<div class="collapsed-clickable-box"
							 @click=${e => this._handleTapAction(e, config)}
							 @contextmenu=${e => this._handleHoldAction(e, config)}>
						<div class="icon">${this._renderIcon(config, "light")}</div>
					</div>
				</div>`;
		}

		/* -------- UI ESPANSA -------------------------------------- */
		return html`
			<div class="card light${compact ? ' compact' : ''}">
				<!-- header: titolo + switch -->
				<div class="light-header">
					<div class="value"
							 @click=${e => { e.stopPropagation(); this._handleTapAction(e, config);} }>
						${config.name || state.attributes.friendly_name}
					</div>

					<label class="toggle-switch" @click=${e => e.stopPropagation()}>
						<input type="checkbox" ?checked=${isOn}
									 @change=${() => this._callService(
													"light",
													isOn ? "turn_off" : "turn_on",
													config.entity)} >
						<span class="toggle-slider"></span>
					</label>
				</div>

				<!-- Controlli mostrati solo se ON e supportati -------- -->
				${isOn && (supportsBrightness || supportsKelvin || supportsColor) ? html`
					<!-- Brightness -->
          ${supportsBrightness ? html`
           <div class="slider-container">
             <input type="range" class="slider"
                    .value=${this._localBrightness}
                    @input=${e => this._localBrightness = Number(e.target.value)}
                    @change=${e => this._callService(
                        "light","turn_on",config.entity,
                        { brightness_pct:Number(e.target.value) })}>
             <div class="label" style="text-align:center; margin-top:8px;">
               ${this._localBrightness}%
             </div>
           </div>` : ""}
					<!-- Kelvin -->
					${supportsKelvin ? html`
						<div class="slider-container">
							<input type="range" class="slider"
										 min="2000" max="6500" step="50"
										 .value=${this._localKelvin}
										 @input=${e => this._localKelvin = Number(e.target.value)}
										 @change=${e => this._callService(
											 "light","turn_on",config.entity,
											 { kelvin:Number(e.target.value) })}>
							<div class="label" style="text-align:center;">
								${this._localKelvin} K
							</div>
						</div>` : ""}

					<!-- Color picker -->
					${supportsColor ? html`
						<div class="button-row" style="justify-content:center;">
							<button class="control-button" title="RGB picker"
											@click=${() => this._showMoreInfo(config.entity)}>🎨</button>
						</div>` : ""}
				` : "" }
			</div>`;
	}

	_renderSwitch(config) {
		const state = this.hass.states[config.entity];
		if (!state) return html``;

		const isOn   = state.state === 'on';
		const domain = config.entity.split('.')[0];

		return html`
			<div class="card switch">
				${this._collapsed ? html`
					<div class="collapsed-clickable-box"
							 tabindex="0"
							 @click=${e => this._handleTapAction(e, config)}
							 @contextmenu=${e => this._handleHoldAction(e, config)}>
						<div class="icon">
							${this._renderIcon(config, 'switch')}
						</div>
					</div>
				` : html`
					<div class="switch-header"
							 style="display:flex;justify-content:space-between;
												align-items:center;width:100%;padding:0 6px;">
						<div class="value"
								 @click=${e => { e.stopPropagation(); this._handleTapAction(e, config);} }>
							${config.name || state.attributes.friendly_name}
						</div>

						<label class="toggle-switch" @click=${e => e.stopPropagation()}>
							<input type="checkbox" ?checked=${isOn}
										 @change=${e => {
											 e.stopPropagation();
											 this._callService(
												 domain,
												 isOn ? 'turn_off' : 'turn_on',
												 config.entity);
										 }}>
							<span class="toggle-slider"></span>
						</label>
					</div>
				`}
			</div>
		`;
	}

  _renderButton(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const domain = config.entity.split('.')[0];
    const name = config.name || state.attributes.friendly_name;
    const service = domain === 'script' ? 'turn_on' : 'press';

    return html`
      <div class="card button">
        ${this._collapsed ? html`
          <div class="collapsed-clickable-box"
            tabindex="0"
            @click=${(e) => {
              e.stopPropagation();
              this._callService(domain, service, config.entity);
            }}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            <div class="icon">
              ${this._renderIcon(config, domain)}
            </div>
          </div>
        ` : html`
          <div class="value" @click=${(e) => { e.stopPropagation(); this._handleTapAction(e, config); }}>
            ${name}
          </div>
          <button class="control-button"
            @click=${(e) => {
              e.stopPropagation();
              this._callService(domain, service, config.entity);
            }}>
            <ha-icon icon="mdi:gesture-tap-button"></ha-icon>
          </button>
        `}
      </div>
    `;
  }
	_renderFan(config) {
		const state = this.hass.states[config.entity];
		if (!state) return html``;

		const isOn = state.state === 'on';
		const speed = state.attributes.percentage ?? 0;

		// buffer locale
		if (this._localFanSpeed == null || !isOn) {
			this._localFanSpeed = isOn ? speed : 0;
		}

		return html`
			<div class="card fan">
				${this._collapsed ? html`
					<div class="collapsed-clickable-box"
							 tabindex="0"
							 @click=${e => this._handleTapAction(e, config)}
							 @contextmenu=${e => this._handleHoldAction(e, config)}>
						<div class="icon">${this._renderIcon(config, 'fan')}</div>
					</div>
				` : html`
					<div class="value"
							 tabindex="0"
							 @click=${e => { e.stopPropagation(); this._handleAction(e, config); }}
							 @contextmenu=${e => this._handleHoldAction(e, config)}>
						${config.name || state.attributes.friendly_name}
					</div>

					<label class="toggle-switch"
								 @click=${e => e.stopPropagation()}>
						<input
							type="checkbox"
							?checked=${isOn}
							@click=${e => e.stopPropagation()}
							@change=${e => {
								e.stopPropagation();
								this._callService(
									'fan',
									isOn ? 'turn_off' : 'turn_on',
									config.entity
								);
							}}>
						<span class="toggle-slider"></span>
					</label>

					${isOn ? html`
						<div class="slider-container" style="margin-top:10px;width:100%;">
							<input
								type="range"
								class="slider"
								@click=${e => e.stopPropagation()}
								.value=${this._localFanSpeed}
								@input=${e => this._localFanSpeed = Number(e.target.value)}
								@change=${e => {
									e.stopPropagation();
									this._callService(
										'fan',
										'set_percentage',
										config.entity,
										{ percentage: Number(e.target.value) }
									);
								}}
								min="0"
								max="100"
								step="1"
								style="
									-webkit-appearance:none;
									appearance:none;
									width:100%;
									height:6px;
									border-radius:4px;
									background:var(--secondary-background-color);
									outline:none;
									cursor:pointer;">
							<div class="label" style="text-align:center; margin-top:4px;">
								${this._localFanSpeed}%
							</div>
						</div>
					` : ''}
				`}
			</div>
		`;
	}

	_renderMediaPlayer(config) {
		const state = this.hass.states[config.entity];
		if (!state) return html``;

		const isPlaying = state.state === 'playing';
		const volume    = state.attributes.volume_level || 0;

		const mediaControls = [
			{ action: 'media_previous_track', icon: 'mdi:skip-previous' },
			{ action: 'media_play_pause',     icon: isPlaying ? 'mdi:pause' : 'mdi:play' },
			{ action: 'media_next_track',     icon: 'mdi:skip-next' }
		];

		return html`
			<div class="card media-player">
				${this._collapsed ? html`
					<!-- COLLAPSED: icona-bottone che apre mini-popup -->
					<div class="collapsed-clickable-box"
							 tabindex="0"
							 @click=${(e) => this._handleTapAction(e, config)}
							 @contextmenu=${(e) => this._handleHoldAction(e, config)}>
						<div class="icon">
							${this._renderIcon(config, 'media_player')}
						</div>
					</div>
				` : html`
					<!-- ESPANSA -->
					<div class="value"
							 @click=${(e) => { e.stopPropagation(); this._handleTapAction(e, config);} }>
						${config.name || state.attributes.friendly_name}
					</div>

					<div class="media-info">
						<div class="track-name">${state.attributes.media_title || 'Nessuna traccia in riproduzione'}</div>
						<div class="track-artist">${state.attributes.media_artist || ''}</div>
					</div>

					<div class="media-controls"
							 style="display:flex;justify-content:center;gap:8px;margin-top:12px;">
						${mediaControls.map(control => html`
							<button class="dash-button"
											style="
												background:var(--primary-color);
												color:var(--text-primary-color,#ffffff);
												border:none;border-radius:10px;padding:8px;
												width:36px;height:36px;display:inline-flex;
												align-items:center;justify-content:center;
												cursor:pointer;transition:all .3s ease;"
											@click=${(e) => { e.stopPropagation(); this._callService('media_player', control.action, config.entity);} }>
								<ha-icon icon="${control.icon}"></ha-icon>
							</button>
						`)}
					</div>

					<div class="slider-container"
							 style="margin-top:10px;width:100%;">
						<input type="range"
									 class="slider"
									 .value=${volume * 100}
									 min="0" max="100" step="1"
									 @change=${(e) => this._callService(
										 'media_player','volume_set',config.entity,
										 { volume_level:Number(e.target.value)/100 })}>
					</div>

					<style>
						input.slider::-webkit-slider-thumb {
							-webkit-appearance: none;
							appearance: none;
							width: 16px; height: 16px;
							border-radius: 50%;
							background: var(--primary-color);
							cursor: pointer;
							box-shadow: 0 0 4px var(--primary-color);
						}
						input.slider::-moz-range-thumb {
							width: 16px; height: 16px;
							border-radius: 50%;
							background: var(--primary-color);
							cursor: pointer;
							box-shadow: 0 0 4px var(--primary-color);
						}
						input.slider::-webkit-slider-runnable-track,
						input.slider::-moz-range-track {
							width: 100%; height: 6px;
							border-radius: 4px;
							background: var(--secondary-background-color);
						}
					</style>
				`}
			</div>
		`;
	}
  _renderSensor(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const value = state.state;
    const isActive = (!isNaN(value) && Number(value) > 0) || value === "on";

    const renderValue = () => {
      return this._collapsed
        ? html`
            <div class="sensor-value-wrapper collapsed-centered">
              ${this._renderIcon(config, 'sensor')}
              <span class="sensor-value-text">${state.state}</span>
            </div>
          `
        : html`
            <div class="sensor-value-wrapper expanded-right">
              ${this._renderIcon(config, 'sensor')}
              <span class="sensor-number-text">${state.state}</span>
            </div>
          `;
    };

    return html`
      <div class="sensor">
        ${this._collapsed ? html`
          <div class="sensor-state collapsed-clickable-box ${isActive ? "active" : ""}"
            tabindex="0"
            @click=${(e) => this._handleAction(e, config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            ${renderValue()}
          </div>
        ` : html`
          <div class="value"
            tabindex="0"
            @click=${(e) => this._handleAction(e, config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            ${config.name || state.attributes.friendly_name}
          </div>
          <div class="sensor-state ${isActive ? "active" : ""}"
            tabindex="0"
            @click=${(e) => this._handleAction(e, config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            ${renderValue()}
          </div>
        `}
      </div>
    `;
  }
  _renderWeather(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const weatherIcon = this._getWeatherIcon(state.state);
    const weatherState = this._getWeatherState(state.state);

    return html`
      <div class="card weather">
        ${this._collapsed ? html`
          <div class="collapsed-clickable-box"
            tabindex="0"
            @click=${(e) => this._handleAction(e, config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            <div class="weather-icon ${weatherIcon.animation}">
              ${weatherIcon.icon}
            </div>
          </div>
        ` : html`
          <div class="weather-icon ${weatherIcon.animation}">
            ${weatherIcon.icon}
          </div>
          <div class="value"
            tabindex="0"
            @click=${(e) => this._handleAction(e, config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            ${state.attributes.temperature}°${state.attributes.temperature_unit || ""}
          </div>
          <div class="label">${config.name || weatherState}</div>
          ${state.attributes.humidity ? html`
            <div class="label">
              ${this._getTranslation('ui.card.weather.attributes.humidity', 'Humidity')}: ${state.attributes.humidity}%
            </div>
          ` : ""}
        `}
      </div>
    `;
  }
  _renderPerson(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const entityPicture = state.attributes.entity_picture || 'https://www.gravatar.com/avatar/0?d=mp';
    const isHome = state.state.toLowerCase() === 'home';
    const imageClass = isHome ? 'color' : 'grayscale';

    if (this._collapsed) {
      return html`
        <div class="person-wrapper">
          <div class="collapsed-clickable-box"
            tabindex="0"
            @click=${() => this._handlePersonClick(config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            <div class="avatar-container">
              <img
                src="${entityPicture}"
                alt="${config.name || state.attributes.friendly_name}"
                class="person-image ${imageClass}"
              />
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="person" @click=${() => this._handlePersonClick(config)}>
        <img
          src="${entityPicture}"
          alt="${config.name || state.attributes.friendly_name}"
          class="person-image ${imageClass}"
        />
        <div class="person-info">
          <div class="name">${config.name || state.attributes.friendly_name}</div>
          <div class="status">${this._getPersonStateLabel(state.state)}</div>
        </div>
      </div>
    `;
  }
  _getPersonStateLabel(state) {
    const translations = {
      home: {
        en: "Home",
        it: "A Casa",
        de: "Zuhause"
      },
      not_home: {
        en: "Away",
        it: "Fuori Casa",
        de: "Abwesend"
      },
      unavailable: {
        en: "Unavailable",
        it: "Non Disponibile",
        de: "Nicht verfügbar"
      },
      unknown: {
        en: "Unknown",
        it: "Sconosciuto",
        de: "Unbekannt"
      }
    };

    const lang = (this.hass?.language || 'en').split('-')[0];
    const stateKey = (state || '').toLowerCase();

    if (translations[stateKey]?.[lang]) {
      return translations[stateKey][lang];
    }

    // Fallback per zone personalizzate → capitalizza
    return this._capitalize(stateKey.replace(/_/g, ' '));
  }

  _renderIcon(config = {}, fallbackType = null) {
    const domain = config.entity?.split('.')?.[0];
    const state = this.hass?.states?.[config.entity];
    const value = state?.state;

    let icon = config.icon?.trim() || state?.attributes?.icon;

    if (!icon) {
      const defaultIcons = {
        sensor: "mdi:gauge",
        cover: "mdi:window-shutter",
        climate: "mdi:thermometer",
        switch: "mdi:toggle-switch",
        button: "mdi:gesture-tap-button",
        fan: "mdi:fan",
        media_player: "mdi:play-circle",
        light: "mdi:lightbulb",
        weather: "mdi:weather-partly-cloudy",
        person: "mdi:account"
      };
      icon = defaultIcons[fallbackType || domain] || "mdi:help-circle";
    }

    const isActive = (!isNaN(value) && Number(value) > 0) || value === "on";
    const className = isActive ? "on" : "";

    return html`
      <ha-icon
        icon="${icon}"
        class="${className}"
      ></ha-icon>
    `;
  }
  _handleTapAction(e, config) {
    e.stopPropagation();

    const domain = config.entity?.split('.')[0];

    // ── Se sidebar collassata E mini-popup NON già aperto → apri popup
    if (this._collapsed && !this._miniEntity) {
      const popupAllowed = [
        'light', 'switch', 'climate',
        'cover', 'fan', 'media_player', 'sensor'
      ];
      if (popupAllowed.includes(domain) || config.type === 'custom_card') {
        const x = e.touches?.[0]?.clientX || e.clientX;
        const y = e.touches?.[0]?.clientY || e.clientY;
        this._openMiniPopup(config, x, y);
        return;
      }
    }
    let action = config.tap_action?.action;
    if (!action) {
      action = (domain === 'light' || domain === 'switch')
        ? 'toggle'
        : 'more-info';
    }

    switch (action) {
      case 'toggle':
        this.hass.callService(domain, 'toggle', { entity_id: config.entity });
        break;

      case 'navigate':
        if (config.tap_action?.navigation_path) {
          window.location.href = config.tap_action.navigation_path;
        }
        break;

      case 'call-service':
        if (config.tap_action?.service) {
          const [svcDomain, svc] = config.tap_action.service.split('.');
          this.hass.callService(svcDomain, svc, config.tap_action.service_data || {});
        }
        break;

      case 'more-info':
      default:
        const entityId = config.tap_action?.entity || config.entity;
        this._showMoreInfo(entityId);
        break;
    }
  }

  _parseTitle(title) {
    if (!title) return "";

    // Ottieni utente corrente da Home Assistant
    const userName = this.hass?.user?.name || "utente";

    // Rimpiazza {{ user }} con il nome dell'utente loggato
    return title.replace("{{ user }}", userName);
  }
  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities");
    }

    if (!Array.isArray(config.entities)) {
      throw new Error("Entities must be an array");
    }

    this.config = {
      ...config,
      mode: ['vertical', 'horizontal'].includes(config.mode) ? config.mode : 'vertical',
      landscape: config.landscape || false,
      entities: config.entities.map(e => ({
        ...e,
        tracker_entity: e.tracker_entity || null,
      }))
    };

    this.cards = config.cards || [];

    // Gestione stato collapsed e dimensioni configurate
    this._collapsed = config.hasOwnProperty('collapsed') ? config.collapsed : true;

    // ⬅️ Width e Height (se configurate)
    this._configuredWidth  = config.width  || null;
    this._configuredHeight = config.height || null;
  }
  render() {
    if (!this.hass || !this.config) return html``;

    const mode = this.config.mode || 'vertical';
    const align = this.config.align || 'top';

    const isVertical = mode === 'vertical';
    const isHorizontal = mode === 'horizontal';

    const dashboardClasses = [
      'dashboard',
      this._collapsed ? 'collapsed' : '',
      isVertical ? 'vertical' : 'horizontal',
      this._expandContent ? 'expanded-content' : ''
    ].join(' ');

    const width  = this._configuredWidth  || 'auto';
    const height = this._configuredHeight || 'auto';

    const effectiveWidth = (isVertical || this._expandContent) ? width : 'auto';

    let dashboardStyle = `
      width: ${effectiveWidth};
      height: ${height};
    `;

    if (!this._collapsed) {
      dashboardStyle += `--dashboard-width: ${width};`;
    }

    if (isVertical && align === 'right') {
      dashboardStyle += 'margin-left: auto;';
    }

    const dashboardHtml = html`
      <div class="${dashboardClasses}" style="${dashboardStyle}">
        <div class="header" @click=${this._toggleCollapse}>
          <div class="clock">${this._time}</div>
          ${!this._collapsed ? html`
            <div class="title">
              ${this._parseTitle(this.config.title || 'Dashboard')}
            </div>` : ''}
        </div>

        <div class="content">
          ${this.config.entities.map(entity => this._renderEntity(entity))}
        </div>

        ${isVertical ? html`
          <div class="expand-button" @click=${this._toggleExpandContent}>
            ${this._expandContent ? '⌃' : '⌄'}
          </div>` : null}
      </div>
    `;

    const justify =
      align === 'left'  ? 'flex-start' :
      align === 'right' ? 'flex-end'   :
                          'center';

    const alignItems =
      align === 'top'    ? 'flex-start' :
      align === 'bottom' ? 'flex-end'   :
                           'center';

    return html`
      <div style="
        display: flex;
        width: 100%;
        justify-content: ${justify};
        align-items: ${alignItems};
      ">
        <ha-card style="
          padding: 0;
          width: ${effectiveWidth};
          height: ${height};
          max-width: none;
          margin: 0;
          background: transparent;
          box-shadow: none;
        ">
          ${dashboardHtml}
          ${this._renderPersonModal()}
          ${this._miniEntity ? html`
            <div class="mini-overlay" @click=${this._closeMiniPopup}>
              <div class="mini-popup"
                   @click=${e => e.stopPropagation()}
                   style="top:${this._miniPos?.y}px; left:${this._miniPos?.x}px;">
                <span class="mini-close" @click=${this._closeMiniPopup}>×</span>
                ${this._renderEntityExpanded(this._miniEntity)}
              </div>
            </div>` : ''}
        </ha-card>
      </div>
    `;
  }

  static get configSchema() {
    return {
      type: "object",
      properties: {
        type: { type: "string" },
        title: { type: "string" },
        entities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["weather", "person", "sensor", "cover", "climate", "switch", "script", "button", "fan", "media_player", "light", "custom_card"]
              },
              entity: { type: "string" },
              name: { type: "string" },
              tracker_entity: { type: "string" }
            },
            required: ["entity"]
          }
        }
      }
    };
  }
}

customElements.define("ha-dashboard-sidebar", HaDashboardSidebar);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-dashboard-sidebar",
  name: "Dashboard Sidebar",
  preview: true,
  description: "A collapsible sidebar dashboard for Home Assistant"
});
