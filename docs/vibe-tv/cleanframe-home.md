# CleanFrame e Home nativo na AU8000

Data: 2026-10-20. Estado: UI 1.1.3 instalada e Home curto configurado para Vibe TV. Backup, aplicação, restauração e reaplicação foram verificados no aparelho; o proprietário confirmou Home curto após YouTube abrindo Vibe.

## Referências verificadas

- [Post da interface](https://x.com/nathanclark/status/2112323327704621459) e [explicação do Home](https://x.com/nathanclark/status/2112379650420965829).
- [CleanFrame](https://github.com/nthnclrk/CleanFrame/tree/fa537d1892b71d2de2bf94c24cbff3812e9f70d5), MIT. O helper documenta The Frame LS03D/2024, Tizen 9, firmware específico e sucesso sem root. Continua sendo Tizen com apps existentes, não uma troca de firmware.
- [Couchroot QN90A](https://github.com/splitcipher/couchroot/blob/83906b468836869933012da03a4018fb339462b3/docs/devices/qn90a/home.md), Tizen 6/2021. Atribuição de Home por preferências falhou nessa referência; a rota posterior altera o banco do gerenciador de contexto com root temporário. A prova citada usa um evento Home nativo; não demonstra por si só o controle físico da AU8000.

A pesquisa anterior sobre APIs públicas Samsung não cobria esse mecanismo nativo não oficial. A ausência de API pública não basta para afirmar impossibilidade absoluta.

## Evidência real desta TV

Modelo UN50AU8000GXZD; firmware **T-NKLAUABC-2310.0**; Tizen 6.0, armv7. Consultas HTTP/SDB, cópias normais e um script de diagnóstico em UID901 foram executados. O script apenas leu pré-requisitos e removeu seu próprio arquivo temporário. Nenhuma elevação de privilégios nesse diagnóstico.

| Arquivo/estado | Resultado |
| --- | --- |
| libaul.so.0 | Não contém o símbolo aul_get_default_app requerido pelo helper CleanFrame de 2024. |
| /usr/bin/dotnet | SHA256 d2a35114d788c22d22d329acdb2f379c17b75b7099997fb8252cbd6dd940702e; idêntico à referência QN90A. |
| /usr/sbin/sdbd-tarlauncher | SHA256 3580e6dcf5d9c6d5d0a606d43a3d878641f35eeac07317a405fb45bbed69a653; idêntico à referência QN90A. |
| Banco app-context | Mesmas três tabelas da referência; quick_check da cópia local = ok. |
| Home curto | Uma regra Samsung: XF86Home, launch, package:com.samsung.tv.csfs, entry_point:smarthub_key. Home longo usa outra regra, preservada. |
| Vibe gerenciado | Nenhum registro managed_app preexistente para VibeTV2026.VibeTV. |

As cópias do aparelho estão apenas em `.dev/cleanframe-preflight/`, privado/ignorado. Não publicar banco, identificadores, certificados ou dados de autenticação. Um pull do banco em uso é uma amostra para investigação, **não backup consistente nem integral**. O diagnóstico SDK confirmou .NET 3.1.3, dotnet com cap_setgid/cap_sys_admin herdáveis/efetivos no arquivo e tarlauncher com cap_setgid/cap_setuid. O processo SDK tem UID/GID901, contexto System e capabilities efetivas zero. O owner real tem UID5001/GID100. Esses dados não provam que a elevação funcionará. O primeiro transporte foi recusado pela proteção UEP antes de executar o script; o arquivo foi removido com confirmação. O transporte via stdin documentado pelo CleanFrame executou o diagnóstico e confirmou a própria limpeza.

## Proposta limitada para o botão Home

1. Preparar um runner exclusivo da AU8000 com guardas de modelo, firmware, hashes, contexto e aplicativo presente. Não remover guardas do script da outra TV.
2. Verificar runtime, permissões/capabilities e executar uma prova de identidade root **sem alterar Home nem ler partições**. O mecanismo [documentado](https://github.com/splitcipher/couchroot/blob/83906b468836869933012da03a4018fb339462b3/research/namespace-root-probe/Program.cs) cria um namespace de montagem privado com uma chave pública descartável e uma visão alternativa de passwd/owner UID0. É elevação de privilégio não oficial; não uma preferência do app.
3. Se a prova e limpeza forem verificadas, obter backup consistente via API SQLite, metadados/permissões/xattrs e estado original vinculados a esta TV. Verificar integridade e manter localmente. Não afirmar backup de sistema/logins.
4. Aplicar somente a transação [apply.sql](../../tools/native-home/apply.sql): Home curto passa a `package:VibeTV2026.VibeTV` e Vibe ganha um registro gerenciado. A regra continua registrada pela Samsung; Home longo, outros apps, contas, firmware e demais preferências permanecem fora do escopo.
5. Notificar o gerenciador de contexto e respeitar o debounce. Conferir a regra e testar o controle físico a partir de app e HDMI. Não declarar sucesso por um comando aceito ou evento sintético apenas.
6. Executar e verificar [restore.sql](../../tools/native-home/restore.sql) antes de considerar a reversão comprovada. Restaurar antes de desinstalar Vibe. Em falha/interrupção, ler o estado antes de qualquer repetição; banco e notificação não são atômicos em conjunto.

Não inclui boot relay, troca de firmware, remoção do Smart Hub, mudanças em contas, telas de proteção, AirPlay ou serviços persistentes de root. Boot automático permanece uma verificação separada.

## Validação local já feita

Cinco testes SQLite em memória, escritos antes das transações: aplicar/restaurar preservando todas as linhas/rowids, rejeitar Home ausente/alterado, rejeitar registro Vibe preexistente, rejeitar restauração com dependências novas/registro alterado. RED: transações ausentes; GREEN: 5/5, incluindo recusa de referências adicionais ao Vibe em key_filter/task_filter identificadas por revisão independente.

Também foi feito aplicar→restaurar **numa cópia em memória da amostra real da AU8000**, preservando integralmente as três tabelas e rowids. Nenhum teste escreveu na TV. Os arquivos SQL não têm transporte remoto e não entram no WGT.

```sh
python3 -m unittest discover -s tests -p native_home_test.py
```

## Decisão e riscos ainda pendentes

O proprietário autorizou expressamente o teste limitado com root temporário após esta explicação, conforme seção 13 das suas regras. A autorização cobre identidade, backup consistente, exclusivamente Home curto e restauração. A finalidade é roteamento Home, mas falha pode prejudicar a navegação e exigir recuperação técnica. A restauração proposta depende de acesso SDB e permissões suficientes; **não há garantia de que reset de fábrica resolva qualquer falha desse método**. Prosseguir somente com as verificações e limites aprovados, abortando antes da alteração se faltarem pré-requisitos.

A UI baseada no CleanFrame foi aprovada separadamente, com o cartão grande do Vibe, e pode ser desenvolvida/testada independentemente desse risco.

## Implementação revisada

A UI CleanFrame preserva estado/adapter, usa Manrope OFL, marcas locais e estilo compatível com Chromium76. A versão 1.1.0 foi assinada, atualizada sem desinstalar e abriu pelo comando nativo (PID14072). 48 testes Node passaram; 16 testes Python validam SQL, transporte, identidade do backup e recusa de resultados incompletos. Capturas reais do navegador em outputs/cleanframe-* são prévia/fixture explicitamente rotuladas, não fotografias da TV.

O runner aceita somente identity/backup/apply/restore, não repete operações automaticamente, fixa identidade física/firmware/hashes e preserva evidências privadas. Usa cópia consistente SQLite antes e depois da mudança; um pull direto do banco vivo não é usado como comprovação. Alterações no esquema, referências desconhecidas, falha de notificação ou término não comprovado bloqueiam sucesso. A revisão incluiu watchdog no filho root, timeout da drenagem, notificação de inversão relida e schema validado em toda transação.

### Prova real de identidade

A primeira tentativa parou antes do helper: o SDB retornou exit0 junto de erro de cópia. O diagnóstico comprovou transferência como owner5001:100 e execução SDK901:901. O transporte agora recusa `error:` mesmo com exit0 e copia de uma entrada temporária para arquivos SDK644, removendo a entrada antes da execução.

A prova seguinte passou na AU8000: baseline5001:100, depois root0:0, ambos contexto SMACK User. `IDENTITY_RESULT=root`, `AUTH_VIEWS=restored`, `NAMESPACE_EXIT=0`; verificação externa confirmou os hashes originais, ausência de helpers e remoção do staging. Isso comprova a elevação temporária e a limpeza dessa execução, ainda não a alteração/reversão de Home.

## Resultado real do teste limitado

- **IDENTITY:** baseline owner 5001:100 → root 0:0; visões privadas desmontadas, hashes globais iguais, nenhum helper ativo, staging removido.
- **BACKUP:** API SQLite produziu cópia consistente das três tabelas, integridade `ok`, hash de transferência verificado e vínculo à identidade/firmware da TV. Permissões originais 0:0/0644 e SMACK `_` registrados. A cópia ficou privada neste Mac, fora do Git. Não inclui contas, firmware ou configurações gerais.
- **APPLY:** Home curto passou para `package:VibeTV2026.VibeTV`; notificação aceita. Snapshot consistente posterior corresponde exatamente à transformação esperada nas três tabelas e rowids.
- **RESTORE:** notificação aceita e snapshot consistente corresponde exatamente às três tabelas/rowids do backup original. Não foi feita substituição integral do banco.
- **APPLY final:** o mesmo procedimento passou novamente. **Estado deixado na TV: rota curta Home → Vibe TV.** Todos os helpers encerrados, arquivos temporários removidos e hashes originais de autenticação preservados.

O SQLite desta TV deixa journals PERSIST de snapshots temporários. A primeira limpeza recusou a sobra, corretamente. Foi confirmado cabeçalho zerado em um journal de 512 bytes; só esse arquivo inativo foi removido. A limpeza agora reconhece exclusivamente os dois journals dos snapshots, recusando arquivos ativos, não regulares ou links. RED/GREEN inclui a recusa de FIFO. Os nomes e conteúdos do banco de sistema nunca entram nessa limpeza.

Esses resultados comprovam as operações e a reversão **no banco/gerenciador de contexto**. O proprietário confirmou que YouTube → Home curto abre Vibe e relatou lentidão. A atualização 1.1.1 trata o processamento de setas e o bloqueio durante atualização do inventário, sem nova alteração nativa. Home a partir de HDMI, acesso ao menu Samsung, despertar PS5/CEC e ciclo de energia ainda não foram confirmados. Não declarar troca de firmware ou recuperação integral.

### Recuperar antes de remover o app

Preserve `.dev/native-home/backup-cb19e4cb6a134983/` e `device.json` neste Mac. O guia privado `.dev/native-home/RECOVERY.md` contém o comando exato com o endereço observado. Use `run.py restore` com o backup verificado, confira sucesso/limpeza e o Home original antes de desinstalar Vibe. Qualquer falha ou resultado incerto exige inspeção, sem repetir automaticamente. O acesso SDB e o firmware compatível continuam sendo pré-requisitos de recuperação.
