# Linux USB Auto-Mount

## 1. Get the USB UUID

Plug in the USB drive and run:

```bash
lsblk -f
```

Example output:

```text
sda1  exfat  MYDRIVE  6987-B281
```

Or:

```bash
blkid
```

Example:

```text
/dev/sda1: UUID="6987-B281" TYPE="exfat"
```

Copy the UUID (e.g., `6987-B281`)

---

## 2. Create the mount point

```bash
sudo mkdir -p /mnt/1038Pit
sudo chown team1038:team1038 /mnt/1038Pit
```

---

## 3. Configure `/etc/fstab`

Edit the file:

```bash
sudo nano /etc/fstab
```

Add this line:

```fstab
UUID=6987-B281  /mnt/1038Pit  exfat  nofail,x-systemd.device-timeout=30,uid=team1038,gid=team1038,ro  0  0
```

Save and test:

```bash
sudo systemctl daemon-reload
sudo mount -av
findmnt /mnt/1038Pit
```

---

## 4. Create the retry mount service

Create the service file:

```bash
sudo cp ./mount-pit-display.service /etc/systemd/system/mount-pit-display.service
```

---

## 5. Enable the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mount-pit-display.service
```

Verify:

```bash
sudo systemctl status mount-pit-display.service --no-pager
findmnt /mnt/1038Pit
```

---

## 6. Reboot test

```bash
sudo reboot
```

After reboot:

```bash
findmnt /mnt/1038Pit
```

---

## 7. If the USB UUID changes

Find new UUID:

```bash
lsblk -f
```

Update it in:

- `/etc/fstab`
- `/etc/systemd/system/mount-pit-display.service`

Then run:

```bash
sudo systemctl daemon-reload
sudo systemctl restart mount-pit-display.service
sudo mount -av
```

---

## Result

- USB mounts at: `/mnt/1038Pit`
- Works at boot
- Retries if device is slow to initialize
- Safe read-only kiosk setup
