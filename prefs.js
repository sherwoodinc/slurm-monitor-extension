const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}

function buildPrefsWidget() {

    // Copy the same GSettings code from `extension.js`
    this.settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.slurmmonitor');

    // Create a parent widget that we'll return from this function
    let prefsWidget = new Gtk.Grid({
        margin: 18,
        column_spacing: 12,
        row_spacing: 12,
        visible: true
    });

    // Add a simple title and add it to the prefsWidget
    let title = new Gtk.Label({
        label: `<b>${Me.metadata.name} Preferences</b>`,
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    prefsWidget.attach(title, 0, 0, 2, 1);

    // Create a label & switch for `hostname`
    let hostnameLabel = new Gtk.Label({
        label: 'user@hostname:',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(hostnameLabel, 0, 1, 1, 1);

    let textbuffer = new Gtk.EntryBuffer({
        text: this.settings.get_string ('hostname')
    }

    );
    let text = new Gtk.Entry({
        buffer: textbuffer,
        halign: Gtk.Align.END,
        visible: true
    });
    prefsWidget.attach(text, 1, 1, 1, 1);

        // Bind the switch to the `show-indicator` key
        this.settings.bind(
            'hostname',
            textbuffer,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );
    

    // Create a label & switch for `hostname`
    let intervalLabel = new Gtk.Label({
        label: 'Refresh interval (seconds):',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(intervalLabel, 0, 2, 1, 1);

    let adj = new Gtk.Adjustment({
        value: this.settings.get_int ('refresh-interval-seconds'),
        lower: 1,
        upper: 9999999,
        step_increment: 60,
        page_increment: 5,
        page_size: 0}
        );

    let spin = new Gtk.SpinButton({
        adjustment: adj,
        value: this.settings.get_int ('refresh-interval-seconds'),
        halign: Gtk.Align.END,
        visible: true
    });
    prefsWidget.attach(spin, 1, 2, 1, 1);
    
    // Bind the switch to the `show-indicator` key
    this.settings.bind(
        'refresh-interval-seconds',
        spin,
        'value',
        Gio.SettingsBindFlags.DEFAULT
    );

    // Return our widget which will be added to the window
    return prefsWidget;
}
