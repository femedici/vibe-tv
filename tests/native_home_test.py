"""Offline tests only: in-memory routing schema, no device connection."""
from pathlib import Path
import sqlite3
import unittest

ROOT = Path(__file__).resolve().parents[1] / 'tools' / 'native-home'

class HomeRouteTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.addCleanup(self.db.close)
        self.db.executescript('''
        CREATE TABLE managed_app(appid TEXT NOT NULL,ui_type TEXT,source TEXT,UNIQUE(appid,ui_type,source));
        CREATE TABLE key_filter(appid TEXT NOT NULL,key TEXT NOT NULL,longpress TEXT,override TEXT,on_selector TEXT,request TEXT NOT NULL,target_selector TEXT NOT NULL,args TEXT,UNIQUE(appid,key,longpress,override,on_selector,request,target_selector,args));
        CREATE TABLE task_filter(appid TEXT NOT NULL,source_selector TEXT NOT NULL,source_event TEXT NOT NULL,request TEXT NOT NULL,target_selector TEXT,target TEXT,args TEXT,UNIQUE(appid,source_selector,source_event,request,target_selector,target,args));
        INSERT INTO managed_app VALUES('com.samsung.tv.csfs','partial',NULL);
        INSERT INTO key_filter(rowid,appid,key,longpress,override,on_selector,request,target_selector,args) VALUES(79,'com.samsung.tv.csfs','XF86Home',NULL,NULL,'','launch','package:com.samsung.tv.csfs','entry_point:smarthub_key');
        INSERT INTO key_filter VALUES('org.tizen.remote-management','XF86Home','5300',NULL,'~with-package:org.tizen.remote-management','launch','package:org.tizen.remote-management',NULL);
        INSERT INTO task_filter VALUES('another.app','source','event','launch',NULL,'untouched',NULL);
        ''')

    def rows(self):
        return {t: self.db.execute('SELECT rowid,* FROM '+t+' ORDER BY rowid').fetchall()
                for t in ['managed_app','key_filter','task_filter']}

    def run_sql(self, mode):
        path = ROOT / (mode+'.sql')
        self.assertTrue(path.exists(), 'Missing reviewed '+mode+' route transaction')
        try:
            self.db.executescript(path.read_text())
        except Exception:
            self.db.rollback()
            raise

    def test_apply_then_restore_preserves_every_original_row_and_rowid(self):
        before = self.rows()
        self.run_sql('apply')
        after = self.rows()
        changed = [row for row in after['key_filter'] if row[0] == 79][0]
        self.assertEqual(changed[-2:], ('package:VibeTV2026.VibeTV', None))
        self.assertEqual(after['key_filter'][0], before['key_filter'][0][:7] + ('package:VibeTV2026.VibeTV',None))
        self.assertEqual(after['key_filter'][1], before['key_filter'][1])
        self.assertEqual(after['task_filter'], before['task_filter'])
        self.assertEqual(after['managed_app'][:-1], before['managed_app'])
        self.run_sql('restore')
        self.assertEqual(self.rows(), before)

    def test_conflicting_or_missing_home_aborts_without_changes(self):
        for mutate in ["UPDATE key_filter SET args='different' WHERE rowid=79",
                       "DELETE FROM key_filter WHERE rowid=79"]:
            with self.subTest(mutate=mutate):
                self.db.execute(mutate); self.db.commit()
                before=self.rows()
                with self.assertRaises(sqlite3.IntegrityError): self.run_sql('apply')
                self.assertEqual(self.rows(),before)

    def test_preexisting_vibe_registration_is_never_overwritten(self):
        self.db.execute("INSERT INTO managed_app VALUES('VibeTV2026.VibeTV','other',NULL)");self.db.commit()
        before=self.rows()
        with self.assertRaises(sqlite3.IntegrityError): self.run_sql('apply')
        self.assertEqual(self.rows(),before)

    def test_restore_rejects_new_key_and_task_target_references(self):
        self.run_sql('apply')
        changes = [
            "INSERT INTO key_filter VALUES('VibeTV2026.VibeTV','OtherKey',NULL,NULL,'','launch','package:other',NULL)",
            "INSERT INTO key_filter VALUES('other','OtherKey',NULL,NULL,'','launch','package:VibeTV2026.VibeTV',NULL)",
            "INSERT INTO task_filter VALUES('other','source','event','launch','package:VibeTV2026.VibeTV',NULL,NULL)",
            "INSERT INTO task_filter VALUES('other','source','event','launch',NULL,'VibeTV2026.VibeTV',NULL)"
        ]
        for change in changes:
            with self.subTest(change=change):
                rowid=self.db.execute(change).lastrowid;self.db.commit()
                before=self.rows()
                with self.assertRaises(sqlite3.IntegrityError): self.run_sql('restore')
                self.assertEqual(self.rows(),before)
                table='key_filter' if 'INTO key_filter' in change else 'task_filter'
                self.db.execute('DELETE FROM '+table+' WHERE rowid=?',(rowid,));self.db.commit()

    def test_restore_rejects_new_dependencies_and_changed_registration(self):
        self.run_sql('apply')
        self.db.execute("INSERT INTO task_filter VALUES('VibeTV2026.VibeTV','source','event','launch',NULL,'other',NULL)");self.db.commit()
        before=self.rows()
        with self.assertRaises(sqlite3.IntegrityError): self.run_sql('restore')
        self.assertEqual(self.rows(),before)
        self.db.execute("DELETE FROM task_filter WHERE appid='VibeTV2026.VibeTV'")
        self.db.execute("UPDATE managed_app SET ui_type='other' WHERE appid='VibeTV2026.VibeTV'");self.db.commit()
        before=self.rows()
        with self.assertRaises(sqlite3.IntegrityError): self.run_sql('restore')
        self.assertEqual(self.rows(),before)

if __name__ == '__main__': unittest.main()
