# Backend

## API HTTP

As rotas HTTP da API usam o prefixo `/api` (por exemplo, `/api/me` e `/api/bills`). Em desenvolvimento, o CORS aceita origens HTTP locais em `localhost`, `127.0.0.1` e `[::1]`, independentemente da porta do Vite. Os métodos `GET`, `POST`, `PUT`, `PATCH` e `DELETE` são permitidos. O proxy de desenvolvimento encaminha `/api` ao backend sem remover o prefixo.

No Render, configure `FRONTEND_URLS` no backend com a origem exata do frontend (sem caminho final), por exemplo `https://maze-bank-projeto-expoceep2026.onrender.com`. Se houver mais de uma origem legítima, separe-as por vírgula. Em produção (`NODE_ENV=production`), o cookie de sessão usa `Secure` e `SameSite=None` para autenticar chamadas entre os domínios HTTPS do frontend e da API. O navegador ainda pode bloquear cookies de terceiros conforme as políticas de privacidade; nesse caso, publique frontend e API sob o mesmo domínio/site ou use um proxy same-origin.

## Atualizações em tempo real

O backend expõe o WebSocket autenticado em `/ws`. Ele usa o cookie de sessão existente e envia apenas avisos de que os dados da conta mudaram; o frontend então consulta novamente os endpoints HTTP autenticados.

Em desenvolvimento, são aceitas as origens locais `localhost` e `127.0.0.1` nas portas 5173 e 5174, além de `localhost:5500`. Para outros endereços e produção, configure `WS_ALLOWED_ORIGINS` com as origens completas separadas por vírgula, por exemplo:

```text
WS_ALLOWED_ORIGINS=https://maze.example.com
```

O proxy/reverse proxy da aplicação deve encaminhar `/ws` ao backend preservando os headers `Upgrade` e `Connection`. A conexão usa `wss://` quando a aplicação está em HTTPS.
