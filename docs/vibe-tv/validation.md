# Validação do Vibe TV — 1.0.3

Registro: 20/10/2026. As evidências abaixo distinguem navegador, simulação e Samsung física.

## Resultado atual

- 1.0.3 assinada, instalada por atualização direta e aberta na Samsung UN50AU8000GXZD. O instalador retornou `install completed` e o launcher confirmou um novo processo.
- Na 1.0.2, o proprietário confirmou artes corretas e abertura perfeita do YouTube. Depois pediu controles no topo direito, ↓ direto para os apps e um seletor suave; esses ajustes compõem a 1.0.3.
- O proprietário confirmou o novo seletor e a navegação, mas relatou falha na segunda abertura do YouTube. Diagnóstico em T016, causa ainda não confirmada.
- Home continua com o Smart Hub, observado pelo proprietário e consistente com a documentação Samsung. Não foi implementada troca de sistema/launcher global.

## Verificação automatizada

`node --test tests/*.test.cjs`: **44 passaram, zero falhas**.

| Área | Testes | Escopo |
|---|---:|---|
| Estado | 13 | ordem inicial, cinco temas, persistência, corrupção, armazenamento bloqueado, favoritos e histórico |
| Plataforma | 17 | inventário sanitizado, ID exato, erro/timeout, HDMI2, viewer, falha parcial e saída |
| Navegação | 9 | setas, overflow, Tab, nomes ambíguos, IDs observados, Spotify, HDMI/app homônimo, cartão largo |
| Controlador | 3 | aviso de armazenamento permanece após sucesso; resposta assíncrona não rouba foco em sucesso/falha |
| Ferramentas | 2 | servidor confinado, symlinks/métodos, arquivos do pacote |

RED/GREEN observados: cartão largo era ignorado ao subir; aliases duplicados selecionavam alvo ambíguo; aviso de armazenamento sumia; callback tardio roubava foco. A reprodução VM dos últimos dois comportamentos falhou 3/3 antes das correções e passou 3/3 depois. A VM usa módulos reais com DOM/hardware simulados e omite renderização; não mede o aparelho.

## Pacote e preservação

- `node tools/package-tizen.cjs`: 20 arquivos de runtime/assets.
- `tz pack` com perfil Samsung local VibeTV: pacote 1.0.3 com duas assinaturas XML.
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
- Certificado Samsung concluído pelo proprietário após uma primeira tentativa de callback expirar. Perfil válido usado para assinar 1.0.0, 1.0.1, 1.0.2 e 1.0.3. Não há pendência de emissão.
- Web Inspector da 1.0.1 confirmou inventário e ícones: YouTube/HBO Max/TV Plus 117×117, Netflix 298×298, Disney+ 423×423, Spotify 170×170. Prime retornou `ERR_FILE_NOT_FOUND`. Isso motivou originais locais para marcas conhecidas.
- Proprietário confirmou na 1.0.2: “tá correto, abre perfeito”, sobre artes e YouTube. Também confirmou Home abrindo Smart Hub e relatou o desvio do foco para Organizar.
- 1.0.3: instalador e abertura confirmados por ferramenta; navegação e destaque aceitos pelo proprietário; reabertura do YouTube em investigação.
- Autorun Last App foi ativado pelo proprietário. O ciclo de energia e o comportamento após usar outro app não foram verificados.

Ferramentas: Node.js v25.8.1; extensão oficial Tizen VS Code 10.4.3, servidor arm64 10.4.5, SDB 4.2.36 e CLI `tz`.

## Revisão independente

Revisores somente leitura conferiram plataforma/limites, ícones e UI. Achados sobre aviso de armazenamento, explicação inacessível do histórico e foco tardio foram corrigidos e revalidados. Revisão final dos controles superiores, transições e compatibilidade Chromium 76 não trouxe achados bloqueantes. O coordenador inspecionou os diffs e executou os 44 testes.

## Capturas

- [1.0.3 escuro / foco no YouTube](../../outputs/vibe-tv-1.0.3-dark.png)
- [1.0.3 claro](../../outputs/vibe-tv-1.0.3-light.png)
- [1.0.3 PS5 — simulação explícita](../../outputs/vibe-tv-1.0.3-ps5-simulated.png)
- [1.0.3 estreita — simulação explícita](../../outputs/vibe-tv-1.0.3-narrow-simulated.png)

Capturas salvas do navegador e inspecionadas, sem mockups. Não são fotos da TV. Screencast do Web Inspector não forneceu pixels úteis do aparelho.

## Limites ainda abertos

Não verificados: todos os demais serviços/sessões, HDMI/PS5 físico, imagem/HDR/Game Mode/áudio/latência, ciclo de energia/autorun, saída/remoção física e restauração. Não há medição de FPS. Nenhum backup integral foi criado; o proprietário aceitou reset documentado como fallback, sabendo que apaga configurações e sessões e não restaura firmware antigo/danificado. Reset não foi executado. Histórico privado/retomada de episódios não está integrado; só há último lançamento pelo Vibe.

## Novo relato do proprietário — após 1.0.3
O proprietário confirmou navegação e destaque corretos, mas relatou que o YouTube abriu uma vez e não abriu na segunda tentativa. Reabertura em investigação em T016; causa ainda não comprovada. A instalação e a primeira abertura não validam ciclos consecutivos. Publicação final aguarda essa correção ou evidência clara do bloqueio.
