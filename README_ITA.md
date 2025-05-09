[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/lotablet)

# 📘 `ha-dashboard-sidebar` per Home Assistant

Questa guida descrive **tutte le funzionalità disponibili** per la custom card `ha-dashboard-sidebar`, compatibile con Lovelace in Home Assistant.


## Installazione automatica
Basta premere il pulsante qui sotto:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=lotablet&repository=ha-dashboard-sidebar&category=plugin)


## Installazione manuale
Per installare manualmente questa card, segui questi passaggi:

1. Vai nella cartella `www` nella directory di configurazione di Home Assistant.
2. Apri la cartella `community` e crea la cartella `ha-dashboard-sidebar`
3. Scarica il file della card `ha-dashboard-sidebar.js` dal repository GitHub e copialo nella cartella che hai creato prima.
4. In Home Assistant, vai su **Dashboard - Gestisci Risorse** e aggiungi una nuova risorsa con il seguente URL:
   ```
   /local/custom_cards/ha-dashboard-sidebar/ha-dashboard-sidebar.js
   ```
6. Una volta aggiunta la risorsa, riavvia Home Assistant per caricare la card.

A questo punto, la card sarà  disponibile per l'uso nel tuo dashboard.

 !["gif"](https://github.com/lotablet/ha-dashboard-sidebar/blob/main/gif/gif1.gif)


## 🔧 Configurazione base

```yaml
type: custom:ha-dashboard-sidebar
title: Benvenuto, {{ user }}
mode: horizontal       # Default "vertical"
align: center          # Default "left", scegli "right" o "left" se vuoi l`orientamento a destra o a sinistra
collapsed: true        # mostrare o non mostrare in sidebar espansa o collassata
width: 250px           # Controllo Larghezza
height: 50vh           # Controllo Altezza
entities:
  - type: sensor
    entity: sensor.example
```

## 🧱 Proprietà globali

| Campo         | Tipo      | Descrizione                                                                 |
|---------------|-----------|-----------------------------------------------------------------------------|
| `type`        | string    | `custom:ha-dashboard-sidebar`                                               |
| `title`       | string    | Titolo mostrato in alto (può includere `{{ user }}`)                        |
| `mode`        | string    | `vertical` o `horizontal`                                                   |
| `align`       | string    | `right` o `left`                                                            |
| `collapsed`   | boolean   | Se `true`, mostra una card solo in espansa, se `false` mostra solo in collassata, se non specificato, entrambe   |
| `entities`    | list      | Lista di entità (vedi tabella tipi supportati sotto)                        |
| `width`    | string      | Controllo larghezza                       |
| `height`    | string      | Controllo altezza
## 🧩 Tipi di entità supportati

| Tipo          | Comportamento                                               | Esempio `entity:`                             |
|---------------|-------------------------------------------------------------|-----------------------------------------------|
| `sensor`      | Mostra valore, icona, nome                                   | `sensor.luce_salotto`                         |
| `person`      | Mostra badge, stato e (opz.) posizione da `tracker_entity`   | `person.lorenzo` + `tracker_entity`           |
| `cover`       | Controlli apri/chiudi se disponibile                         | `cover.tapparella_camera`                     |
| `climate`     | Mostra temp. attuale, target e pulsanti modalità             | `climate.soggiorno`                           |
| `fan`         | Mostra stato e velocità ventilatore                          | `fan.ventilatore_soffitto`                    |
| `light`       | Mostra stato e slider luminosità                             | `light.lampada_scrivania`                     |
| `switch`      | Interruttore toggle                                          | `switch.friggitrice`                          |
| `script`      | Pulsante per eseguire uno script                             | `script.riavvia_router`                       |
| `media_player`| Stato, controlli play/pause/volume                           | `media_player.spotify_lorenzo`                |
| `weather`     | Mostra meteo attuale e previsioni                            | `weather.home`                                |
| `custom_card` | Inserisce una card Lovelace custom all’interno               | `card:` con tipo embedded (es. `mushroom`)    |

## 🎯 Azioni supportate (tap/hold)

Ogni entità può avere:

```yaml
tap_action:
  action: toggle | more-info | call-service | navigate
  entity: optional_entity
  service: optional_service
  navigation_path: /dashboard/xxx
```

Esempio completo:

```yaml
- type: sensor
  entity: sensor.tapparelle_aperte
  name: Tapparelle
  icon: phu:top-window-open        # puoi specificare un icona diversa da quella di default
  tap_action:
    action: more-info
    entity: cover.tapparelle_casa  # 🔥🔥🔥 puoi aggiungere un altra entità differente per more-info!
```
## 👉🏻 Custom Cards

Puoi inserire all'interno qualsiasi card in modalità espansa cosi:


 ```
type: custom:ha-dashboard-sidebar
mode: horizontal
entities: 
  - type: custom_card
    collapsed: false
    card:
      type: grid
      cards:
        - entity: climate.aria_condizionata_sala
          fill_container: true
          icon: mdi:air-conditioner
          layout: vertical
          name: AC Sala
          type: custom:mushroom-entity-card
        - entity: light.acquario
          name: Acquario
          type: custom:button-card
        - entity: sensor.frigo_power
          fill_container: true
          icon: mdi:fridge
          layout: vertical
          name: Frigo
          type: custom:mushroom-entity-card
        - entity: switch.forno
          icon: mdi:fridge
          name: Forno
          type: button
```
## Personalizzare le `custom_card`

| Variabile                                                   | Descrizione                                                                 |
|-------------------------------------------------------------|-----------------------------------------------------------------------------|
| `.dashboard:not(.collapsed) .custom-card-wrapper`           | Controlla larghezza, altezza o qualsiasi stile di tutte le `custom_card` contemporaneamente. Deve essere usata con `!important`. |
| `:host`                                                     | Controlla larghezza, altezza o qualsiasi stile di **una singola card**. Deve essere usata con `!important`. |

### Esempio per controllare **una singola** `custom_card`

```
type: custom:ha-dashboard-sidebar
title: Welcome, {{ user }}
mode: horizontal
entities:
  - type: custom_card
    icon: mdi:window-maximize
    card:
      type: custom:mushroom-entity-card
      entity: climate.aria_condizionata_sala
      fill_container: true
      name: AC Sala
      layout: vertical
      card_mod:
        style: |
          :host {
            width: 100px !important;
            height: 100px !important;
          }
```

### Esempio per controllare **tutte** le `custom_card`

```
type: custom:ha-dashboard-sidebar
title: Benvenuto, {{ user }}
mode: horizontal
entities:
  - type: custom_card
    icon: mdi:window-maximize
    card:
      type: custom:mushroom-entity-card
      entity: climate.aria_condizionata_sala
      fill_container: true
      name: AC Sala
      layout: vertical
card_mod:
  style: |
    .dashboard:not(.collapsed) .custom-card-wrapper {
      width: 150px !important;
      height: 150px !important;
    }
```

## 🧠 Comportamenti avanzati

| Feature                  | Descrizione                                                                 |
|--------------------------|-----------------------------------------------------------------------------|
| `collapsed` per entità   | Ogni entità può essere visibile solo quando la sidebar è collassata         |
| `tracker_entity`         | Usato con `type: person` per mostrare posizione GPS                         |
| `custom_card`            | Può contenere qualsiasi Lovelace card                                       |
| `style:`                 | Compatibile con `card-mod` a livello di card principale                     |
| `title` dinamico         | Può includere `{{ user }}` per mostrare nome utente loggato                 |


# 🔢 Better with Card Mod! Ecco le variabili di Card Mod

| Variabile                             | Descrizione                                              | Default (fallback)                  |
|---------------------------------------|----------------------------------------------------------|-------------------------------------|
| `--card-background-color`            | Sfondo della sidebar e delle card                        | `#1a1b1e`                           |
| `--primary-text-color`               | Colore del testo principale                              | `#ffffff`                           |
| `--primary-color`                    | Colore primario (icone attive, slider, bottoni, etc.)    | `#7289da`                           |
| `--text-primary-color`               | Colore del testo sopra bottoni o slider colorati         | `#ffffff`                           |
| `--secondary-background-color`       | Sfondo degli slider, toggle e input                      | `#333` (tema dipendente)            |
| `--divider-color`                    | Colore dei bordi delle card e sezioni                    | `rgba(255,255,255,0.1)`             |
| `--state-icon-active-color`          | Colore per le icone attive (`ha-icon.on`)                | `var(--primary-color)`              |
| `--ha-card-border-radius`            | Border radius per tutte le card e popup                  | `24px`                              |
| `--ha-card-box-shadow`               | Ombra delle card (effetto fluttuante)                    | `0 8px 32px rgba(0,0,0,0.25)`       |
| `--dashboard-width`                  | Larghezza della sidebar quando espansa                   | `300px` (o da config)               |
| `--dashboard-collapsed-width`        | Larghezza della sidebar quando collassata (verticale)    | `90px`                              |
| `--rgb-primary-color`                | Usato per generare ombre dinamiche (tipo glow)           | `114, 137, 218`                     |

## 🖌️ Esempio con stile `card-mod`

```yaml
type: custom:ha-dashboard-sidebar
title: Benvenuto, {{ user }}
mode: vertical
align: left
width: 250px
collapsed: true
entities:
  - type: switch
    entity: switch.luce_studio
    name: Studio
style: |
  ha-card {
    border-radius: 16px;
    box-shadow: 0 0 12px #000;
    width: 80vw
    height: 100px
    --card-background-color: black;
    --primary-color: #ffcc00;
    --primary-text-color: white;
    --secondary-background-color: #333333;
    --divider-color: rgba(255,255,255,0.1);
    --state-icon-active-color: #00e676;
    --text-primary-color: #ffffff;
    --ha-card-border-radius: 20px;
    --ha-card-box-shadow: none;
  }
```
## ➡️ Esempio completo
```yaml
type: custom:ha-dashboard-sidebar
title: Benvenuto, {{ user }}
mode: vertical
align: left
width: 250px
collapsed: true
entities:
  - type: weather
    entity: weather.weather
  - type: person
    entity: person.lorenzo
    tracker_entity: device_tracker.lorenzo_telefono
  - type: sensor
    name: Consumo
    entity: sensor.casa_power
  - type: sensor
    name: Luci
    entity: sensor.counter_luci_accese
  - type: sensor
    collapsed: true
    entity: sensor.tapparelle_aperte
    icon: phu:top-window-open
    name: Tapparelle
    tap_action:
      action: more-info
      entity: cover.tapparelle_casa
  - type: climate
    entity: climate.aria_condizionata_sala
    collapsed: false
  - type: media_player
    entity: media_player.sala
    collapsed: false
  - type: custom_card
    collapsed: false
    card:
      - type: custom:mushroom-entity-card
        entity: switch.luce_studio
        fill_container: true
        icon: mdi:air-conditioner
        layout: vertical
        name: Luce Studio
card_mod:
  style: |
    ha-card {
      border-radius: 16px;
      box-shadow: 0 0 12px #000;
      width: 80vw
      height: 100px
      --card-background-color: black;
      --primary-color: #ffcc00;
      --primary-text-color: white;
      --secondary-background-color: #333333;
      --divider-color: rgba(255,255,255,0.1);
      --state-icon-active-color: #00e676;
      --text-primary-color: #ffffff;
      --ha-card-border-radius: 20px;
      --ha-card-box-shadow: none;
    }

```


## 📌 Note finali

- La card è **responsive** e si adatta al layout `vertical` o `horizontal`
- Gli stili e il comportamento sono ottimizzati per tablet o pannelli touch
- Può essere espansa/collassata dinamicamente
- Si possono includere tutte le card di home assistant all'interno della barra espansa

---

Made with ❤️ by [LoTableT](https://tiktok.com/@lotablet)
