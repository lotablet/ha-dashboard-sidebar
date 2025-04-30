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
      _localFanSpeed: { type: Number }
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
    this._localVolume = 0;
    this._localPosition = 0;
    this._localFanSpeed = 0;
    this._localTemp = 0;
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
        animation: 'snow'
      },
      'sunny': {
        icon: '☀️',
        animation: 'float'
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
    // Stile trasparente al card root
    const card = this.shadowRoot.querySelector('ha-card');
    if (card) {
      card.style.background = 'transparent';
      card.style.boxShadow = 'none';
    }

    // Registrazione forzata di ha-map via ghost map cards
    if (!customElements.get('ha-map')) {
      try {
        const helpers = await window.loadCardHelpers();

        // Prendi tutte le entità "person" con tracker_entity valido
        const persons = this.config.entities
          .filter(e => e.type === 'person' && e.tracker_entity);

        for (const person of persons) {
          const trackerId = person.tracker_entity;
          const ghostMap = await helpers.createCardElement({
            type: 'map',
            entities: [trackerId]
          });

          ghostMap.setConfig({
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
      }
      .dashboard {
        background: var(--card-background-color, #1a1b1e);
        border-radius: var(--ha-card-border-radius, 24px);
        box-shadow: var(--ha-card-box-shadow, 0 8px 32px rgba(0, 0, 0, 0.25));
        width: var(--dashboard-width, 300px);
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
        width: var(--dashboard-collapsed-width, 90px);
      }
      /* COLLASSATA ORIZZONTALE */
      .dashboard.collapsed.horizontal {
        height: 90px;
      }

      /* ESPANSA VERTICALE */
      .dashboard.vertical:not(.collapsed) {
        width: var(--dashboard-width, 240px);
        height: 100%;
      }

      .dashboard.horizontal.collapsed {
        height: 90px;
      }

      .dashboard.horizontal:not(.collapsed):not(.expanded-content) {
        height: 160px; /* quando è expanded ma non espansa completamente */
      }

      .dashboard.horizontal.expanded-content {
        width: fit-content;
        max-width: 100vw;
        margin-left: auto;
        margin-right: auto;
        height: 160px;
      }

      /* EXPANDED-CONTENT (Expand button cliccato) */
      .dashboard.expanded-content.vertical {
        max-height: none;
        height: auto;
      }

      .dashboard.expanded-content.horizontal {
        width: 100%;
        height: auto;
        max-height: 80vh;
      }

      /* Layout base VERTICALE */
      .dashboard.vertical {
        flex-direction: column;
      }

      /* Layout base ORIZZONTALE */
      .dashboard.horizontal {
        flex-direction: row;
        width: auto;
        margin: 0 auto;
        max-width: 100%;
      }
      .dashboard.horizontal .header {
        border-bottom: none !important;
      }
      .dashboard.horizontal .content,
      .dashboard.horizontal .header {
        display: flex;
        flex-direction: row;
        overflow-x: auto;
        overflow-y: hidden;
        white-space: nowrap;
        scroll-snap-type: x mandatory;
        scrollbar-width: thin;
        scrollbar-color: var(--primary-color) transparent;
      }

      /* Quando expanded */
      .dashboard.horizontal.expanded-content .content {
        flex-wrap: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        white-space: nowrap;
        scroll-snap-type: x mandatory;
      }

      /* Card larghezza */
      .dashboard.horizontal .card,
      .dashboard.horizontal .sensor,
      .dashboard.horizontal .person,
      .dashboard.horizontal .button,
      .dashboard.horizontal .cover,
      .dashboard.horizontal .climate,
      .dashboard.horizontal .media-player,
      .dashboard.horizontal .fan {
        width: auto;
        flex-shrink: 0;0
        scroll-snap-align: start;
        flex-direction: column;
        display: flex;
        transform: scale(0.8);
      }
      .dashboard.horizontal.collapsed .card,
      .dashboard.horizontal.collapsed .sensor,
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
        flex-shrink: 0;0
        scroll-snap-align: start;
        display: flex;
        transform: scale(1);
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
      .dashboard:hover .toggle {
        opacity: 1;
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
        border-color: var(--primary-color, var(--primary-color));
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
      .sensor:hover {
        background: transparent;
        border-color: var(--primary-color, var(--primary-color));
      }
      .sensor {
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

      .dashboard:not(.collapsed) .person,
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
        border-color: var(--primary-color, var(--primary-color));
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        transform: scale(1.05);
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
        border-color: var(--primary-color, var(--primary-color));
        box-shadow: 1px 1px 3px var(--primary-color);
        transform: scale(1.05);
      }

      .dashboard.collapsed .person-image {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        margin: 0;
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

      .dashboard.collapsed .sensor,
      .dashboard.collapsed .weather,
      .dashboard.collapsed .media-player,
      .dashboard.collapsed .fan,
      .dashboard.collapsed .cover,
      .dashboard.collapsed .climate,
      .dashboard.collapsed .button {
        width: 56px;
        height: 56px;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        box-sizing: border-box;
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
        animation: snow 3s linear infinite;
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
        box-shadow: none;
        border-radius: 16px;
        padding: 8px 8px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s;
      }

      .control-button:hover {
        filter: brightness(1.1);
      }

      .control-button:active {
        transform: scale(0.98);
      }

      .slider-container {
        width: 100%;
        margin-top: 8px;
      }

      .slider {
        width: 100%;
        -webkit-appearance: none;
        height: 6px;
        border-radius: 3px;
        background: var(--secondary-background-color);
        outline: none;
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
        color: var(--state-icon-active-color, #fbc02d);
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

      @keyframes snow {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
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
  }
  _toggleExpandContent() {
    this._expandContent = !this._expandContent;
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

    // Se ha collapsed:true/false, gestiscilo
    if (entity.hasOwnProperty('collapsed')) {
      if (entity.collapsed === true && !this._collapsed) return html``;
      if (entity.collapsed === false && this._collapsed) return html``;
    }

    if (entity.type === 'custom_card') {
      const id = entity.card.entity || entity.card.unique_id || JSON.stringify(entity.card);
      const card = this._createdCards.get(id);
      if (card) {
        card.hass = this.hass;
        return card;
      } else {
        this._createCustomCard(entity);
        return html``;
      }
    }

    if (!entity.entity) return html``;

    const state = this.hass.states[entity.entity];
    if (!state) return html``;

    const domain = entity.entity.split('.')[0];

    switch (domain) {
      case 'weather':
        return this._renderWeather(entity);
      case 'person':
        return this._renderPerson(entity);
      case 'sensor':
        return this._renderSensor(entity);
      case 'cover':
        return this._renderCover(entity);
      case 'climate':
        return this._renderClimate(entity);
      case 'switch':
      case 'input_boolean':
        return this._renderSwitch(entity);
      case 'script':
      case 'button':
        return this._renderButton(entity);
      case 'input_text':
        return this._renderInputText(entity);
      case 'fan':
        return this._renderFan(entity);
      case 'media_player':
        return this._renderMediaPlayer(entity);
      case 'light':
        return this._renderLight(entity);
      default:
        return html``;
    }
  }

  _renderCover(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;
    const isOpen = state.state === 'open';
    const position = state.attributes.current_position;
    this._localPosition = position ?? 0;
    return html`
      <div class="card cover">
        ${this._collapsed ? html`
        	<div class="collapsed-clickable-box"
        		tabindex="0"
        		@click=${(e) => {
        			e.stopPropagation();
        			this._showMoreInfo(config.entity);
        		}}
        		@contextmenu=${(e) => this._handleHoldAction(e, config)}>
        		<div class="icon">
        			${this._renderIcon(config, 'cover')}
        		</div>
        	</div>
        ` : html`
          <div class="value" @click=${(e) => { e.stopPropagation(); this._handleTapAction(config); }}>
            ${config.name || state.attributes.friendly_name}
          </div>
          <div class="label">${this._capitalize(state.state)}</div>
          <div class="cover-actions" style="margin-top: auto;">
            <div class="button-row" style="display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
              ${['opening', 'stopped', 'closing'].map(action => {
                const iconMap = {
                  opening: 'mdi:arrow-up',
                  stopped: 'mdi:stop',
                  closing: 'mdi:arrow-down'
                };
                const serviceMap = {
                  opening: 'open_cover',
                  stopped: 'stop_cover',
                  closing: 'close_cover'
                };
                const isActive = state.state === action;
                return html`
                  <button
                    class="dash-button"
                    style="
                      background: ${isActive ? 'var(--state-icon-active-color)' : 'var(--primary-color)'};
                      color: var(--text-primary-color, #ffffff);
                      border: none;
                      border-radius: 10px;
                      padding: 6px;
                      width: 36px;
                      height: 36px;
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      cursor: pointer;
                      transition: all 0.3s ease;
                      box-shadow: ${isActive ? '0 0 8px var(--state-icon-active-color)' : 'none'};
                    "
                    @click=${(e) => {
                      e.stopPropagation();
                      this._callService('cover', serviceMap[action], config.entity);
                    }}
                    title="${this._capitalize(action)}"
                  >
                    <ha-icon icon="${iconMap[action]}" style="color: var(--text-primary-color, #ffffff);"></ha-icon>
                  </button>
                `;
              })}
            </div>
            ${position !== undefined ? html`
              <div class="slider-container" style="margin-top: 10px; width: 100%;">
                <input
                  type="range"
                  class="slider"
                  .value=${this._localPosition}
                  @input=${(e) => this._localPosition = e.target.value}
                  @change=${(e) => this._callService('cover', 'set_cover_position', config.entity, { position: Number(e.target.value) })}
                  min="0"
                  max="100"
                  step="1"
                  style="
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: var(--secondary-background-color);
                    outline: none;
                    cursor: pointer;
                  "
                >
                <style>
                  input.slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    cursor: pointer;
                    box-shadow: 0 0 6px var(--primary-color);
                    margin-top: -5px;
                  }

                  input.slider::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    cursor: pointer;
                    box-shadow: 0 0 6px var(--primary-color);
                  }

                  input.slider::-webkit-slider-runnable-track,
                  input.slider::-moz-range-track {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: var(--secondary-background-color);
                  }
                </style>
              </div>
            ` : ''}
          </div>
        `}
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
      'off': 'mdi:power',
      'heat': 'mdi:fire',
      'cool': 'mdi:snowflake',
      'auto': 'mdi:autorenew',
      'dry': 'mdi:water-off',
      'fan_only': 'mdi:fan'
    };

    return html`
      <div class="card climate">
        ${this._collapsed ? html`
        	<div class="collapsed-clickable-box"
        		tabindex="0"
        		@click=${(e) => {
        			e.stopPropagation();
        			this._showMoreInfo(config.entity);
        		}}
        		@contextmenu=${(e) => this._handleHoldAction(e, config)}>
        		<div class="icon">
        			${this._renderIcon(config, 'climate')}
        		</div>
        	</div>
        ` : html`
          <div class="value" @click=${(e) => { e.stopPropagation(); this._handleTapAction(config); }}>
            ${current_temperature}°${state.attributes.temperature_unit}
          </div>
          <div class="label"
            style="cursor: pointer;"
            @click=${(e) => this._handleTapAction(config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            ${config.name || state.attributes.friendly_name}
          </div>

          <div class="climate-controls" style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
            <div class="button-row" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
              ${hvac_modes?.map(mode => html`
                <button
                  class="dash-button ${state.state === mode ? 'active' : ''}"
                  style="
                    background: ${state.state === mode ? 'var(--primary-color)' : '#727272'};
                    color: var(--text-primary-color, #ffffff);
                    border: none;
                    border-radius: 10px;
                    padding: 6px;
                    width: 36px;
                    height: 36px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                  "
                  @click=${(e) => {
                    e.stopPropagation();
                    this._callService('climate', 'set_hvac_mode', config.entity, { hvac_mode: mode });
                  }}
                  title="${this._capitalize(mode)}"
                >
                  <ha-icon icon="${modeIcons[mode] || 'mdi:help-circle'}"></ha-icon>
                </button>
              `)}
            </div>

            <div class="slider-container" style="margin-top: 10px; width: 100%;">
              <input
                type="range"
                class="slider"
                .value=${temperature}
                @change=${(e) => {
                  this._callService('climate', 'set_temperature', config.entity, { temperature: Number(e.target.value) });
                }}
                min=${min_temp}
                max=${max_temp}
                step="0.5"
                style="
                  -webkit-appearance: none;
                  appearance: none;
                  width: 100%;
                  height: 6px;
                  border-radius: 4px;
                  background: var(--secondary-background-color);
                  outline: none;
                  cursor: pointer;
                "
              >
            </div>

            <div class="label" style="text-align: center; margin-top: 4px;">
              Target: ${temperature}°${state.attributes.temperature_unit}
            </div>

            <style>
              input.slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--primary-color);
                cursor: pointer;
                box-shadow: 0 0 4px var(--primary-color);
              }
              input.slider::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--primary-color);
                cursor: pointer;
                box-shadow: 0 0 4px var(--primary-color);
              }
              input.slider::-webkit-slider-runnable-track,
              input.slider::-moz-range-track {
                width: 100%;
                height: 6px;
                border-radius: 4px;
                background: var(--secondary-background-color);
              }
            </style>
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
    const min = state.attributes.min_temp || 7;
    const max = state.attributes.max_temp || 35;

    newTemp = Math.max(min, Math.min(max, newTemp));
    this._localTemp = newTemp;  // aggiorna subito la variabile locale

    // invia comunque il comando a HA
    this._callService('climate', 'set_temperature', entityId, { temperature: newTemp });
  }


  _renderLight(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const isOn = state.state === 'on';
    const brightness = state.attributes.brightness || 0;

    return html`
      <div class="card light">
        ${this._collapsed ? html`
          <div class="collapsed-clickable-box"
            tabindex="0"
            @click=${(e) => this._handleTapAction(config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            <div class="icon">
              ${this._renderIcon(config, 'light')}
            </div>
          </div>
        ` : html`
          <div class="light-header"
            style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 0 6px;">
            <div class="value" @click=${(e) => { e.stopPropagation(); this._handleTapAction(config); }}>
              ${config.name || state.attributes.friendly_name}
            </div>
            <label class="toggle-switch" @click=${(e) => e.stopPropagation()}>
              <input type="checkbox"
                ?checked=${isOn}
                @change=${(e) => {
                  e.stopPropagation();
                  this._callService('light', isOn ? 'turn_off' : 'turn_on', config.entity);
                }}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          ${isOn ? html`
            <div class="slider-container" style="margin-top: 10px;">
              <input type="range" class="slider"
                .value=${(brightness / 255) * 100}
                @change=${(e) => this._callService('light', 'turn_on', config.entity, { brightness: Math.round((e.target.value / 100) * 255) })}
                min="0" max="100" step="1">
            </div>
          ` : ''}
        `}
      </div>
    `;
  }
  _renderSwitch(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const isOn = state.state === 'on';
    const domain = config.entity.split('.')[0];

    return html`
      <div class="card switch">
        ${this._collapsed ? html`
          <div class="collapsed-clickable-box"
            tabindex="0"
            @click=${(e) => this._handleTapAction(config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            <div class="icon">
              ${this._renderIcon(config, 'switch')}
            </div>
          </div>
        ` : html`
          <div class="switch-header"
            style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 0 6px;">
            <div class="value" @click=${(e) => { e.stopPropagation(); this._handleTapAction(config); }}>
              ${config.name || state.attributes.friendly_name}
            </div>
            <label class="toggle-switch" @click=${(e) => e.stopPropagation()}>
              <input type="checkbox"
                ?checked=${isOn}
                @change=${(e) => {
                  e.stopPropagation();
                  this._callService(domain, isOn ? 'turn_off' : 'turn_on', config.entity);
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
          <div class="value" @click=${(e) => { e.stopPropagation(); this._handleTapAction(config); }}>
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
  _renderInputText(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    return html`
      <div class="card input-text">
        ${this._collapsed ? html`
          <div class="collapsed-clickable-box"
            tabindex="0"
            @click=${(e) => this._handleAction(e, config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            <div class="icon">
              ${this._renderIcon(config, 'input_text')}
            </div>
          </div>
        ` : html`
          <div class="value"
            @click=${(e) => { e.stopPropagation(); this._handleTapAction(config); }}>
            ${config.name || state.attributes.friendly_name}
          </div>
          <input
            type="text"
            class="input-field"
            .value=${state.state}
            @change=${(e) => this._callService('input_text', 'set_value', config.entity, { value: e.target.value })}>
        `}
      </div>
    `;
  }

  _renderFan(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const isOn = state.state === 'on';
    const speed = state.attributes.percentage || 0;

    return html`
      <div class="card fan">
        ${this._collapsed ? html`
        	<div class="collapsed-clickable-box"
        		tabindex="0"
        		@click=${(e) => {
        			e.stopPropagation();
        			this._showMoreInfo(config.entity);
        		}}
        		@contextmenu=${(e) => this._handleHoldAction(e, config)}>
        		<div class="icon">
        			${this._renderIcon(config, 'fan')}
        		</div>
        	</div>
        ` : html`
          <div class="value"
            tabindex="0"
            @click=${(e) => this._handleAction(e, config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            ${config.name || state.attributes.friendly_name}
          </div>
          <label class="toggle-switch">
            <input type="checkbox"
              ?checked=${isOn}
              @change=${(e) => {
                e.stopPropagation();
                this._callService('fan', isOn ? 'turn_off' : 'turn_on', config.entity);
              }}>
            <span class="toggle-slider"></span>
          </label>
          ${isOn ? html`
            <div class="slider-container" style="margin-top: 10px;">
              <input type="range" class="slider"
                .value=${speed}
                @change=${(e) => this._callService('fan', 'set_percentage', config.entity, { percentage: Number(e.target.value) })}
                min="0" max="100" step="1">
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
    const volume = state.attributes.volume_level || 0;

    const mediaControls = [
      { action: 'media_previous_track', icon: 'mdi:skip-previous' },
      { action: 'media_play_pause', icon: isPlaying ? 'mdi:pause' : 'mdi:play' },
      { action: 'media_next_track', icon: 'mdi:skip-next' }
    ];

    return html`
      <div class="card media-player">
        ${this._collapsed ? html`
        	<div class="collapsed-clickable-box"
        		tabindex="0"
        		@click=${(e) => {
        			e.stopPropagation();
        			this._showMoreInfo(config.entity);
        		}}
        		@contextmenu=${(e) => this._handleHoldAction(e, config)}>
        		<div class="icon">
        			${this._renderIcon(config, 'media_player')}
        		</div>
        	</div>
        ` : html`
          <div class="value"
            @click=${(e) => { e.stopPropagation(); this._handleTapAction(config); }}>
            ${config.name || state.attributes.friendly_name}
          </div>
          <div class="media-info">
            <div class="track-name">${state.attributes.media_title || 'Nessuna traccia in riproduzione'}</div>
            <div class="track-artist">${state.attributes.media_artist || ''}</div>
          </div>

          <div class="media-controls" style="display: flex; justify-content: center; gap: 8px; margin-top: 12px;">
            ${mediaControls.map(control => html`
              <button
                class="dash-button"
                style="
                  background: var(--primary-color);
                  color: var(--text-primary-color, #ffffff);
                  border: none;
                  border-radius: 10px;
                  padding: 8px;
                  width: 36px;
                  height: 36px;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  transition: all 0.3s ease;
                "
                @click=${(e) => { e.stopPropagation(); this._callService('media_player', control.action, config.entity); }}
              >
                <ha-icon icon="${control.icon}" style="color: var(--text-primary-color, #ffffff);"></ha-icon>
              </button>
            `)}
          </div>
          <div class="slider-container" style="margin-top: 10px; width: 100%;">
            <input type="range"
              class="slider"
              .value=${volume * 100}
              @change=${(e) => this._callService('media_player', 'volume_set', config.entity, { volume_level: Number(e.target.value) / 100 })}
              min="0"
              max="100"
              step="1"
              style="
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 6px;
                border-radius: 4px;
                background: var(--secondary-background-color);
                outline: none;
                cursor: pointer;
              ">
          </div>

          <style>
            input.slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: var(--primary-color);
              cursor: pointer;
              box-shadow: 0 0 4px var(--primary-color);
            }

            input.slider::-moz-range-thumb {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: var(--primary-color);
              cursor: pointer;
              box-shadow: 0 0 4px var(--primary-color);
            }

            input.slider::-webkit-slider-runnable-track,
            input.slider::-moz-range-track {
              width: 100%;
              height: 6px;
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
            <div class="weather-icon ${weatherIcon.animation}">${weatherIcon.icon}</div>
          </div>
        ` : html`
          <div class="weather-icon ${weatherIcon.animation}"></div>
          <div class="value"
            tabindex="0"
            @click=${(e) => this._handleAction(e, config)}
            @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            ${state.attributes.temperature}°${state.attributes.temperature_unit || ""}
          </div>
          <div class="label">${config.name || weatherState}</div>
          ${state.attributes.humidity ? html`
            <div class="label">${this._getTranslation('ui.card.weather.attributes.humidity', 'Humidity')}: ${state.attributes.humidity}%</div>
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
        input_text: "mdi:text-box",
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
    this._collapsed = config.collapsed || true;
  }
render() {
  if (!this.hass || !this.config) return html``;

  const mode = this.config.mode || 'vertical';
  const align = this.config.align || 'top';

  const isVertical = mode === 'vertical';
  const isHorizontal = mode === 'horizontal';

  const dashboardClasses = [
    "dashboard",
    this._collapsed ? "collapsed" : "",
    isVertical ? "vertical" : "horizontal",
    this._expandContent ? "expanded-content" : ""
  ].join(" ");

  const width = this.config.width || (isHorizontal ? '80vw' : 'auto');
  const height = this.config.height || (this._collapsed ? 'auto' : '25vh');

  const dashboardStyle = `
    width: 100%;
    height: ${height};
    --dashboard-width: ${width};
  `;

  const dashboardHtml = html`
    <div class="${dashboardClasses}" style="${dashboardStyle}">
      <div class="header" @click=${this._toggleCollapse}>
        <div class="clock">${this._time}</div>
        ${!this._collapsed ? html`
          <div class="title">${this._parseTitle(this.config.title || "Dashboard")}</div>
        ` : ''}
      </div>

      <div class="content">
        ${this.config.entities.map(entity => this._renderEntity(entity))}
      </div>

      ${isVertical ? html`
        <div class="expand-button" @click=${this._toggleExpandContent}>
          ${this._expandContent ? "⌃" : "⌄"}
        </div>
      ` : null}
    </div>
  `;

  const justify =
    align === 'left'   ? 'flex-start' :
    align === 'right'  ? 'flex-end' :
                         'center';

  const alignItems =
    align === 'top'    ? 'flex-start' :
    align === 'bottom' ? 'flex-start' :
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
        width: ${width};
        height: ${height};
        max-width: none;
        margin: 0;
        background: transparent;
        box-shadow: none;
      ">
        ${dashboardHtml}
        ${this._renderPersonModal()}
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
                enum: ["weather", "person", "sensor", "cover", "climate", "switch", "script", "button", "input_boolean", "input_text", "fan", "media_player", "light", "custom_card"]
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
if (!customElements.get('ha-map')) {
  const script = document.createElement('script');
  script.type = 'module';
  script.src = '/frontend_latest/map/ha-map.js';
  script.onload = () => console.log('[sidebar] ha-map caricato via script fallback');
  script.onerror = () => console.error('[sidebar] Errore nel caricamento ha-map fallback');
  document.head.appendChild(script);
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-dashboard-sidebar",
  name: "Dashboard Sidebar",
  preview: true,
  description: "A collapsible sidebar dashboard for Home Assistant"
});
