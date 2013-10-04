from distutils.core import setup
import py2exe

"""
After adding py2exe to your python distribution (using eas_install with the executable to install into a specific version of python), build with:
python setup.py py2exe

The executable file is placed in /dist/route_test.exe

See more information about py2exe here:
http://www.py2exe.org/
http://www.py2exe.org/index.cgi/Tutorial


"""

setup(console=['route_test.py'])