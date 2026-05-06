# Deployment Guide — Ubuntu 24.04 LTS

Panduan lengkap setup **PostgreSQL 16**, **PgBouncer**, dan deploy aplikasi **Bun monorepo** ini di Ubuntu Server 24.04 menggunakan PM2 + Systemd.

---

## 📋 Stack Overview

| Komponen | Versi / Detail |
|----------|----------------|
| OS | Ubuntu 24.04 LTS |
| Runtime | Bun |
| API | Hono + Drizzle ORM |
| Web | Next.js 14 |
| Database | PostgreSQL 16 |
| Connection Pooler | PgBouncer |
| Process Manager | PM2 + Systemd |
| Reverse Proxy | Nginx |

---

## 1. Server Preparation

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install tools umum
sudo apt install -y curl git build-essential nginx ufw

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version

# Install Node.js (dibutuhkan oleh Next.js / PM2 secara opsional)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version

# Install PM2 global
bun add -g pm2
```

---

## 2. PostgreSQL 16 Setup

### 2.1 Install & Start Service

```bash
sudo apt install -y postgresql postgresql-contrib

# Pastikan PostgreSQL running dan enable on boot
sudo systemctl enable --now postgresql
sudo systemctl status postgresql
```

### 2.2 Create Database & User

```bash
# Ganti password sesuai kebutuhan
sudo -u postgres psql -c "CREATE USER sandbox WITH PASSWORD 'StrongPassword123';"
sudo -u postgres psql -c "CREATE DATABASE sandbox OWNER sandbox;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sandbox TO sandbox;"
```

### 2.3 Konfigurasi Akses (pg_hba.conf)

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Pastikan baris berikut ada (untuk local & IPv4):

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

> Jika aplikasi berjalan di server yang sama, bind ke `127.0.0.1` sudah cukup aman.

### 2.4 Konfigurasi Listen Address (postgresql.conf)

```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Cari dan ubah:

```conf
listen_addresses = 'localhost'
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## 3. PgBouncer Setup (Connection Pooler)

PgBouncer disarankan untuk mengurangi overhead koneksi ke PostgreSQL, terutama jika API memiliki banyak worker/instans.

### 3.1 Install PgBouncer

```bash
sudo apt install -y pgbouncer
```

### 3.2 Konfigurasi PgBouncer

Edit file utama:

```bash
sudo nano /etc/pgbouncer/pgbouncer.ini
```

Isi minimal yang direkomendasikan:

```ini
[databases]
sandbox = host=127.0.0.1 port=5432 dbname=sandbox

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 600
server_lifetime = 3600
server_connect_timeout = 15
stats_period = 60
log_connections = 0
log_disconnections = 0
```

> `pool_mode = transaction` adalah mode paling aman untuk aplikasi web modern. Setiap transaksi menggunakan koneksi dari pool dan dikembalikan setelah `COMMIT`.

### 3.3 Buat Auth File

```bash
sudo nano /etc/pgbouncer/userlist.txt
```

Format:

```text
"sandbox" "SCRAM-SHA-256$4096:..."
```

Untuk generate hash SCRAM-SHA-256 dengan mudah, gunakan perintah:

```bash
# Method 1: gunakan psql untuk mendapatkan password hash (jika password plain sudah diketahui)
# Atau lebih mudah, gunakan mode auth_type = md5 (kurang direkomendasikan) atau trusted (hanya jika localhost)
```

**Cara paling praktis** untuk localhost-only setup:

Ubah `auth_type` menjadi `trust` (hanya jika PgBouncer & App berada di server yang sama):

```ini
auth_type = trust
```

Jika ingin tetap `scram-sha-256`, generate hash:

```bash
psql -h 127.0.0.1 -p 5432 -U sandbox -d sandbox -c "\password"
# Lalu copy hash dari PostgreSQL (lihat di pg_authid) — cara ini memerlukan langkah tambahan.
```

> **Rekomendasi produksi**: gunakan `auth_type = scram-sha-256` dan isi `userlist.txt` dengan hash yang benar. Untuk setup cepat di single server, `trust` masih dapat diterima karena listen_addr hanya `127.0.0.1`.

### 3.4 Start & Enable PgBouncer

```bash
sudo systemctl enable --now pgbouncer
sudo systemctl status pgbouncer
```

Verifikasi PgBouncer berjalan:

```bash
psql -h 127.0.0.1 -p 6432 -U sandbox -d sandbox -c "SELECT 1;"
```

---

## 4. Application Deployment

### 4.1 Clone Repository

```bash
cd /var/www
sudo git clone <repo-url> sandbox
sudo chown -R $USER:$USER sandbox
cd sandbox
```

### 4.2 Install Dependencies & Build

```bash
bun install

# Build shared packages & apps
bun run build
```

### 4.3 Environment Configuration

Buat file environment untuk production:

**`apps/api/.env`**

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://sandbox:StrongPassword123@127.0.0.1:6432/sandbox
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**`apps/web/.env.local`**

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_URL=https://api.yourdomain.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

> Ubah `NEXT_PUBLIC_API_URL` dan `API_URL` sesuai domain Anda.

### 4.4 Database Migration

```bash
cd /var/www/sandbox
bun run db:migrate
```

> Pastikan `DATABASE_URL` sudah mengarah ke PgBouncer (port `6432`) atau langsung ke PostgreSQL (port `5432`). Untuk migration via Drizzle Kit, koneksi langsung ke PostgreSQL juga aman.

---

## 5. PM2 Process Manager + Systemd

Project ini sudah memiliki konfigurasi PM2: `ecosystem.prod.config.cjs`.

### 5.1 Jalankan Aplikasi dengan PM2

```bash
cd /var/www/sandbox
pm2 start ecosystem.prod.config.cjs --env production
```

Cek status:

```bash
pm2 status
pm2 logs
```

### 5.2 Save PM2 Config & Setup Systemd Auto-start

Agar PM2 berjalan sebagai **daemon** dan auto-start saat server reboot:

```bash
# Simpan konfigurasi PM2
pm2 save

# Generate systemd startup script
pm2 startup systemd
```

PM2 akan mengeluarkan perintah yang harus di-copy dan dijalankan dengan `sudo`, contoh:

```bash
sudo env PATH=$PATH:/home/username/.bun/bin /home/username/.bun/bin/bun pm2 startup systemd -u username --hp /home/username
```

Jalankan perintah tersebut, lalu:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable PM2 service
sudo systemctl enable pm2-username

# Start PM2 service via systemd
sudo systemctl start pm2-username

# Cek status
sudo systemctl status pm2-username
```

Sekarang PM2 (beserta aplikasi API & Web) akan otomatis start saat boot.

### 5.3 PM2 Cheat Sheet

```bash
pm2 status                 # Lihat status aplikasi
pm2 logs                   # Lihat log real-time
pm2 logs --lines 100       # Lihat 100 baris log terakhir
pm2 restart all            # Restart semua aplikasi
pm2 reload all             # Zero-downtime reload
pm2 stop all               # Hentikan semua aplikasi
pm2 delete all             # Hapus semua dari PM2 list
pm2 monit                  # Monitor interaktif
```

---

## 6. Nginx Reverse Proxy

### 6.1 API Proxy

```bash
sudo nano /etc/nginx/sites-available/api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Web Proxy

```bash
sudo nano /etc/nginx/sites-available/web
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.3 Enable Sites

```bash
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. SSL dengan Certbot (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL untuk API
sudo certbot --nginx -d api.yourdomain.com

# Generate SSL untuk Web
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal sudah aktif secara default, cek dengan:
sudo systemctl status certbot.timer
```

---

## 8. Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Jika perlu expose port langsung (tidak disarankan jika sudah pakai Nginx)
# sudo ufw allow 4000/tcp
# sudo ufw allow 3000/tcp

sudo ufw enable
sudo ufw status verbose
```

---

## 9. Struktur Port & Akses

| Layanan | Port | Akses External |
|---------|------|----------------|
| Nginx (Web) | 80 / 443 | ✅ Ya |
| Nginx (API) | 80 / 443 | ✅ Ya |
| Next.js App | 3000 | ❌ Hanya localhost |
| Hono API | 4000 | ❌ Hanya localhost |
| PgBouncer | 6432 | ❌ Hanya localhost |
| PostgreSQL | 5432 | ❌ Hanya localhost |

---

## 10. Troubleshooting

### PostgreSQL tidak bisa diakses

```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"
sudo cat /var/log/postgresql/postgresql-16-main.log
```

### PgBouncer error auth

```bash
sudo cat /var/log/postgresql/pgbouncer.log
# Pastikan user & password di userlist.txt sesuai
```

### PM2 tidak auto-start setelah reboot

```bash
sudo systemctl status pm2-$(whoami)
pm2 save
sudo env PATH=$PATH:$(dirname $(which bun)) $(which bun) pm2 startup systemd -u $(whoami) --hp $HOME
```

### Drizzle migration gagal

Pastikan `DATABASE_URL` valid:

```bash
cd /var/www/sandbox
export $(cat apps/api/.env | xargs)
bun run db:migrate
```

### Permission denied saat git pull / build

```bash
sudo chown -R $USER:$USER /var/www/sandbox
```

---

## 11. Maintenance & Update

### Update aplikasi (zero-downtime)

```bash
cd /var/www/sandbox
git pull origin main
bun install
bun run build
bun run db:migrate
pm2 reload ecosystem.prod.config.cjs --env production
```

### Backup Database

```bash
# Backup manual
pg_dump -h 127.0.0.1 -p 6432 -U sandbox -d sandbox > backup_$(date +%F).sql

# Restore
psql -h 127.0.0.1 -p 6432 -U sandbox -d sandbox < backup_2026-01-01.sql
```

### Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo systemctl restart postgresql pgbouncer nginx
pm2 reload all
```

---

## ✅ Checklist Deploy

- [ ] PostgreSQL 16 terinstall & running
- [ ] Database & user PostgreSQL dibuat
- [ ] PgBouncer terinstall & running di port 6432
- [ ] Repository di-clone ke `/var/www/sandbox`
- [ ] `bun install` & `bun run build` sukses
- [ ] File `.env` (API) dan `.env.local` (Web) sudah dibuat
- [ ] `bun run db:migrate` sukses
- [ ] PM2 running dengan `ecosystem.prod.config.cjs`
- [ ] `pm2 startup systemd` & `pm2 save` sudah dieksekusi
- [ ] Nginx configured & SSL aktif
- [ ] UFW aktif dengan aturan yang benar
- [ ] Aplikasi bisa diakses via domain
