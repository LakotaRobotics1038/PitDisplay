# 1038 Pit Display

## Setting up on a new Linux device

1. **Clone this repo to a USB 3.0 or higher USB drive** and name the drive `1038Pit`.
2. **Attach the drive** to a USB 3.0 or higher port on your Linux computer.
3. **Set up USB auto-mount:** Follow the [USB Auto-mount Instructions](./usb_mount_setup.md) to ensure the USB drive always mounts to `/mnt/1038Pit` at boot. (See that file for details on UUID, fstab, and systemd service setup.)
4. **Install the Autodesk Viewer system service:**
   1. Copy the service file: `sudo cp ./autodesk-viewer/autodesk-viewer.service /etc/systemd/system/autodesk-viewer.service`
   2. Reload systemd: `sudo systemctl daemon-reload`
   3. Enable and start: `sudo systemctl enable --now autodesk-viewer.service`
5. **Install the Pit Display user service:**
   1. Ensure the directory exists: `mkdir -p ~/.config/systemd/user/`
   2. Copy the service file: `cp ./pit-display.service ~/.config/systemd/user/pit-display.service`
   3. Enable and start: `systemctl enable --now --user pit-display.service`
6. **Set up automatic login:** Configure your Linux system to log in automatically on boot. [See this guide for Ubuntu/Debian](https://wiki.archlinux.org/title/Automatic_login#GDM) or your distro's documentation.
7. **Reboot and verify:** Restart your Linux device. It should launch a Chromium browser in kiosk mode with the pit display active. (If not, see Troubleshooting below.)

### Notes

- **Permissions:** Only steps involving `/etc/systemd/system/` require `sudo`. User-level service steps do not.
- **Chromium Kiosk:** The pit-display service launches Chromium in kiosk mode automatically (see the service file for details).
- **User directory:** If `~/.config/systemd/user/` does not exist, create it first.

## Updating the display

1. Turn off the linux system and remove the USB drive
2. Attach the USB drive to your computer and `git pull` on the repo on the drive
3. Reconnect USB to linux device and turn back on

## How to get the videos

1. Go to <https://drive.google.com/drive/folders/1qx3EfIiKZUHiw8Z3KiMIw3TmyeBKLSpr?usp=drive_link> and download the folder
1. Place the videos in the [./src/videos](./src/videos) folder you just made **(make sure the individual videos are in the `./src/videos` directory, any other directory or subdirectory will not work)**

Once all of those steps are completed, it should look something like this:
![Image showing two videos under /src/videos](videoplacementinstructionfinal.png)

---

## Troubleshooting

- **Service not starting?**
  - Check the status: `systemctl status autodesk-viewer.service` or `systemctl --user status pit-display.service`
  - Check the USB is mounted at `/mnt/1038Pit`.
  - Ensure the correct user is logged in and auto-login is enabled.
- **USB not mounting?**
  - Double-check the UUID in `/etc/fstab` and the mount-pit-display.service file.
  - Run `lsblk -f` to verify the UUID.
  - See [usb_mount_setup.md](./usb_mount_setup.md) for more help.
- **Chromium not launching?**
  - Make sure Chromium is installed: `which chromium` or `which chromium-browser`.
  - Check the ExecStart line in the service file for errors.
