# Backup e recuperação

Data da investigação: 2026-10-19. Modelo confirmado: Samsung UN50AU8000GXZD, Tizen. Atualização em 20/10/2026: o Vibe TV foi assinado, instalado e iniciado com autorização. Nenhum reset, alteração de firmware ou extração de conta foi executado. O proprietário ativou Developer Mode e reiniciou a TV.

## Situação atual

**Não existe um backup integral verificado.** Após a pesquisa oficial, o proprietário dispensou esse requisito em favor do reset de fábrica documentado e solicitou expressamente a instalação do Vibe TV separado. Isso autoriza preparar e instalar o aplicativo; não é autorização para executar reset ou alterar firmware durante o teste.

Não equivalem a esse backup:

- Clone do repositório ou pacote WGT.
- Download de firmware de atualização Samsung.
- Inventário ou fotografias das configurações.
- Exportação das preferências do Vibe TV.
- Backup de configurações Samsung Cloud sem prova de restauração das sessões dos serviços.

## O que a Samsung documenta

A Samsung descreve backup de configurações na conta Samsung. O e-Manual brasileiro disponibilizado para este modelo confirma essa função na página 45: Configurações → Geral → Gerenciador de Sistema → Conta da Samsung → Minha conta → Backup. A documentação não estabelece uma imagem integral restaurável com dados privados de Netflix/Prime/YouTube.

[Samsung: gerenciamento da conta e backup de configurações](https://www.samsung.com/ae/support/tv-audio-video/how-can-i-manage-a-samsung-account-on-my-tv/)

A página do modelo oferece manual e firmware, não uma cópia do estado particular do usuário:
[Suporte UN50AU8000GXZD](https://www.samsung.com/br/support/model/UN50AU8000GXZD/).

O [e-Manual oficial em português](https://org.downloadcenter.samsung.com/downloadfile/ContentsFile.aspx?CDSite=UNI_BR&OriginYN=N&ModelType=N&ModelName=UN50AU8000G&CttFileID=9452868&CDCttType=UM&VPath=UM%2F202401%2F20240111130058658%2FOSNISDBA-8.0.0_EM_OSCAR_SA_B-POR_230626.0.pdf), página 130, confirma Configurações → Geral → Restaurar. Depois do PIN e da confirmação, a TV reinicia na configuração inicial. O PIN padrão é 0000, se não tiver sido alterado. Esse procedimento foi confirmado documentalmente, não executado.

Voltar aos padrões de fábrica não significa regressar ao firmware de quando a TV foi comprada. A Samsung não suporta downgrade nem atualização forçada; reset não é garantia de recuperar uma TV que deixou de iniciar por corrupção de firmware. [FAQ oficial de firmware, Q8–Q10](https://developer.samsung.com/smarttv/develop/faq/device-information-and-firmware.html).

**Reset Smart Hub encerra sessões e remove contas/configurações dos apps.** Não usar reset como procedimento de backup ou teste de recuperação.
[Samsung: efeitos do reset Smart Hub](https://www.samsung.com/au/support/tv-audio-video/reset-smart-hub-samsung-tv/)

## Por que não executar o instalador original

O projeto Android grava referências de launcher/screensaver e uma lista de pacotes desativados, não o firmware ou dados privados. Sua reversão não preserva todos os estados prévios de screensaver/pacotes. Além de incompatível com Tizen, esse procedimento não satisfaz a exigência de recuperar tudo exatamente como estava.

## Limite desta fase

O código Tizen usa armazenamento próprio. Não lê nem copia senhas, tokens ou sessões dos outros apps. Não inclui comandos de root, reset, alteração de firmware, desinstalação de apps existentes ou desativação do sistema. Abrir um app já instalado é diferente de migrar seus acessos para outro dispositivo.

O requisito de recuperação foi revisado explicitamente pelo proprietário. As ferramentas oficiais e Developer Mode/SDB já funcionam. O perfil Samsung foi criado e as versões 1.0.0, 1.0.1, 1.0.2 e 1.0.3 foram instaladas/iniciadas. Inventário e arquivos de ícones foram consultados no runtime da TV. Sessões, PS5 e início automático ainda exigem verificação física específica.

Registrar certificado e identificadores privados em armazenamento local fora do Git. A primeira reversão proposta é encerrar/remover apenas o Vibe TV, pois Smart Hub e apps não são substituídos. Isso é uma estratégia de remoção isolada, **não prova de backup completo**. O reset de fábrica é último recurso documentado, com possível necessidade de refazer configurações e logins; não é parte da instalação normal. Não publicar DUID, número de série, certificados, tokens ou dados das contas no Git.
