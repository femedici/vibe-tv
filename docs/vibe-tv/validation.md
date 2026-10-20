**Estado atual 1.1.5:** veja a seção “Fundo por aplicativo e seleção sem borda” ao final. As seções anteriores preservam evidência histórica.

# Validação do Vibe TV — 1.0.4

Registro: 20/10/2026. As evidências abaixo distinguem navegador, simulação e Samsung física.

## Resultado atual

- 1.0.4 assinada, instalada por atualização direta e aberta na Samsung UN50AU8000GXZD. O instalador retornou `install completed` e o launcher confirmou um novo processo.
- Na 1.0.2, o proprietário confirmou artes corretas e abertura perfeita do YouTube. Depois pediu controles no topo direito, ↓ direto para os apps e um seletor suave; esses ajustes compõem a 1.0.3.
- O proprietário confirmou o novo seletor/navegação e depois informou abertura correta do YouTube. O relato anterior de falha na segunda abertura não foi reproduzido; ciclos consecutivos continuam pendentes em T016, sem correção especulativa.
- Home continua com o Smart Hub, observado pelo proprietário e consistente com a documentação Samsung. Não foi implementada troca de sistema/launcher global.

## Verificação automatizada

`node --test tests/*.test.cjs`: **45 passaram, zero falhas**.

| Área | Testes | Escopo |
|---|---:|---|
| Estado | 13 | ordem inicial, cinco temas, persistência, corrupção, armazenamento bloqueado, favoritos e histórico |
| Plataforma | 18 | inventário sanitizado, ID exato, erro/timeout, HDMI2, viewer, falha parcial e saída |
| Navegação | 9 | setas, overflow, Tab, nomes ambíguos, IDs observados, Spotify, HDMI/app homônimo, cartão largo |
| Controlador | 3 | aviso de armazenamento permanece após sucesso; resposta assíncrona não rouba foco em sucesso/falha |
| Ferramentas | 2 | servidor confinado, symlinks/métodos, arquivos do pacote |

RED/GREEN observados: cartão largo era ignorado ao subir; aliases duplicados selecionavam alvo ambíguo; aviso de armazenamento sumia; callback tardio roubava foco. A reprodução VM dos últimos dois comportamentos falhou 3/3 antes das correções e passou 3/3 depois. A VM usa módulos reais com DOM/hardware simulados e omite renderização; não mede o aparelho.

## Pacote e preservação

- `node tools/package-tizen.cjs`: 20 arquivos de runtime/assets.
- `tz pack` com perfil Samsung local VibeTV: pacote 1.0.4 com duas assinaturas XML.
- ZIP/CRC, manifesto e assinaturas XML válidos; todos os 20 arquivos de runtime idênticos entre pacote não assinado e assinado. Entradas de diretório adicionadas pelo assinador não são arquivos de runtime.
- Sem fixture, certificados privados ou credenciais no código/pacote-fonte. Pacote assinado fica em `dist/`, ignorado pelo Git.
- Atualização por SDB push + `vd_appinstall`, sem comando de desinstalação. Somente o processo Vibe foi encerrado para abrir a versão nova. Nenhum reset, firmware ou dado de outro aplicativo foi alterado.
- Assets de marcas copiados das fontes oficiais e hashes documentados em [brand-assets.md](brand-assets.md). Artes PS5 preservadas; fonte Inter/OFL e histórico Android preservados.

## Navegador real

Microsoft Edge, prévia principal em `http://127.0.0.1:4173`:

| Verificação | Evidência |
|---|---|
| ↓ do cartão | RED: focava Organizar. GREEN 1.0.3: `favorite-youtube` após mover controles ao cabeçalho |
| ↑ do primeiro app | Retorna a `hero-open` |
| Destaque | Sem outline externo; tile com `scale(1.05)` e deslocamento −3px, transição transform de 150ms; sombra/realce em camada de opacidade |
| Temas | Cinco temas selecionáveis; foco permanece no controle selecionado; claro/escuro inspecionados visualmente |
| Imagens | Nove imagens visíveis carregadas (hero + oito favoritos), todas com `object-fit: contain` |
| Tela principal | Capturas em 1912×845 e 1912×884; oito atalhos visíveis na prévia padrão |
| HD e estreita | Fixture em iframes 1280×720 e 390×844: cabeçalho cabe, controles acima do cartão, ↓ alcança YouTube; prateleira rolável |
| Movimento reduzido | Regra CSS inspecionada: duração 0,01ms e scroll auto; preferência do sistema não alterada |

A fixture `node tests/ui-fixture.cjs` roda separada em 4175, com aviso “TESTE SIMULADO · SEM TV”. Nos testes desta revisão: sucesso YouTube por ID observado atualiza histórico; falha Netflix o preserva; PS5 usa HDMI2/viewer simulados; app adicional com ícone quebrado recebe símbolo neutro; mudança de tema/inventário inalterado não reconstrói a prateleira. A configuração simulada contém apps extras de teste e serviços ausentes, por isso suas capturas não representam o inventário físico.

A fase local inicial também verificou reordenar/remover/adicionar, vazio/restauração, persistência após reload, Tab/Shift+Tab no painel, Escape/saída e 1920×1080. Esses resultados históricos não são apresentados como novas medições de desempenho.

## Samsung física

- Developer Mode/Host PC IP configurados pelo proprietário; SDB reconheceu o modelo e plataforma 6.0. Endereço de rede mudou durante a tarefa e foi redescoberto somente por leitura.
- Certificado Samsung concluído pelo proprietário após uma primeira tentativa de callback expirar. Perfil válido usado para assinar 1.0.0, 1.0.1, 1.0.2, 1.0.3 e 1.0.4. Não há pendência de emissão.
- Web Inspector da 1.0.1 confirmou inventário e ícones: YouTube/HBO Max/TV Plus 117×117, Netflix 298×298, Disney+ 423×423, Spotify 170×170. Prime retornou `ERR_FILE_NOT_FOUND`. Isso motivou originais locais para marcas conhecidas.
- Proprietário confirmou na 1.0.2: “tá correto, abre perfeito”, sobre artes e YouTube. Também confirmou Home abrindo Smart Hub e relatou o desvio do foco para Organizar.
- 1.0.3: instalador e abertura confirmados por ferramenta; navegação e destaque aceitos pelo proprietário; abertura do YouTube posteriormente confirmada pelo proprietário; repetição completa ainda não observada.
- Autorun Last App foi ativado pelo proprietário. O ciclo de energia e o comportamento após usar outro app não foram verificados.

Ferramentas: Node.js v25.8.1; extensão oficial Tizen VS Code 10.4.3, servidor arm64 10.4.5, SDB 4.2.36 e CLI `tz`.

## Revisão independente

Revisores somente leitura conferiram plataforma/limites, ícones e UI. Achados sobre aviso de armazenamento, explicação inacessível do histórico e foco tardio foram corrigidos e revalidados. Revisão final dos controles superiores, transições e compatibilidade Chromium 76 não trouxe achados bloqueantes. O coordenador inspecionou os diffs e executou os 44 testes.

## Capturas

- [1.0.4 PS5 — seleção sem sinal simulada](../../outputs/vibe-tv-1.0.4-ps5-simulated.png)
- [1.0.3 escuro / foco no YouTube](../../outputs/vibe-tv-1.0.3-dark.png)
- [1.0.3 claro](../../outputs/vibe-tv-1.0.3-light.png)
- [1.0.3 PS5 — simulação explícita](../../outputs/vibe-tv-1.0.3-ps5-simulated.png)
- [1.0.3 estreita — simulação explícita](../../outputs/vibe-tv-1.0.3-narrow-simulated.png)

Capturas salvas do navegador e inspecionadas, sem mockups. Não são fotos da TV. Screencast do Web Inspector não forneceu pixels úteis do aparelho.

## Limites ainda abertos

Não verificados: todos os demais serviços/sessões, HDMI/PS5 físico, imagem/HDR/Game Mode/áudio/latência, ciclo de energia/autorun, saída/remoção física e restauração. Não há medição de FPS. Nenhum backup integral foi criado; o proprietário aceitou reset documentado como fallback, sabendo que apaga configurações e sessões e não restaura firmware antigo/danificado. Reset não foi executado. Histórico privado/retomada de episódios não está integrado; só há último lançamento pelo Vibe.

## Correção de HDMI 2 — 1.0.4

1. **RED físico:** leitura no Web Inspector retornou `connected: [TV 1]` e `disconnected: [AV 1, HDMI 1, HDMI 2, HDMI 3]`, todos com sinal desconhecido. Clique no PS5 mostrou “HDMI 2 não está disponível. Confira o cabo e ligue o PS5.”; `getSource()` permaneceu TV 1. A plataforma bloqueava antes de `setSource`.
2. **RED automatizado:** 15/18 passaram; falharam seleção em connected sem sinal, seleção em disconnected e duplicidade entre listas. Nenhum teste foi removido para mascarar o resultado.
3. **GREEN:** pesquisar ambas as listas e deixar a API decidir sobre a entrada sem sinal fez 18/18 de plataforma passarem. Suíte completa 45/45. Erros/timeout/objeto original/porta exata/viewer posterior preservados.
4. **Navegador:** fixture atualizada com TV1 conectado e HDMI2 desconectado. Clique YouTube seguido de PS5 produziu `HDMI2`, depois `org.tizen.tv-viewer`, hero PS5, foco `favorite-ps5` e toast oculto. É simulação explícita, não CEC real. Captura 1.0.4 salva e inspecionada.
5. **Pacote:** 20 arquivos idênticos entre unsigned e signed; CRC/XML/versão e duas assinaturas válidos, sintaxe dos scripts válida. Atualização direta completou, somente Vibe foi reiniciado; Inspector confirmou `appInfo.version === '1.0.4'`.
6. **Teste físico pós-atualização:** clique no favorito PS5 acionado; Inspector desconectou antes de permitir ler o resultado. Pergunta ao proprietário sobre imagem/ligar PS5 enviada. Sem resposta registrada neste fechamento: não declarar wake, HDMI visível ou desempenho confirmados.
7. **Revisão:** revisor independente conferiu o diff e 18 testes, sem achados acionáveis; coordenador leu todo o diff e executou a suíte. Nenhuma nova permissão, firmware, reset ou acesso a contas.

Home foi reconferido nas fontes oficiais listadas em compatibility.md. Continua indisponível a troca global do Smart Hub por esse WGT. A condição de não haver sinal foi corrigida no código; o resultado físico completo ainda depende de evidência, registrado em T017/T009.

## CleanFrame 1.1.0 e Home nativo — 20/10/2026

- Coordenador revisou o diff da UI e os helpers. **48/48 Node**, **16/16 Python** e **38 assertions C#** passaram. Regressões RED/GREEN cobrem Down após rolagem, abertura Samsung sem mudar histórico, erros SDB com exit0, resultado parcial, backup vinculado ao aparelho, lançamento exato e recusa de journal ativo/FIFO. Não foram escritos testes para detalhes cosméticos triviais.
- Navegador real: 1920×1080, 1280×720 e 390×844; cinco temas, reload, favoritos/overflow, foco/Back/Tab e falhas simuladas. Sem imagens quebradas/overflow de página. Down após rolar até Spotify retorna ao YouTube. Capturas em `outputs/cleanframe-*`, inspecionadas pelo coordenador, marcadas como prévia/fixture. Não são fotos da TV.
- Pacote1.1.0: CRC/XML/versão, 24 arquivos de runtime idênticos ao unsigned e duas assinaturas XML; o assinador acrescenta também entradas de diretório. `vd_appinstall` concluiu atualização direta; comando nativo confirmou lançamento. Nenhum app foi desinstalado.
- AU8000/T-NKLAUABC-2310.0: prova de identidade root temporária passou. BACKUP via SQLite e transferência SHA/integridade passaram. APPLY→RESTORE→APPLY tiveram notificações aceitas e snapshots consistentes correspondentes às três tabelas/rowids esperadas. Auth original, ausência de helpers e limpeza confirmados em cada operação concluída.
- O diagnóstico de transporte distinguiu execução SDK901 de transferência5001:100. Cleanup inicial recusou journal PERSIST residual inativo, inspecionado e removido; a guarda foi testada e usada nas operações posteriores.
- Estado final: rota curta Home aponta para Vibe. Proprietário confirmou Home físico após YouTube; permanecem pendentes Home desde HDMI, PS5/CEC, acesso real ao menu Samsung, demais sessões, HDR/áudio/Game Mode/latência e ciclo de energia. Não há medição de FPS nem backup integral. [Detalhes do método](cleanframe-home.md).

Capturas atuais: [PS5 1920](../../outputs/cleanframe-ps5-1920.jpg), [claro1280](../../outputs/cleanframe-light-1280.jpg), [vinho](../../outputs/cleanframe-themes-wine.jpg), [foco390](../../outputs/cleanframe-navigation-fixed-390.jpg), [Ajustes1.1.0](../../outputs/cleanframe-settings-1.1.0-1920.jpg).

## Responsividade 1.1.1 — 20/10/2026

O proprietário confirmou Home curto após YouTube abrindo Vibe, mas relatou resposta lenta. Duas causas de trabalho/bloqueio desnecessários foram reproduzidas: cada seta da fileira media todos os botões e chamava scrollIntoView; um app já identificado não podia abrir enquanto getAppsInfo estava pendente. Isso não estabelece qual parcela explica o atraso físico relatado.

- RED: 5 falhas novas em 12 testes do controller; GREEN: 12/12 e suíte completa **54/54**. Cobertura: ordem alterada, repetição na borda, overflow, rolagem vertical em tela estreita, abertura durante refresh, falha de refresh e inventário atualizado vazio. Apps só abrem com ID previamente observado e resolvido; callback/erro nativo permanecem obrigatórios.
- Medição reproduzida pelo coordenador e por auditor em VM, com o mesmo DOM de 14 botões, contra `c683b96`:

| Operação | Antes | 1.1.1 |
| --- | ---: | ---: |
| Leituras de geometria em 14 movimentos horizontais | 196 | 28 |
| scrollIntoView nesses movimentos | 14 | 0 |
| Leituras em 100 repetições adicionais na borda | 1.400 | 0 |
| Mudanças de foco nos 14 movimentos | 14 | 14 |
| Renderizações / gravações durante as setas | 0 / 0 | 0 / 0 |

Esses números contam chamadas, **não** milissegundos, FPS ou reflows. Movimento/opacity continuam com 150 ms; os estilos e imagens foram preservados. Painéis mantêm a rolagem anterior; a otimização de rolagem é restrita ao hub.

- Navegador real: hero↓→primeiro favorito, setas pelos oito apps, ↑→hero, ordem personalizada e foco após sucesso simulado. Frames 1280×720 e 390×844 confirmados por innerWidth/innerHeight; Spotify alcançável no fim do overflow e retorno ao primeiro favorito. Tab/painel/Back mantêm foco visível. Capturas: [desktop](../../outputs/responsiveness-desktop.jpg), [layouts fixos](../../outputs/responsiveness-layouts.jpg). São prévia/fixture, sem conexão da página à TV.
- Revisão independente final sem achados; `git diff --check`, sintaxe JS, CRC/XML/versão e identidade dos 24 arquivos do pacote passaram. Perfil existente assinou 1.1.1; atualização direta retornou `install completed`; `was_execute` confirmou `launched` após encerrar somente a instância anterior do Vibe. Sem desinstalação ou mudança na rota Home.
- O Inspector anunciou uma porta, mas o navegador recebeu conexão recusada diretamente e reset pelo encaminhamento SDB. Não houve perfil de frames nem medição cold/warm na TV. O encaminhamento foi removido e Vibe foi aberto normalmente, sem debug. Confirmação física da melhora solicitada ao proprietário e ainda pendente.

Não habilitar background-support como atalho: a [Samsung exige disable para TV](https://developer.samsung.com/smarttv/develop/faq/other-features.html). A retomada em memória varia com suporte/modelo conforme [multitasking](https://developer.samsung.com/smarttv/develop/guides/fundamentals/multitasking.html); não foi demonstrado se cada Home nesta TV reinicia o processo. O caminho de Home é uma rota nativa direta, sem helper em execução por tecla.


## Atualização automática e rodapé — 1.1.2, 20/10/2026

- Pedido: remover as indicações de setas/OK/Voltar abaixo dos apps e consultar a lista a cada entrada sem clique manual. Somente a legenda principal e seus estilos foram removidos; navegação do controle e ajuda de Voltar nos painéis permanecem.
- Abertura inicial já consultava o inventário. Foi acrescentado retorno por foco da janela, além de `visibilitychange`; foco em botões não consulta. Um retorno ocorrido durante consulta antiga agenda uma consulta sequencial após ela terminar. Não há polling, nova permissão, dependência ou alteração da rota Home.
- TDD: teste de retorno por foco falhou antes do listener, depois 57/57 passaram. Os dois testes de retorno durante consulta antiga falharam antes da fila; depois **60/60 passaram**, incluindo falha/ocultação e abertura com último inventário conhecido. O controller tem 18 testes. Sucesso vazio remove apps ausentes; erro mantém o último inventário em memória; na próxima entrada há nova tentativa.
- Revisão independente sem achados impeditivos; coordenador inspecionou todo o diff e executou a suíte completa, sintaxe, `git diff --check` e pré-requisitos Spec Kit. Eventos sobrepostos compartilham a consulta pendente; eventos separados pela conclusão podem iniciar consultas sequenciais. Não se promete deduplicação temporal completa nem sucesso de API indisponível.
- Navegador real: desktop 1912×794 sem legenda e sem imagens quebradas; hero↓ e→ mantêm foco nos apps. Fixture 1280×720/390×844 confirmou ordem salva (PS5 primeiro), abertura simulada de YouTube sem atualização manual e Escape retornando de Ajustes com a ajuda do painel preservada. [Captura desktop](../../outputs/automatic-refresh-desktop.jpg) e [layouts](../../outputs/automatic-refresh-layouts.jpg) são prévia/fixture, não fotos da TV.
- Pacote assinado 1.1.2: CRC/XML/identidade/versão válidos, todos os 24 arquivos de runtime idênticos ao source/unsigned; extras somente assinaturas e diretórios. Modelo AU8000 reconfirmado no SDB. Atualização direta retornou `install completed`; somente a instância do Vibe foi encerrada e o lançamento normal retornou `launched`. Não houve desinstalação, novo root ou operação no roteamento.
- Confirmação física YouTube→Home→YouTube sem clique em atualizar foi solicitada após a instalação; ainda não recebida neste registro. Latência/FPS e demais pendências físicas continuam separados dos testes locais.

A Samsung documenta [`visibilitychange` para retomada](https://developer.samsung.com/smarttv/develop/guides/fundamentals/multitasking.html). O fallback usa o [evento focus da janela](https://www.w3.org/TR/uievents/#event-type-focus). `appcontrol` exige configuração/solicitação específica e não foi adotado como evento genérico de Home ([documentação Tizen](https://github.com/Samsung/tizen-docs/blob/master/docs/application/web/guides/app-management/app-controls.md#prevent-page-reloads-for-incoming-requests)).


## Resposta imediata, ícones e recuperação automática — 1.1.3, 20/10/2026

### Comparação física na AU8000

O Web Inspector conectou à versão 1.1.2 nesta sessão, diferente da tentativa malsucedida da 1.1.1. Runtime Tizen 6/Chromium 76, viewport 1920×1080. Uma consulta real retornou **397 aplicativos em 3.212 ms**; não houve timeout nessa consulta (limite existente de 5 s). Isso não prova que a lentidão das setas seja causada pelo inventário.

Um probe temporário, somente em memória, observou eventos de seta confiáveis do controle. O proprietário primeiro navegou com o CSS original; depois foi desativada **somente** a animação/transição CSS e ele repetiu o teste.

| Observação | CSS original, 79 setas | Sem transições, 39 setas |
| --- | ---: | ---: |
| Fila do evento até o listener — mediana / p95 / máximo | 15 / 321 / 398 ms | 4 / 6 / 7 ms |
| Tempo do handler — mediana / p95 / máximo | 6,4 / 10,4 / 14,8 ms | 5,3 / 6,7 / 6,8 ms |
| Próximo callback rAF — mediana / p95 / máximo | 9 / 16 / 40 ms | 6 / 8 / 8 ms |

O proprietário respondeu **“perfeito! mantenhjaassim, com a alteração dos icones”**. São duas amostras manuais de tamanhos diferentes, com possível interferência de diagnóstico no ensaio inicial; não constituem benchmark controlado. `performance.now() - event.timeStamp` não mede botão físico→pixel; callback rAF não comprova apresentação de frame/FPS. A evidência sustenta a preferência aprovada pelo proprietário, sem promessa de latência universal. O probe não entrou no pacote e o reinício normal removeu a sessão de debug.

### Código e testes

- Removidas transições/animações, nomes/captions da fileira e material retangular coletivo. Mantidos os assets originais, proporção, nomes acessíveis e destaque imediato no próprio ícone. Cada tema recebeu um degradê estático; nenhuma imagem foi substituída/recomprimida.
- `refreshInventory()` retorna a consulta compartilhada. Adicionar consulta automaticamente; um favorito ainda sem ID aguarda a consulta, revalida a identidade atual e abre uma vez. Apps já identificados continuam abrindo imediatamente. O botão manual foi removido.
- A ativação ainda aguardando inventário é cancelada quando o usuário sai, antes de chamar a API nativa; remover o favorito durante a consulta não abre outro item. Erros não gravam histórico; busy é limpo também quando a fileira foi reconstruída. Não há polling, nova dependência ou mudança na API/timeout.
- RED inicial: 6 falhas em 23 testes do controller (regra anterior e cinco cenários novos). A revisão encontrou intenção tardia após sair e busy residual: 3 novos RED em 28 testes. GREEN final: **28/28 controller e 70/70 totais**, sem exclusões. Revisor independente conferiu controller/plataforma e o coordenador revisou diff e executou a suíte completa.
- Browser fixture: falha inicial, abertura por um único clique, nova consulta e lançamento simulado do ID observado do YouTube; somente duas consultas e uma abertura. Adicionar após falha mostra “Consultando…” sem erro antigo/botão manual e depois lista candidatos reais da fixture. São callbacks simulados, não evidência de abertura física.
- Navegador: cinco temas e imagens conferidos com a aba visível; 1912×884, frames 1280×720/390×844. Sem captions visuais nem overflow horizontal da página; nomes acessíveis presentes; setas seguem ordem salva até Spotify e ↑ retorna ao hero. CSS computado de transição: 0 s. Algumas prévias de captura mostraram o hero vazio; a tela visível e as capturas finais mostraram o conteúdo completo. Uma divergência do visualizador foi confirmada por decodificação dos pixels salvos. Não foi estabelecido defeito no app nem aplicada correção especulativa de stacking.
- `git diff --check`, sintaxe e pré-requisitos Spec Kit passaram. Pacotes unsigned/signed: CRC e XML válidos, versão/ID corretos, **24 arquivos iguais ao source**, extras somente assinaturas e diretórios.
- Modelo reconfirmado via SDB; atualização direta 1.1.3 retornou `install completed`; encerramento apenas da instância Vibe anterior seguido de `was_execute` retornou `launched`. Sem desinstalação, root ou alteração da rota Home nesta revisão. Confirmação final YouTube→Home→YouTube solicitada após a atualização; pendente neste registro.

Capturas da **prévia local**, não da TV: [escuro](../../outputs/immediate-icons-dark.jpg), [claro](../../outputs/immediate-icons-light.jpg), [cinza](../../outputs/immediate-icons-gray.jpg), [pastel](../../outputs/immediate-icons-pastel.jpg), [vinho](../../outputs/immediate-icons-wine.jpg).

HDMI/CEC, outros serviços/sessões, menu Samsung, boot e tempo de abertura fria/quente continuam pendentes separadamente. A aprovação do teste de setas não encerra esses itens.


## Fundo por aplicativo e seleção sem borda — 1.1.5, 20/10/2026

- `renderHero()` reaproveita a identidade já resolvida e define `data-app`. CSS estático aplica sete degradês de marca e a arte original PS5, sem amostragem de pixels, dependência ou trabalho novo em cada seta. Antes de existir histórico, usa o primeiro favorito; app adicional desconhecido usa o tema escolhido. Mover o foco ou falhar ao abrir não troca o fundo.
- Ícones passaram de 6,6×3,72 rem para 7,05×3,97 rem (cerca de 7%). Seleção usa escala 1,12, deslocamento de −4px, opacidade plena e sombra curta. A 1.1.4 foi instalada, mas o proprietário rejeitou a borda preta; a **1.1.5 remove todo anel de foco dos favoritos**. Browser final: bordas 0px, outline none, sombra única com blur e transição 0s. Não há animação, filtro novo ou nova imagem.
- TDD comportamental: dois testes novos falharam antes do atributo; depois **30/30 controller e 72/72 totais**. Cobrem sucesso versus falha/foco, marca conhecida adicionada como app, extra desconhecido e lista vazia. Mudança cosmética da borda foi conferida pelo estilo computado/captura, sem teste que apenas repete CSS.
- Coordenador inspecionou o diff; revisões independentes de controller/plataforma e CSS não encontraram impedimentos. Sintaxe JS, diff e pré-requisitos Spec Kit passaram.
- Navegador real, fixture explicitamente simulada: oito aberturas atualizam identidade/fundo correspondente, zero imagens quebradas, nomes acessíveis mantidos e painéis ainda seguem o tema escolhido (claro conferido com PS5 ativo). Frames 1280×720/390×844: setas alcançam todos os favoritos, ↑ volta ao hero, ↓ alcança o primeiro da ordem salva, sem overflow da página; foco das extremidades mantém espaço para a sombra. O fundo permanece ao navegar. Capturas finais atualizadas após remover a borda.
- Contraste calculado por amostragem de 101 posições por trecho dos sete gradientes: texto do hub mínimo 5,26:1 YouTube; 8,24 Netflix; 5,00 Prime; 8,41 Max; 6,50 Samsung; 4,85 Disney; 4,89 Spotify. Isso verifica as paletas, não certifica a acessibilidade de toda a interface. PS5 usa a imagem original com escurecimento estático; conteúdo/ícones conservam suas cores.
- Pacote assinado 1.1.5: CRC/XML/versão/ID válidos, 24 arquivos de runtime iguais entre source/unsigned/signed, extras apenas assinaturas e diretórios. Modelo reconfirmado; atualização direta retornou `install completed`, somente a instância Vibe anterior foi encerrada e `was_execute` retornou `launched`. Sem desinstalação, root ou alteração da rota Home.
- Não foi feita nova medição de FPS/latência na TV. A aprovação física da ausência de animação pertence ao ensaio anterior 1.1.2. A escala/sombra são estáticas; isso reduz trabalho contínuo, mas não prova custo zero. Aceitação visual/física 1.1.5, ciclos consecutivos YouTube, HDMI/CEC, menu Samsung, outros serviços e boot permanecem distintos.

Capturas **do navegador simulado**, não fotos da TV: [YouTube](../../outputs/brand-background-youtube.jpg), [Netflix](../../outputs/brand-background-netflix.jpg), [Prime](../../outputs/brand-background-prime.jpg), [HBO Max](../../outputs/brand-background-max.jpg), [Samsung TV Plus](../../outputs/brand-background-samsung.jpg), [Disney+](../../outputs/brand-background-disney.jpg), [Spotify](../../outputs/brand-background-spotify.jpg), [PS5](../../outputs/brand-background-ps5.jpg), [layouts](../../outputs/brand-background-layouts.jpg).

Na validação final, o Node passou a herdar `type: module` do `package.json` no diretório pai e os testes CommonJS falharam no carregamento dos módulos UMD, antes das asserções. O repo agora declara `type: commonjs` num `package.json` mínimo e privado; a mesma suíte passou novamente 72/72 no Node 25.8.1. O arquivo externo não foi alterado, nenhuma dependência instalada e o WGT continua com 24 arquivos.
