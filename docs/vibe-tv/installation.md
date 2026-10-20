# Instalação e atualização na AU8000

O Vibe é um app Tizen com ID `VibeTV2026.VibeTV`, pacote `VibeTV2026`. Não substitui firmware. O Smart Hub é preservado; o teste de roteamento do Home é separado do pacote e está descrito em [cleanframe-home.md](cleanframe-home.md). A instalação no aparelho do proprietário foi expressamente autorizada após a decisão de recuperação documentada em [recovery.md](recovery.md).

## Ambiente já preparado

No Mac desta tarefa: extensão oficial VS Code 10.4.3, servidor arm64 10.4.5, SDB 4.2.36 e CLI `tz`, em `~/.tizen-extension-platform/server/sdktools/`. Perfil Samsung **VibeTV** criado pelo proprietário, nível Public e DUID da TV autorizado. Certificados, senhas, perfis, DUID, endereços privados e pacotes assinados ficam fora do Git.

Developer Mode foi ativado pelo proprietário na loja Apps, digitando 1–2–3–4–5 pelo teclado virtual do botão 123. O Host PC IP deve corresponder ao Mac e requer reinicialização conforme a tela. O endereço da TV mudou por DHCP durante a tarefa: confirme o dispositivo/modelo atual antes de qualquer atualização.

## Pacote

```sh
node --test tests/*.test.cjs
node tools/package-tizen.cjs
```

Produz 24 arquivos de runtime/assets em `dist/VibeTV-unsigned.wgt`; a fixture não é incluída. Assinatura local com o perfil já criado:

```sh
vibe_sdk="$HOME/.tizen-extension-platform/server/sdktools"
"$vibe_sdk/data/tools/tizen-core/tz" pack -t wgt \
  -b "$PWD/dist/VibeTV-unsigned.wgt" -s VibeTV \
  -p "$vibe_sdk/sdk-data/profile/profiles.xml" \
  -o "$PWD/dist/VibeTV-1.1.3.wgt"
unzip -t dist/VibeTV-1.1.3.wgt
```

Além de CRC e XML válidos, confira que cada um dos 24 arquivos de runtime é idêntico ao pacote não assinado, com somente `author-signature.xml`, `signature1.xml` e entradas de diretório adicionadas pelo assinador.

## Atualização direta, preservando os dados do app

Use o dispositivo verificado em `sdb devices`. Defina `VIBE_TV_SERIAL` com o serial de conexão atual **localmente**, sem incluí-lo no Git. Na TV desta tarefa o caminho de ferramentas, confirmado por capabilities, é `/home/owner/share/tmp/sdk_tools`.

```sh
"$vibe_sdk/data/tools/sdb" devices
"$vibe_sdk/data/tools/sdb" -s "$VIBE_TV_SERIAL" push \
  "$PWD/dist/VibeTV-1.1.3.wgt" /home/owner/share/tmp/sdk_tools/VibeTV-1.1.3.wgt
"$vibe_sdk/data/tools/sdb" -s "$VIBE_TV_SERIAL" shell 0 vd_appinstall \
  VibeTV /home/owner/share/tmp/sdk_tools/VibeTV-1.1.3.wgt
"$vibe_sdk/data/tools/tizen-core/tz" run \
  --serial "$VIBE_TV_SERIAL" --package-id VibeTV2026
```

Exija `install completed`, lançamento confirmado e revisão visual no aparelho. A sequência push/`vd_appinstall` segue o [Samsung Wits](https://github.com/Samsung/Wits/blob/c18cf03eced66aa66c3603c94fccf4c14d193f00/lib/appLaunchHelper.js). Não copiar rotinas de desinstalação ou alterações de segurança de outros fluxos. O wrapper `tz install` observado tentava desinstalar antes de instalar; por isso a atualização usa a operação direta.

Se uma instância antiga do Vibe ainda estiver aberta, encerre somente `VibeTV2026.VibeTV` e abra novamente. Não limpar dados ou desinstalar outros aplicativos. Não publicar o WGT assinado.

## Home, início e retorno

O comportamento público oficial é Home → Smart Hub, conforme a [checklist CO-GE-07](https://developer.samsung.com/smarttv/develop/development-checklist/common.html). O método nativo não oficial é um teste separado, com estado real e recuperação em [cleanframe-home.md](cleanframe-home.md). O proprietário ativou “Execução Automática do Último Aplicativo”; isso depende do último app e do suporte da TV e não redefine Home. O ciclo de energia ainda precisa de verificação física.

Se a rota nativa estiver alterada, restaure e verifique primeiro o Home original; só depois feche/remova Vibe. Sem alteração de rota, o retorno mais simples é fechar/remover somente Vibe. Reset de fábrica é um fallback destrutivo documentado, não foi executado e não recupera sessões ou uma versão antiga de firmware.
