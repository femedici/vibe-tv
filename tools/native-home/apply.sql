-- Offline-reviewed Home-only transaction. See README.md before any device use.
BEGIN IMMEDIATE;
CREATE TEMP TABLE hub_guard (ok INTEGER CHECK (ok = 1));
INSERT INTO hub_guard SELECT count(*) = 1 FROM key_filter
 WHERE appid = 'com.samsung.tv.csfs' AND key = 'XF86Home';
INSERT INTO hub_guard SELECT count(*) = 1 FROM key_filter
 WHERE appid = 'com.samsung.tv.csfs' AND key = 'XF86Home'
 AND longpress IS NULL AND override IS NULL AND on_selector = ''
 AND request = 'launch' AND target_selector = 'package:com.samsung.tv.csfs'
 AND args = 'entry_point:smarthub_key';
INSERT INTO hub_guard SELECT count(*) = 0 FROM managed_app WHERE appid = 'VibeTV2026.VibeTV';
UPDATE key_filter SET target_selector = 'package:VibeTV2026.VibeTV', args = NULL
 WHERE appid = 'com.samsung.tv.csfs' AND key = 'XF86Home';
INSERT INTO managed_app (appid, ui_type, source) VALUES ('VibeTV2026.VibeTV', NULL, NULL);
DROP TABLE hub_guard;
COMMIT;
