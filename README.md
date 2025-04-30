
# 📘 `ha-dashboard-sidebar` for Home Assistant

This guide describes **all available features** for the `ha-dashboard-sidebar` custom card, compatible with Lovelace in Home Assistant.


🇮🇹 [GUIDA IN ITALIANO](https://github.com/lotablet/ha-dashboard-sidebar/blob/main/README_ITA.md)


## 🔧 Basic configuration

```yaml
type: custom:ha-dashboard-sidebar
title: Welcome, {{ user }}
mode: horizontal       # or "vertical"
align: left            # or "right" to align on the right side
width: 80vw            # control width
height: 10vh           # control height
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
| `mode`        | string    | `vertical` or `horizontal`                                                |
| `align`       | string    | Sidebar alignment: `left` or `right`                                      |
| `collapsed`   | boolean   | If `true`, shows entity only in collapsed mode, `false` = only expanded. If not specified, both   |
| `entities`    | list      | List of entities (see supported types below)                              |
| `width`    | string      | Control width                       |
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
| `input_text`   | Editable input field                                            | `input_text.profile_name`                     |
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

## 🧠 Advanced behaviors

| Feature                 | Description                                                              |
|-------------------------|--------------------------------------------------------------------------|
| `collapsed` per entity  | Each entity can be shown only when the sidebar is collapsed or expanded, If `true`, shows entity only in collapsed mode, `false` = only expanded. If not specified, both  |
| `tracker_entity`        | Used with `person` to display live location on map                      |
| `custom_card.card`      | Can contain any nested Lovelace card                                    |
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
      width: 80vw;
      height: 100px;
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
