# Vibe TV / CleanFrame design

Owner selected “Manter meu cartão grande de último acesso, com o estilo e ajustes do CleanFrame”.

Adapt the CleanFrame visual layer to the existing Vibe native application: a large app-relevant last-success card, quiet upper-right controls, a dock with correctly proportioned original brand assets, five existing skins and restrained transform/opacity focus. Keep the user’s PS5 art and exact HDMI2 adapter. Preserve storage/application identity, dynamic inventory resolution, launch error handling and history only after success.

Alternatives considered: direct source replacement would introduce incompatible CSS and lose HDMI/preferences; keeping the current presentation would not fulfill the requested redesign. The selected hybrid preserves owner requirements while adopting the reference’s presentation.

Native Home is a separate integration: CleanFrame’s helper is guarded for another model/firmware and calls a symbol absent on this TV. Read-only AU8000 evidence and Couchroot code review must establish a concrete approach before any root/database change. Source/state backup is not a complete system backup. No Home success claim from UI redesign.

Implementation steps and single task tracker remain in specs/001-vibe-tv-tizen/plan.md and tasks.md. Browser and existing tests verify the UI; physical remote/Home/boot/CEC remain separate hardware checks.
