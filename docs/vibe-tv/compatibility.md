# Compatibilidade e roteiro de hardware

## Matriz de capacidades

| Recurso | Implementação pretendida | Limite de evidência |
|---|---|---|
| UI, temas, favoritos e foco | Mesmas fontes no navegador e no WGT | Teste local não mede desempenho do chip da TV |
| Abrir app existente | Inventário real e application.launch | Cada serviço/firmware exige teste; nenhum ID Android ou catálogo é presumido |
| Último acesso | Último lançamento bem-sucedido pelo Vibe | Não lê uso global nem reprodução privada |
| Retomar episódio | Indisponível sem integração autorizada do provedor | Não há progresso ou episódio fictício |
| PS5 HDMI 2 | Fonte HDMI real, setSource e viewer nativo documentado | Qualidade, HDR, Game Mode e latência não foram testados |
| Configurações Samsung | Controle e Smart Hub nativos preservados | Não é prometido acesso programático a todos os menus |
| Inicialização | App separado | Não substitui Home nem garante abrir em todo boot |
| Logins | Abrir apps instalados sem acessar seus dados | Preservação física e restauração integral ainda não verificadas |
| Backup | Nenhum integral verificado | Instalação bloqueada |

A AU8000 de 2021 é da família Tizen 6.0, engine Chromium 76. As fontes evitam sintaxes recentes sem suporte. O navegador Samsung não fornece APIs Tizen: para integração real é necessário um WGT instalado e assinado. O arquivo local produzido é não assinado.

## Testes físicos futuros, somente após resolver o backup

1. Confirmar o requisito de recuperação e a autorização específica para instalação. Preparar SDK/certificado Samsung e modo desenvolvedor com o usuário, mantendo chaves fora do Git.
2. Instalar somente o WGT Vibe TV assinado; não executar `build.sh`/ADB do upstream Android.
3. Conferir inventário real e identificar cada favorito; validar ausência, nomes ambíguos e erros.
4. Abrir cada serviço e confirmar que a sessão preexistente continua utilizável; não solicitar senhas pelo chat.
5. Confirmar HDMI 2/PS5 e retorno ao sinal nativo; comparar imagem, áudio, HDR, Game Mode e latência. Se o viewer falhar após troca de fonte, a interface deve informar a alteração parcial.
6. Testar setas/OK/Voltar no Vibe; Home/Volume/Power continuam nativos. Reabrir Vibe pelo Smart Hub após usar outro app.
7. Testar encerramento e início frio, persistência, corte/reconexão de rede e a opção de último app do sistema, quando disponível. Não afirmar autorun universal.
8. Testar saída e remoção exclusivamente do Vibe, confirmando sistema/apps/configurações. Não usar reset Smart Hub/factory reset.

## Fontes oficiais

- [Engine por ano de TV](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html)
- [Application API TV 6.0](https://github.com/Samsung/tizen-docs/blob/master/docs/application/web/api/6.0/device_api/tv/tizen/application.html)
- [TVWindow](https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/tvwindow-api.html)
- [SystemInfo / VIDEOSOURCE](https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/systeminfo-api.html)
- [Viewer nativo, overlays e background](https://developer.samsung.com/smarttv/develop/faq/other-features.html)
- [Controle remoto e navegador](https://developer.samsung.com/smarttv/develop/faq/user-interaction.html)
- [Autorun Last App](https://www.samsung.com/au/support/tv-audio-video/use-autorun-start-screen-options-on-your-samsung-tv/)
- [Prelaunch: não suportado desde 2019](https://developer.samsung.com/smarttv/develop/guides/fundamentals/prelaunching-applications.html)
