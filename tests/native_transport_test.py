from pathlib import Path
import importlib.util
import unittest
import subprocess
import tempfile
import os
from unittest.mock import patch

path=Path(__file__).resolve().parents[1]/'tools/native-home/transport.py'

class TransportTests(unittest.TestCase):
    def module(self):
        self.assertTrue(path.exists(),'Missing guarded SDK transport')
        spec=importlib.util.spec_from_file_location('vibe_transport',path)
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
    def test_target_guard_rejects_wrong_model_host_and_identity(self):
        m=self.module()
        good={'modelName':'UN50AU8000GXZD','developerMode':'1','developerIP':'192.0.2.8','id':'test-tv'}
        m.validate_device(good,'192.0.2.8','test-tv')
        for k,v in [('modelName','another'),('developerIP','192.0.2.9'),('developerMode','0'),('id','another')]:
            with self.subTest(k=k),self.assertRaises(ValueError):m.validate_device(dict(good,**{k:v}),'192.0.2.8','test-tv')
    def test_bounded_injection_contains_no_unvalidated_host_or_path(self):
        m=self.module()
        self.assertLessEqual(len(m.sdk_argument('192.0.2.8',12345,'vibe-preflight-0123456789abcdef.sh').encode()),400)
        for host,name in [('x;id','vibe-preflight-0123456789abcdef.sh'),('192.0.2.8','../../other')]:
            with self.assertRaises(ValueError):m.sdk_argument(host,12345,name)
    def test_cleanup_failure_cannot_report_success(self):
        m=self.module()
        with tempfile.TemporaryDirectory() as folder:
            staged=Path(folder)/'probe.sh'; staged.write_text('pending')
            self.assertTrue(hasattr(m,'wrap_script'),'Missing verified-cleanup wrapper')
            fake=Path(folder)/'rm'; fake.write_text('#!/bin/sh\nexit 1\n'); fake.chmod(0o700)
            wrapped=m.wrap_script('true',str(staged),'abcdef')
            result=subprocess.run(['/bin/bash','-c',wrapped],capture_output=True,text=True,env=dict(os.environ,PATH=folder+':/usr/bin:/bin'))
            self.assertNotEqual(result.returncode,0)
            self.assertTrue(staged.exists())
            with self.assertRaises(RuntimeError):m.completed(result.stdout,'abcdef')
            result=subprocess.run(['bash','-c',m.wrap_script('true',str(staged),'abcdef')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0)
            self.assertFalse(staged.exists())
            m.completed(result.stdout,'abcdef')

    def test_missing_failure_or_duplicate_completion_is_uncertain(self):
        m=self.module()
        self.assertEqual(m.completed('data\nVIBE_RESULT:abcdef:0\n','abcdef'),'data\n')
        for text in ['data','VIBE_RESULT:abcdef:1\n','VIBE_RESULT:wrong:0\n','VIBE_RESULT:abcdef:0\nVIBE_RESULT:abcdef:0\n']:
            with self.subTest(text=text),self.assertRaises(RuntimeError):m.completed(text,'abcdef')

    def test_sdb_zero_exit_with_reported_copy_error_is_failure(self):
        m=self.module()
        session=object.__new__(m.Session);session.sdk=Path('/unused/sdb')
        result=subprocess.CompletedProcess([],0,"error: failed to close 'file': Permission denied\n","")
        with patch.object(m.subprocess,'run',return_value=result),self.assertRaises(RuntimeError):
            session.run(['push','source','target'])

if __name__=='__main__':unittest.main()
