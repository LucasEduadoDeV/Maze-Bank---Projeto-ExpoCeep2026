# Backend

## Atualizações em tempo real

O backend expõe o WebSocket autenticado em `/ws`. Ele usa o cookie de sessão existente e envia apenas avisos de que os dados da conta mudaram; o frontend então consulta novamente os endpoints HTTP autenticados.

Em desenvolvimento, são aceitas as origens locais `localhost` e `127.0.0.1` nas portas 5173 e 5174, além de `localhost:5500`. Para outros endereços e produção, configure `WS_ALLOWED_ORIGINS` com as origens completas separadas por vírgula, por exemplo:

```text
WS_ALLOWED_ORIGINS=https://maze.example.com
```

O proxy/reverse proxy da aplicação deve encaminhar `/ws` ao backend preservando os headers `Upgrade` e `Connection`. A conexão usa `wss://` quando a aplicação está em HTTPS.
