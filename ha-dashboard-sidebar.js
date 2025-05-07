import { until } from "https://unpkg.com/lit-html/directives/until.js?module";
import { loadHaComponents, DEFAULT_HA_COMPONENTS } from "https://cdn.jsdelivr.net/npm/@kipk/load-ha-components/+esm";
import { LitElement, html, css, nothing } from "https://unpkg.com/lit@2.8.0/index.js?module";

loadHaComponents([
  ...DEFAULT_HA_COMPONENTS,
  "ha-icon",
  "ha-icon-picker",
  "ha-dialog",
]).catch(() => {});
class HaDashboardSidebarEditor extends LitElement {
  static properties = {
    hass: { type: Object },
    _config: { type: Object },
    _pickerOpenIndex: { state: true },
    _zIndexActive: { state: true }
  };

  constructor() {
    super();
    this._config = {
      title: "",
      width: "",
      height: "",
      mode: "vertical",
      align: "left",
      entities: [],
      start_expanded: false,

    };
    this._pickerOpenIndex = null;
    this._zIndexActive = false;
    this._widthRaw = "";
    this._heightRaw = "";
    this._expandedIndex = null;
  }

  setConfig(cfg) {
    this._config = {
      type: "custom:ha-dashboard-sidebar",
      title: cfg?.title ?? "",
      width: cfg?.width ?? "",
      height: cfg?.height ?? "",
      mode: cfg?.mode ?? "vertical",
      align: cfg?.align ?? "left",
      entities: Array.isArray(cfg?.entities) ? cfg.entities : [],
      start_expanded: cfg?.start_expanded ?? false, // ✅ aggiunto
    };

    // Serve per i campi controllati nei textfield (evita reset visivi)
    this._widthRaw = this._config.width?.replace("px", "") ?? "";
    this._heightRaw = this._config.height?.replace("px", "") ?? "";
  }

  getConfig() {
    return this._config;
  }
  _toggleExpander(index) {
    this._expandedIndex = this._expandedIndex === index ? null : index;
  }
  _push(field, val) {
    const updated = { ...this._config };

    if (field === "width" || field === "height") {
      const clean = val?.trim();
      if (!clean) {
        delete updated[field];
      } else if (/^\d+$/.test(clean)) {
        updated[field] = `${clean}px`;
      } else {
        updated[field] = clean;
      }
    } else {
      updated[field] = val;
    }

    this._config = updated;
    this.requestUpdate();

    const cfg = { type: "custom:ha-dashboard-sidebar", ...this._config };
    if (cfg.mode === "horizontal") {
      delete cfg.align;
    }

    // Rimuovi height se vuoto anche da export finale
    if (!cfg.height) delete cfg.height;

    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: cfg },
      bubbles: true,
      composed: true,
    }));
  }

  _row(i, key, val) {
    const ents = [...this._config.entities];
    ents[i] = { ...ents[i], [key]: val };

    if (key === "type") {
      const newType = val;
      ents[i] = {
        type: newType,
        icon: ents[i].icon || "",
        ...(newType === "custom_card" ? { card: ents[i].card || {} } : { entity: "" }),
        tap_action: { action: "more-info" },
        hold_action: { action: "none" },
        double_tap_action: { action: "none" }
      };
    }

    this._push("entities", ents);
  }


  _add() {
    const ents = [...this._config.entities, { type: "sensor", entity: "" }];
    this._push("entities", ents);
  }

  _del(i) {
    const ents = [...this._config.entities];
    ents.splice(i, 1);
    this._push("entities", ents);
  }
  async _openCardPicker(index) {
    console.log("🛠️ Avvio _openCardPicker per l'indice:", index);

    const createPicker = () => {
      const p = document.createElement("hui-card-picker");
      p.hass = this.hass;
      p.lovelace = editorContext.lovelace;
      p.value = this._config.entities[index]?.card || {};
      p.style = "width: 100%; display: block;";
      p.addEventListener("config-changed", (ev) => {
        const config = ev.detail.config || ev.detail.value;
        if (config && config.type) handleSelection(config);
      });
      return p;
    };

    const deepQuery = (root, sel) => {
      const direct = root.querySelector(sel);
      if (direct && !direct.tagName?.includes("DASHBOARD-SIDEBAR")) return direct;
      for (const el of root.querySelectorAll("*")) {
        if (el.shadowRoot) {
          const inside = deepQuery(el.shadowRoot, sel);
          if (inside && !inside.tagName?.includes("DASHBOARD-SIDEBAR")) return inside;
        }
      }
      return null;
    };

    const editorContext = deepQuery(document.body, "hui-card-element-editor, ha-card-element-editor");
    if (!editorContext) {
      console.error("❌ Contesto Lovelace non trovato.");
      return;
    }

    let guiEditor;
    let yamlEditor;
    let showingYaml = false;
    let picker = createPicker();

    const dialog = document.createElement("ha-dialog");
    dialog.setAttribute("open", "");
    dialog.setAttribute("scrimClickAction", "");
    dialog.setAttribute("escapeKeyAction", "");
    dialog.classList.add("sidebar-editor-dialog");
    dialog.style.cssText = `
      --dialog-content-padding: 0;
      display: flex;
      flex-direction: column;
    `;

    const toggleYamlButton = document.createElement("mwc-button");
    toggleYamlButton.innerText = "";
    toggleYamlButton.style.display = "none";
    toggleYamlButton.addEventListener("click", async () => {
      showingYaml = !showingYaml;
      toggleYamlButton.innerText = showingYaml ? "" : "";

      if (showingYaml && guiEditor) {
        try {
          const currentConfig = await guiEditor.getConfig?.() ?? guiEditor._config ?? guiEditor.value ?? picker.value;
          const dumpYaml = window.jsyaml?.dump ?? ((x) => JSON.stringify(x, null, 2));
          yamlEditor.yaml = dumpYaml(currentConfig);
        } catch (e) {
          console.warn("❌ Errore nel dump della GUI", e);
          yamlEditor.yaml = "";
        }
      }

      if (guiEditor) guiEditor.style.display = showingYaml ? "none" : "flex";
      if (yamlEditor) yamlEditor.style.display = showingYaml ? "flex" : "none";
    });

    const saveButton = document.createElement("mwc-button");
    saveButton.innerText = "Salva";
    saveButton.slot = "primaryAction";
    saveButton.addEventListener("click", () => {
      let newConfig;
      try {
        newConfig = showingYaml && yamlEditor
          ? yamlEditor.yaml
            ? window.jsyaml?.load?.(yamlEditor.yaml) ?? JSON.parse(yamlEditor.yaml)
            : {}
          : guiEditor._config || guiEditor.value || picker.value;
      } catch (e) {
        console.error("❌ YAML non valido", e);
        alert("Errore nel parsing YAML, controlla la sintassi.");
        return;
      }
      const ents = [...this._config.entities];
      ents[index] = { ...ents[index], card: newConfig };
      this._push("entities", ents);
      dialog.remove();
    });

    const closeButton = document.createElement("mwc-button");
    closeButton.innerText = "Chiudi";
    closeButton.slot = "secondaryAction";
    closeButton.addEventListener("click", () => dialog.remove());

    const backButton = document.createElement("mwc-button");
    backButton.innerText = "Indietro";
    backButton.slot = "secondaryAction";
    backButton.style.display = "none";
    backButton.addEventListener("click", () => {
      picker = createPicker();
      contentWrapper.innerHTML = "";
      contentWrapper.appendChild(picker);
      backButton.style.display = "none";
    });


    dialog.append(closeButton, backButton, saveButton);

    const footer = document.createElement("div");
    footer.style.cssText = `
      display: flex;
      justify-content: flex-start;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid var(--divider-color);
    `;
    footer.append(toggleYamlButton);

    const contentWrapper = document.createElement("div");
    contentWrapper.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
      padding: 25px;
      min-height: 0;
      background: var(--card-background-color);
    `;

    const handleSelection = async (cardConfig) => {
      if (!cardConfig || !cardConfig.type) return;
      picker.remove();
      backButton.style.display = "";
      contentWrapper.innerHTML = "";

      try {
        const helpers = await window.loadCardHelpers?.();

        const el = await helpers.createCardElement(cardConfig);
        el.hass = this.hass;
        await el.setConfig?.(cardConfig);
        const editor = await el.constructor.getConfigElement?.();
        if (!editor) throw new Error("Editor grafico non disponibile");

        await editor.setConfig(cardConfig);
        editor.hass = this.hass;
        editor.lovelace = editorContext.lovelace;
        editor.style.cssText = `
          width: 100%;
          display: block;
          flex: 0 0 auto;
        `;

        guiEditor = editor;

        yamlEditor = document.createElement("ha-yaml-editor");
        yamlEditor.hass = this.hass;
        yamlEditor.setAttribute("label", "YAML");
        yamlEditor.setAttribute("mode", "yaml");
        yamlEditor.setAttribute("autofocus", "true");
        yamlEditor.style.cssText = `
          flex: 0 0 auto;
          display: none;
          overflow: auto;
        `;
        const dumpYaml = window.jsyaml?.dump ?? ((x) => JSON.stringify(x, null, 2));
        yamlEditor.value = dumpYaml(cardConfig);
        yamlEditor.addEventListener("value-changed", (ev) => {
          yamlEditor.yaml = ev.detail.value;
        });

        const preview = await helpers.createCardElement(cardConfig);
        preview.hass = this.hass;
        const previewWrapper = document.createElement("div");
        previewWrapper.style.cssText = `
          display: flex;
          padding: 12px 16px;
          background: var(--card-background-color);
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          border-top: 1px solid var(--divider-color);
          overflow: hidden;
          flex: 0 0 auto;
        `;

        previewWrapper.appendChild(preview);

        contentWrapper.append(guiEditor, yamlEditor, previewWrapper, footer);
      } catch (e) {
        console.warn("❌ Editor non disponibile, fallback a YAML", e);
        const fallback = document.createElement("pre");
        fallback.innerText = window.jsyaml?.dump?.(cardConfig) ?? JSON.stringify(cardConfig, null, 2);
        fallback.style.padding = "16px";
        contentWrapper.appendChild(fallback);
        contentWrapper.appendChild(footer);
      }
    };

    const container = document.createElement("div");
    container.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
      position: relative;
      padding: 25px;
    `;
    container.appendChild(picker);
    container.appendChild(contentWrapper);

    dialog.appendChild(container);
    document.body.appendChild(dialog);
    setInterval(() => {
      const root = dialog.shadowRoot;
      if (!root) return;

      const surface = root.querySelector(".mdc-dialog__surface");
      const container = root.querySelector(".mdc-dialog__container");
      const content = root.querySelector("#content");
      const slot = root.querySelector("slot#contentslot");

      const isMobile = window.matchMedia("(max-width: 700px)").matches;

      if (surface) {
        surface.style.cssText = `
          width: ${isMobile ? "100vw" : "50vw"} !important;
          max-width: ${isMobile ? "100vw" : "50vw"} !important;
          min-width: ${isMobile ? "100vw" : "20vw"} !important;
          height: ${isMobile ? "100vh" : "auto"} !important;
          max-height: ${isMobile ? "100vh" : "90vh"} !important;
          min-height: ${isMobile ? "100vh" : "50vh"} !important;
          margin: auto !important;
          padding: 0px !important;
          border-radius: ${isMobile ? "0" : "24px"} !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
          overflow: auto !important;
        `;
      }

      if (container) {
        container.style.cssText = `
          width: ${isMobile ? "100vw" : "auto"} !important;
          height: ${isMobile ? "100vh" : "auto"} !important;
          margin: auto !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
        `;
      }

      if (content) {
        content.style.setProperty("flex", "1", "important");
        content.style.setProperty("display", "flex", "important");
        content.style.setProperty("flex-direction", "column", "important");
        content.style.setProperty("overflow", "auto", "important");
      }

      if (slot) {
        slot.style.setProperty("flex", "1", "important");
        slot.style.setProperty("min-height", "0", "important");
      }
    }, 100);

  }
  render() {
    if (!this.hass) return html``;

    const typeOpts = [
      "sensor", "person", "weather", "light", "switch", "fan", "cover",
      "climate", "media_player", "button", "script", "custom_card"
    ].map(t => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }));

    return html`
      <ha-textfield class="full" label="Sidebar title"
        .value=${this._config.title}
        @input=${e => this._push("title", e.target.value)}>
      </ha-textfield>

      <div class="row triple">
        <ha-selector class="sel" .hass=${this.hass}
          .selector=${{
            select: {
              mode: "dropdown", // <- questo forza il menu a tendina
              options: [
                { value: "vertical", label: "Vertical" },
                { value: "horizontal", label: "Horizontal" }
              ]
            }
          }}
          .value=${this._config.mode}
          @value-changed=${e => this._push("mode", e.detail.value)}>
        </ha-selector>
        <ha-selector class="sel" .hass=${this.hass}
          .selector=${{
            select: {
              mode: "dropdown",
              options: [
                { value: "left", label: "Left" },
                { value: "right", label: "Right" },
                { value: "none", label: "None" }
              ]
            }
          }}
          .value=${this._config.align}
          ?hidden=${this._config.mode === "horizontal"}
          @value-changed=${e => this._push("align", e.detail.value)}>
        </ha-selector>

        <ha-formfield class="switch" label="Start expanded">
          <ha-switch
            .checked=${this._config.start_expanded ?? false}
            @change=${e => this._push("start_expanded", e.target.checked)}>
          </ha-switch>
        </ha-formfield>
      </div>


      <div class="row">
        <ha-textfield class="full" label="Width (in px)"
          .value=${this._config.width?.replace("px", "") || ""}
          ?hidden=${this._config.mode === "horizontal"}
          @input=${e => this._widthRaw = e.target.value}
          @blur=${() => this._push("width", this._widthRaw.trim())}>
        </ha-textfield>

        <ha-textfield class="full" label="Height (in px)"
          .value=${this._config.height?.replace("px", "") || ""}
          @input=${e => this._heightRaw = e.target.value}
          @blur=${() => this._push("height", this._heightRaw.trim())}>
        </ha-textfield>
      </div>
      ${this._config.entities.map((ent, i) => html`
        <div class="divider">
          <b>Card ${i + 1}</b><span></span>
          <ha-icon icon="mdi:close-circle" class="delete" @click=${() => this._del(i)} title="Remove"></ha-icon>
        </div>
        <div class="row">
          <div class="column" style="min-width: 50px;">
            <div class="field-label">Type</div>
            <ha-selector class="sel small" .hass=${this.hass}
              .selector=${{ select: { options: typeOpts } }}
              .value=${ent.type || "sensor"}
              @value-changed=${e => this._row(i, "type", e.detail.value)}>
            </ha-selector>
          </div>
          <div class="column" style="min-width: 50px;">
            <div class="field-label">Icon</div>
            <ha-icon-picker class="sel icon-cell" .hass=${this.hass}
              .value=${ent.icon || ""}
              @value-changed=${e => this._row(i, "icon", e.detail.value)}>
            </ha-icon-picker>
          </div>
        </div>
        <div class="column">
          ${ent.type !== "custom_card"
            ? html`
                <div class="field-label">Entity</div>
                <ha-selector class="full" .hass=${this.hass}
                  .selector=${{ entity: { domain: [ent.type] } }}
                  .value=${ent.entity}
                  @value-changed=${e => this._row(i, "entity", e.detail.value)}>
                </ha-selector>`
            : html`
                <mwc-button class="yaml"
                  title="For complex cards, build it outside and paste it in YAML mode."
                  @click=${() => this._openCardPicker(i)}>
                  Select Card (YAML editor not available yet)
                </mwc-button>
          }

          <details class="expander">
            <summary><ha-icon icon="mdi:gesture-tap-button"></ha-icon><b> Azioni Interazione</b></summary>

            <!-- Tap Action -->
            <div class="field-label">Tap Action</div>
            <ha-selector class="full" .hass=${this.hass}
              .selector=${{ ui_action: {} }}
              .value=${ent.tap_action || { action: "default" }}
              @value-changed=${e => this._row(i, "tap_action", e.detail.value)}>
            </ha-selector>
            ${ent.tap_action?.action === "more-info" ? html`
              <div class="field-label">Show entity (optional)</div>
              <ha-selector class="full" .hass=${this.hass}
                .selector=${{ entity: {} }}
                .value=${ent.tap_action.entity || ""}
                @value-changed=${e => {
                  const updated = { ...(ent.tap_action || { action: "more-info" }) };
                  updated.entity = e.detail.value;
                  this._row(i, "tap_action", updated);
                }}>
              </ha-selector>
            ` : ""}

            <!-- Hold Action -->
            <div class="field-label">Hold Action</div>
            <ha-selector class="full" .hass=${this.hass}
              .selector=${{ ui_action: {} }}
              .value=${ent.hold_action || { action: "none" }}
              @value-changed=${e => this._row(i, "hold_action", e.detail.value)}>
            </ha-selector>
            ${ent.hold_action?.action === "more-info" ? html`
              <div class="field-label">Show entity (optional)</div>
              <ha-selector class="full" .hass=${this.hass}
                .selector=${{ entity: {} }}
                .value=${ent.hold_action.entity || ""}
                @value-changed=${e => {
                  const updated = { ...(ent.hold_action || { action: "more-info" }) };
                  updated.entity = e.detail.value;
                  this._row(i, "hold_action", updated);
                }}>
              </ha-selector>
            ` : ""}

            <!-- Double Tap Action -->
            <div class="field-label">Double Tap Action</div>
            <ha-selector class="full" .hass=${this.hass}
              .selector=${{ ui_action: {} }}
              .value=${ent.double_tap_action || { action: "none" }}
              @value-changed=${e => this._row(i, "double_tap_action", e.detail.value)}>
            </ha-selector>
            ${ent.double_tap_action?.action === "more-info" ? html`
              <div class="field-label">Show entity (optional)</div>
              <ha-selector class="full" .hass=${this.hass}
                .selector=${{ entity: {} }}
                .value=${ent.double_tap_action.entity || ""}
                @value-changed=${e => {
                  const updated = { ...(ent.double_tap_action || { action: "more-info" }) };
                  updated.entity = e.detail.value;
                  this._row(i, "double_tap_action", updated);
                }}>
              </ha-selector>
            ` : ""}
          </details>
        </div>
      `)}

      <mwc-button raised class="add" @click=${this._add}>Add entity</mwc-button>
    `;
  }
  static styles = css`
    :host {
      display: block;
      padding: 16px;
      font-size: 14px;
    }

    .full {
      width: 100%;
      margin: 6px 0;
      border-radius: 25px;

    }

    .row,
    .row.triple {
      display: flex;
      gap: 8px;
      margin: 6px 0;
      align-items: center;
      border-radius: 25px;''
    }

    ::marker {
      transform: scale(1.5);
    }
    .row.triple {
      margin: 8px 0;
      flex-wrap: nowrap;
      border-radius: 25px;

    }
    .sel {
      --mdc-shape-small: 6px;
    }

    .sel.small {
      flex: 2;
      border-radius: 25px;
    }

    .icon-cell {
      flex: 1;
      min-width: 100px;
    }

    .row > ha-selector,
    .row .sel {
      flex: 1;
      min-width: 0;
      border-radius: 25px;
    }

    .switch {
      margin-left: auto;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 14px 0 6px;
      color: var(--secondary-text-color);
    }

    .divider span {
      flex: 1;
      height: 1px;
      background: var(--divider-color, rgba(255, 255, 255, 0.15));
    }

    .yaml {
      width: 100%;
      margin-top: 4px;
    }

    .add {
      margin-top: 12px;
    }

    .delete {
      cursor: pointer;
      --mdc-icon-size: 20px;
      color: var(--primary-text-color);
      transition: 0.2s ease;
    }

    .delete:hover {
      color: var(--primary-color);
      transform: scale(1.2);
    }

    .field-label {
      font-size: 14px;
      font-weight: bold;
      margin: 4px 0 2px;
      color: var(--secondary-text-color);
    }

    details.expander {
      margin-top: 12px;
    }

    .expander summary ha-icon {
      --mdc-icon-size: 20px;
      color: var(--primary-text-color); /* corretto: era '---' */
    }
  `;
}
customElements.define("ha-dashboard-sidebar-editor", HaDashboardSidebarEditor);

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
      width: '250px',
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
  static getConfigElement() {
    return document.createElement('ha-dashboard-sidebar-editor');
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
        }
      } catch (err) {
        console.error('[ha-dashboard-sidebar] Errore caricamento ha-map:', err);
      }
    }
  }
  static get styles() {
    return css`
        :host{--sidebar-item-size:56px;display:block;height:100%}
        :root{
          --dashboard-width:200px;
          --state-icon-active-color:var(--primary-color);
        }

        /* ---------- ELEMENTI BASE --------------------------------------------------- */
        ha-card{height:100%}

        .custom-card-container{
          display:flex;flex-direction:column;gap:12px;margin-top:16px;font-size:1.5rem}
        .custom-card-wrapper{
          display:flex;flex-direction:column;align-items:start;justify-content:center;
          width:100%;box-sizing:border-box;font-size:1.5rem}
        .custom-card-wrapper:is(.horizontal,.vertical).collapsed{
          width:56px;height:56px;font-size:1.5rem}

        /* ---------- HEADER & CLOCK -------------------------------------------------- */
        .header{
          display:flex;flex-direction:column;border-radius:16px;align-items:center;justify-content:center;
          padding:24px 20px;background:var(--card-background-color,#1a1b1e);
          border-bottom:1px solid var(--divider-color,rgba(255,255,255,.1));flex-shrink:0;z-index:1}
        @media (max-width: 640px) {
          .header {
            padding: 12px 10px;
            border-radius: 8px;
            width: auto;
            border: none !important;
          }
        }
        @media (max-width: 640px) {
          .title {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .dashboard.horizontal .clock {
            font-size: 1.2em !important;
            transform: scaleX(1.4);
            writing-mode: vertical-rl;
            text-orientation: upright;
            letter-spacing: -6px;
            box-shadow: var(--primary-text-color);
          }
        }
        @media (max-width: 640px) {
          .dashboard.horizontal {
            transform: scale(0.9) !important;
            max-width: 100vw !important;
          }
        }
        .expand-button{
          flex:0 0 auto;text-align:center;padding:10px;cursor:pointer;
          font:700 15px/1 var(--font-family);color:var(--primary-text-color);
          background:var(--card-background-color,#1a1b1e);
          border-top:1px solid var(--divider-color,rgba(255,255,255,.1))!important;
          line-height:1;border-bottom-left-radius:16px;border-bottom-right-radius:16px}
        .expand-button:hover{background:var(--primary-color,#7289da);color:var(--card-background-color,#1a1b1e)}

        .content{
          flex:1 1 auto;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;
          scrollbar-width:none;-ms-overflow-style:none}
        .content::-webkit-scrollbar{width:0;height:0}
        .toggle-area{position:absolute;inset:0;cursor:pointer;background:transparent;z-index:1}

        .clock{
          font-size:2.25rem;font-weight:600;margin-bottom:8px;transition:.3s;
          color:var(--primary-text-color,#fff);letter-spacing:-1px;z-index:1}
        .collapsed .clock{font-size:1.5rem;letter-spacing:0}

        .title{font-size:1rem;font-weight:500;opacity:.7;transition:.3s;
          color:var(--primary-text-color,#fff);margin:0}
        .collapsed .title{opacity:0;height:0}

        /* ---------- CARD BASE ------------------------------------------------------- */
        .card{
          border-radius:var(--ha-card-border-radius,24px);padding:20px;transition:.3s;
          border:1px solid var(--divider-color,rgba(255,255,255,.05));position:relative;overflow:hidden;
          cursor:pointer;backdrop-filter:blur(5px);color:var(--primary-text-color,#fff);flex-shrink:0
        }
        .collapsed .card{padding:12px;display:flex;align-items:center;justify-content:center;aspect-ratio:1}
        .card:hover{border-color:var(--primary-color);transform:translateY(-2px)}

        .value{font-size:1rem;font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:8px;color:var(--primary-text-color,#fff)}
        .label{font-size:1.1rem;transition:.3s;color:var(--primary-text-color,#fff),border-radius:16px!important;box-shadow:var(--primary-text-color)!important}
        .collapsed .value,.collapsed .label{display:none}

        .icon{font-size:24px;color:var(--primary-text-color,#fff);opacity:.9;display:none;transition:.3s}
        .collapsed .icon{display:flex;align-items:center;justify-content:center}

        /* ---------- RIGHE DI PULSANTI ------------------------------------------------ */
        .button-row,.media-controls,.cover-actions{
          display:flex;gap:clamp(2px,1vw,2px);justify-content:center;margin-top:30px
        }

        /* ---------- SENSORI & LUCI --------------------------------------------------- */
        .sensor,.light{
          display:flex;justify-content:space-between;align-items:center;padding:12px;height:auto;
          border-radius:16px;background:var(--card-background-color,rgba(255,255,255,.03));
          border:1px solid var(--divider-color,rgba(255,255,255,.05));
          cursor:pointer;transition:.3s;color:var(--primary-text-color,#fff);flex-shrink:0
        }
        .sensor:hover,.light:hover{background:transparent;border-color:var(--primary-color)}

        /* ---------- MINI‑POPUP ------------------------------------------------------- */
        .mini-popup{
          position:absolute;top:50%!important;left:50%!important;transform:translate(-50%,-90%)!important;
          background:var(--card-background-color);border-radius:16px;z-index:9999;
          padding:0;overflow:visible!important;display:flex;justify-content:center;align-items:center;
          animation:popup-appear .3s ease forwards;min-width:100px;max-width:90vw;max-height:80vh;width:auto;height:auto
        }
        @keyframes popup-appear{0%{opacity:0;transform:scale(.8,.4) translateY(-50px)}100%{transform:scale(1) translateY(0)}}
        .mini-popup.closing{animation:dock-minimize .2s ease forwards;pointer-events:none;transform-origin:left center}
        @keyframes dock-minimize{0%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:scale(.8,.4) translateY(-50px)}}
        .mini-overlay{position:fixed;inset:0;background:rgba(0,0,0,0);z-index:9998}

        .mini-popup::after{
          content:"";position:absolute;top:12px;left:-8px;border-width:8px;border-style:solid;
          border-color:transparent var(--card-background-color,#1a1b1e) transparent transparent
        }
        .mini-popup .mini-close{
          position:absolute;top:8px;right:8px;font-size:1.2em;color:var(--primary-text-color);cursor:pointer;z-index:10;user-select:none
        }
        .mini-popup .mini-close:hover{color:var(--primary-color)}

        /* ---------- PERSONA ---------------------------------------------------------- */
        .person{
          display:flex;align-items:center;background:rgba(255,255,255,.03);
          border-radius:16px;padding:14px 16px;margin-bottom:2px;border:1px solid rgba(255,255,255,.05);
          transition:.3s;cursor:pointer;color:var(--primary-text-color,#fff);box-shadow:0 2px 6px rgba(0,0,0,.1);flex-shrink:0
        }
        .dashboard:not(.collapsed) .person:hover{
          background:rgba(255,255,255,.08);
          border-color:var(--primary-color);
          transform:scale(1.05)
          box-shadow:0 4px 10px rgba(0,0,0,.2)
        }
        .person-image{
          width:50px;height:50px;border-radius:16px;object-fit:cover;margin-right:12px;
          border:2px solid var(--primary-color,#7289da);transition:filter .3s,opacity .3s
        }
        .person-image.grayscale{filter:grayscale(100%) brightness(.7);opacity:.7}
        .person-info{display:flex;flex-direction:column}
        .person-info .name{font-weight:600;font-size:1rem}
        .person-info .status{font-size:.875rem;opacity:.7}

        .presence-badge{
          position:absolute;top:-2px;right:-2px;width:15px;height:15px;border-radius:50%;
          display:flex;justify-content:center;align-items:center;background:#fff;border:2px solid
        }
        .presence-badge ha-icon{--mdc-icon-size:10px;color:#000}
        .presence-badge.home{border-color:#4caf50}
        .presence-badge.away{border-color:#f44336}
        .collapsed .person-info{display:none}

        /* ---------- SENSOR STATE & ICONI ATTIVI ------------------------------------- */
        .sensor-state{
          width:100%;height:100%;background:transparent!important;border:none!important;box-shadow:none!important;
          font-size:.8rem;display:flex;align-items:center;justify-content:center;padding:0!important
        }
        .collapsed .sensor-state{aspect-ratio:1/1;width:36px;height:36px}
        .sensor-state.active{
          background:var(--primary-color,#7289da);color:var(--text-primary-color,white);
        }
        ha-icon.on{color:var(--state-icon-active-color,var(--primary-color,#fbc02d))}
        ha-icon:not(.on){color:var(--disabled-text-color,#666);opacity:.75}
        .sensor-value-wrapper ha-icon:not(.on),.sensor-value-wrapper .sensor-value-text{color:var(--disabled-text-color,#666)}

        /* ---------- DASHBOARD LAYOUT ------------------------------------------------- */
        .dashboard{
          background:var(--card-background-color,#1a1b1e);border-radius:var(--ha-card-border-radius,24px);
          box-shadow:var(--ha-card-box-shadow,0 8px 32px rgba(0,0,0,.25));
          width:auto;max-height:80vh;overflow:hidden;position:relative;backdrop-filter:blur(10px);
          border:1px solid var(--divider-color,rgba(255,255,255,.1));display:flex;flex-direction:column;
          transition:all .5s ease,height .5s,width .5s
        }
        .dashboard.vertical{flex-direction:column;width:var(--dashboard-width)!important;z-index: 1}
        .dashboard.collapsed.horizontal {
          flex-direction:row;width:auto;max-width:90vw;margin-inline:auto;position:relative!important;
          display:flex!important;justify-content:center!important;align-items:center!important
        }
        .dashboard.horizontal {
          flex-direction:row;width:auto;max-width:90vw;margin-inline:auto;position:relative!important;
          display:flex!important;justify-content:center!important;align-items:center!important,min-height:300px!important;z-index:1
        }
        /* collapsed width */
        .dashboard.collapsed.vertical{width:90px!important}

        /* content area scroll */
        .dashboard .content{overflow-y:auto;max-height:100vh;flex:1 1 auto}
        :host(.horizontal):not(.collapsed) {
          --custom-sidebar-height: 300px;
        }
        /* horizontal content scroll */
        .dashboard.horizontal .content{
          display:flex!important;flex-direction:row;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;
          white-space:nowrap;scroll-snap-type:x mandatory;scroll-padding-inline:16px;
          scrollbar-width:thin;scrollbar-color:var(--primary-color) transparent;
          gap:12px;padding:12px 8px 16px 8px;box-sizing:border-box
        }
        .dashboard.horizontal .content>*{scroll-snap-align:start;flex-shrink:0}
        .dashboard.horizontal .content::-webkit-scrollbar{height:6px}
        .dashboard.horizontal .content::-webkit-scrollbar-thumb{background:var(--primary-color);border-radius:4px}

        /* header tweaks in horizontal */
        .dashboard.horizontal .header{flex-direction:column;align-items:center;justify-content:center;border-bottom:none!important;border-right:1px solid var(--divider-color,rgba(255,255,255,.1))!important;z-index:1}
        .dashboard.horizontal .clock{font-size:2rem;font-weight:700;margin-bottom:6px;color:var(--primary-text-color,#fff)}
        .dashboard.horizontal .title{font-size:1rem;margin-top:5px;text-align:center}

        /* card widths in layouts */
        .dashboard.vertical:not(.collapsed)
          .card:is(.light, .switch, .button) {
            width: 90%;
            padding: 16px;
            text-align: center;
            align-self: center;
        }

        .dashboard.horizontal:not(.collapsed)
          .card.light {
            width: 110px !important;
            min-height: 10px;
            height: auto;
            max-height: none;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center !important;
            padding: 12px;
            text-align: center;
            margin-bottom: 10px;
        }
        .dashboard.horizontal:not(.collapsed)
          .card.switch,
        .dashboard.horizontal:not(.collapsed)
          .card.button {
            height: auto;
            width: 110px !important;
            min-height: 80px;
            max-height: none;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center !important;
            padding: 12px;
            margin-bottom: 10px;
            text-align: center;
        }
        .dashboard.horizontal:not(.collapsed)
          .sensor,
        .dashboard.horizontal:not(.collapsed)
          .weather,
        .dashboard.horizontal:not(.collapsed)
          .person {
            width: 100px !important;
            height: 100px !important;
            padding: 12px;
            text-align: center;
            flex-direction: column;
            justify-content: center;
            align-items: center !important;
        }

        /* collapsed universal size */
        .dashboard.collapsed .sensor,
        .dashboard.collapsed .weather,
        .dashboard.collapsed .media-player,
        .dashboard.collapsed .fan,
        .dashboard.collapsed .cover,
        .dashboard.collapsed .climate,
        .dashboard.collapsed .button,
        .dashboard.collapsed .custom-card,
        .dashboard.collapsed .light,
        .dashboard.collapsed .switch{
          width:56px;height:56px;padding:8px;margin:0 auto;display:flex;align-items:center;justify-content:center;box-sizing:border-box
        }

        /* person collapsed tweaks */
        .dashboard.collapsed .person{
          padding:8px;margin:0 auto;background:var(--card-background-color,rgba(255,255,255,.03));box-shadow:0 4px 10px rgba(0,0,0,.2);border-radius:16px;box-sizing:border-box
        }
        .dashboard.collapsed .collapsed-clickable-box:hover{
          background:rgba(255,255,255,.08);border-radius:16px;border-color:var(--primary-color);transform:scale(1.05)
        }
        .dashboard.collapsed .person-image{width:52px;height:52px;border-radius:16px;margin:0}
        .dashboard.horizontal.collapsed .person img.person-image{width:50px;height:50px;border-radius:50%;object-fit:cover}
        .dashboard.horizontal.collapsed .person-info{display:none!important}
        .dashboard.collapsed .collapsed-clickable-box,
        .dashboard.horizontal.collapsed .collapsed-clickable-box {
          width: 56px !important;
          height: 56px !important;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        /* horizontally hidden big cards */
        .dashboard.horizontal .climate,
        .dashboard.horizontal .cover,
        .dashboard.horizontal .media-player,
        .dashboard.horizontal .fan{display:none}

        /* expand button rotazione orizzontale */
        .dashboard.horizontal .expand-button{writing-mode:vertical-rl;transform:rotate(180deg)}

        /* ---------- CONTROL BUTTON --------------------------------------------------- */
        .control-button{
          background:var(--primary-color);color:var(--text-primary-color);border:none;border-radius:.6em;
          width:2.4em;height:2.4em;display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:.3s;font-size:1.2em
        }

        .rgb-control-button {
          background:transparent;color:var(--text-primary-color);border:none;border-radius:.6em;
          width:2em;height:2em;display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:.3s;font-size:1.5em
        }
        .rgb {
          background:transparent;color:var(--text-primary-color);border:none;border-radius:.6em;
          width:auto;height:30px;display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:.3s;font-size:1.2em
        }
        .control-button:hover{filter:brightness(1.1)}
        .control-button:active{transform:scale(.98)}
        .control-button ha-icon{--mdc-icon-size:1.2em}

        .slider-container {
          width: 100%;
          margin: 10px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 4px;
          background: var(--secondary-background-color);
          outline: none;
          cursor: pointer;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary-color);
          cursor: pointer;
          box-shadow: 0 0 4px var(--primary-color);
          position: relative;
          z-index: 1;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary-color);
          cursor: pointer;
          box-shadow: 0 0 4px var(--primary-color);
          position: relative;
          z-index: 1;
        }
        /* ---------- SLIDER CLIMATE STYLE FIX ----------------------------------- */
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

        .slider::-webkit-slider-thumb:hover{transform: scale(1.2)}
        /* ---------- TOGGLE SWITCH ---------------------------------------------------- */
        .toggle-switch{position:relative;display:inline-block;width:40px;height:24px}
        .toggle-switch input{opacity:0;width:0;height:0}
        .toggle-slider{
          position:absolute;cursor:pointer;inset:0;background:var(--secondary-background-color);
          transition:.4s;border-radius:24px
        }
        .toggle-slider:before{
          content:"";position:absolute;height:16px;width:16px;left:4px;bottom:4px;background:#fff;
          transition:.4s;border-radius:50%
        }
        input:checked + .toggle-slider{background:var(--primary-color)}
        input:checked + .toggle-slider:before{transform:translateX(16px)}
        .icon ha-icon{color:var(--primary-color);--mdc-icon-size:20px}

        /* ---------- CARD TIPI SPECIFICI (button/fan/cover/climate/media) ------------- */
        .card.button,
        .card.light,
        .card.fan,
        .card.cover,
        .card.climate,
        .card.media-player{
          padding:16px 10%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:1
        }
        .card.light .light-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px; /* spazio tra elementi interni */
          margin-bottom: 8px; /* margine sotto al blocco completo */
        }
        .card.switch mwc-switch,
        .card.switch ha-switch{
          position: static !important;   /* torna nel flusso normale */
          margin: 0    auto   !important;/* centrato orizzontalmente */
        }
        .card.switch{
          display: flex         !important;
          flex-direction: column!important;
          align-items: center    !important;
          justify-content: center!important;
          gap: 12px              !important; /* spazio costante */
        }

        .card.switch .toggle-switch {
          margin: 0 auto !important;
        }

        .card.button{gap:10px}
        .card.button .value{text-align:center;width:100%;margin:0}
        .card.button .control-button{align-self:center}

        /* ---------- SENSOR VALUE WRAPPERS ------------------------------------------- */
        .sensor-value-wrapper.collapsed-centered{
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px
        }
        .sensor-value-wrapper.collapsed-centered ha-icon{font-size:24px}
        .sensor-value-text{font-size:.9rem;font-weight:500;color:var(--primary-text-color,#fff)}
        .sensor-value-wrapper.expanded-right{
          display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:4px;width:100%
        }
        .sensor-value-wrapper.expanded-right ha-icon{font-size:20px}
        .sensor-number-text{font-size:1rem;font-weight:600;color:var(--primary-text-color,#fff)}

        /* ---------- WEATHER ICON + ANIMAZIONI --------------------------------------- */
        .weather-icon{font-size:2rem;margin-bottom:8px;transition:.3s}
        .collapsed .weather-icon{font-size:1.5rem;margin-bottom:0}

        /* keyframes originali (twinkle, float, pulse, bounce, flash, storm, rain, shake, snow-spin) */
        @keyframes twinkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(.9)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes flash{0%,49%,51%,100%{opacity:1}50%{opacity:0}}
        @keyframes storm{0%,100%{transform:translate(0,0)}25%{transform:translate(-2px,2px)}50%{transform:translate(0,-2px)}75%{transform:translate(2px,2px)}}
        @keyframes rain{0%{transform:translateY(-3px)}50%{transform:translateY(0)}100%{transform:translateY(-3px)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}
        .weather-icon.twinkle{animation:twinkle 2s ease-in-out infinite}
        .weather-icon.float{animation:float 3s ease-in-out infinite}
        .weather-icon.pulse{animation:pulse 2s ease-in-out infinite}
        .weather-icon.bounce{animation:bounce 1s ease-in-out infinite}
        .weather-icon.flash{animation:flash 2s ease-in-out infinite}
        .weather-icon.storm{animation:storm 3s ease-in-out infinite}
        .weather-icon.rain{animation:rain 1s ease-in-out infinite}
        .weather-icon.snow{display:inline-flex;align-items:center;justify-content:center;width:1em;height:1em;line-height:0;animation:snow-spin 3s linear infinite;transform-origin:50% 50%}
        @keyframes snow-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .weather-icon.shake{animation:shake 1s ease-in-out infinite}

        /* ---------- MODAL (mappa, ecc.) --------------------------------------------- */
        .modal{
          position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:9999
        }
        .modal-content{
          background:var(--card-background-color,#1a1b1e);border-radius:var(--ha-card-border-radius,16px);
          padding:24px;width:100%;max-width:50vw;max-height:80vh;overflow-y:auto;position:relative
        }
        @media (max-width:640px){.modal-content{max-width:90vw!important}}
        @media (max-width:720px){.modal-content{max-width:50vw}}
        @media (min-width:1280px){.modal-content{max-width:30vw!important}}
        .modal-header{display:flex;align-items:center;margin-bottom:16px}
        .modal-close{
          position:absolute;top:16px;right:16px;background:none;border:none;
          color:var(--primary-text-color,#fff);font-size:24px;cursor:pointer;padding:4px
        }
        .modal-title{font-size:1.5rem;font-weight:600;margin:0;color:var(--primary-text-color,#fff)}

        /* ---------- STATUS INDICATORS ----------------------------------------------- */
        .status-indicator{width:12px;height:12px;border-radius:50%;margin-right:8px}
        .status-indicator.home{background:var(--state-icon-active-color,#4caf50)}
        .status-indicator.away{background:var(--warning-color,#ff9800)}

        /* ---------- MAP CONTAINER ---------------------------------------------------- */
        .map-container{
          width:100%;height:400px;border-radius:8px;overflow:hidden;margin-top:16px;
          display:flex;justify-content:center;align-items:center
        }
        .map-container ha-map{width:100%!important;height:100%!important;display:block}

        /* ---------- MINI‑POPUP SPECIFIC SIZE PER TIPI -------------------------------- */
        .mini-popup .fan,
        .mini-popup .cover,
        .mini-popup .media-player{width:200px!important;height:200px!important;flex-shrink:0}
        .mini-popup .sensor{width:180px!important;height:180px!important;flex-shrink:0}
        .mini-popup .card.light,{
          width:260px;padding:16px;padding-bottom:32px;box-sizing:border-box;overflow:visible
        }
        .mini-popup .card.light .label{font-size:1rem;height:20px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .mini-popup .card.light .button-row{justify-content:center;margin-top:12px}
        .mini-popup .switch {
          width: 90%;
          padding: 16px;
          text-align: center;
          align-self: center;
        }
        .mini-popup .card.climate{width:300px}
        .mini-popup .card.climate .button-row button{width:40px;height:40px;font-size:1.2rem;margin:0 4px}
        .mini-popup .card.climate .label:last-of-type{
          font-size:.9rem;margin:6px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;width:100%;display:block
        }
        .mini-popup .card{background:var(--card-background-color);border:1px solid var(--divider-color);box-shadow:var(--ha-card-box-shadow);border-radius:var(--ha-card-border-radius);padding:12px;overflow:visible!important}
        .mini-popup .content{display:flex!important;flex-wrap:wrap!important;gap:8px!important;width:auto!important;max-width:90vw!important}
        .mini-popup ha-card{width:auto!important}


        .dashboard.collapsed .person,
        .dashboard.horizontal.collapsed .person{
          width:var(--sidebar-item-size);
          height:var(--sidebar-item-size);
          padding:0;
          margin:0 auto;
          display:flex;
          justify-content:center;
          align-items:center;
          box-shadow:0 4px 10px rgba(0,0,0,.2);
        }

        .dashboard.collapsed .person-image{
          margin:0;
        }

        /* ============================================================================ */

        /* ---------- CUSTOM-CARD WIDTH AUTO ------------------------------------------ */
        .card.custom-card{
          width:auto !important;           /* lascia la card adattarsi al contenuto */
        }

        /* Orizzontale: niente forzatura a 100px */
        .dashboard.horizontal .card.custom-card{
          width:auto !important;
        }

        /* ---------- ESPANSIONE SIDEBAR ---------------------------------------------- */
        /* Quando la sidebar NON è .collapsed mostriamo wrapper e card al 100% della     */
        /* larghezza disponibile                                                         */
        .dashboard:not(.collapsed) .custom-card-wrapper,
        .dashboard:not(.collapsed) .card.custom-card{
          width:auto !important;
          min-width: 50px;
        }

        /* Safety: se .expanded-content è presente, annulla limiti di width             */
        .dashboard.expanded-content.vertical{
          width: 90px;
          max-width:var(--dashboard-width,200px) !important;
          height:auto!important;
          max-height:none!important;
          overflow:visible!important;
          border-radius: 16px;
        }
        .dashboard.expanded-content.vertical .expand-button{
          width:auto;
        }
        .dashboard.expanded-content.horizontal{
          max-width:none!important;width:100%!important;
        }

        /* Assicura che anche l'area contenuti non abbia limiti */
        .dashboard.expanded-content.vertical .content{
          max-height:none!important;
        }
        .dashboard.expanded-content.vertical .person-wrapper {
          width: var(--sidebar-item-size, 50px) !important;
          max-width: var(--sidebar-item-size, 50px) !important;
          margin: 0 auto;
        }
        .avatar-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-self: center;
          align-items: center;
          justify-content: center;
        }
        .person-wrapper {
          position: relative;
          width: auto;
          height: 100%;
          display: flex;
          align-self: center;
          align-items: center;
          justify-content: center;
        }
        .dashboard.horizontal.expanded-content {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          margin: auto !important;
          width: var(--dashboard-width, 90vw) !important;
          height: var(--sidebar-item-size, 56px) !important;
          overflow: visible !important;
          z-index: 999 !important;
        }

        .dashboard.horizontal.expanded-content .content {
          position: absolute !important;
          top: var(--sidebar-item-size, 56px) !important;
          left: 0 !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: row !important;
          overflow-x: auto !important;
          overflow-y: visible !important;
          padding: 8px !important;
          gap: 12px !important;
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
  _openMiniPopup(entity) {
      this._miniEntity = entity;

      // Calcolare la posizione centrata
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      // Calcolare la larghezza e altezza del popup
      const popup = this.shadowRoot.querySelector('.mini-popup');
      if (!popup) return;

      const rect = popup.getBoundingClientRect();

      // Posizioniamo il popup al centro della finestra
      const x = (screenW - rect.width) / 2;
      const y = (screenH - rect.height) / 2;

      this._miniPos = { x, y };
      this.requestUpdate();

      // Chiudi il popup se clicchi fuori
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
    const popup = this.shadowRoot.querySelector('.mini-popup');
    if (popup) {
      popup.classList.add('closing');
      setTimeout(() => {
        this._miniEntity = null;
        this._miniPos = null;
        this.requestUpdate();
      }, 200); // deve combaciare con i 200ms della animazione
    } else {
      this._miniEntity = null;
      this._miniPos = null;
    }
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
               style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"
               tabindex="0"
               @click=${(e) => this._handleTapAction(e, config)}
               @contextmenu=${(e) => this._handleHoldAction(e, config)}>
            ${this._renderIcon(config, 'cover')}
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
      max_temp,
      temperature_unit
    } = state.attributes;

    const modeIcons = {
      'off':      'mdi:power',
      'heat':     'mdi:fire',
      'cool':     'mdi:snowflake',
      'auto':     'mdi:autorenew',
      'dry':      'mdi:water-off',
      'fan_only': 'mdi:fan'
    };

    if (this._collapsed) {
      return html`
        <div class="card climate">
          <div class="collapsed-clickable-box"
               tabindex="0"
               @click=${e => this._handleTapAction(e, config)}
               @contextmenu=${e => this._handleHoldAction(e, config)}>
            ${this._renderIcon(config, "climate")}
          </div>
        </div>
      `;
    }

    return html`
      <div class="card climate">
        <div class="value" @click=${e => e.stopPropagation()}>
          ${current_temperature}°${temperature_unit}
        </div>
        <div class="label"
             @click=${() => this._showMoreInfo(state.entity_id)}>
          ${config.name || state.attributes.friendly_name}
        </div>
        <div class="climate-controls"
             style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
          <div class="button-row"
               style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
            ${hvac_modes?.map(mode => html`
              <button
                class="dash-button ${state.state === mode ? 'active' : ''}"
                style="
                  background:${state.state === mode ? 'var(--primary-color)' : '#727272'};
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
                    this._callService('climate', 'set_hvac_mode', config.entity, {
                      hvac_mode: mode
                    });
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
              .value=${temperature}
              min=${min_temp}
              max=${max_temp}
              step="0.5"
              @input=${e => this._localTemperature = e.target.value}
              @change=${e => this._callService('climate', 'set_temperature', config.entity, {
                temperature: Number(e.target.value)
              })}
          </div>

          <div class="label" style="text-align:center;margin-top:4px;">
            Target: ${temperature}°${temperature_unit}
          </div>
        </div>
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
/* ---------- RENDER LIGHT ---------- */
  _renderLight(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const isOn = state.state === "on";
    const supportsBrightness = "brightness" in state.attributes;
    const supportsKelvin =
      "color_temp_kelvin" in state.attributes ||
      (state.attributes.supported_color_modes ?? []).some(m =>
        ["color_temp", "kelvin"].includes(m)
      );
    const supportsColor = (state.attributes.supported_color_modes ?? []).some(m =>
      ["rgb", "rgbw", "rgbww", "hs"].includes(m)
    );
    const compact = !supportsBrightness && !supportsKelvin && !supportsColor;

    if (supportsBrightness && (this._localBrightness == null || !isOn)) {
      this._localBrightness =
        isOn && state.attributes.brightness
          ? Math.round((state.attributes.brightness / 255) * 100)
          : 0;
    }
    if (supportsKelvin && (this._localKelvin == null || !isOn)) {
      this._localKelvin = isOn ? state.attributes.color_temp_kelvin || 4000 : 4000;
    }

    if (this._collapsed) {
      return html`
        <div class="card light${compact ? " compact" : ""}">
          <div
            class="collapsed-clickable-box"
            tabindex="0"
            @click=${e => this._handleTapAction(e, config)}
            @contextmenu=${e => this._handleHoldAction(e, config)}
          >
            ${this._renderIcon(config, "light")}
          </div>
        </div>
      `;
    }

    return html`
      <div class="card light${compact ? " compact" : ""}">
        <div class="light-header">
          <div class="value" @click=${e => e.stopPropagation()}>
            ${config.name || state.attributes.friendly_name}
          </div>
          <label class="toggle-switch">
            <input
              type="checkbox"
              .checked=${isOn}
              @change=${e =>
                this._callService(
                  "light",
                  e.target.checked ? "turn_on" : "turn_off",
                  config.entity
                )}
            />
            <span class="toggle-slider"></span>
          </label>
        </div>

        ${isOn && (supportsBrightness || supportsKelvin || supportsColor)
          ? html`
              <div style="display:flex;flex-direction:column;gap:2px;width:100%;">
                ${supportsBrightness
                  ? html`
                      <div class="slider-container" style="width:100%;">
                        <input
                          type="range"
                          class="slider"
                          .value=${this._localBrightness}
                          @input=${e => (this._localBrightness = Number(e.target.value))}
                          @change=${e =>
                            this._callService("light", "turn_on", config.entity, {
                              brightness_pct: Number(e.target.value),
                            })}
                        />
                      </div>
                      <div class="label" style="text-align:center;margin-top:4px;">
                        ${this._localBrightness}%
                      </div>
                    `
                  : ""}

                ${supportsKelvin
                  ? html`
                      <div class="slider-container" style="width:100%;">
                        <input
                          type="range"
                          class="slider"
                          min="2000"
                          max="6500"
                          step="50"
                          .value=${this._localKelvin}
                          @input=${e => (this._localKelvin = Number(e.target.value))}
                          @change=${e =>
                            this._callService("light", "turn_on", config.entity, {
                              kelvin: Number(e.target.value),
                            })}
                        />
                      </div>
                      <div class="label" style="text-align:center;margin-top:4px;">
                        ${this._localKelvin} K
                      </div>
                    `
                  : ""}

                ${supportsColor
                  ? html`
                      <div class="rgb" style="justify-content:center;">
                        <button
                          class="rgb-control-button"
                          title="RGB picker"
                          @click=${() => this._showMoreInfo(config.entity)}
                        >
                          🎨
                        </button>
                      </div>
                    `
                  : ""}
              </div>
            `
          : ""}
      </div>
    `;
  }

  /* ---------- RENDER SWITCH ---------- */
  _renderSwitch(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const isOn = state.state === "on";
    const domain = config.entity.split(".")[0];

    return html`
      <div class="card switch">
        ${this._collapsed
          ? html`
              <div
                class="collapsed-clickable-box"
                tabindex="0"
                @click=${e => this._handleTapAction(e, config)}
                @contextmenu=${e => this._handleHoldAction(e, config)}
              >
                ${this._renderIcon(config, "switch")}
              </div>
            `
          : html`
              <div class="switch-header">
                <div class="value" @click=${e => e.stopPropagation()}>
                  ${config.name || state.attributes.friendly_name}
                </div>

                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    .checked=${isOn}
                    @change=${e =>
                      this._callService(
                        domain,
                        e.target.checked ? "turn_on" : "turn_off",
                        config.entity
                      )}
                  />
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

    if (this._collapsed) {
      return html`
        <div class="card button">
          <div class="collapsed-clickable-box"
               class="centered-box"
               tabindex="0"
               @click=${e => this._handleTapAction(e, config)}
               @contextmenu=${e => this._handleHoldAction(e, config)}>
            ${this._renderIcon(config, domain)}
          </div>
        </div>
      `;
    }

    return html`
      <div class="card button">
        <div class="value" @click=${e => e.stopPropagation()}>
          ${name}
        </div>
        <button class="control-button"
                @click=${e => {
                  e.stopPropagation();
                  this._callService(domain, service, config.entity);
                }}>
          <ha-icon icon="mdi:gesture-tap-button"></ha-icon>
        </button>
      </div>
    `;
  }

  _renderFan(config) {
    const state = this.hass.states[config.entity];
    if (!state) return html``;

    const isOn = state.state === 'on';
    const speed = state.attributes.percentage ?? 0;

    if (this._localFanSpeed == null || !isOn) {
      this._localFanSpeed = isOn ? speed : 0;
    }

    if (this._collapsed) {
      return html`
        <div class="card fan">
          <div class="collapsed-clickable-box"
               tabindex="0"
               @click=${e => this._handleTapAction(e, config)}
               @contextmenu=${e => this._handleHoldAction(e, config)}>
            ${this._renderIcon(config, "fan")}
          </div>
        </div>
      `;
    }

    return html`
      <div class="card fan">
        <div class="value"
             @click=${e => e.stopPropagation()}>
          ${config.name || state.attributes.friendly_name}
        </div>

        <label class="toggle-switch" @click=${e => e.stopPropagation()}>
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
              .value=${this._localFanSpeed}
              @input=${e => this._localFanSpeed = Number(e.target.value)}
              @change=${e => this._callService(
                'fan',
                'set_percentage',
                config.entity,
                { percentage: Number(e.target.value) }
              )}
              min="0"
              max="100"
              step="1">
            <div class="label" style="text-align:center; margin-top:4px;">
              ${this._localFanSpeed}%
            </div>
          </div>
        ` : ''}
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

    if (this._collapsed) {
      return html`
        <div class="card media-player">
          <div class="collapsed-clickable-box"
               style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"
               tabindex="0"
               @click=${e => this._handleTapAction(e, config)}
               @contextmenu=${e => this._handleHoldAction(e, config)}>
            ${this._renderIcon(config, "media_player")}
          </div>
        </div>
      `;
    }

    return html`
      <div class="card media-player">
        <div class="value"
             @click=${e => {
               e.stopPropagation();
               this._handleTapAction(e, config);
             }}>
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
                    @click=${e => {
                      e.stopPropagation();
                      this._callService('media_player', control.action, config.entity);
                    }}>
              <ha-icon icon="${control.icon}"></ha-icon>
            </button>
          `)}
        </div>

        <div class="slider-container" style="margin-top:10px;width:100%;">
          <input type="range"
                 class="slider"
                 .value=${volume * 100}
                 min="0" max="100" step="1"
                 @change=${e => this._callService(
                   'media_player', 'volume_set', config.entity,
                   { volume_level: Number(e.target.value) / 100 })}>
        </div>
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
               style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"
               tabindex="0"
               @click=${(e) => this._handleTapAction(e, config)}
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

    // ✅ Legge il valore start_expanded e imposta collapsed al contrario
    this._collapsed = config.hasOwnProperty('collapsed')
      ? config.collapsed
      : !(config.start_expanded === true);

    // ✅ Memorizza dimensioni se presenti
    this._configuredWidth  = config.width  || null;
    this._configuredHeight = config.height || null;
  }

  render() {
    if (!this.hass || !this.config) return html``;

    const mode = this.config.mode || 'vertical';
    const align = this.config.align || 'top';

    const isVertical = mode === 'vertical';
    const isHorizontal = mode === 'horizontal';
    const isExpanded = this._expandContent;

    const dashboardClasses = [
      'dashboard',
      this._collapsed ? 'collapsed' : '',
      isVertical ? 'vertical' : 'horizontal',
      isExpanded ? 'expanded-content' : ''
    ].join(' ');

    const width  = this._configuredWidth  || 'auto';
    const height = this._configuredHeight || 'auto';
    const effectiveWidth = isVertical ? width : (isExpanded ? width : 'auto');

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

    const cardStyle = `
      padding: 0;
      width: ${effectiveWidth};
      height: ${isHorizontal ? '100px' : height};
      max-width: none;
      margin: 0;
      background: transparent;
      box-shadow: none;
    `;

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
        position: relative;
      ">
        <ha-card style="${cardStyle}">
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
console.log(`HA Dashboard Sidebar v1 beta`);
customElements.define("ha-dashboard-sidebar", HaDashboardSidebar);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-dashboard-sidebar",
  name: "Dashboard Sidebar",
  preview: true,
  description: "A collapsible sidebar dashboard for Home Assistant"
});
