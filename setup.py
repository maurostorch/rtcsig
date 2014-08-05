import os
from setuptools import setup
from siteflags import VERSION


PATH_BASE = os.path.dirname(__file__)

f = open(os.path.join(PATH_BASE, 'README.rst'))
README = f.read()
f.close()

setup(
    name='rtcsig',
    version='.'.join(map(str, VERSION)),
    url='https://github.com/maurostorch/rtcsig',

    description='This is a Django App for handle the session exchanging of a WebRTC peer interconnection',
    long_description=README,
    license='The MIT License (MIT)',

    author='Mauro Storch',
    author_email='mauro@storchlab.com',

    packages=['rtcsig'],
    include_package_data=True,
    zip_safe=False,

    install_requires=['django-etc'],

    classifiers=[
        # As in https://pypi.python.org/pypi?:action=list_classifiers
        'Development Status :: 4 - Beta',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.2',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'License :: OSI Approved :: BSD License'
    ],
)

