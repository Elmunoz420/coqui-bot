# Deploy Guide — CoquiBot a OKE (Juan Pablo's Cluster)

Documento basado en el deploy exitoso del 2026-04-29.  
Rama: `refactor` → Cluster: `context-cwjp4dructq` (IP `163.192.143.141`)  
Registry: `mx-queretaro-1.ocir.io/axsmsoz5mjgw/agileimage:0.1`

---

## Prerequisitos

### 1. kubectl context correcto
```powershell
kubectl config use-context context-cwjp4dructq
kubectl config current-context   # debe mostrar context-cwjp4dructq
kubectl get nodes                 # debe listar los nodos del cluster de JP
```

### 2. Docker login al OCIR de Juan Pablo
```powershell
docker login mx-queretaro-1.ocir.io
# Usuario:   axsmsoz5mjgw/<tu-usuario-oci>
# Password:  Auth Token de OCI (no la contraseña de consola)
```

### 3. Estar en la rama refactor
```powershell
git checkout refactor
git pull coqui refactor
```

Si la rama local tiene cambios no commiteados que bloquean el checkout:
```powershell
# OPCIÓN A — guardar cambios temporalmente
git stash

# OPCIÓN B — descartar cambios locales (solo si ya están en refactor)
git checkout -- .
git clean -fd
git checkout refactor
git pull coqui refactor
```

---

## Paso 1 — Pull del branch refactor

```powershell
git fetch coqui refactor
git checkout refactor
git pull coqui refactor
```

Si la rama local ya existe y hay conflicto de cambios locales, ver Prerequisito 3 arriba.

---

## Paso 2 — Verificar deploy-final.yaml

Abrir `backend\deploy-final.yaml` y confirmar los tres campos críticos:

```yaml
# 1. Namespace correcto del OCIR (axsmsoz5mjgw, NO axicfx7xkp0y)
image: mx-queretaro-1.ocir.io/axsmsoz5mjgw/agileimage:0.1

# 2. DB apuntando a la base de CoquiBot (coquibot_tp, NO taskbotdb_tp)
- name: db_url
  value: "jdbc:oracle:thin:@coquibot_tp?TNS_ADMIN=/mtdrworkshop/creds"

# 3. ANTHROPIC_API_KEY usando la key correcta del secret (apikey, NO api-key)
- name: ANTHROPIC_API_KEY
  valueFrom:
    secretKeyRef:
      name: anthropic-secret
      key: apikey
```

Si algo está mal, corregirlo antes de continuar.

---

## Paso 3 — Build y push de la imagen

```powershell
cd C:\Users\Lenovo\oci_devops_project\backend

# Build del JAR
mvn clean verify -q

# Build de la imagen Docker para linux/amd64 (OKE corre en AMD)
docker build -f DockerfileDev --platform linux/amd64 -t mx-queretaro-1.ocir.io/axsmsoz5mjgw/agileimage:0.1 .

# Push al OCIR
docker push mx-queretaro-1.ocir.io/axsmsoz5mjgw/agileimage:0.1
```

El push exitoso termina con una línea similar a:
```
0.1: digest: sha256:f9e19ca9c241... size: 856
```

---

## Paso 4 — Deploy en OKE

```powershell
cd C:\Users\Lenovo\oci_devops_project\backend

kubectl replace -f deploy-final.yaml -n mtdrworkshop
kubectl rollout restart deployment/todolistapp-springboot-deployment -n mtdrworkshop
kubectl rollout status deployment/todolistapp-springboot-deployment -n mtdrworkshop --timeout=150s
```

Salida esperada al finalizar:
```
deployment "todolistapp-springboot-deployment" successfully rolled out
```

---

## Paso 5 — Verificación final

```powershell
# Ver que los pods estén Running (2/2)
kubectl get pods -n mtdrworkshop

# Ver logs del deployment (buscar "Started MyTodoListApplication")
kubectl logs deployment/todolistapp-springboot-deployment -n mtdrworkshop --tail=60
```

El deploy fue exitoso si aparece:
```
Started MyTodoListApplication in XX.XXX seconds
```

Y **no aparece** ninguno de estos errores:
- `Anthropic` / `ANTHROPIC`
- `CreateContainerConfigError`
- `couldn't find key`
- `CrashLoopBackOff`

Los errores de `TelegramBotSession` con reintentos son **normales** si el bot de Telegram no está activo en ese momento — no indican fallo del deploy.

---

## Troubleshooting

### Problema 1 — Docker build falla con `/wallet: not found`
```
ERROR: failed to calculate checksum ... "/wallet": not found
```
**Causa:** `DockerfileDev` tenía `COPY wallet/ /mtdrworkshop/creds` pero la wallet no se baquea en la imagen; se monta en runtime vía el secret `db-wallet-secret` de Kubernetes.

**Solución:** Eliminar esa línea de `DockerfileDev`. El archivo debe quedar:
```dockerfile
FROM openjdk:22-jdk
RUN mkdir -p /mtdrworkshop/creds     # solo crea el mountpoint, no copia nada
WORKDIR /tmp/
EXPOSE 8080
COPY target/MyTodoList-0.0.1-SNAPSHOT.jar MyTodoList.jar
...
```

---

### Problema 2 — Pod en `CreateContainerConfigError` tras el deploy
```
Error: couldn't find key api-key in Secret mtdrworkshop/anthropic-secret
```
**Causa:** El campo `key:` en el `secretKeyRef` de `ANTHROPIC_API_KEY` no coincide con el nombre real de la key en el secret.

**Diagnóstico:**
```powershell
kubectl describe pod <nombre-del-pod> -n mtdrworkshop
# buscar la línea "Error:" en los Events
```

Verificar las keys reales del secret:
```powershell
kubectl get secret anthropic-secret -n mtdrworkshop -o jsonpath='{.data}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(list(d.keys()))"
```

**Solución:** El secret usa `apikey` (sin guión). Corregir en `deploy-final.yaml`:
```yaml
- name: ANTHROPIC_API_KEY
  valueFrom:
    secretKeyRef:
      name: anthropic-secret
      key: apikey      # NO api-key
```

---

### Problema 3 — Namespace de OCIR incorrecto en la imagen
El `deploy-final.yaml` original apuntaba a `axicfx7xkp0y` (namespace de otro tenancy).  
El namespace correcto del tenancy de Juan Pablo es **`axsmsoz5mjgw`**.

Siempre verificar que la imagen en el yaml coincida exactamente con el tag pusheado:
```
mx-queretaro-1.ocir.io/axsmsoz5mjgw/agileimage:0.1
```

---

### Problema 4 — Rutas Windows en Git Bash
Los comandos Bash con rutas Windows (`cd c:\Users\...`) fallan en Git Bash.  
Usar rutas Unix: `cd /c/Users/Lenovo/oci_devops_project/backend`  
O ejecutar directamente en PowerShell con rutas Windows normales.

---

## Secrets requeridos en el namespace `mtdrworkshop`

| Secret | Key | Descripción |
|---|---|---|
| `dbuser` | `dbpassword` | Password de la DB Oracle |
| `frontendadmin` | `password` | Password del admin de UI |
| `telegram-bot-secret` | `token` | Token del bot de Telegram |
| `anthropic-secret` | `apikey` | API Key de Anthropic (Claude) |
| `db-wallet-secret` | — | Wallet de conexión Oracle (montado como volumen) |
| `ocisecret` | — | Credenciales para pull de imagen desde OCIR |
