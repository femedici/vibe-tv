# Compatibilidade e roteiro de hardware

## Matriz de capacidades

| Recurso | Implementação pretendida | Limite de evidência |
|---|---|---|
| UI, temas, favoritos e foco | Mesmas fontes no navegador e no WGT | Teste local não mede desempenho do chip da TV |
| Abrir app existente | Inventário real e application.launch | Cada serviço/firmware exige teste; nenhum ID Android ou catálogo é presumido |
| Último acesso | Último lançamento bem-sucedido pelo Vibe | Não lê uso global nem reprodução privada |
| Retomar episódio | Indisponível sem integração autorizada do provedor | Não há progresso ou episódio fictício |
| PS5 HDMI 2 | Fonte HDMI real enumerada, inclusive sem sinal, setSource e viewer nativo | Seleção física e wake por CEC aguardam confirmação; HDR, Game Mode e latência não testados |
| Configurações Samsung | Controle e Smart Hub nativos preservados | Não é prometido acesso programático a todos os menus |
| Inicialização | App separado | Não substitui Home nem garante abrir em todo boot |
| Logins | Abrir apps instalados sem acessar seus dados | Preservação física e restauração integral ainda não verificadas |
| Recuperação | Reset oficial aceito pelo proprietário em substituição ao backup integral | Não recupera necessariamente sessões nem firmware anterior; não será executado como teste |

A AU8000 de 2021 é da família Tizen 6.0, engine Chromium 76. As fontes evitam sintaxes recentes sem suporte. O navegador Samsung não fornece APIs Tizen: para integração real é necessário um WGT instalado e assinado. O empacotador local produz um WGT não assinado; a versão 1.0.4 foi assinada separadamente com certificado Samsung e instalada.

## Testes físicos autorizados, ainda não concluídos

1. Concluído: recuperação revisada, ferramentas oficiais, certificado Samsung, Developer Mode e instalação/início do Vibe. Chaves fora do Git.
2. Instalar somente o WGT Vibe TV assinado; não executar `build.sh`/ADB do upstream Android.
3. Inventário real e ambiguidades conferidos. YouTube e arte corrigida confirmados pelo proprietário na 1.0.2; demais lançamentos físicos pendentes.
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

## Comparação com as referências

Os exemplos [SimbasJungles](https://x.com/SimbasJungles/status/2112244057313345892) e [gathint](https://x.com/gathint/status/2111379569030939102) foram inspecionados no navegador em 20/10/2026. Ambos usam Android/Google TV. O Free My TV declara CATEGORY_HOME no manifesto e usa `cmd package set-home-activity`; não troca o firmware. O próprio upstream orienta usar um streamer HDMI para Samsung. As artes de recomendações vêm de TMDB, sem acesso ao histórico privado dos serviços. O [segundo projeto](https://github.com/Gathin23/cleanyourtv) também depende de Android/ADB.

Na Samsung, o [checklist CO-GE-07](https://developer.samsung.com/smarttv/develop/development-checklist/common.html) exige que Home mostre o Smart Hub. Não foi encontrado mecanismo público oficial para promover este WGT a Home global. `getAppsUsageInfo` é restrito a mobile e não resolve o histórico global de TV. O proprietário ativou Autorun Last App; isso ainda requer teste e depende de qual app foi usado por último.

## Diagnóstico das artes no aparelho

O Web Inspector da TV confirmou caminhos de ícones públicos do inventário. YouTube, HBO Max e TV Plus retornaram arquivos de 117×117; Netflix 298×298, Disney+ 423×423 e Spotify 170×170. O caminho `ignition.png` do Prime Video resultou em ERR_FILE_NOT_FOUND. Esses ícones quadrados não equivalem aos banners do Smart Hub. A versão 1.0.2 usa arquivos originais de marca incluídos no pacote para os sete favoritos conhecidos; outros apps usam o ícone público disponível, com símbolo neutro se falhar. Logos mantêm `object-fit: contain`; ícones desconhecidos no destaque não são ampliados além do tamanho natural.

## Correção HDMI 2 — 1.0.4

No aparelho, `VIDEOSOURCE` retornou TV 1 em `connected` e HDMI 2 em `disconnected`, com `signal: null`. O clique na 1.0.3 mostrou indisponibilidade e `getSource()` continuou em TV 1: o próprio Vibe recusava a entrada antes de chamar a Samsung.

A 1.0.4 usa o objeto HDMI 2 único das duas listas e deixa a API confirmar ou rejeitar a troca. Não exige sinal prévio, não inventa objetos e não seleciona outra porta. A documentação [SystemInfo](https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/systeminfo-api.html) distingue existência/conexão/sinal; [TVWindow 6.0](https://github.com/Samsung/tizen-docs/blob/master/docs/application/web/api/6.0/device_api/tv/tizen/tvwindow.html) não condiciona a chamada a sinal ativo.

Isso não equivale a emitir um comando de ligar o PS5. Não foi encontrada API pública documentada de envio CEC equivalente ao Smart Hub. O callback de fonte, a imagem HDMI e o despertar do console precisam de evidências separadas. Após a atualização, o clique foi acionado, mas o Inspector desconectou; isso não comprova o resultado visual.

Home foi reconferido no checklist CO-GE-07 e na [FAQ de interação, Q7](https://developer.samsung.com/smarttv/develop/faq/user-interaction.html): teclas controladas pela plataforma não devem ser registradas pelo app. Autorun não remapeia Home durante YouTube, HDMI ou outros apps. Substituição global solicitada permanece não atendida; nenhuma alteração de firmware/root foi feita.
