-- Offline-reviewed Home-only transaction. See README.md before any device use.
BEGIN IMMEDIATE;
CREATE TEMP TABLE hub_guard (ok INTEGER CHECK (ok = 1));
INSERT INTO hub_guard SELECT count(*) = 1 FROM key_filter
 WHERE appid = 'com.samsung.tv.csfs' AND key = 'XF86Home';
INSERT INTO hub_guard SELECT count(*) = 1 FROM key_filter
 WHERE appid = 'com.samsung.tv.csfs' AND key = 'XF86Home'
 AND longpress IS NULL AND override IS NULL AND on_selector = ''
 AND request = 'launch' AND target_selector = 'package:VibeTV2026.VibeTV' AND args IS NULL;
INSERT INTO hub_guard SELECT count(*) = 1 FROM managed_app WHERE appid = 'VibeTV2026.VibeTV';
INSERT INTO hub_guard SELECT count(*) = 1 FROM managed_app
 WHERE appid = 'VibeTV2026.VibeTV' AND ui_type IS NULL AND source IS NULL;
-- Refuse to remove a registration now used by another rule.
INSERT INTO hub_guard SELECT count(*) = 0 FROM key_filter
 WHERE appid = 'VibeTV2026.VibeTV';
INSERT INTO hub_guard SELECT count(*) = 1 FROM key_filter
 WHERE instr(coalesce(target_selector, '') || ' ' || coalesce(args, '') || ' ' || coalesce(on_selector, ''), 'VibeTV2026.VibeTV') > 0;
INSERT INTO hub_guard SELECT count(*) = 0 FROM task_filter
 WHERE instr(appid || ' ' || coalesce(source_selector, '') || ' ' || coalesce(target_selector, '') || ' ' || coalesce(target, '') || ' ' || coalesce(args, ''), 'VibeTV2026.VibeTV') > 0;
UPDATE key_filter SET target_selector = 'package:com.samsung.tv.csfs', args = 'entry_point:smarthub_key'
 WHERE appid = 'com.samsung.tv.csfs' AND key = 'XF86Home';
DELETE FROM managed_app WHERE appid = 'VibeTV2026.VibeTV' AND ui_type IS NULL AND source IS NULL;
DROP TABLE hub_guard;
COMMIT;
