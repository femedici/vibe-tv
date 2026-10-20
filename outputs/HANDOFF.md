# Handoff — Vibe TV para Samsung Tizen

Data de referência: 19/10/2026. Responsável pela integração: Codex (`/root`).

## Objetivo e pedido

Criar `femedici/vibe-tv` a partir de `simbasjungles/free-my-tv`, preservar o histórico e personalizar a interface da TV do proprietário: último aplicativo como destaque, arte contextual e ações reais, PS5 no HDMI 2 com as duas imagens fornecidas, favoritos editáveis na ordem YouTube, PS5, Netflix, Prime Video, HBO Max, Samsung TV Plus, Disney+ e Spotify, cinco temas (escuro, claro, cinza, pastel e vinho), navegação fluida, controles/configurações nativos preservados. Antes de qualquer mudança na TV, obter backup restaurável do sistema, configurações e sessões atuais. Rodar localmente, testar, capturar telas, documentar e publicar no GitHub.

**Pedido otimizado:** preservar o clone e implementar/testar localmente um hub Tizen independente para a Samsung UN50AU8000GXZD, com o visual, favoritos e temas solicitados, último acesso registrado somente após abertura confirmada pelo Vibe TV e retomada apenas com integração comprovada. Preservar Smart Hub, aplicativos e sessões sem acessar credenciais; não instalar enquanto o requisito de backup não estiver resolvido. Entregar fonte revisada, testes, capturas reais, documentação e branch publicada.

## Decisões e autorizações já concedidas

- Usar Spec Kit v1.0.3 e inicializar seu scaffold. Não atualizar a versão.
- Investigar um app Tizen separado, após confirmar que o upstream Android não funciona nesta Samsung.
- Desenvolver e testar localmente o desenho proposto com esses limites.
- Commit/push da branch da tarefa estão autorizados. Não abrir PR, fazer merge remoto, deploy ou limpar worktrees sem pedido.
- A instalação permanece bloqueada pelo requisito de backup integral. A aprovação local não libera alterações no aparelho.
- Não assumir que todos os aplicativos permitem abertura por API, que existe acesso ao episódio assistido ou que Vibe TV pode substituir Home/ser iniciado em toda ligação.

## Estado atual

Fase local implementada e validada: hub com último acesso, favoritos editáveis, cinco temas, artes PS5, adaptação ao controle, adaptador Tizen, prévia local e pacote não assinado. Publicação da branch está em andamento nesta revisão do documento. O tracker autoritativo é `specs/001-vibe-tv-tizen/tasks.md`.

A prévia principal está rodando em http://127.0.0.1:4173 e foi deixada aberta no Edge. Nenhum requisito de hardware foi marcado como concluído.

**O objetivo físico original não foi concluído.** Não há backup integral restaurável verificado. Nenhuma instalação, ativação do modo desenvolvedor, pareamento, troca de entrada, reset ou mudança de configuração foi executada. As sessões existentes não foram lidas, copiadas ou exportadas, e sua restauração não foi prometida.

## Tarefas e dependências

| ID | Entrega | Estado | Responsável / dependências |
|---|---|---|---|
| T001 | Constituição, spec e contratos aprovados | done | root / nenhuma |
| T002 | Preferências, favoritos e histórico | done | audit_platform_recovery / T001 |
| T003 | Adaptador e manifesto Tizen | done | audit_ui_capabilities / T001 |
| T004 | Interface, assets e navegação | done | tv_interface / T001 |
| T005 | Ferramentas e recuperação documentada | done | root / T001 |
| T006 | Integração, testes e capturas | done | root / T002–T005 |
| T007 | Revisão independente/convergência | done | root + revisores / T006 |
| T008 | Handoff, commit e push final | in_progress | root / T007 |
| T009 | Backup e validação física | blocked | root + usuário / T008 e recuperação |
| T010 | HDMI não oculta app homônimo | done | root / T004 |
| T011 | Foco preservado após abertura | done | root / T006 |

T009 é a única frente física. Próxima ação: decisão de recuperação antes de qualquer mutação no dispositivo. Não executar a partir desta entrega local.

## Validação executada e evidência

- `node --test tests/*.test.cjs`: **38/38**, zero falhas (estado 13, plataforma 17, navegação 6, ferramentas 2).
- `node --check`: todos os scripts Tizen, ferramentas e fixture passaram.
- `node tools/package-tizen.cjs`: 13 arquivos em `dist/VibeTV-unsigned.wgt`; `unzip -t` passou. Pacote excluído do Git e reproduzível; não assinado e não pronto para instalar, sem fixture ou certificados.
- Manifesto XML, conteúdo/ícone e dois privilégios públicos conferidos. Hashes SHA256 das duas imagens idênticos aos originais; código Android/licença e README original preservados.
- Edge em 1920×1080 e 390×844: ordem inicial, cinco temas após reload, reordenar/remover/adicionar, prateleira vazia/restauração, navegação com overflow, Enter/Escape e foco de painéis passaram. Sem erros/avisos de console nos fluxos conferidos.
- Fixture separada, marcada SIMULADO, verificou último acesso após sucesso, falha preservando o anterior, ID de app extra, HDMI2/viewer e saída. Fixture encerrada; não é teste de hardware.
- RED/GREEN adicional: app chamado PlayStation5 oculto por HDMI e foco perdido após sucesso; corrigidos e revalidados. Revisão independente final sem achados pendentes.
- Redução de movimento: regra CSS carregada/inspecionada; preferência do sistema não alterada e comportamento físico pendente.
- Convergência: 16 requisitos, 6 critérios, 14 cenários de aceitação, 7 decisões de arquitetura e 5 princípios revisados; sem lacunas locais de implementação. Publicação é T008; original físico é T009.

Veja [validação completa](../docs/vibe-tv/validation.md), [tema escuro](vibe-tv-dark.jpg), [claro](vibe-tv-light.jpg), [temas](vibe-tv-themes.jpg), [organização](vibe-tv-organize.jpg), [tela estreita](vibe-tv-narrow.jpg) e [histórico em simulação explícita](vibe-tv-simulated-last-access.jpg).

## Arquitetura e fluxo

Sem frameworks ou dependências de runtime. HTML/CSS/JavaScript local escrito para compatibilidade com Chromium 76 / Tizen 6.0; execução neste engine ainda depende de hardware/SDK.

1. `tizen/state.js`: estado versionado validado de tema, ordem, favoritos personalizados e último acesso; armazenamento local sem credenciais.
2. `tizen/app.js` + `navigation.js`: renderização, painéis, controle de foco, seleção exata de apps por inventário e ações do usuário.
3. `tizen/platform.js`: adaptador UMD para APIs Tizen públicas; preview rejeita; callbacks têm timeout. Apps abrem por ID real. PS5 enumera VIDEOSOURCE e aceita somente HDMI 2; seleciona a fonte e abre `org.tizen.tv-viewer`. Falha após mudança de fonte relata o efeito parcial.
4. Histórico atualiza apenas após sucesso do adaptador; falhas e preview não inventam acesso. Conteúdo privado/episódios dos provedores não é acessado.
5. `tools/preview.cjs`: servidor estático restrito a `tizen/`, ligado só em `127.0.0.1`, sem conexão à TV.
6. `tools/package-tizen.cjs`: ZIP/WGT de fontes com lista explícita, sem assinatura ou instalação. Não é build certificado pelo SDK.

O código Android original continua em `app/` com seu `build.sh` e README em `README.upstream.md`. Não aplicar suas instruções ADB à Samsung Tizen.

## Arquivos e documentação

- `tizen/`: hub, adaptadores, manifesto, estilos e assets locais. `assets/ATTRIBUTION.txt` preserva origem; imagens PS5 copiadas do usuário e fonte Inter com OFL.
- `tests/`: testes de estado, plataforma, navegação e ferramentas.
- `tools/`: servidor local e preparação do pacote não assinado.
- `README.md`: uso e limites; `README.upstream.md`: original preservado.
- `docs/vibe-tv/recovery.md`: requisito de recuperação não atendido; backup de configurações não equivale a imagem e sessões restauráveis.
- `docs/vibe-tv/compatibility.md`: matriz de capacidades, fontes oficiais e checklist físico futuro.
- `docs/vibe-tv/validation.md`: resultados observados, ambiente e limites dos testes.
- `specs/001-vibe-tv-tizen/`: contrato vivo, plano interno, pesquisa, contratos de módulos, checklist e único tracker.
- `.specify/`, `.agents/skills/`: scaffold autorizado do Spec Kit 1.0.3.
- `outputs/`: este handoff, prova do repositório criado e capturas reais da aplicação.

## Git e worktrees

Repositório: https://github.com/femedici/vibe-tv

Diretório local: `/Users/felipemedici/Documents/quadro-branco/vibe-tv`.

Branch de integração: `agent/vibe-tv`. Base original: `b29d3e0e646a5a185ede9cf4dadf9306e6c529f5`. Base comum das tarefas: `c084d09`.

| Branch | Worktree | Responsabilidade |
|---|---|---|
| agent/vibe-tv | raiz | coordenação, ferramentas, documentação, integração e entrega |
| agent/vibe-tv-state | .worktrees/state | estado e seus testes |
| agent/vibe-tv-platform | .worktrees/platform | adaptador Tizen e seus testes |
| agent/vibe-tv-interface | .worktrees/interface | interface, assets e navegação |

Worktrees preservadas. Só a branch de integração reúne o resultado. `origin` aponta para o fork, com push SSH já autenticado como `femedici`; `upstream` aponta para `simbasjungles/free-my-tv`. Nunca imprimir chaves/tokens. `main` permanece o upstream; a adaptação está na branch de trabalho.

## Retomar localmente

```sh
cd /Users/felipemedici/Documents/quadro-branco/vibe-tv
git status --short
node --test tests/*.test.cjs
node tools/preview.cjs
```

Se a prévia já estiver ativa, reutilize http://127.0.0.1:4173. Se a porta estiver ocupada por outro processo, use `node tools/preview.cjs 4174`; não encerre processos alheios. Setas/Enter/Escape e mouse permitem revisar a interface. Os temas e a ordem ficam no armazenamento local deste navegador; esta preferência não é backup da TV.

```sh
node tools/package-tizen.cjs
unzip -l dist/VibeTV-unsigned.wgt
SPECIFY_FEATURE_DIRECTORY=specs/001-vibe-tv-tizen .specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks
```

O override de Spec Kit resolve a feature em novos clones porque `.specify/feature.json` é estado local ignorado. Ler spec, constituição, tracker e validação antes de alterar. Novas mudanças devem atualizar o contrato vivo e manter os limites aprovados.

## Bloqueios e ações proibidas

T009 depende de um backup realmente restaurável ou decisão explícita do usuário revisando esse requisito. Só depois poderão ser definidos SDK/certificados/autorizações e testes físicos. A instalação e o comportamento no aparelho não se deduzem do sucesso do navegador ou das APIs simuladas.

Não usar root/firmware/ISO/ADB para contornar Tizen. Não resetar Smart Hub ou fábrica, limpar dados, desinstalar apps existentes, migrar tokens privados, mudar rede/pareamento, habilitar modo desenvolvedor, instalar, trocar HDMI ou alterar inicialização nesta fase. Não publicar serial, DUID, endereços de rede privados, certificados, senhas ou tokens. Não force push, reescrever histórico, integrar em main, fazer deploy ou remover worktrees automaticamente.
