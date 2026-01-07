# CloudVault - Guida Self-Hosting Completa

Questa guida ti accompagna nell'hosting di CloudVault su un tuo server VPS con dominio personalizzato.

---

## 📋 Requisiti

- VPS con Ubuntu 22.04+ (minimo 1GB RAM)
- Dominio registrato (es. `tuodominio.com`)
- Accesso SSH al server
- Account Supabase (gratuito su [supabase.com](https://supabase.com))

---

## 🗄️ Parte 1: Configurazione Supabase

### 1.1 Crea un nuovo progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un account
2. Clicca "New Project"
3. Scegli nome, password database e regione (scegli la più vicina ai tuoi utenti)
4. Attendi la creazione (2-3 minuti)

### 1.2 Crea le tabelle del database

Vai su **SQL Editor** nel menu laterale e esegui questo script:

```sql
-- Tabella buckets
CREATE TABLE public.buckets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  access TEXT NOT NULL DEFAULT 'PRIVATE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabella storage_items
CREATE TABLE public.storage_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id UUID NOT NULL REFERENCES public.buckets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  size BIGINT DEFAULT 0,
  mime_type TEXT,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Abilita RLS
ALTER TABLE public.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_items ENABLE ROW LEVEL SECURITY;

-- Policy per buckets (permetti tutto - modifica per produzione!)
CREATE POLICY "Allow all bucket operations" ON public.buckets
  FOR ALL USING (true) WITH CHECK (true);

-- Policy per storage_items
CREATE POLICY "Allow all storage_items operations" ON public.storage_items
  FOR ALL USING (true) WITH CHECK (true);

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per buckets
CREATE TRIGGER update_buckets_updated_at
  BEFORE UPDATE ON public.buckets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger per storage_items
CREATE TRIGGER update_storage_items_updated_at
  BEFORE UPDATE ON public.storage_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 1.3 Configura lo Storage

1. Vai su **Storage** nel menu laterale
2. Clicca "New bucket"
3. Nome: `user-files`
4. Spunta "Public bucket" ✅
5. Clicca "Create bucket"

Poi vai su **Policies** per il bucket `user-files` e aggiungi:

```sql
-- Permetti upload pubblico
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-files');

-- Permetti lettura pubblica
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-files');

-- Permetti eliminazione
CREATE POLICY "Allow delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-files');
```

### 1.4 Ottieni le credenziali

1. Vai su **Settings** → **API**
2. Copia questi valori:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGci...` (la chiave lunga)

---

## 🖥️ Parte 2: Preparazione VPS

### 2.1 Connettiti al server

```bash
ssh root@tuo-ip-server
```

### 2.2 Aggiorna il sistema

```bash
apt update && apt upgrade -y
```

### 2.3 Installa le dipendenze

```bash
# Installa Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Installa Nginx
apt install -y nginx

# Installa Certbot per SSL
apt install -y certbot python3-certbot-nginx

# Installa Git
apt install -y git
```

### 2.4 Configura il firewall

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

---

## 📦 Parte 3: Build dell'applicazione

### 3.1 Clona/carica il progetto

**Opzione A - Da Git:**
```bash
cd /var/www
git clone https://github.com/tuo-username/cloudvault.git
cd cloudvault
```

**Opzione B - Upload manuale (da locale):**
```bash
# Sul tuo PC locale
scp -r ./cloudvault root@tuo-ip-server:/var/www/
```

### 3.2 Configura le variabili d'ambiente

```bash
cd /var/www/cloudvault

# Crea il file .env
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF
```

⚠️ **Sostituisci** `xxxxx.supabase.co` e la chiave con i tuoi valori!

### 3.3 Build del progetto

```bash
npm install
npm run build
```

Questo crea la cartella `dist/` con i file statici.

### 3.4 Sposta i file in posizione

```bash
mkdir -p /var/www/cloudvault-prod
cp -r dist/* /var/www/cloudvault-prod/
chown -R www-data:www-data /var/www/cloudvault-prod
```

---

## 🌐 Parte 4: Configurazione Dominio

### 4.1 Configura i record DNS

Nel pannello del tuo registrar (Cloudflare, Namecheap, GoDaddy, ecc.):

| Tipo | Nome | Valore | TTL |
|------|------|--------|-----|
| A | @ | `tuo-ip-server` | Auto |
| A | www | `tuo-ip-server` | Auto |

⏳ Attendi 5-30 minuti per la propagazione DNS.

### 4.2 Verifica la propagazione

```bash
# Dal server
dig tuodominio.com +short
# Dovrebbe mostrare l'IP del tuo server
```

---

## ⚙️ Parte 5: Configurazione Nginx

### 5.1 Crea la configurazione del sito

```bash
cat > /etc/nginx/sites-available/cloudvault << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name tuodominio.com www.tuodominio.com;
    
    root /var/www/cloudvault-prod;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing - redirect all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
```

⚠️ **Sostituisci** `tuodominio.com` con il tuo dominio!

### 5.2 Abilita il sito

```bash
# Rimuovi il sito default
rm -f /etc/nginx/sites-enabled/default

# Abilita CloudVault
ln -s /etc/nginx/sites-available/cloudvault /etc/nginx/sites-enabled/

# Testa la configurazione
nginx -t

# Ricarica Nginx
systemctl reload nginx
```

### 5.3 Verifica che funzioni

Vai su `http://tuodominio.com` - dovresti vedere il sito!

---

## 🔒 Parte 6: Certificato SSL (HTTPS)

### 6.1 Ottieni il certificato con Certbot

```bash
certbot --nginx -d tuodominio.com -d www.tuodominio.com
```

Segui le istruzioni:
1. Inserisci la tua email
2. Accetta i termini (Y)
3. Scegli se ricevere email (opzionale)
4. Certbot configurerà automaticamente Nginx

### 6.2 Verifica il rinnovo automatico

```bash
certbot renew --dry-run
```

### 6.3 Testa HTTPS

Vai su `https://tuodominio.com` 🎉

---

## 🔐 Parte 7: Sicurezza Aggiuntiva

### 7.1 Cambia le credenziali di login

Modifica `src/contexts/AuthContext.tsx` prima del build:

```typescript
// Cambia queste credenziali!
const VALID_USERNAME = 'tuo_username';
const VALID_PASSWORD = 'password_molto_sicura_123!';
```

### 7.2 Configura Fail2ban (protezione brute force)

```bash
apt install -y fail2ban

cat > /etc/fail2ban/jail.local << 'EOF'
[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
EOF

systemctl restart fail2ban
```

### 7.3 Aggiorna regolarmente

```bash
# Crea uno script di aggiornamento
cat > /root/update-cloudvault.sh << 'EOF'
#!/bin/bash
cd /var/www/cloudvault
git pull
npm install
npm run build
cp -r dist/* /var/www/cloudvault-prod/
chown -R www-data:www-data /var/www/cloudvault-prod
systemctl reload nginx
echo "CloudVault aggiornato!"
EOF

chmod +x /root/update-cloudvault.sh
```

---

## 📊 Parte 8: Monitoraggio

### 8.1 Controlla i log

```bash
# Log Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Stato servizi
systemctl status nginx
```

### 8.2 Configura backup automatici (opzionale)

```bash
# Backup giornaliero su Supabase (i dati sono già lì!)
# Per backup locale:
cat > /etc/cron.daily/backup-cloudvault << 'EOF'
#!/bin/bash
tar -czf /root/backups/cloudvault-$(date +%Y%m%d).tar.gz /var/www/cloudvault-prod
find /root/backups -name "cloudvault-*.tar.gz" -mtime +7 -delete
EOF

mkdir -p /root/backups
chmod +x /etc/cron.daily/backup-cloudvault
```

---

## 🚀 Comandi Utili

```bash
# Riavvia Nginx
systemctl restart nginx

# Controlla stato
systemctl status nginx

# Rigenera build
cd /var/www/cloudvault && npm run build && cp -r dist/* /var/www/cloudvault-prod/

# Controlla spazio disco
df -h

# Controlla memoria
free -h
```

---

## ❓ Troubleshooting

### Il sito non carica
```bash
# Controlla se Nginx è attivo
systemctl status nginx

# Controlla i log
tail -50 /var/log/nginx/error.log
```

### Errore 502 Bad Gateway
```bash
# Verifica che i file esistano
ls -la /var/www/cloudvault-prod/
```

### Certificato SSL non funziona
```bash
# Riprova
certbot --nginx -d tuodominio.com
```

### I file non si caricano
- Verifica le policy di Supabase Storage
- Controlla la console del browser per errori CORS

---

## 📞 Supporto

- **Supabase Docs**: https://supabase.com/docs
- **Nginx Docs**: https://nginx.org/en/docs/
- **Certbot Docs**: https://certbot.eff.org/docs/

---

**Buon hosting! 🎉**
