# Backup e recuperação

Data da investigação: 2026-10-19. Modelo confirmado: Samsung UN50AU8000GXZD, Tizen. Nenhum reset, instalação, alteração de launcher, entrada, rede, conta ou configuração foi executado na TV.

## Situação atual

**Não existe um backup integral verificado nesta entrega.** A solicitação original exige restaurar sistema, configurações e sessões atuais. Esse requisito continua bloqueando qualquer instalação. A aprovação recebida permite somente desenvolver e testar localmente um app Tizen separado.

Não equivalem a esse backup:

- Clone do repositório ou pacote WGT.
- Download de firmware de atualização Samsung.
- Inventário ou fotografias das configurações.
- Exportação das preferências do Vibe TV.
- Backup de configurações Samsung Cloud sem prova de restauração das sessões dos serviços.

## O que a Samsung documenta

A Samsung descreve backup de configurações na conta Samsung. A presença e o alcance dessa opção precisam ser verificados no firmware da unidade; a documentação não estabelece uma imagem integral restaurável com dados privados de Netflix/Prime/YouTube.

[Samsung: gerenciamento da conta e backup de configurações](https://www.samsung.com/ae/support/tv-audio-video/how-can-i-manage-a-samsung-account-on-my-tv/)

A página do modelo oferece manual e firmware, não uma cópia do estado particular do usuário:
[Suporte UN50AU8000GXZD](https://www.samsung.com/br/support/model/UN50AU8000GXZD/).

**Reset Smart Hub encerra sessões e remove contas/configurações dos apps.** Não usar reset como procedimento de backup ou teste de recuperação.
[Samsung: efeitos do reset Smart Hub](https://www.samsung.com/au/support/tv-audio-video/reset-smart-hub-samsung-tv/)

## Por que não executar o instalador original

O projeto Android grava referências de launcher/screensaver e uma lista de pacotes desativados, não o firmware ou dados privados. Sua reversão não preserva todos os estados prévios de screensaver/pacotes. Além de incompatível com Tizen, esse procedimento não satisfaz a exigência de recuperar tudo exatamente como estava.

## Limite desta fase

O código Tizen usa armazenamento próprio. Não lê nem copia senhas, tokens ou sessões dos outros apps. Não inclui comandos de root, reset, alteração de firmware, desinstalação de apps existentes ou desativação do sistema. Abrir um app já instalado é diferente de migrar seus acessos para outro dispositivo.

Antes de uma futura instalação, o proprietário precisa resolver o requisito de recuperação integral: demonstrar um caminho suportado e verificável ou aprovar explicitamente uma mudança nessa exigência. Até lá, continuar apenas a validação local.

Caso uma instalação seja autorizada posteriormente, registrar o ID/certificado do Vibe em armazenamento privado. A reversão proposta é encerrar/remover apenas o Vibe TV, pois Smart Hub e apps não são substituídos. Isso é uma estratégia de remoção isolada, **não prova de backup completo**. Não publicar DUID, número de série, certificados, tokens ou dados das contas no Git.
