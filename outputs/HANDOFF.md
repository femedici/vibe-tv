# Handoff — Vibe TV 1.0.3

20/10/2026 · Samsung UN50AU8000GXZD · coordenador Codex `/root`.

## Resultado entregue e estado atual

**1.0.3 assinada, instalada por atualização direta e aberta na TV.** Na 1.0.2, o proprietário confirmou artes corretas e abertura perfeita do YouTube. A 1.0.3 responde ao último feedback:

- Organizar, Adicionar, Aparência e Ajustes no canto superior direito.
- ↓ sai do cartão grande direto para YouTube; ↑ retorna ao cartão.
- Destaque no próprio app com leve aumento/elevação e sombra, transição de 150 ms, sem retângulo externo; redução de movimento respeitada.
- Cartão retangular inteiro abre o último app acessado pelo Vibe. Sem histórico, mostra o primeiro favorito como Acesso rápido.
- Sete marcas com imagens oficiais locais, proporção preservada; ícone nativo/fallback neutro para apps extras. PS5 conserva as artes fornecidas.
- Menos reconstruções de imagens; foco preservado durante callbacks; aviso de armazenamento não desaparece após abertura.

44 testes passaram. Prévia local rodando em [127.0.0.1:4173](http://127.0.0.1:4173), com o mesmo código do pacote. O proprietário confirmou navegação e destaque corretos. Porém relatou que YouTube abriu na primeira tentativa e não reabriu na segunda; T016 está em diagnóstico, sem causa confirmada.

**Home continua abrindo Smart Hub.** Não foi feita substituição de sistema. Os exemplos Android usam a seleção de launcher do Android; a Samsung não oferece esse mecanismo público para o WGT. O usuário autorizou a melhor alternativa suportada. Autorun Last App foi ativado por ele, mas início após ligar/usar outros apps não foi verificado. Não há acesso a episódio/progresso/arte privada dos serviços. Backup integral não existe; reset não foi executado.

Publicação desta continuação: commit/push da branch `agent/vibe-tv` em andamento; atualizar este registro após verificar o remoto. Entrega anterior publicada: `98afd9704983da2c8a22bf306e0174e4b84cf161`.

## Pedido original e otimizado

Original: clonar Free My TV em `femedici/vibe-tv`, reconstruir a interface da TV, manter configurações e logins, ter recuperação, último app em destaque com arte e ações reais, PS5 HDMI2 com imagens anexadas, favoritos editáveis na ordem YouTube, PS5, Netflix, Prime, HBO Max, Samsung TV Plus, Disney+, Spotify; cinco temas; fluidez; capturas/documentação/Git. Depois pediu Home como sistema, logos originais sem quebra e retirada do texto supérfluo; aceitou a melhor alternativa suportada quando a troca global não fosse possível. Último feedback: controles no topo direito e foco suave, direto para apps.

**Pedido otimizado:** manter o clone e entregar o melhor hub Tizen suportado para a AU8000, com último lançamento confirmado pelo Vibe, artes originais proporcionais, favoritos/temas/PS5 e navegação leve. Preservar sistema, apps e credenciais; usar a instalação separada já autorizada. Corrigir o percurso do controle e o destaque, validar no navegador e instalar a versão assinada; documentar evidência real e limites de Home/histórico/recuperação, publicar fonte e capturas na branch e deixar teste local disponível.

## Decisões e autorizações

- Spec Kit **v1.0.3**, scaffold/constituição existentes e autorizados; não atualizar automaticamente.
- Tizen separado aprovado após constatar que o upstream exige Android. Nenhuma nova aprovação de desenho é necessária para os ajustes pedidos.
- O requisito inicial de backup integral foi substituído expressamente por reset oficial documentado como fallback, com perda possível de sessões/configurações e sem garantia de recuperar firmware antigo ou corrompido.
- Developer Mode, conexão, assinatura, instalação exclusiva do Vibe e testes de apps/HDMI autorizados. Conta/certificado Samsung concluídos pelo proprietário; não pedir credenciais no chat nem recriar certificado.
- Commit/push da branch autorizados; sem PR, merge em main, force push ou limpeza automática de worktrees.
- Reset, root, firmware/ISO/ADB, desativar Smart Hub ou limpar/desinstalar apps de terceiros continuam fora do escopo.

## Arquitetura e fluxo

Aplicação estática, sem dependências de runtime, backend ou chamadas externas. HTML/CSS/JS compatíveis com Chromium 76 / Tizen 6.0.

1. `state.js`: `vibe-tv.preferences.v1` em localStorage — tema, ordem, favoritos e último lançamento; nenhuma senha/token.
2. `app.js`: UI, hero, logos, painéis, cache de renderização e feedback. Dados inalterados não recriam shelf/hero. Falhas de armazenamento mantêm aviso.
3. `navigation.js`: geometria por distância entre bordas; resolução por ID observado presente no inventário ou nome exato não ambíguo. IDs dummy conhecidos excluídos.
4. `platform.js`: APIs públicas Tizen com timeout de 5 s. `application.launch` abre o app já instalado; só sucesso registra último acesso.
5. PS5: enumera VIDEOSOURCE, exige HDMI2 conectado, `tvwindow.setSource`, depois `org.tizen.tv-viewer`. Erro parcial é explícito. Fluxo confirmado em simulação; imagem/áudio/HDR/latência físicos pendentes.
6. `preview.cjs`: serve apenas `tizen/` em loopback. Navegador não abre apps reais nem inventa histórico.
7. `package-tizen.cjs`: prepara WGT não assinado com 20 arquivos; assinatura posterior via perfil Samsung local e atualização direta `vd_appinstall`.

Privilégios: somente `application.launch` e `tv.window`. O original Android em `app/` permanece preservado, assim como licença/histórico e `README.upstream.md`.

## Tracker e dependências

Única fonte de verdade: `specs/001-vibe-tv-tizen/tasks.md`; somente coordenador atualiza. Resumo, sem tracker paralelo:

- T001–T008: fase local original concluída/publicada.
- T010–T011: correções iniciais de deduplicação e foco concluídas.
- T012: ícones/IDs corrigidos, aceitos pelo proprietário.
- T013: pesquisa Home/autorun concluída; sem mecanismo público para substituir Home.
- T014: refinamento 1.0.3 implementado/validado/instalado.
- T015: revisão/capturas/docs feitas, publicação em andamento (depende de T014).
- T009: validação física parcial em andamento (depende de T008). Navegação/destaque aceitos; falha na reabertura do YouTube em T016; demais serviços/sessões, PS5, desempenho e autorun ainda não verificados.

Não marcar toda a integração física concluída com base no sucesso do YouTube ou de uma fixture.

## Verificações executadas

- `node --test tests/*.test.cjs`: **44/44**, zero falhas (estado 13, plataforma 17, navegação 9, controlador 3, ferramentas 2).
- `node --check` em 12 scripts; manifesto XML com somente dois privilégios públicos.
- Browser RED: ↓ do hero parava em Organizar. GREEN: `favorite-youtube`; ↑ retorna a hero. Desktop, 1280×720 e 390×844 conferidos.
- Imagens carregadas com `contain`; cinco temas/foco; fallback neutro e ausência de reconstrução da prateleira testados. Capturas reais do navegador, não fotografias da TV.
- Revisores independentes sem bloqueios após correções de aviso de armazenamento, foco assíncrono e descrição do histórico. VM RED 0/3 antes/GREEN 3/3 depois.
- 1.0.3: 20 arquivos idênticos entre unsigned e signed, duas assinaturas XML adicionais; CRC/XML/version válidos. Primeira comparação encontrou entradas de diretório extras do assinador; verificação corrigida para comparar arquivos, sem divergência de bytes.
- TV: atualização reportou `install completed`; somente Vibe reiniciado e novo processo confirmado. 1.0.2 teve aceitação explícita de visual e YouTube pelo proprietário.
- `git diff --check`, prerequisites Spec Kit e inspeção de privacidade passaram antes de publicar. Pacotes/chaves/identificadores privados fora do Git.

Capturas: [escuro](vibe-tv-1.0.3-dark.png), [claro](vibe-tv-1.0.3-light.png), [PS5 simulado](vibe-tv-1.0.3-ps5-simulated.png), [estreita simulada](vibe-tv-1.0.3-narrow-simulated.png). Capturas 1.0.2 preservadas como evidência intermediária. Veja [validação detalhada](../docs/vibe-tv/validation.md).

## Arquivos relevantes desta continuação

- `tizen/{index.html,styles.css,app.js,navigation.js,state.js,config.xml}`: layout/foco/logos/IDs/cache/versão 1.0.3.
- `tizen/assets/brands/*`, `ATTRIBUTION.txt`: originais oficiais e atribuição; [fontes/hashes](../docs/vibe-tv/brand-assets.md).
- `tests/navigation.test.cjs`, `controller.test.cjs`, `ui-fixture.cjs`: regressões e ambiente explicitamente simulado.
- `docs/vibe-tv/{compatibility,recovery,validation,installation,brand-assets}.md`, README: limites, processo e evidências atualizados.
- `.specify/memory/constitution.md`, `specs/001-vibe-tv-tizen/`: decisão de recuperação, contrato vivo, pesquisa, plano, tracker e checklist.
- `outputs/`: capturas e este handoff. `dist/` e `.dev/` continuam privados/ignorados.

## Git e worktrees

Repo: [femedici/vibe-tv, agent/vibe-tv](https://github.com/femedici/vibe-tv/tree/agent/vibe-tv).

Raiz `/Users/felipemedici/Documents/quadro-branco/vibe-tv`; branch de integração `agent/vibe-tv`. `origin` é o fork; `upstream` é simbasjungles/free-my-tv. Histórico preservado. Não commitar diretamente em main.

Worktrees existentes preservadas: `.worktrees/state` (`agent/vibe-tv-state`), `.worktrees/platform` (`agent/vibe-tv-platform`), `.worktrees/interface` (`agent/vibe-tv-interface`). Base comum original `c084d09`. Nesta continuação root editou sequencialmente; agentes trabalharam somente em pesquisa/revisão ou snippets em `/tmp`. Nenhuma branch auxiliar precisa ser publicada.

## Retomar e rodar

```sh
cd /Users/felipemedici/Documents/quadro-branco/vibe-tv
git status --short
node --test tests/*.test.cjs
node tools/preview.cjs
```

Reutilizar a prévia ativa em 4173. Para integração simulada, `node tests/ui-fixture.cjs` serve 4175; nunca confundir com hardware. Servidores não precisam de npm install.

```sh
node tools/package-tizen.cjs
SPECIFY_FEATURE_DIRECTORY=specs/001-vibe-tv-tizen .specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks
```

Para TV, seguir [installation.md](../docs/vibe-tv/installation.md). Ferramentas já instaladas em `~/.tizen-extension-platform/server/sdktools/`; perfil VibeTV pronto. Não usar `tz install` para atualização, pois o wrapper observado tenta desinstalar primeiro. Conferir `sdb devices` e modelo atual: endereço mudou por DHCP. Não publicar IP/DUID/serial/perfis. Guardar certificado no Mac, não no repo. A porta/debug do Web Inspector é temporária; reconectar somente quando necessário.

Próxima ação: coletar a mensagem do segundo clique no YouTube e reproduzir T016. Após reiniciar somente Vibe para diagnóstico, versão 1.0.3 foi confirmada no Web Inspector; estado inicial sem aria-busy e sem toast. Isso não reproduz a falha. A conexão de debug posteriormente fechou, sem causa confirmada. Se houver problema reproduzível, corrigir com teste proporcional, incrementar versão, reempacotar/assinar e atualizar só Vibe. Para demais verificações físicas, orientar um teste por vez; não reiniciar/resetar a TV como atalho sem contexto. Home global e histórico privado não devem ser prometidos.

## Novo relato do proprietário — após 1.0.3
O proprietário confirmou navegação e destaque corretos, mas relatou que o YouTube abriu uma vez e não abriu na segunda tentativa. Reabertura em investigação em T016; causa ainda não comprovada. A instalação e a primeira abertura não validam ciclos consecutivos. Publicação final aguarda essa correção ou evidência clara do bloqueio.
