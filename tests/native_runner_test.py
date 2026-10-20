from pathlib import Path
import hashlib
import importlib.util
import json
import sqlite3
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
class RunnerTests(unittest.TestCase):
    def load_runner(self):
        path=ROOT/'tools/native-home/run.py'
        spec=importlib.util.spec_from_file_location('native_runner',path)
        module=importlib.util.module_from_spec(spec)
        import sys
        sys.path.insert(0,str(path.parent))
        self.addCleanup(lambda:sys.path.pop(0))
        spec.loader.exec_module(module)
        return module

    def test_partial_or_duplicate_root_result_is_not_success(self):
        module=self.load_runner()
        good='BASELINE=no_action\nIDENTITY_RESULT=root\nAUTH_VIEWS=restored\nNAMESPACE_EXIT=0\n'
        module.check_result('IDENTITY',good)
        for bad in [good.replace('AUTH_VIEWS=restored\n',''),good+'IDENTITY_RESULT=root\n',good+'UNCERTAIN: helper alive\n']:
            with self.assertRaises(RuntimeError):module.check_result('IDENTITY',bad)

    def test_only_observed_native_launch_message_confirms_app(self):
        module=self.load_runner()
        self.assertTrue(module.launched("... successfully launched pid = 14072 with debug 0\n"))
        for output in ["unsuccessful", "not successful", "", "... successfully launched pid = 0 with debug 0\n"]:
            self.assertFalse(module.launched(output))

    def test_cleanup_only_removes_inactive_private_snapshot_journal(self):
        module=self.load_runner()
        import subprocess
        with tempfile.TemporaryDirectory() as temp:
            file=Path(temp)/'snapshot.db-journal'
            file.write_bytes(bytes(512))
            script=module.cleanup_journal(str(file))
            result=subprocess.run(['bash','-c','set -eu\n'+script],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertFalse(file.exists())
            file.write_bytes(bytes.fromhex('d9d505f920a163d7')+bytes(504))
            result=subprocess.run(['bash','-c','set -eu\n'+script],capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertTrue(file.exists())

    def test_cleanup_rejects_non_regular_snapshot_journal(self):
        module=self.load_runner()
        import os, subprocess
        with tempfile.TemporaryDirectory() as temp:
            file=Path(temp)/'snapshot.db-journal';os.mkfifo(file)
            writer=subprocess.Popen(['bash','-c',"printf '\\0\\0\\0\\0\\0\\0\\0\\0' > \"$1\"",'writer',str(file)],
                                    stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            try:
                result=subprocess.run(['bash','-c','set -eu\n'+module.cleanup_journal(str(file))],
                                      capture_output=True,text=True,timeout=3)
                self.assertNotEqual(result.returncode,0)
                self.assertTrue(file.exists())
            finally:
                if writer.poll() is None:writer.terminate()
                writer.wait(timeout=3)

    def test_readback_uses_checksummed_consistent_snapshot(self):
        module=self.load_runner()
        import shutil
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp);backup=folder/'backup';backup.mkdir()
            file=backup/'app-context-original.db'
            db=sqlite3.connect(file)
            for table in ['managed_app','key_filter','task_filter']:db.execute('CREATE TABLE '+table+'(id TEXT)')
            db.commit();db.close()
            checksum=hashlib.sha256(file.read_bytes()).hexdigest()
            output='OBSERVED_RESULT=consistent_integrity_ok\nOBSERVED_SHA256='+checksum+'\n'
            calls=[]
            class FakeSession:
                def pull(self,remote,target):
                    calls.append(remote);shutil.copyfile(file,target)
            module.readback(FakeSession(),folder,backup,'RESTORE',output)
            self.assertEqual(calls,[module.STAGE+'/app-context-observed.db'])
            with self.assertRaises(RuntimeError):module.readback(FakeSession(),folder,backup,'RESTORE','')
            with self.assertRaises(RuntimeError):module.readback(FakeSession(),folder,backup,'RESTORE',output.replace(checksum,'0'*64))

    def test_backup_must_match_integrity_hash_and_this_device(self):
        path=ROOT/'tools/native-home/run.py'
        self.assertTrue(path.exists(),'Missing exact-device backup guard')
        spec=importlib.util.spec_from_file_location('native_runner',path)
        module=importlib.util.module_from_spec(spec)
        import sys
        sys.path.insert(0,str(path.parent))
        self.addCleanup(lambda:sys.path.pop(0))
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as folder:
            folder=Path(folder);dbfile=folder/'app-context-original.db'
            db=sqlite3.connect(dbfile)
            for table in ['managed_app','key_filter','task_filter']:db.execute('CREATE TABLE '+table+'(id TEXT)')
            db.commit();db.close()
            sha=hashlib.sha256(dbfile.read_bytes()).hexdigest()
            metadata={'sha256':sha,'device_id_sha256':hashlib.sha256(b'known-tv').hexdigest(),'firmware':'T-NKLAUABC-2310.0'}
            (folder/'verified.json').write_text(json.dumps(metadata))
            self.assertEqual(module.verify_backup(folder,'known-tv'),sha)
            with self.assertRaises(ValueError):module.verify_backup(folder,'other-tv')
            dbfile.write_bytes(b'corrupted')
            with self.assertRaises(ValueError):module.verify_backup(folder,'known-tv')
            metadata['sha256']=hashlib.sha256(dbfile.read_bytes()).hexdigest();(folder/'verified.json').write_text(json.dumps(metadata))
            with self.assertRaises(ValueError):module.verify_backup(folder,'known-tv')
if __name__=='__main__':unittest.main()
