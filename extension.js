/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = 'my-indicator-extension';

const { Clutter, Gio, GLib, GObject, Shell, St } = imports.gi;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    status()
		{        
			if(typeof this.logfile == "undefined")
			{
			this.logfile = Gio.file_new_for_path(GLib.get_user_cache_dir()+"/slurmmonitor-extension.log");
			}

		let fileOutput = this.logfile.append_to(Gio.FileCreateFlags.PRIVATE,null);
			if(!arguments[0])
			fileOutput.write("\n",null);
			else
			fileOutput.write("["+new Date().toString()+"] "+arguments[0]+"\n",null);
		fileOutput.close(null);
		return 0;
	}

    _init(hostname) {
        super._init(0.0, _('My Shiny Indicator'));
        let jobs = String(GLib.spawn_command_line_sync('ssh '+hostname+' -C \'squeue --format="%.6i %.4Q %.7T %.13V %.13S %.10u %.8a %.8q %.10P %16j %.11M %.11l %.5D %R"\'')[1]).split('\n');
        let i = 0;
        for (i=0; i<jobs.length-1; ++i) {
            jobs[i] = jobs[i].split(/\s+/);
        }
        let joblist = [];
        for (i=1; i<jobs.length-1; ++i) {
            let v = {};
            for (let j=0; j < jobs[1].length; ++j)
                v[jobs[0][j+1]] = jobs[i][j];
            joblist.push(v);
        }
        this.status("Jobs fetched: " + String(joblist.length));

        let box = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        box.add_child(new St.Icon({
            icon_name: 'face-smile-symbolic',
            style_class: 'system-status-icon',
        }));
        box.add_child(new St.Label({
            text: String(joblist.length)+_(' jobs'),
            y_align: Clutter.ActorAlign.CENTER
        }));
        box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.add_child(box);

        i = 0;
        while (i < joblist.length) {
         let item = new PopupMenu.PopupMenuItem(joblist[i]["JOBID"] + " -- " + joblist[i]["STATE"] + " -- " + joblist[i]["TIME"] +" of " + joblist[i]["TIME_LIMIT"] );
         this.menu.addMenuItem(item);
         i++;
        } 
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        this.timer = null;
	this._hostname = "localhost";
	this._interval = 60;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);

        this.settings = ExtensionUtils.getSettings(
            'org.gnome.shell.extensions.slurmmonitor');
    }

    status()
		{
			if(typeof this.logfile == "undefined")
			{
			this.logfile = Gio.file_new_for_path(GLib.get_user_cache_dir()+"/slurmmonitor-extension.log");
			}

		let fileOutput = this.logfile.append_to(Gio.FileCreateFlags.PRIVATE,null);
			if(!arguments[0])
			fileOutput.write("\n",null);
			else
			fileOutput.write("["+new Date().toString()+"] "+arguments[0]+"\n",null);
		fileOutput.close(null);
		return 0;
	}

    refresh() {
        this.status(_("Refreshing SLURM info..."));
        this._indicator = new Indicator(this._hostname);
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    enable() {
        this._hostname = this.settings.get_string('hostname');	    
        this._interval = this.settings.get_int('refresh-interval-seconds');
	    if (this._interval < 5)		    
		    this._interval = 5;	     

        this.refresh();
        this.timer  = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._interval*1000, imports.lang.bind(this, function() { this._update(); return true;}));
    }
    
    disable() {
        if (this.timer)
            GLib.source_remove(this.timer);
        this.timer = null;
        this._indicator.destroy();
        this._indicator = null;
    }

    _update() {
        this._indicator.destroy();
        this._indicator = null;
        this.refresh();
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
