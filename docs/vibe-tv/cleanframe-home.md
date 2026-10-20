# CleanFrame e Home nativo na AU8000

Data: 2026-10-20. Estado: pesquisa e transações testadas **somente localmente**; nenhum Home alterado na TV.

## Referências verificadas

- [Post da interface](https://x.com/nathanclark/status/2112323327704621459) e [explicação do Home](https://x.com/nathanclark/status/2112379650420965829).
- [CleanFrame](https://github.com/nthnclrk/CleanFrame/tree/fa537d1892b71d2de2bf94c24cbff3812e9f70d5), MIT. O helper documenta The Frame LS03D/2024, Tizen 9, firmware específico e sucesso sem root. Continua sendo Tizen com apps existentes, não uma troca de firmware.
- [Couchroot QN90A](https://github.com/splitcipher/couchroot/blob/83906b468836869933012da03a4018fb339462b3/docs/devices/qn90a/home.md), Tizen 6/2021. Atribuição de Home por preferências falhou nessa referência; a rota posterior altera o banco do gerenciador de contexto com root temporário. A prova citada usa um evento Home nativo; não demonstra por si só o controle físico da AU8000.

A pesquisa anterior sobre APIs públicas Samsung não cobria esse mecanismo nativo não oficial. A ausência de API pública não basta para afirmar impossibilidade absoluta.

## Evidência real desta TV

Modelo UN50AU8000GXZD; firmware **T-NKLAUABC-2310.0**; Tizen 6.0, armv7. Consultas HTTP/SDB e cópias normais de arquivos foram somente leituras; nenhum helper remoto foi executado neste preflight.

| Arquivo/estado | Resultado |
| --- | --- |
| libaul.so.0 | Não contém o símbolo aul_get_default_app requerido pelo helper CleanFrame de 2024. |
| /usr/bin/dotnet | SHA256 d2a35114d788c22d22d329acdb2f379c17b75b7099997fb8252cbd6dd940702e; idêntico à referência QN90A. |
| /usr/sbin/sdbd-tarlauncher | SHA256 3580e6dcf5d9c6d5d0a606d43a3d878641f35eeac07317a405fb45bbed69a653; idêntico à referência QN90A. |
| Banco app-context | Mesmas três tabelas da referência; quick_check da cópia local = ok. |
| Home curto | Uma regra Samsung: XF86Home, launch, package:com.samsung.tv.csfs, entry_point:smarthub_key. Home longo usa outra regra, preservada. |
| Vibe gerenciado | Nenhum registro managed_app preexistente para VibeTV2026.VibeTV. |

As cópias do aparelho estão apenas em `.dev/cleanframe-preflight/`, privado/ignorado. Não publicar banco, identificadores, certificados ou dados de autenticação. Um pull do banco em uso é uma amostra para investigação, **não backup consistente nem integral**. A leitura de um caminho presumido de runtime falhou; a versão instalada de .NET ainda precisa ser identificada. Arquivos binários iguais não provam capabilities/xattrs, SMACK ou comportamento de namespace iguais.

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
