import icons from "../icons.js";
import { App, Applications, Gdk, Gtk, Variable, Widget } from "../imports.js";
import PopupWindow from "../misc/PopupWindow.js";
import options from "../options.js";
import AppItem from "./AppItem.js";

const WINDOW_NAME = "launcher";
const searchTerm = Variable("");

const searchBar = Widget.Entry({
  hexpand: false,
  primary_icon_name: icons.apps.search,
  setup: (self) => {
    self.grab_focus_without_selecting();
  },
  binds: [["text", searchTerm]],
  on_change: ({ text }) => {
    searchTerm.value = text;
  },
});

const Applauncher = () => {
  const flowbox = () =>
    Widget.FlowBox({
      className: "app-list",
      vpack: "start",
      hpack: "start",
      min_children_per_line: 5,
      max_children_per_line: 5,
      selection_mode: Gtk.SelectionMode.NONE,
      setup: (self) => {
        options.launcher.pins.map((term) => {
          const app = Applications.list.find(
            (app) => app.name.toLowerCase() === term.toLowerCase()
          );
          if (!app) {
            console.warn(`Launcher pinned app "${term}" not found`);
            return;
          }
          self.add(AppItem(app));
        });
        Applications.list.map((app) => {
          for (const appName of options.launcher.pins) {
            if (app.name.toLowerCase() === appName.toLowerCase()) return;
          }
          self.add(AppItem(app));
        });
        // The child is a Gtk.FlowBoxChild, not the button, but we only want to focus the app button
        // which is the child of the child
        self.get_child_at_index(0).get_child().grab_focus();
        // The button is what should grab focus, so disable focus on FlowBoxChild
        self.get_children().map((child) => {
          child.can_focus = false;
        });
        self.show_all();
      },
      connections: [
        [
          searchTerm,
          (self) => {
            if (searchTerm.value.length < 1) {
              self.get_child_at_index(0).get_child().grab_focus();
              self.show_all();
              return;
            }
            for (const item of self.get_children()) {
              if (item.get_child().app.match(searchTerm.value)) {
                item.visible = true;
              } else {
                item.visible = false;
              }
            }
            for (const item of self.get_children()) {
              if (item.visible) {
                item.get_child().grab_focus();
                break;
              }
            }
          },
        ],
      ],
    });

  return Widget.Box({
    vertical: true,
    className: "launcher",
    children: [
      searchBar,
      Widget.Scrollable({
        hscroll: "never",
        vscroll: "always",

        connections: [
          [
            Applications,
            (self) => {
              self.child = flowbox();
            },
            "changed",
          ],
        ],
      }),
    ],
    connections: [
      [
        App,
        (_, name, visible) => {
          if (name !== WINDOW_NAME || visible === false) return;
          searchTerm.value = "";
        },
        "window-toggled",
      ],
    ],
  });
};

export default () =>
  PopupWindow({
    name: WINDOW_NAME,
    transition: "none",
    layer: "overlay",
    child: Applauncher(),
    connections: [
      [
        "key-press-event",
        (_, event) => {
          const key = event.get_keyval()[1];
          switch (key) {
            case Gdk.KEY_downarrow:
            case Gdk.KEY_Up:
            case Gdk.KEY_Down:
            case Gdk.KEY_Left:
            case Gdk.KEY_Right:
            case Gdk.KEY_Tab:
            case Gdk.KEY_Return:
            case Gdk.KEY_Page_Up:
            case Gdk.KEY_Page_Down:
            case Gdk.KEY_Home:
            case Gdk.KEY_End:
              return false;
            default:
              if (!searchBar.is_focus) {
                searchBar.grab_focus_without_selecting();
              }
              return false;
          }
        },
      ],
    ],
  });
