# Validação do Vibe TV

Data de referência do trabalho: 19/10/2026. Esta evidência cobre a fase local aprovada, não a instalação na Samsung.

## Ambiente e escopo

- Node.js v25.8.1, ferramentas nativas `zip`/`unzip`, macOS e Microsoft Edge.
- Sem dependências de runtime, backend, chamadas de rede da aplicação ou credenciais de streaming.
- Alvo de compatibilidade de fontes: Chromium 76 / Tizen 6.0. Execução no engine real da AU8000 ainda não verificada.
- Histórico e licença do upstream preservados. O README original está em `README.upstream.md`; os arquivos Android não foram convertidos em um APK compatível com Tizen.

## Evidência automatizada em integração

**38 testes passaram, zero falhas** (`node --test tests/*.test.cjs`).

- Estado: 13 testes para ordem inicial, cinco temas, persistência, corrupção, falhas de armazenamento, edição de favoritos, validação de nomes/IDs/ícones e histórico.
- Plataforma: 17 testes com adaptadores falsos e relógio controlado, cobrindo inventário real sanitizado, IDs exatos, callbacks, timeout, HDMI 2 e efeitos parciais. São testes da lógica, não evidência de funcionamento na TV.
- Navegação/resolução: 6 testes de setas, limites, overflow, Tab e IDs/aliases, incluindo distinção entre aplicativo e HDMI com o mesmo nome.
- Ferramentas: 2 testes de confinamento do servidor, caminhos/symlinks, métodos HTTP e conteúdo do pacote.
- `node --check` em todos os scripts de runtime/ferramentas/fixture; XML do manifesto, alvo e ícone conferidos.
- `node tools/package-tizen.cjs` gerou 13 arquivos de runtime/assets; `unzip -t` sem erros. Certificados, fixture e `test-native.js` ausentes do pacote.
- Hashes SHA256 das duas artes idênticos aos anexos; fonte com OFL; README original byte a byte e árvore Android/licença inalterados.
- RED/GREEN observado: gravação semanticamente igual com propriedades em outra ordem; preview/timeout/HDMI; servidor e pacote; distinção de HDMI versus app homônimo. As falhas foram reproduzidas antes das correções mínimas.

## Revisão independente

- Estado: sem achados acionáveis após revisão de spec/contrato/código e nova execução dos 13 testes.
- Ferramentas e documentação de recuperação: sem achados acionáveis; 2 testes e checagem sintática passaram.
- As revisões não certificam assinatura Samsung, instalação, engine antigo ou hardware.

## Verificação real no navegador

Prévia principal em `http://127.0.0.1:4173`, Microsoft Edge:

| Fluxo | Evidência observada |
|---|---|
| Full HD |1920×1080, documento 1920×1080, oito favoritos na ordem pedida; sem corte horizontal |
| Tela estreita |390×844, documento sem overflow horizontal global; todas as oito opções alcançáveis por setas com rolagem da prateleira |
| Temas | Claro, cinza, pastel, vinho e escuro selecionados e persistiram após reload |
| Favoritos | PS5 movido à primeira posição; Spotify removido/restaurado; persistência conferida; ordem inicial restaurada |
| Vazio | Todos os oito atalhos removidos; estado vazio visível; Escolher um app moveu foco a Adicionar; todos restaurados |
| Foco | Enter/setas, Tab e Shift+Tab presos no painel; Escape fechou e restaurou o controle de origem |
| Preview | PS5 exibiu indisponibilidade sem atualizar o destaque/histórico |
| Console | Nenhum erro/aviso capturado nos fluxos conferidos |
| Movimento reduzido | Regra CSS carregada e inspecionada: duração 0,01ms e scroll auto. Preferência do sistema não foi alterada; ativação na TV não testada |

### Integração isolada com APIs simuladas

`node tests/ui-fixture.cjs` serve uma **cópia temporária** em `127.0.0.1:4175`, com aviso visível “TESTE SIMULADO · SEM TV”. A fixture não faz parte do WGT nem modifica a prévia principal. Foi encerrada após os testes.

- YouTube simulado abriu com ID exato, virou o destaque e persistiu após reload.
- Netflix simulado retornou `NotFoundError`; destaque anterior permaneceu.
- Plex (teste) foi adicionado pelo inventário, persistiu e abriu por `test.plex`.
- App chamado PlayStation5 continuou disponível para adicionar mesmo com o atalho HDMI2; YouTube já representado não apareceu duplicado.
- Fluxo PS5 usou HDMI2 e depois `org.tizen.tv-viewer`; o destaque mudou para PS5 após callback de sucesso simulado.
- Falha de foco reproduzida: antes da correção, sucesso deixava `document.activeElement` no body. Depois, permaneceu no favorito de origem.
- Escape abriu confirmação de saída; cancelar restaurou o foco; confirmar chamou apenas a saída da aplicação simulada.

**Esses resultados verificam a ligação entre UI/estado/adaptador, não uma TV conectada nem uma sessão real de streaming.**

## Capturas reais

- [Tema escuro / primeiro uso](../../outputs/vibe-tv-dark.jpg)
- [Tema claro](../../outputs/vibe-tv-light.jpg)
- [Painel de temas](../../outputs/vibe-tv-themes.jpg)
- [Organização](../../outputs/vibe-tv-organize.jpg)
- [Prévia estreita](../../outputs/vibe-tv-narrow.jpg)
- [Último acesso com APIs simuladas — não é hardware](../../outputs/vibe-tv-simulated-last-access.jpg)
- [Fork criado](../../outputs/repository-created.jpg)

Todas as capturas da aplicação foram salvas do navegador e inspecionadas visualmente. Nenhum mockup substituiu screenshots.

## Convergência e revisão final

Conferidos 16 requisitos funcionais, 6 critérios de sucesso e 14 cenários de aceitação, 7 decisões de arquitetura (stack, plataforma, persistência, APIs, assets/motion, ferramentas e verificação) e 5 princípios da constituição. Sem lacunas de implementação local pendentes após T010/T011; revisão independente final 38/38, sintaxe/diff e lista WGT aprovados. Publicação rastreada por T008; hardware continua em T009, bloqueado, sem duplicar esse trabalho como concluído.

## Ainda não verificado na TV

Backup integral e restauração de sessões, certificado/assinatura, instalação, inventário real, abertura dos apps, saída do app, HDMI/PS5, qualidade de imagem, latência de jogo, áudio, controle físico e inicialização após ligar a TV.

A TV não recebeu mudanças. Não foi criado nem anunciado backup integral. Não foram copiados logins ou tokens. A investigação inicial da rede foi somente leitura; a prévia local não se conecta à TV.
