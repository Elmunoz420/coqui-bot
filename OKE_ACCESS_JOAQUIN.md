# Acceso al Cluster OKE por Terminal — Joaquín

Guía completa para que Joaquín tenga acceso total al cluster de Juan Pablo por terminal (`kubectl`, `oci`, restarts, etc).

---

## PARTE 1 — Lo que hace Juan Pablo (5 min, desde OCI Console)

### Paso 1 — Generar API Key para Joaquín

1. Entra a [OCI Console](https://cloud.oracle.com) con tu cuenta
2. Ve a **Identity & Security → Users**
3. Click en el usuario de Joaquín: `A01639134@tec.mx`
4. Scroll abajo hasta la sección **API Keys**
5. Click **Add API Key**
6. Selecciona **Generate API Key Pair**
7. Click **Download Private Key** — guarda el archivo `.pem`
8. Click **Add**
9. OCI te muestra un snippet así:

```
[DEFAULT]
user=ocid1.user.oc1..xxxxxxxx
fingerprint=xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..xxxxxxxx
region=mx-queretaro-1
key_file=~/.oci/oci_api_key.pem
```

10. **Mándale a Joaquín por privado:**
    - El archivo `.pem` (private key)
    - El snippet de config completo con su fingerprint

---

## PARTE 2 — Lo que hace Joaquín (10 min, desde su terminal)

### Prerequisitos
- OCI CLI instalado ([instrucciones](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm))
- kubectl instalado
- Git instalado

### Paso 1 — Configurar OCI CLI

Crea la carpeta de configuración:

```powershell
New-Item -ItemType Directory -Force -Path "$HOME\.oci"
```

Crea el archivo de config:

```powershell
notepad "$HOME\.oci\config"
```

Pega el snippet que te mandó Juan Pablo:

```
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaawfuyiiunvn5b5hfggaxerwzxnip7pgcj7ixzsvbc24fpuw6jcxnq
fingerprint=<el fingerprint que aparece en OCI Console>
tenancy=ocid1.tenancy.oc1..aaaaaaaabu4feiz5nqwybinvfbqjm6eoofsw46gye7mod5qekutjbqmde2bq
region=mx-queretaro-1
key_file=~/.oci/oci_api_key.pem
```

### Paso 2 — Colocar el Private Key

Mueve el archivo `.pem` que te mandó Juan Pablo a:

```powershell
Copy-Item "C:\Users\TuUsuario\Downloads\oci_api_key.pem" "$HOME\.oci\oci_api_key.pem"
```

### Paso 3 — Verificar que OCI CLI funciona

```powershell
oci iam user get --user-id ocid1.user.oc1..aaaaaaaawfuyiiunvn5b5hfggaxerwzxnip7pgcj7ixzsvbc24fpuw6jcxnq
```

Debe regresar un JSON con tu info de usuario. Si da error de fingerprint, verifica que el `.pem` y el fingerprint en el config coincidan.

### Paso 4 — Generar kubeconfig

```powershell
oci ce cluster create-kubeconfig `
  --cluster-id ocid1.cluster.oc1.mx-queretaro-1.aaaaaaaa5fcvxlch5ucu36iwnae7svtdyslyw4krkbnz2nco3cwjp4dructq `
  --region mx-queretaro-1 `
  --token-version 2.0.0 `
  --kube-endpoint PUBLIC_ENDPOINT `
  --overwrite
```

### Paso 5 — Verificar acceso al cluster

```powershell
kubectl get pods -n mtdrworkshop
```

Debes ver algo así:

```
NAME                                                  READY   STATUS    RESTARTS
todolistapp-springboot-deployment-xxxxxxxxx-xxxxx     1/1     Running   0
todolistapp-springboot-deployment-xxxxxxxxx-xxxxx     1/1     Running   0
```

---

## Comandos de uso diario

### Ver pods
```powershell
kubectl get pods -n mtdrworkshop
```

### Ver logs en tiempo real
```powershell
kubectl logs -f deployment/todolistapp-springboot-deployment -n mtdrworkshop
```

### Restart del deployment
```powershell
kubectl rollout restart deployment/todolistapp-springboot-deployment -n mtdrworkshop
```

### Ver status del rollout
```powershell
kubectl rollout status deployment/todolistapp-springboot-deployment -n mtdrworkshop
```

### Apagar la app (escalar a 0 pods)
```powershell
kubectl scale deployment/todolistapp-springboot-deployment --replicas=0 -n mtdrworkshop
```

### Prender la app (restaurar a 2 pods)
```powershell
kubectl scale deployment/todolistapp-springboot-deployment --replicas=2 -n mtdrworkshop
```

### Ver servicios e IP del LoadBalancer
```powershell
kubectl get svc -n mtdrworkshop
```

La app corre en: **http://163.192.143.141/**

---

## Info del cluster

| Campo | Valor |
|---|---|
| Cluster ID | `ocid1.cluster.oc1.mx-queretaro-1.aaaaaaaa5fcvxlch5ucu36iwnae7svtdyslyw4krkbnz2nco3cwjp4dructq` |
| Región | `mx-queretaro-1` |
| Namespace | `mtdrworkshop` |
| Tenancy OCID | `ocid1.tenancy.oc1..aaaaaaaabu4feiz5nqwybinvfbqjm6eoofsw46gye7mod5qekutjbqmde2bq` |
| URL app | `http://163.192.143.141/` |
| Registry OCIR | `mx-queretaro-1.ocir.io/axsmsoz5mjgw/agileimage:0.1` |
