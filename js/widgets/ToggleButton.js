import icons from "../icons.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Variable from "resource:///com/github/Aylur/ags/variable.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";

/** name of the currently opened menu  */
export const opened = Variable("");
App.connect("window-toggled", (_, name, visible) => {
  if (name === "dashboard" && !visible)
    Utils.timeout(500, () => {
      opened.value = "";
    });
});

/**
 * @param {string} name - menu name
 * @param {(() => void) | false=} activate
 */
export const Arrow = (name, activate) => {
  let deg = 0;
  let iconOpened = false;
  return Widget.Button({
    child: Widget.Icon({
      icon: icons.ui.arrow.right,
      connections: [
        [
          opened,
          (icon) => {
            if (
              (opened.value === name && !iconOpened) ||
              (opened.value !== name && iconOpened)
            ) {
              const step = opened.value === name ? 10 : -10;
              iconOpened = !iconOpened;
              for (let i = 0; i < 9; ++i) {
                Utils.timeout(15 * i, () => {
                  deg += step;
                  icon.setCss(`-gtk-icon-transform: rotate(${deg}deg);`);
                });
              }
            }
          },
        ],
      ],
    }),
    onClicked: () => {
      opened.value = opened.value === name ? "" : name;
      if (typeof activate === "function") activate();
    },
  });
};

/**
 * @param {string} name menu name
 * @param {(() => void) | false=} activate
 * @param {string} icon icon name
 */
export const IconArrow = (name, activate, icon) => {
  let iconOpened = false;
  return Widget.Button({
    child: Widget.Icon({
      icon: icon,
      connections: [
        [
          opened,
          (icon) => {
            if (
              (opened.value === name && !iconOpened) ||
              (opened.value !== name && iconOpened)
            ) {
              iconOpened = !iconOpened;
              icon.toggleClassName("arrow-opened", iconOpened);
            }
          },
        ],
      ],
    }),
    onClicked: () => {
      opened.value = opened.value === name ? "" : name;
      if (typeof activate === "function") activate();
    },
  });
};

/**
 * @param {Object} o
 * @param {string} o.name - menu name
 * @param {import('gi://Gtk').Gtk.Widget} o.icon
 * @param {import('gi://Gtk').Gtk.Widget} o.label
 * @param {() => void} o.activate
 * @param {() => void} o.deactivate
 * @param {boolean=} o.activateOnArrow
 * @param {[import('gi://GObject').GObject.Object, () => boolean]} o.connection
 */
export const ArrowToggleButton = ({
  name,
  icon,
  label,
  activate,
  deactivate,
  activateOnArrow = true,
  connection: [service, condition],
}) =>
  Widget.Box({
    className: "toggle-button",
    connections: [
      [
        service,
        (box) => {
          box.toggleClassName("active", condition());
        },
      ],
    ],
    children: [
      Widget.Button({
        child: Widget.Box({
          hexpand: true,
          className: "label-box horizontal",
          children: [icon, label],
        }),
        onClicked: () => {
          if (condition()) {
            deactivate();
            if (opened.value === name) opened.value = "";
          } else {
            activate();
          }
        },
      }),
      Arrow(name, activateOnArrow && activate),
    ],
  });

/**
 * @param {Object} o
 * @param {string} o.name - menu name
 * @param {import('gi://Gtk').Gtk.Widget} o.icon
 * @param {import('gi://Gtk').Gtk.Widget} o.title
 * @param {import('gi://Gtk').Gtk.Widget[]} o.content
 */
export const Menu = ({ name, icon, title, content }) =>
  Widget.Revealer({
    transition: "slide_down",
    binds: [["reveal-child", opened, "value", (v) => v === name]],
    child: Widget.Box({
      classNames: ["menu", name],
      vertical: true,
      children: [
        Widget.Box({
          className: "title horizontal",
          children: [icon, title],
        }),
        Widget.Separator(),
        ...content,
      ],
    }),
  });

/**
 * @param {Object} o
 * @param {import('gi://Gtk').Gtk.Widget} o.icon
 * @param {() => void} o.toggle
 * @param {[import('gi://GObject').GObject.Object, () => boolean]} o.connection
 */
export const SimpleToggleButton = ({
  icon,
  toggle,
  connection: [service, condition],
}) =>
  Widget.Button({
    className: "simple-toggle",
    connections: [
      [
        service,
        (box) => {
          box.toggleClassName("active", condition());
        },
      ],
    ],
    child: icon,
    onClicked: toggle,
  });