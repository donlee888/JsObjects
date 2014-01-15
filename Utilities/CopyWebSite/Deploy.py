#!/usr/bin/python
'''
Created on May 19, 2012

@author: Charlie Calvert
@attention: Note that this project depends on elfutils.
elfutils is a directory, and it needs to be on the Python
path. For instance:

set PYTHONPATH=G:\Src\GitHub\JsObjects\Python\PythonUtils\

Or Maybe.

set PYTHONPATH=G:\Src\andelf\Utilties\src\

Please see the Deploy.config file, referenced in 
this script.
'''
import os
from elfutils.elffiles import CopyFilesBasePredefined

class CopyFiles(CopyFilesBasePredefined):
    '''
    Deploy the files in this project to a website 
    '''
    
    def __init__(self):
        self.projectName = ""
        CopyFilesBasePredefined.__init__(self, True, "../../Deploy.config")
        
    def fineTune(self):
        # Do some special tasks to fine tune this project
        #path = os.getcwd()
        #tempFile = os.path.join(path, "Deploy.py" )        
        self.cgiFiles.remove("Deploy.py")                
        self.scriptPath = ""

print os.environ['PYTHONPATH'].split(os.pathsep)
if __name__ == '__main__':
    copy_files = CopyFiles()
    copy_files.copyFiles(True)