# 🚀 Guia de Deploy - FinancePro (VM Windows + Acesso Externo)

Este guia descreve como hospedar o FinancePro em uma VM Windows e torná-lo acessível publicamente via **ngrok**, ideal para demonstrações em eventos.

## 📋 Pré-requisitos na VM

1. **Docker Desktop**
   - Baixe e instale: [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/)
   - *Recomendado:* Ative o suporte ao **WSL 2** durante a instalação.

2. **Git**
   - Baixe e instale: [Git para Windows](https://git-scm.com/download/win)

3. **Conta no ngrok**
   - Crie uma conta gratuita em: [ngrok.com](https://ngrok.com)
   - Copie seu **Authtoken** no painel do ngrok.

## 🛠️ Instalação e Execução

### 1. Clonar o Repositório
Abra o PowerShell na pasta desejada:

```powershell
git clone https://github.com/Thucosta0/financepro-.git
cd financepro-
```

### 2. Configurar Variáveis de Ambiente
Edite o arquivo `.env.local` e adicione seu token do ngrok no final do arquivo:

```env
# ... outras variáveis ...
NGROK_AUTHTOKEN=seu_token_aqui_copiado_do_dashboard
```

### 3. Iniciar o Servidor
Execute o comando para subir a aplicação e o túnel:

```powershell
docker-compose up -d --build
```

---

## 🌍 Como Acessar Externamente (Celular/Visitantes)

Após iniciar o `docker-compose`, o ngrok gerará uma URL pública segura (HTTPS) automaticamente. Para descobrir qual é essa URL:

### Opção A: Via Painel do ngrok (Mais fácil)
1. Acesse [dashboard.ngrok.com/endpoints/status](https://dashboard.ngrok.com/endpoints/status)
2. Você verá a URL ativa (ex: `https://abc1-200-100-50-25.ngrok-free.app`).
3. **Compartilhe essa URL** (ou gere um QR Code para ela) com os visitantes.

### Opção B: Via Logs do Container
No PowerShell, execute:
```powershell
docker-compose logs ngrok
```
Procure nos logs por uma linha que diz `url=https://...`.

---

## 🔄 Manutenção

### Atualizar código
```powershell
git pull origin main
docker-compose up -d --build
```

### Parar tudo
```powershell
docker-compose down
```

## ⚠️ Notas Importantes sobre o ngrok Gratuito

- A URL pública muda cada vez que você reinicia o container (a menos que você tenha um plano pago com domínio fixo).
- Para o evento, **mantenha a VM ligada e o Docker rodando** para não perder a URL.
- Se precisar reiniciar, lembre-se de pegar a nova URL e atualizar seu QR Code (se estiver usando um QR Code dinâmico, melhor ainda).
