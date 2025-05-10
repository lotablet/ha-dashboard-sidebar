[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/lotablet)



# 📘 `ha-dashboard-sidebar` for Home Assistant
![version](https://img.shields.io/badge/version-1.0.3-blue)
![hacs](https://img.shields.io/badge/HACS-default-orange)

This guide describes **all available features** for the `ha-dashboard-sidebar` custom card, compatible with Lovelace in Home Assistant.


🇮🇹 [GUIDA IN ITALIANO](https://github.com/lotablet/ha-dashboard-sidebar/blob/main/README_ITA.md)


## Automatic install
Just press this button below:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=lotablet&repository=ha-dashboard-sidebar&category=plugin)


## Manual install
To manually install this card, follow these steps:

1. Go to the `www` folder in your Home Assistant configuration directory
2. Open `community` folder and create a folder `ha-dashboard-sidebar`
3. Download the card file `ha-dashboard-sidebar.js` from the GitHub repository and copy it into the folder you created before.
5. In Home Assistant, go to **Dashboard > Add Resources** and add a new resource with the following URL:
   ```
   /local/community/ha-dashboard-sidebar/ha-dashboard-sidebar.js
   ```
6. Once the resource is added, reload Home Assistant to load the card (reset cache if needed)

At this point, the card will be available for use in your dashboard.

 !["gif"](https://github.com/lotablet/ha-dashboard-sidebar/blob/main/gif/gif1.gif)
 
## 🔧 Basic configuration

```yaml
type: custom:ha-dashboard-sidebar
title: Welcome, {{ user }}
mode: horizontal       # Default "vertical" 
align: center          # Default left, choose "right" or "left" if you want to align on the left or right side
width: 250px
height: 500px          # control height
collapsed: true        # whether the sidebar starts collapsed
entities:
  - type: sensor
    entity: sensor.example
```

## 🧱 Global properties

| Field         | Type      | Description                                                               |
|---------------|-----------|---------------------------------------------------------------------------|
| `type`        | string    | Always `custom:ha-dashboard-sidebar`                                      |
| `title`       | string    | Header title (can include `{{ user }}`)                                   |
| `mode`        | string    | `vertical` or `horizontal`                                              |
| `align`       | string    | Sidebar alignment: `left` or `right`                                      |
| `collapsed`   | boolean   | If `true`, shows entity only in collapsed mode, `false` = only expanded. If not specified, both   |
| `entities`    | list      | List of entities (see supported types below)                              |
| `width`    | string      | Control width                    |
| `height`    | string      | Control height                            |
## 🧩 Supported entity types

| Type           | Behavior                                                        | Example `entity:`                             |
|----------------|------------------------------------------------------------------|-----------------------------------------------|
| `sensor`       | Shows value, icon and name                                       | `sensor.living_room_light`                    |
| `person`       | Shows badge, state and (optional) map from `tracker_entity`     | `person.john` + `tracker_entity`              |
| `cover`        | Shows open/close controls if supported                          | `cover.bedroom_shutter`                       |
| `climate`      | Shows current/target temp and mode buttons                      | `climate.living_room_ac`                      |
| `fan`          | Shows state and speed                                           | `fan.ceiling_fan`                             |
| `light`        | Shows on/off toggle and brightness slider                       | `light.desk_lamp`                             |
| `switch`       | Toggle switch                                                   | `switch.fryer`                                |
| `script`       | Button to execute a script                                      | `script.restart_router`                       |
| `media_player` | Track info, controls, and volume                                | `media_player.spotify_john`                   |
| `weather`      | Shows weather icon and forecast                                 | `weather.home`                                |
| `custom_card`  | Embed any Lovelace card (e.g. Mushroom)                         | `card:` embedded config                        |

## 🎯 Supported actions (tap/hold)

Each entity can include:

```yaml
tap_action:
  action: toggle | more-info | call-service | navigate
  entity: another_optional_entity_to_see_more_info
  service: optional_service
  navigation_path: /dashboard/xyz
```

Example:

```yaml
- type: sensor
  entity: sensor.open_shutters
  name: Shutters
  icon: phu:top-window-open        # customize icon
  tap_action:
    action: more-info
    entity: cover.all_shutters     # 🔥🔥🔥 you can specify another entity to see more-info
```

## 👉🏻 Custom Cards

You can embed any Lovelace card like this:

```yaml
type: custom:ha-dashboard-sidebar
mode: horizontal
entities: 
  - type: custom_card
    collapsed: false
    card:
      type: grid
      cards:
        - entity: climate.living_room_ac
          fill_container: true
          icon: mdi:air-conditioner
          layout: vertical
          name: AC Living
          type: custom:mushroom-entity-card
        - entity: light.aquarium
          name: Aquarium
          type: custom:button-card
        - entity: sensor.fridge_power
          fill_container: true
          icon: mdi:fridge
          layout: vertical
          name: Fridge
          type: custom:mushroom-entity-card
        - entity: switch.oven
          icon: mdi:fridge
          name: Oven
          type: button
```


## Customize custom_cards
| Variable                            | Description                                              |
|-------------------------------------|----------------------------------------------------------|
| `.dashboard:not(.collapsed) .custom-card-wrapper`          | control width and height or whatever you want of all `custom_card` in a shot, must be used with `!important` |
| `:host` | control width and height or whatever you want, of a single card, must be used with `!important` |

Example for control a single `custom_card`

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
Example for control all `custom_card`:
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
    .dashboard:not(.collapsed) .custom-card-wrapper {
      width: 150px !important;
      height 150px !importamt;
    }
```

## 🧠 Advanced behaviors

| Feature                 | Description                                                              |
|-------------------------|--------------------------------------------------------------------------|
| `collapsed` per entity  | Each entity can be shown only when the sidebar is collapsed or expanded, If `true`, shows entity only in collapsed mode, `false` = only expanded. If not specified, both  |
| `tracker_entity`        | Used with `person` to display live location on map                      |
| `custom_card`      | Can contain any nested Lovelace card                                    |
| `style:`                | Fully compatible with `card-mod` styles                                |
| `title` dynamic         | You can use `{{ user }}` to show logged-in username                     |

# 🔢 Better with Card Mod – Style variables

| Variable                            | Description                                              | Default                          |
|-------------------------------------|----------------------------------------------------------|----------------------------------|
| `--card-background-color`          | Background of sidebar and cards                         | `#1a1b1e`                        |
| `--primary-text-color`             | Main text color                                         | `#ffffff`                        |
| `--primary-color`                  | Primary color (active icons, sliders, etc.)             | `#7289da`                        |
| `--text-primary-color`             | Text color on buttons and sliders                       | `#ffffff`                        |
| `--secondary-background-color`     | Background for sliders, toggles, inputs                 | `#333` or theme-based           |
| `--divider-color`                  | Borders and dividers                                    | `rgba(255,255,255,0.1)`         |
| `--state-icon-active-color`        | Icon color when active (`ha-icon.on`)                   | `var(--primary-color)`          |
| `--ha-card-border-radius`          | Border radius of cards and modals                       | `24px`                           |
| `--ha-card-box-shadow`             | Box shadow of cards                                     | `0 8px 32px rgba(0,0,0,0.25)`    |
| `--dashboard-width`                | Width when sidebar is expanded                          | `300px`                          |
| `--dashboard-collapsed-width`      | Width when sidebar is collapsed                         | `90px`                           |
| `--rgb-primary-color`              | Used for glow effects (shadows, active states)          | `114, 137, 218`                  |

## 🖌️ Example with `card-mod`

```yaml
type: custom:ha-dashboard-sidebar
title: Welcome, {{ user }}
width: 250px
mode: vertical
align: left
collapsed: true
entities:
  - type: switch
    entity: switch.office_light
    name: Office Light
card_mod:
  style: |
    ha-card {
      border-radius: 16px;
      box-shadow: 0 0 12px #000;
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
## ➡️ Full Example
```yaml
type: custom:ha-dashboard-sidebar
title: Welcome, {{ user }}
mode: vertical
align: left
width: 250px
collapsed: true
entities:
  - type: weather
    entity: weather.weather
  - type: person
    entity: person.lorenzo
    tracker_entity: device_tracker.lorenzo
  - type: sensor
    name: Power Consumption
    entity: sensor.home_power
  - type: sensor
    name: Lights
    entity: sensor.counter_lights_on
  - type: sensor
    collapsed: true
    entity: sensor.topen_shutters
    icon: phu:top-window-open
    name: Cover
    tap_action:
      action: more-info
      entity: cover.all_shutters 
  - type: climate
    entity: climate.ac_living_room
    collapsed: false
  - type: media_player
    entity: media_player.living_room
    collapsed: false
  - type: custom_card
    collapsed: false
    card:
      - type: custom:mushroom-entity-card
        entity: switch.studio
        fill_container: true
        icon: mdi:air-conditioner
        layout: vertical
        name: Studio
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
## 📌 Final notes

- The card is **responsive**, adapts to `vertical` or `horizontal` layout
- Designed for tablet and wall panels
- Can be collapsed/expanded dynamically
- You can embed any Lovelace cards inside the expanded area

---

Made with ❤️ by [LoTableT](https://tiktok.com/@lotablet)
